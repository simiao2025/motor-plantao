import logging

from app.core.config import settings
from app.services.evolution_service import evolution_service
from app.services.supabase_service import supabase_service
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

class PharmacyRegistration(BaseModel):
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
async def finalize_onboarding(data: PharmacyRegistration):
    """
    Recebe dados do perfil, cria instância no Evolution e salva no banco.
    """
    try:
        logging.info(f"Finalizando onboarding para CNPJ: {data.cnpj}")

        # 1. Identificar a farmácia pendente
        res = supabase_service.client.table("pharmacies") \
            .select("id") \
            .eq("profile_completed", False) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()

        if not res.data:
            # Fallback: Se não achar pendente, tenta pelo nome
            res = supabase_service.client.table("pharmacies") \
                .select("id") \
                .eq("name", data.name) \
                .execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Farmácia não encontrada para finalização.")

        pharmacy_id = res.data[0]["id"]

        # 2. Criar Instância na Evolution
        evo_res = await evolution_service.create_instance(data.cnpj)

        if evo_res.get("status") == "error":
            raise HTTPException(status_code=500, detail=f"Erro na Evolution: {evo_res.get('message')}")

        # 3. Configurar Webhook Automaticamente
        webhook_url = f"{settings.PUBLIC_URL}/webhooks/whatsapp"
        await evolution_service.set_webhook(data.cnpj, webhook_url)

        # 4. Tratar Cidade (Busca ou Cria)
        slug = data.city_name.lower().replace(" ", "-")
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

        # 5. Finalizar no Supabase
        final_data = data.dict()
        final_data["city_id"] = city_id # Converte nome em ID para o banco
        final_data["instance_name"] = data.cnpj
        final_data["evolution_apikey"] = evo_res.get("instance_key")

        result = await supabase_service.finalize_pharmacy_onboarding(pharmacy_id, final_data)

        return {
            "status": "success",
            "message": "Onboarding finalizado e instância provisionada.",
            "pharmacy_id": pharmacy_id,
            "instance": data.cnpj
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Erro inesperado no finalize_onboarding: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

@router.get("/pharmacy/pre-fill")
async def get_pre_fill_data():
    """
    Busca os dados básicos da farmácia pendente para preencher o formulário.
    """
    try:
        # Busca a farmácia mais recente que ainda não completou o perfil
        res = supabase_service.client.table("pharmacies") \
            .select("nome_responsavel, email, razao_social") \
            .eq("profile_completed", False) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()

        if not res.data:
            return {}

        data = res.data[0]
        return {
            "nome_responsavel": data.get("nome_responsavel") or data.get("razao_social"),
            "email": data.get("email")
        }
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
async def get_stats():
    try:
        stats = await supabase_service.get_dashboard_stats()
        recent = await supabase_service.get_recent_triages()
        history = await supabase_service.get_historical_triages()
        return {
            "stats": stats,
            "recent_activity": recent,
            "history": history
        }
    except Exception as e:
        logging.error(f"Erro ao buscar estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar estatísticas")

@router.get("/dashboard/clients")
async def get_clients():
    try:
        clients = await supabase_service.get_unique_clients()
        return clients
    except Exception as e:
        logging.error(f"Erro ao buscar clientes: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar clientes")
