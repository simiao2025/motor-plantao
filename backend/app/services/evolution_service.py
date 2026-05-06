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
        """
        url = f"{self.base_url}/instance/create"
        payload = {
            "instanceName": instance_name,
            "token": settings.SECRET_KEY.get_secret_value()[:16], # Token interno da instância
            "qrcode": True,
            "number": ""
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                # Logar erro ou tratar se instância já existir
                if e.response.status_code == 403:
                    return {"message": "Instance already exists or Forbidden", "status": 403}
                raise e

    async def get_qrcode(self, instance_name: str):
        """
        Obtém o QR Code para conexão.
        """
        url = f"{self.base_url}/instance/connect/{instance_name}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def set_webhook(self, instance_name: str, webhook_url: str):
        """
        Configura o destino dos webhooks para uma instância específica.
        """
        url = f"{self.base_url}/webhook/set/{instance_name}"
        payload = {
            "url": webhook_url,
            "enabled": True,
            "events": [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE"
            ]
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def send_text(self, instance_name: str, remote_jid: str, text: str):
        """
        Envia uma mensagem de texto para um contato específico.
        """
        url = f"{self.base_url}/message/sendText/{instance_name}"
        payload = {
            "number": remote_jid,
            "text": text,
            "delay": 1200, # Delay natural em ms
            "linkPreview": True
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

evolution_service = EvolutionService()
