import logging
from datetime import date

from app.core.config import settings

from supabase import Client, create_client


class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY.get_secret_value()
        )

    async def create_pharmacy_onboarding(self, name: str, email: str):
        """
        Cria registro de farmácia contornando as restrições de NOT NULL do banco.
        Usa valores temporários que serão atualizados no 'Completar Perfil'.
        """
        try:
            # 1. Verificar se já existe (pelo e-mail se possível, ou nome)
            # Como a coluna email pode não existir ainda, vamos tentar pelo nome primeiro
            existing = self.client.table("pharmacies").select("id").eq("name", name).execute()
            if existing.data: return existing.data[0]["id"]

            # 2. Buscar uma cidade padrão
            city_res = self.client.table("cities").select("id").eq("slug", "cidade-teste").execute()
            if not city_res.data:
                city_res = self.client.table("cities").select("id").limit(1).execute()
            default_city_id = city_res.data[0]["id"] if city_res.data else None

            # 3. Buscar um owner padrão (Dono do sistema)
            # Tentamos buscar o primeiro usuário do AUTH do Supabase
            try:
                users_res = self.client.auth.admin.list_users()
                default_owner_id = users_res[0].id if users_res else None
            except Exception as e:
                logging.error(f"Erro ao buscar owner padrao: {str(e)}")
                default_owner_id = None

            if not default_city_id or not default_owner_id:
                logging.error(f"Erro: Cidade ({default_city_id}) ou Proprietário ({default_owner_id}) não encontrados.")
                return None

            # 4. Inserir com placeholders
            res = self.client.table("pharmacies").insert({
                "razao_social": name, # No onboarding inicial, o nome do responsável vai aqui temporariamente
                "nome_responsavel": name,
                "cnpj": f"T-{date.today().strftime('%m%d%H%M%S')}",
                "address": "Aguardando preenchimento",
                "city_id": default_city_id,
                "owner_id": default_owner_id,
                "email": email,
                "profile_completed": False
            }).execute()

            return res.data[0]["id"] if res.data else None

        except Exception as e:
            logging.error(f"Erro no onboarding (Fallback mode): {str(e)}")
            return None

    # ... manter os outros métodos iguais ...
    async def get_pharmacy_by_instance(self, instance_name: str):
        res = self.client.table("pharmacies").select("id").eq("instance_name", instance_name).execute()
        return res.data[0]["id"] if res.data else None

    async def get_dashboard_stats(self):
        today = date.today().isoformat()
        res = self.client.table("ai_context_logs").select("id, triage_level, user_phone").gte("created_at", today).execute()
        
        logs = res.data
        total_triagens = len(logs)
        criticos = sum(1 for log in logs if log.get("triage_level") == "VERMELHO")
        verdes = sum(1 for log in logs if log.get("triage_level") == "VERDE")
        pacientes_unicos = len(set(log["user_phone"] for log in logs if log.get("user_phone")))
        
        return {
            "total_triagens": total_triagens,
            "criticos": criticos,
            "verdes": verdes,
            "pacientes_unicos": pacientes_unicos
        }

    async def get_recent_triages(self, limit: int = 5):
        res = self.client.table("ai_context_logs").select("*").order("created_at", desc=True).limit(limit).execute()
        return res.data

    async def get_historical_triages(self):
        res = self.client.table("ai_context_logs").select("created_at, triage_level").order("created_at", desc=True).limit(1000).execute()
        history = {}
        for item in res.data:
            date_str = item.get("created_at")[:10]
            if date_str not in history:
                history[date_str] = {"date": date_str, "total": 0, "VERMELHO": 0, "AMARELO": 0, "VERDE": 0}
            history[date_str]["total"] += 1
            level = item.get("triage_level", "VERDE")
            history[date_str][level] = history[date_str].get(level, 0) + 1
        return sorted(list(history.values()), key=lambda x: x["date"])

    async def log_context(self, pharmacy_id: str, content: str, response: str, user_phone: str = None, triage_level: str = "VERDE", resolved: bool = True):
        try:
            self.client.table("ai_context_logs").insert({
                "pharmacy_id": pharmacy_id,
                "message_content": content,
                "ai_response": response,
                "user_phone": user_phone,
                "triage_level": triage_level,
                "was_resolved": resolved
            }).execute()
        except Exception as e:
            logging.error(f"Erro ao salvar log: {str(e)}")

    async def log_payment(self, data: dict):
        """
        Registra o pagamento/evento da Kiwify na nova tabela de auditoria.
        """
        try:
            res = self.client.table("payments").insert({
                "kiwify_order_id": data.get("order_id"),
                "customer_email": data.get("customer_email"),
                "customer_name": data.get("customer_name"),
                "amount": data.get("amount"),
                "status": data.get("status"),
                "raw_payload": data.get("raw")
            }).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logging.error(f"Erro ao registrar pagamento no banco: {str(e)}")
            return None

    async def finalize_pharmacy_onboarding(self, pharmacy_id: str, data: dict):
        """
        Finaliza o cadastro da farmácia com os dados reais e instância do WhatsApp.
        """
        try:
            res = self.client.table("pharmacies").update({
                "cnpj": data.get("cnpj"),
                "razao_social": data.get("razao_social"),
                "address": data.get("address"),
                "neighborhood": data.get("neighborhood"),
                "state": data.get("state"),
                "phone": data.get("phone"),
                "cep": data.get("cep"),
                "nome_responsavel": data.get("nome_responsavel"),
                "responsible_cpf": data.get("responsible_cpf"),
                "email": data.get("email"),
                "city_id": data.get("city_id"),
                "instance_name": data.get("instance_name"),
                "evolution_apikey": data.get("evolution_apikey"),
                "profile_completed": True
            }).eq("id", pharmacy_id).execute()

            return res.data[0] if res.data else None
        except Exception as e:
            logging.error(f"Erro ao finalizar onboarding no Supabase: {str(e)}")
            return None

supabase_service = SupabaseService()
