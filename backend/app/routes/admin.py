import logging

from app.core.config import settings
from app.services.evolution_service import evolution_service
from app.services.supabase_service import supabase_service
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user_res = supabase_service.client.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")
        return user_res.user.id
    except Exception as e:
        logging.error(f"Erro ao validar token JWT: {str(e)}")
        raise HTTPException(status_code=401, detail="Acesso não autorizado")

class PharmacyRegistration(BaseModel):
    name: str
    cnpj: str
    razao_social: str
    nome_responsavel: str
    responsible_cpf: str
    phone: str
    email: str
    cep: str
    address: str
    neighborhood: str
    city_name: str
    state: str

@router.post("/pharmacy/finalize-onboarding")
async def finalize_onboarding(data: PharmacyRegistration, user_id: str = Depends(get_current_user)):
    """
    Recebe dados do perfil, cria instância no Evolution e salva no banco com tratamento de rollback.
    """
    pharmacy_created = False
    pharmacy_id = None
    instance_created = False
    
    try:
        logging.info(f"Finalizando onboarding para CNPJ: {data.cnpj}")

        # 1. Identificar se a farmácia já existe para o usuário atual
        res = supabase_service.client.table("pharmacies") \
            .select("id") \
            .eq("owner_id", user_id) \
            .execute()

        # 2. Tratar Cidade (Busca ou Cria)
        import unicodedata
        def generate_slug(text: str) -> str:
            normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
            slugified = normalized.lower().strip().replace(" ", "-")
            return "".join(c for c in slugified if c.isalnum() or c == "-")

        slug = generate_slug(data.city_name)
        city_res = supabase_service.client.table("cities").select("id").eq("slug", slug).execute()

        if city_res.data:
            city_id = city_res.data[0]["id"]
        else:
            # Cria a cidade se não existir
            new_city = supabase_service.client.table("cities").insert({
                "name": data.city_name,
                "state": data.state,
                "slug": slug
            }).execute()
            city_id = new_city.data[0]["id"]

        # 3. Determinar o ID da farmácia (busca existente ou cria na hora)
        if res.data:
            pharmacy_id = res.data[0]["id"]
        else:
            logging.warning(f"Farmácia não encontrada no onboarding para o owner {user_id}. Criando registro sob demanda...")
            new_pharmacy = supabase_service.client.table("pharmacies").insert({
                "owner_id": user_id,
                "name": data.name,
                "cnpj": data.cnpj,
                "razao_social": data.razao_social,
                "address": data.address,
                "city_id": city_id
            }).execute()

            if not new_pharmacy.data:
                raise HTTPException(status_code=500, detail="Não foi possível criar o registro da farmácia no banco.")
            pharmacy_id = new_pharmacy.data[0]["id"]
            pharmacy_created = True

        # 4. Criar Instância na Evolution
        evo_res = await evolution_service.create_instance(data.cnpj)

        if evo_res.get("status") == "error":
            # Se a farmácia foi criada nessa transação, deleta-a (rollback)
            if pharmacy_created and pharmacy_id:
                supabase_service.client.table("pharmacies").delete().eq("id", pharmacy_id).execute()
            raise HTTPException(status_code=500, detail=f"Erro na Evolution: {evo_res.get('message')}")

        instance_created = True

        # 5. Configurar Webhook Automaticamente
        webhook_url = f"{settings.PUBLIC_URL}/webhooks/whatsapp"
        await evolution_service.set_webhook(data.cnpj, webhook_url)

        # 6. Finalizar no Supabase
        final_data = data.dict()
        final_data["city_id"] = city_id # Converte nome em ID para o banco
        final_data["instance_name"] = data.cnpj
        final_data["evolution_apikey"] = evo_res.get("instance_key")

        result = await supabase_service.finalize_pharmacy_onboarding(pharmacy_id, final_data)

        if not result:
            raise HTTPException(status_code=500, detail="Falha ao salvar dados de onboarding final no Supabase.")

        return {
            "status": "success",
            "message": "Onboarding finalizado e instância provisionada.",
            "pharmacy_id": pharmacy_id,
            "instance": data.cnpj
        }
    except HTTPException as he:
        # Rollback se der erro
        if instance_created:
            logging.warning(f"Realizando rollback da instância Evolution {data.cnpj} devido a erro subsequente.")
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    headers = {"apikey": settings.EVOLUTION_GLOBAL_API_KEY.get_secret_value()}
                    await client.delete(f"{evolution_service.base_url}/instance/delete/{data.cnpj}", headers=headers)
            except Exception as delete_err:
                logging.error(f"Erro ao deletar instância no rollback: {str(delete_err)}")
        if pharmacy_created and pharmacy_id:
            logging.warning(f"Realizando rollback do registro da farmácia {pharmacy_id} devido a erro subsequente.")
            try:
                supabase_service.client.table("pharmacies").delete().eq("id", pharmacy_id).execute()
            except Exception as db_del_err:
                logging.error(f"Erro ao deletar farmácia no rollback: {str(db_del_err)}")
        raise he
    except Exception as e:
        logging.error(f"Erro inesperado no finalize_onboarding: {str(e)}")
        if instance_created:
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    headers = {"apikey": settings.EVOLUTION_GLOBAL_API_KEY.get_secret_value()}
                    await client.delete(f"{evolution_service.base_url}/instance/delete/{data.cnpj}", headers=headers)
            except Exception as delete_err:
                logging.error(f"Erro ao deletar instância no rollback: {str(delete_err)}")
        if pharmacy_created and pharmacy_id:
            try:
                supabase_service.client.table("pharmacies").delete().eq("id", pharmacy_id).execute()
            except Exception as db_del_err:
                logging.error(f"Erro ao deletar farmácia no rollback: {str(db_del_err)}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao finalizar onboarding: {str(e)}")

@router.get("/pharmacy/pre-fill")
async def get_pre_fill_data(user_id: str = Depends(get_current_user)):
    """
    Busca os dados básicos da farmácia pendente para preencher o formulário.
    """
    try:
        # Busca a farmácia do usuário
        res = supabase_service.client.table("pharmacies") \
            .select("name, razao_social, nome_responsavel, email") \
            .eq("owner_id", user_id) \
            .limit(1) \
            .execute()

        if res.data:
            data = res.data[0]
            return {
                "name": data.get("name") or "",
                "razao_social": data.get("razao_social") or "",
                "nome_responsavel": data.get("nome_responsavel") or "",
                "email": data.get("email") or ""
            }

        # Fallback de Autoreparação: se a farmácia provisória não foi criada no registro (ex. race condition),
        # recuperamos os dados diretamente do Auth do Supabase e criamos o registro pendente sob demanda.
        logging.warning(f"Nenhuma farmácia provisória encontrada para o owner {user_id}. Executando auto-reparação...")
        user_res = supabase_service.client.auth.admin.get_user_by_id(user_id)
        if user_res and user_res.user:
            responsible_name = user_res.user.user_metadata.get("name") or ""
            email = user_res.user.email

            try:
                # 1. Buscar cidade padrão ou criar uma padrão caso a tabela esteja vazia
                city_res = supabase_service.client.table("cities").select("id").limit(1).execute()
                if city_res.data:
                    default_city_id = city_res.data[0]["id"]
                else:
                    new_city = supabase_service.client.table("cities").insert({
                        "name": "São Paulo",
                        "state": "SP",
                        "slug": "sao-paulo"
                    }).execute()
                    default_city_id = new_city.data[0]["id"] if new_city.data else None

                import secrets
                # 2. Inserir farmácia pendente
                supabase_service.client.table("pharmacies").insert({
                    "name": "",                  # Em branco para o usuário preencher
                    "razao_social": "",          # Em branco para o usuário preencher
                    "nome_responsavel": responsible_name,  # Nome cadastrado = Nome do Responsável!
                    "cnpj": f"T-PEND-{secrets.token_hex(3).upper()}",
                    "address": "Aguardando preenchimento comercial",
                    "city_id": default_city_id,
                    "owner_id": user_id,
                    "email": email,
                    "profile_completed": False
                }).execute()
                logging.info(f"Auto-reparação concluída: Farmácia provisória criada para o owner {user_id}")
            except Exception as db_e:
                logging.error(f"Erro de banco durante auto-reparação: {str(db_e)}")

            return {
                "name": "",
                "razao_social": "",
                "nome_responsavel": responsible_name,
                "email": email
            }

        return {}
    except Exception as e:
        logging.error(f"Erro ao buscar dados de preenchimento: {str(e)}")
        return {}

@router.get("/instance/qrcode")
async def get_instance_qrcode(instance_name: str = None):
    if not instance_name:
        return {"status": "error", "message": "Instance name required"}
    try:
        qr_data = await evolution_service.get_qrcode(instance_name)
        return qr_data
    except Exception as e:
        logging.error(f"Erro ao buscar QR Code: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar QR Code")

@router.get("/instance/status")
async def get_instance_status_route(instance_name: str = None):
    if not instance_name:
        return {"instance": {"state": "disconnected"}}
    try:
        status = await evolution_service.get_instance_status(instance_name)
        return status
    except Exception as e:
        logging.error(f"Erro ao buscar status: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar status")

@router.get("/dashboard/stats")
async def get_stats(user_id: str = Depends(get_current_user)):
    try:
        stats = await supabase_service.get_dashboard_stats(user_id)
        recent = await supabase_service.get_recent_triages(user_id)
        history = await supabase_service.get_historical_triages(user_id)
        return {
            "stats": stats,
            "recent_activity": recent,
            "history": history
        }
    except Exception as e:
        logging.error(f"Erro ao buscar estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar estatísticas")

@router.get("/dashboard/clients")
async def get_clients(user_id: str = Depends(get_current_user)):
    try:
        clients = await supabase_service.get_unique_clients(user_id)
        return clients
    except Exception as e:
        logging.error(f"Erro ao buscar clientes: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar clientes")

class ShiftData(BaseModel):
    shift_date: str

@router.get("/shifts")
async def list_shifts(user_id: str = Depends(get_current_user)):
    return await supabase_service.get_pharmacy_shifts(user_id)

@router.post("/shifts")
async def create_shift(data: ShiftData, user_id: str = Depends(get_current_user)):
    res = await supabase_service.add_pharmacy_shift(data.shift_date, user_id)
    if not res:
        raise HTTPException(status_code=500, detail="Erro ao adicionar plantão")
    return res

@router.delete("/shifts/{shift_id}")
async def remove_shift(shift_id: str, user_id: str = Depends(get_current_user)):
    res = await supabase_service.delete_pharmacy_shift(shift_id, user_id)
    return {"status": "success", "deleted": res}

class AISettings(BaseModel):
    system_prompt: str = None
    rag_base: str = None
    auto_response: bool = True
    whatsapp_channel: str = "evolution"
    meta_token: str = None
    meta_phone_number_id: str = None
    meta_waba_id: str = None

@router.get("/pharmacy/settings")
async def get_settings(user_id: str = Depends(get_current_user)):
    return await supabase_service.get_pharmacy_settings(user_id)

@router.put("/pharmacy/settings")
async def update_settings(data: AISettings, user_id: str = Depends(get_current_user)):
    res = await supabase_service.update_pharmacy_settings(data.dict(), user_id)
    if not res: raise HTTPException(status_code=500, detail="Erro ao salvar configs")
    return res

class PharmacyProfile(BaseModel):
    name: str = None
    razao_social: str = None
    cnpj: str = None
    address: str = None
    neighborhood: str = None
    cep: str = None
    state: str = None
    phone: str = None
    email: str = None
    nome_responsavel: str = None

@router.get("/pharmacy/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    return await supabase_service.get_pharmacy_profile(user_id)

@router.put("/pharmacy/profile")
async def update_profile(data: PharmacyProfile, user_id: str = Depends(get_current_user)):
    res = await supabase_service.update_pharmacy_profile(data.dict(), user_id)
    if not res: raise HTTPException(status_code=500, detail="Erro ao salvar perfil")
    return res

class PasswordData(BaseModel):
    new_password: str

@router.post("/security/change-password")
async def change_password(data: PasswordData, user_id: str = Depends(get_current_user)):
    res = await supabase_service.update_user_password(data.new_password, user_id)
    if not res: raise HTTPException(status_code=500, detail="Erro ao alterar senha")
    return {"status": "success"}

# --- CADASTRO MANUAL & VERIFICAÇÃO DE E-MAIL ---
class RegisterData(BaseModel):
    name: str
    email: str
    password: str

@router.post("/auth/register")
async def register_manual(data: RegisterData):
    """
    Cadastra provisoriamente o usuário e envia e-mail de confirmação via Resend.
    """
    import secrets

    from app.services.email_service import email_service
    try:
        # 0. Verificar se o e-mail já existe ativamente no Supabase Auth para evitar spam e sequestro de contas
        try:
            existing = supabase_service.client.table("users").schema("auth").select("id").eq("email", data.email).execute()
            if existing.data:
                raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado no sistema.")
        except HTTPException as he:
            raise he
        except Exception as db_e:
            logging.warning(f"Falha ao checar e-mail no schema auth: {str(db_e)}")
            # Continua se for um erro de permissão ou rede, para não bloquear o cadastro legítimo

        # 1. Gerar token seguro
        token = secrets.token_urlsafe(32)

        # 2. Salvar dados provisórios
        res = await supabase_service.save_pending_confirmation(
            name=data.name,
            email=data.email,
            password_plain=data.password,
            token=token
        )
        if not res:
            raise HTTPException(status_code=500, detail="Erro ao processar dados de registro.")

        # 3. Disparar e-mail de ativação via Resend
        email_sent = await email_service.send_verification_email(
            email=data.email,
            name=data.name,
            token=token
        )
        if not email_sent:
            # Não falha o fluxo inteiro, mas avisa
            logging.warning(f"Resend não conseguiu enviar e-mail para {data.email}")

        return {
            "status": "success",
            "message": "Registro iniciado. E-mail de confirmação disparado!"
        }
    except Exception as e:
        logging.error(f"Erro no cadastro manual: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao registrar.")

@router.get("/auth/confirm-email")
async def confirm_email(token: str):
    """
    Link clicado pelo usuário no e-mail. Cria o usuário real no Supabase Auth e a farmácia pendente.
    """
    from fastapi.responses import RedirectResponse
    try:
        # 1. Buscar token
        pending = await supabase_service.get_pending_confirmation_by_token(token)
        if not pending:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=token_invalid")

        # 2. Criar usuário e farmácia
        user_id = await supabase_service.create_user_after_confirmation(
            name=pending["name"],
            email=pending["email"],
            password_plain=pending["password"]
        )
        if not user_id:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=auth_failed")

        # 3. Limpar pendência
        await supabase_service.delete_pending_confirmation(pending["email"])

        # 4. Redirecionar para login do frontend
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?confirmed=true")
    except Exception as e:
        logging.error(f"Erro na confirmação de e-mail: {str(e)}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=unknown")

# --- GERENCIAMENTO DE MEMBROS E ACESSO (RBAC) ---
class UserCreateData(BaseModel):
    name: str
    email: str
    password: str
    role: str # 'owner' | 'manager' | 'salesperson'

class UserPasswordData(BaseModel):
    new_password: str

@router.get("/users")
async def list_team_members(user_id: str = Depends(get_current_user)):
    """
    Retorna a lista de todos os usuários/balconistas da farmácia ativa
    """
    return await supabase_service.list_pharmacy_users(user_id)

@router.post("/users")
async def add_team_member(data: UserCreateData, user_id: str = Depends(get_current_user)):
    """
    Cria um novo funcionário (Supabase Auth + public.pharmacy_users)
    """
    res = await supabase_service.add_pharmacy_user(
        name=data.name,
        email=data.email,
        password_plain=data.password,
        role=data.role,
        user_id=user_id
    )
    if not res:
        raise HTTPException(status_code=500, detail="Erro ao criar funcionário no servidor.")
    return res

@router.delete("/users/{member_id}")
async def remove_team_member(member_id: str, user_id: str = Depends(get_current_user)):
    """
    Remove o funcionário e exclui sua conta de acesso
    """
    success = await supabase_service.delete_pharmacy_user(member_id, user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Erro ao remover funcionário do servidor.")
    return {"status": "success", "message": "Funcionário excluído."}

@router.post("/users/{member_id}/change-password")
async def change_member_password(member_id: str, data: UserPasswordData, user_id: str = Depends(get_current_user)):
    """
    Altera de forma administrativa a senha de login do balconista/gerente
    """
    success = await supabase_service.update_pharmacy_user_password(member_id, data.new_password, user_id)
    if not success:
        raise HTTPException(status_code=500, detail="Erro ao alterar senha do funcionário.")
    return {"status": "success", "message": "Senha do funcionário atualizada."}



