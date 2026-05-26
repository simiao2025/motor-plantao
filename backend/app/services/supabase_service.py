import logging
from datetime import date

from app.core.config import settings

from supabase import Client, create_client


class SupabaseService:
    def __init__(self):
        self._client: Client = None

    @property
    def client(self) -> Client:
        if self._client is None:
            url = settings.SUPABASE_URL
            key = settings.SUPABASE_SERVICE_ROLE_KEY.get_secret_value() if settings.SUPABASE_SERVICE_ROLE_KEY else ""
            if not url or not key:
                logging.error("Supabase credentials missing! Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
            self._client = create_client(url, key)
        return self._client

    async def get_user_pharmacy_id(self, user_id: str) -> str:
        """
        Retorna o ID da farmácia associada a um usuário do Supabase Auth.
        O usuário pode ser o dono (owner_id) da farmácia ou um membro da equipe (pharmacy_users).
        """
        try:
            # 1. Verifica se é dono (owner_id)
            res = self.client.table("pharmacies").select("id").eq("owner_id", user_id).limit(1).execute()
            if res.data:
                return res.data[0]["id"]
            
            # 2. Verifica se é membro da equipe (pharmacy_users)
            res = self.client.table("pharmacy_users").select("pharmacy_id").eq("user_id", user_id).limit(1).execute()
            if res.data:
                return res.data[0]["pharmacy_id"]
            
            return None
        except Exception as e:
            logging.error(f"Erro ao buscar farmácia do usuário {user_id}: {str(e)}")
            return None



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

    async def get_dashboard_stats(self, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id:
                return {
                    "total_triagens": 0,
                    "criticos": 0,
                    "verdes": 0,
                    "pacientes_unicos": 0
                }
            today = date.today().isoformat()
            res = self.client.table("ai_context_logs").select("id, triage_level, user_phone").eq("pharmacy_id", pharmacy_id).gte("created_at", today).execute()
            
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
        except Exception as e:
            logging.error(f"Erro ao buscar estatísticas (usando fallback seguro): {str(e)}")
            return {
                "total_triagens": 0,
                "criticos": 0,
                "verdes": 0,
                "pacientes_unicos": 0
            }

    async def get_recent_triages(self, user_id: str, limit: int = 5):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return []
            res = self.client.table("ai_context_logs").select("*").eq("pharmacy_id", pharmacy_id).order("created_at", desc=True).limit(limit).execute()
            return res.data
        except Exception as e:
            logging.error(f"Erro ao buscar triagens recentes (fallback vazio): {str(e)}")
            return []

    async def get_historical_triages(self, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return []
            res = self.client.table("ai_context_logs").select("created_at, triage_level").eq("pharmacy_id", pharmacy_id).order("created_at", desc=True).limit(1000).execute()
            history = {}
            for item in res.data:
                date_str = item.get("created_at")[:10]
                if date_str not in history:
                    history[date_str] = {"date": date_str, "total": 0, "VERMELHO": 0, "AMARELO": 0, "VERDE": 0}
                history[date_str]["total"] += 1
                level = item.get("triage_level", "VERDE")
                history[date_str][level] = history[date_str].get(level, 0) + 1
            return sorted(list(history.values()), key=lambda x: x["date"])
        except Exception as e:
            logging.error(f"Erro ao buscar histórico de triagens (fallback vazio): {str(e)}")
            return []

    async def get_unique_clients(self, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return []
            res = self.client.table("ai_context_logs").select("user_phone").eq("pharmacy_id", pharmacy_id).execute()
            if not res.data: return []
            return list(set(item["user_phone"] for item in res.data if item.get("user_phone")))
        except Exception as e:
            logging.error(f"Erro ao buscar clientes únicos: {str(e)}")
            return []

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

    async def get_pharmacy_shifts(self, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return []
            res = self.client.table("pharmacy_shifts").select("*").eq("pharmacy_id", pharmacy_id).order("shift_date", desc=False).execute()
            return res.data
        except Exception as e:
            logging.error(f"Erro ao buscar plantões: {str(e)}")
            return []

    async def add_pharmacy_shift(self, shift_date: str, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id:
                return None

            res = self.client.table("pharmacy_shifts").insert({
                "pharmacy_id": pharmacy_id,
                "shift_date": shift_date
            }).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logging.error(f"Erro ao adicionar plantão: {str(e)}")
            return None

    async def delete_pharmacy_shift(self, shift_id: str, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return None
            res = self.client.table("pharmacy_shifts").delete().eq("id", shift_id).eq("pharmacy_id", pharmacy_id).execute()
            return res.data
        except Exception as e:
            logging.error(f"Erro ao deletar plantão: {str(e)}")
            return None
            return None

    # --- CONFIGURAÇÕES DE IA ---
    async def get_pharmacy_settings(self, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return {}
            pharm = self.client.table("pharmacies").select("system_prompt, rag_base, auto_response, whatsapp_channel, meta_token, meta_phone_number_id, meta_waba_id").eq("id", pharmacy_id).limit(1).execute()
            return pharm.data[0] if pharm.data else {}
        except Exception as e:
            logging.error(f"Erro ao buscar configurações: {str(e)}")
            return {}

    async def update_pharmacy_settings(self, data: dict, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return None
            
            res = self.client.table("pharmacies").update({
                "system_prompt": data.get("system_prompt"),
                "rag_base": data.get("rag_base"),
                "auto_response": data.get("auto_response", True),
                "whatsapp_channel": data.get("whatsapp_channel", "evolution"),
                "meta_token": data.get("meta_token"),
                "meta_phone_number_id": data.get("meta_phone_number_id"),
                "meta_waba_id": data.get("meta_waba_id")
            }).eq("id", pharmacy_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logging.error(f"Erro ao atualizar configurações: {str(e)}")
            return None

    # --- PERFIL DA FARMÁCIA ---
    async def get_pharmacy_profile(self, user_id: str):
        try:
            pharm = self.client.table("pharmacies").select("name, razao_social, cnpj, address, neighborhood, cep, state, phone, email, nome_responsavel, profile_completed").eq("owner_id", user_id).limit(1).execute()
            return pharm.data[0] if pharm.data else {}
        except Exception as e:
            logging.error(f"Erro ao buscar perfil: {str(e)}")
            return {}

    async def update_pharmacy_profile(self, data: dict, user_id: str):
        try:
            pharm = self.client.table("pharmacies").select("id").eq("owner_id", user_id).limit(1).execute()
            if not pharm.data: return None
            pharmacy_id = pharm.data[0]["id"]
            
            res = self.client.table("pharmacies").update({
                "name": data.get("name"),
                "razao_social": data.get("razao_social"),
                "cnpj": data.get("cnpj"),
                "address": data.get("address"),
                "neighborhood": data.get("neighborhood"),
                "cep": data.get("cep"),
                "state": data.get("state"),
                "phone": data.get("phone"),
                "email": data.get("email"),
                "nome_responsavel": data.get("nome_responsavel")
            }).eq("id", pharmacy_id).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logging.error(f"Erro ao atualizar perfil: {str(e)}")
            return None

    # --- SEGURANÇA ---
    async def update_user_password(self, new_password: str, user_id: str):
        try:
            res = self.client.auth.admin.update_user_by_id(user_id, {"password": new_password})
            return True if res else False
        except Exception as e:
            logging.error(f"Erro ao atualizar senha: {str(e)}")
            return False

    # --- CADASTRO PENDENTE & CONFIRMAÇÃO ---
    async def save_pending_confirmation(self, name: str, email: str, password_plain: str, token: str):
        try:
            # Garante que não haja tokens duplicados ou e-mails pendentes
            self.client.table("pending_confirmations").delete().eq("email", email).execute()
            
            res = self.client.table("pending_confirmations").insert({
                "name": name,
                "email": email,
                "password": password_plain,
                "token": token
            }).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logging.error(f"Erro ao salvar cadastro pendente: {str(e)}")
            return None

    async def get_pending_confirmation_by_token(self, token: str):
        try:
            res = self.client.table("pending_confirmations").select("*").eq("token", token).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logging.error(f"Erro ao buscar cadastro pendente por token: {str(e)}")
            return None

    async def delete_pending_confirmation(self, email: str):
        try:
            self.client.table("pending_confirmations").delete().eq("email", email).execute()
            return True
        except Exception as e:
            logging.error(f"Erro ao deletar cadastro pendente: {str(e)}")
            return False

    async def create_user_after_confirmation(self, name: str, email: str, password_plain: str):
        """
        Cria o usuário real confirmado no Supabase Auth e insere a farmácia associada
        """
        try:
            import secrets
            # 1. Criar o usuário no Supabase Auth com a role de owner no metadata
            user_id = None
            try:
                user_res = self.client.auth.admin.create_user(attributes={
                    "email": email,
                    "password": password_plain,
                    "email_confirm": True,
                    "user_metadata": {"name": name, "role": "owner"}
                })
                if user_res and user_res.user:
                    user_id = user_res.user.id
            except Exception as auth_e:
                error_msg = str(auth_e)
                if "already been registered" in error_msg:
                    # Condição de corrida: O usuário já foi criado em uma requisição concorrente (duplo clique)
                    logging.info(f"Usuário {email} já existia (provável duplo clique). Buscando ID...")
                    # Busca o ID do usuário existente
                    existing_users = self.client.auth.admin.list_users()
                    for u in existing_users:
                        if u.email == email:
                            user_id = u.id
                            break
                if not user_id:
                    logging.error(f"Erro Auth ao criar usuário: {error_msg}")
                    return None
            
            if not user_id:
                return None
            
            # 2. Buscar cidade padrão
            city_res = self.client.table("cities").select("id").limit(1).execute()
            default_city_id = city_res.data[0]["id"] if city_res.data else None
            
            # Verificar se já existe farmácia para este dono (Condição de Corrida)
            existing_pharmacy = self.client.table("pharmacies").select("id").eq("owner_id", user_id).execute()
            if existing_pharmacy.data:
                logging.info(f"Farmácia já existia para o owner {user_id}. Considerando sucesso.")
                return user_id

            # 3. Inserir farmácia pendente vinculada ao novo proprietário
            res = self.client.table("pharmacies").insert({
                "name": name,
                "razao_social": name,
                "nome_responsavel": name,
                "cnpj": f"T-PEND-{secrets.token_hex(4).upper()}",
                "address": "Aguardando preenchimento comercial",
                "city_id": default_city_id,
                "owner_id": user_id,
                "email": email,
                "profile_completed": False
            }).execute()
            
            if not res.data:
                return None
            
            pharmacy_id = res.data[0]["id"]
            
            # 4. Vincular o criador (Proprietário) na tabela pharmacy_users
            # Usa upsert ou ignora erro se já existir
            try:
                self.client.table("pharmacy_users").insert({
                    "pharmacy_id": pharmacy_id,
                    "user_id": user_id,
                    "name": name,
                    "email": email,
                    "role": "owner"
                }).execute()
            except Exception as pu_err:
                logging.warning(f"Aviso ao vincular pharmacy_user (talvez já exista): {pu_err}")
            
            return user_id
        except Exception as e:
            logging.error(f"Erro ao criar usuário e farmácia pós-confirmação: {str(e)}")
            return None

    # --- MEMBROS DA EQUIPE (RBAC) ---
    async def list_pharmacy_users(self, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return []
            
            res = self.client.table("pharmacy_users").select("*").eq("pharmacy_id", pharmacy_id).order("created_at", desc=False).execute()
            return res.data
        except Exception as e:
            logging.error(f"Erro ao listar membros da equipe: {str(e)}")
            return []

    async def add_pharmacy_user(self, name: str, email: str, password_plain: str, role: str, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return None
            
            # 1. Criar no Supabase Auth com metadata de perfil
            user_res = self.client.auth.admin.create_user(attributes={
                "email": email,
                "password": password_plain,
                "email_confirm": True,
                "user_metadata": {"name": name, "role": role}
            })
            if not user_res: return None
            new_user_id = user_res.user.id
            
            # 2. Inserir na tabela pharmacy_users
            res = self.client.table("pharmacy_users").insert({
                "pharmacy_id": pharmacy_id,
                "user_id": new_user_id,
                "name": name,
                "email": email,
                "role": role
            }).execute()
            
            return res.data[0] if res.data else None
        except Exception as e:
            logging.error(f"Erro ao adicionar membro à equipe: {str(e)}")
            return None

    async def delete_pharmacy_user(self, member_id: str, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return False
            
            # Busca o registro garantindo que pertence à mesma farmácia
            user_res = self.client.table("pharmacy_users").select("user_id").eq("id", member_id).eq("pharmacy_id", pharmacy_id).execute()
            if not user_res.data: return False
            member_user_id = user_res.data[0]["user_id"]
            
            # 1. Excluir do Supabase Auth
            try:
                self.client.auth.admin.delete_user(member_user_id)
            except Exception as ae:
                logging.error(f"Erro ao deletar do Supabase Auth: {str(ae)}")
                
            # 2. Excluir da tabela do banco
            self.client.table("pharmacy_users").delete().eq("id", member_id).eq("pharmacy_id", pharmacy_id).execute()
            return True
        except Exception as e:
            logging.error(f"Erro ao excluir membro da equipe: {str(e)}")
            return False

    async def update_pharmacy_user_password(self, member_id: str, password_plain: str, user_id: str):
        try:
            pharmacy_id = await self.get_user_pharmacy_id(user_id)
            if not pharmacy_id: return False
            
            # Busca o registro garantindo que pertence à mesma farmácia
            user_res = self.client.table("pharmacy_users").select("user_id").eq("id", member_id).eq("pharmacy_id", pharmacy_id).execute()
            if not user_res.data: return False
            member_user_id = user_res.data[0]["user_id"]
            
            # Atualiza no Supabase Auth
            self.client.auth.admin.update_user_by_id(member_user_id, {"password": password_plain})
            return True
        except Exception as e:
            logging.error(f"Erro ao alterar senha do membro: {str(e)}")
            return False

supabase_service = SupabaseService()
