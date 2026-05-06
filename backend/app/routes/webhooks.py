from fastapi import APIRouter, HTTPException, Request, Header
from app.services.evolution_service import evolution_service
import logging

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/payment")
async def marketplace_webhook(
    request: Request,
    x_marketplace_token: str = Header(None)
):
    """
    Recebe a confirmação de pagamento do marketplace.
    """
    # 1. Validar token de segurança (SDD/Cybersecurity)
    # if x_marketplace_token != settings.MARKETPLACE_WEBHOOK_TOKEN:
    #     raise HTTPException(status_code=403, detail="Invalid token")

    data = await request.json()
    email = data.get("email")
    status = data.get("status")

    if status != "approved":
        return {"message": "Payment not approved, skipping"}

    logging.info(f"Processando pagamento para: {email}")

    # 2. Criar usuário no Supabase (será implementado no serviço de Auth)
    # TODO: Implementar supabase_service.create_user(email)

    return {"message": "Webhook received, processing onboarding"}
