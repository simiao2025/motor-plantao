import logging
import httpx
from app.core.config import settings
from app.services.supabase_service import supabase_service


class EvolutionService:
    def __init__(self):
        self.base_url = settings.EVOLUTION_API_URL.rstrip("/")
        self.headers = {
            "apikey": settings.EVOLUTION_GLOBAL_API_KEY.get_secret_value(),
            "Content-Type": "application/json"
        }

    async def create_instance(self, instance_name: str):
        """
        Cria uma nova instância no Evolution API Go usando o CNPJ como nome.
        Suporta tanto a Evolution API v2 (Node) quanto a v3 (Go).
        """
        url = f"{self.base_url}/instance/create"
        
        # Payload contendo campos de ambos os formatos (v2 e v3) para compatibilidade universal
        payload = {
            "instanceName": instance_name, # v2
            "name": instance_name,         # v3
            "token": settings.SECRET_KEY.get_secret_value()[:16], # Ambas
            "qrcode": True,
            "number": ""
        }

        async with httpx.AsyncClient() as client:
            try:
                logging.info(f"Provisionando instância Evolution para: {instance_name}")
                response = await client.post(url, json=payload, headers=self.headers)
                
                # Se a instância já existe
                if response.status_code in [400, 409, 500] and "exists" in response.text.lower():
                    logging.info(f"Instância {instance_name} já existe na Evolution.")
                    return {
                        "instance_name": instance_name,
                        "instance_key": payload["token"],
                        "status": "success"
                    }
                
                response.raise_for_status()
                data = response.json()

                # Coleta a key nos formatos v2 e v3
                instance_key = (
                    data.get("data", {}).get("token") or # v3 (Go)
                    data.get("hash", {}).get("apikey") or # v2 (Node)
                    data.get("instance", {}).get("apikey") or # v2 alt
                    payload["token"] # fallback
                )

                return {
                    "instance_name": instance_name,
                    "instance_key": instance_key,
                    "status": "success"
                }
            except Exception as e:
                logging.error(f"Erro ao criar instância na Evolution: {str(e)}")
                # Fallback em caso de erros de rede ou se o erro indica que já existe
                if "already exists" in str(e).lower() or (hascall_res := locals().get("response")) and hascall_res.status_code == 500 and "exists" in hascall_res.text.lower():
                    return {
                        "instance_name": instance_name,
                        "instance_key": payload["token"],
                        "status": "success"
                    }
                return {"status": "error", "message": str(e)}

    async def get_qrcode(self, instance_name: str):
        """Obtém o QR Code para conexão, compatível com v2 e v3."""
        # Para v3 (Go), usamos GET /instance/qr
        url = f"{self.base_url}/instance/qr"
        params = {"name": instance_name}
        
        # A Evolution Go exige o token da instância para autenticar chamadas de instância
        instance_token = settings.SECRET_KEY.get_secret_value()[:16]
        try:
            res_db = supabase_service.client.table("pharmacies") \
                .select("evolution_apikey") \
                .eq("instance_name", instance_name) \
                .limit(1) \
                .execute()
            if res_db.data and res_db.data[0].get("evolution_apikey"):
                instance_token = res_db.data[0]["evolution_apikey"]
        except Exception as db_err:
            logging.error(f"Erro ao buscar apikey da instância para QR Code: {str(db_err)}")

        headers = {
            "apikey": instance_token,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                logging.info(f"Buscando QR Code v3 para: {instance_name}")
                response = await client.get(url, params=params, headers=headers)
                
                # Se a sessão já estiver conectada, retorna sucesso amigável (v3 Go)
                if response.status_code == 400:
                    try:
                        err_data = response.json()
                        if "already logged in" in err_data.get("error", "").lower():
                            logging.info(f"Instância {instance_name} já está conectada no Evolution Go v3.")
                            return {
                                "status": "success",
                                "connected": True
                            }
                    except Exception:
                        pass

                # Se der 404, tentamos o formato v2 (Node)
                if response.status_code == 404:
                    logging.info(f"GET /instance/qr falhou (404), tentando fallback v2 para: {instance_name}")
                    url_v2 = f"{self.base_url}/instance/connect/{instance_name}"
                    headers_v2 = {
                        "apikey": settings.EVOLUTION_GLOBAL_API_KEY.get_secret_value(),
                        "Content-Type": "application/json"
                    }
                    response_v2 = await client.get(url_v2, headers=headers_v2)
                    
                    # Trata sessão já logada no fallback v2
                    if response_v2.status_code == 400:
                        try:
                            err_data = response_v2.json()
                            err_msg = err_data.get("message", "") or err_data.get("error", "")
                            if "already" in str(err_msg).lower():
                                logging.info(f"Instância {instance_name} já conectada (fallback v2).")
                                return {
                                    "status": "success",
                                    "connected": True
                                }
                        except Exception:
                            pass
                            
                    response_v2.raise_for_status()
                    data_v2 = response_v2.json()
                    return {
                        "base64": data_v2.get("code") or data_v2.get("base64"),
                        "status": "success"
                    }
                
                response.raise_for_status()
                data = response.json()
                
                # O formato v3 retorna em data['data']['Qrcode']
                qrcode_base64 = data.get("data", {}).get("Qrcode")
                
                return {
                    "base64": qrcode_base64,
                    "status": "success"
                }
            except Exception as e:
                logging.error(f"Erro ao buscar QR Code: {str(e)}")
                raise e

    async def set_webhook(self, instance_name: str, webhook_url: str):
        """Configura o destino dos webhooks, tolerando ausência de suporte na v3 (Go)."""
        url = f"{self.base_url}/webhook/set/{instance_name}"
        payload = {
            "url": webhook_url,
            "enabled": True,
            "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE"]
        }
        
        instance_token = settings.SECRET_KEY.get_secret_value()[:16]
        try:
            res_db = supabase_service.client.table("pharmacies") \
                .select("evolution_apikey") \
                .eq("instance_name", instance_name) \
                .limit(1) \
                .execute()
            if res_db.data and res_db.data[0].get("evolution_apikey"):
                instance_token = res_db.data[0]["evolution_apikey"]
        except Exception:
            pass

        headers = {
            "apikey": instance_token,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 404:
                    # Na Evolution Go v3, o webhook é configurado globalmente pelo servidor,
                    # então ignoramos a configuração per-instance graciosamente.
                    logging.info(f"Webhook set retornou 404 (Evolution Go v3). Ignorando configuração manual.")
                    return {"status": "success", "message": "Webhook globally configured (Evolution Go v3)"}
                
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logging.error(f"Erro ao configurar webhook: {str(e)}")
                # Retornamos sucesso mesmo em caso de erro para não travar o onboarding,
                # visto que no Evolution Go v3 os webhooks são estáticos ou gerenciados de forma global.
                return {"status": "success", "message": f"Webhook config skipped: {str(e)}"}

    async def send_text(self, instance_name: str, remote_jid: str, text: str):
        """Envia mensagem de texto, compatível com v2 e v3."""
        # Para v3 (Go), usamos POST /send/text
        url = f"{self.base_url}/send/text"
        payload = {
            "number": remote_jid,
            "text": text,
            "delay": 1200,
            "linkPreview": True
        }
        
        instance_token = settings.SECRET_KEY.get_secret_value()[:16]
        try:
            res_db = supabase_service.client.table("pharmacies") \
                .select("evolution_apikey") \
                .eq("instance_name", instance_name) \
                .limit(1) \
                .execute()
            if res_db.data and res_db.data[0].get("evolution_apikey"):
                instance_token = res_db.data[0]["evolution_apikey"]
        except Exception:
            pass

        headers = {
            "apikey": instance_token,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                
                # Se der 404, tentamos o formato v2 (Node)
                if response.status_code == 404:
                    url_v2 = f"{self.base_url}/message/sendText/{instance_name}"
                    headers_v2 = {
                        "apikey": settings.EVOLUTION_GLOBAL_API_KEY.get_secret_value(),
                        "Content-Type": "application/json"
                    }
                    response_v2 = await client.post(url_v2, json=payload, headers=headers_v2)
                    return response_v2.json()
                
                return response.json()
            except Exception as e:
                logging.error(f"Erro ao enviar mensagem pela Evolution: {str(e)}")
                return {"status": "error", "message": str(e)}

    async def get_instance_status(self, instance_name: str):
        """Verifica se a instância está conectada, compatível com v2 e v3."""
        # Para v3 (Go), usamos GET /instance/status
        url = f"{self.base_url}/instance/status"
        params = {"name": instance_name}
        
        instance_token = settings.SECRET_KEY.get_secret_value()[:16]
        try:
            res_db = supabase_service.client.table("pharmacies") \
                .select("evolution_apikey") \
                .eq("instance_name", instance_name) \
                .limit(1) \
                .execute()
            if res_db.data and res_db.data[0].get("evolution_apikey"):
                instance_token = res_db.data[0]["evolution_apikey"]
        except Exception:
            pass

        headers = {
            "apikey": instance_token,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, headers=headers)
                
                # Se der 404, tentamos o formato v2 (Node)
                if response.status_code == 404:
                    url_v2 = f"{self.base_url}/instance/connectionState/{instance_name}"
                    headers_v2 = {
                        "apikey": settings.EVOLUTION_GLOBAL_API_KEY.get_secret_value(),
                        "Content-Type": "application/json"
                    }
                    response_v2 = await client.get(url_v2, headers=headers_v2)
                    if response_v2.status_code == 200:
                        res_json = response_v2.json()
                        instance_data = res_json.get("instance", {})
                        state = instance_data.get("state") or instance_data.get("status")
                        if state in ["open", "connected", "CONNECTED", "OPEN"]:
                            return {"instance": {"state": "connected"}}
                        return res_json
                    return {"instance": {"state": "disconnected"}}
                
                if response.status_code == 200:
                    data = response.json()
                    inner_data = data.get("data", {})
                    # Evolution Go v3 case-insensitive check (Connected/connected)
                    is_connected = inner_data.get("Connected") or inner_data.get("connected") or False
                    state_str = "connected" if is_connected else "disconnected"
                    return {
                        "instance": {
                            "state": state_str
                        }
                    }
                return {"instance": {"state": "disconnected"}}
            except Exception:
                return {"instance": {"state": "disconnected"}}


evolution_service = EvolutionService()
