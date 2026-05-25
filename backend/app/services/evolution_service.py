import logging

import httpx
from app.core.config import settings


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
        Retorna a apikey da instância recém-criada.
        """
        url = f"{self.base_url}/instance/create"
        # Usamos o CNPJ como nome da instância
        payload = {
            "instanceName": instance_name,
            "token": settings.SECRET_KEY.get_secret_value()[:16], # Token interno/segurança da instância
            "qrcode": True,
            "number": ""
        }

        async with httpx.AsyncClient() as client:
            try:
                logging.info(f"Provisionando instância Evolution para: {instance_name}")
                response = await client.post(url, json=payload, headers=self.headers)
                data = response.json()

                # A Evolution pode retornar a key em locais diferentes dependendo da versão
                # Normalmente está em data['hash']['apikey'] ou data['instance']['apikey']
                instance_key = data.get("hash", {}).get("apikey") or data.get("instance", {}).get("apikey")

                return {
                    "instance_name": instance_name,
                    "instance_key": instance_key,
                    "status": "success"
                }
            except Exception as e:
                logging.error(f"Erro ao criar instância na Evolution: {str(e)}")
                # Se der 403 ou 400, pode ser que já exista
                return {"status": "error", "message": str(e)}

    async def get_qrcode(self, instance_name: str):
        """Obtém o QR Code para conexão."""
        url = f"{self.base_url}/instance/connect/{instance_name}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def set_webhook(self, instance_name: str, webhook_url: str):
        """Configura o destino dos webhooks."""
        url = f"{self.base_url}/webhook/set/{instance_name}"
        payload = {
            "url": webhook_url,
            "enabled": True,
            "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE"]
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            return response.json()

    async def send_text(self, instance_name: str, remote_jid: str, text: str):
        """Envia mensagem de texto."""
        url = f"{self.base_url}/message/sendText/{instance_name}"
        payload = {
            "number": remote_jid,
            "text": text,
            "delay": 1200,
            "linkPreview": True
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            return response.json()

    async def get_instance_status(self, instance_name: str):
        """Verifica se a instância está conectada."""
        url = f"{self.base_url}/instance/connectionState/{instance_name}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                return {"instance": {"state": "disconnected"}}
            except Exception:
                return {"instance": {"state": "disconnected"}}

evolution_service = EvolutionService()
