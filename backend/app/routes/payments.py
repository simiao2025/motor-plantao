import logging
import os
import secrets
import string

from app.services.email_service import email_service
from app.services.supabase_service import supabase_service
from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/payments", tags=["Payments"])

def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/kiwify/webhook")
async def kiwify_webhook(request: Request, token: str = None):
    """
    Endpoint de Webhook da Kiwify.
    Segurança: Verifica token compartilhado.
    """
    expected_token = os.getenv("PAYMENT_WEBHOOK_TOKEN", "motor-plantao-seguro-2026")

    if token != expected_token:
        logging.warning(f"Tentativa de acesso não autorizada ao Webhook. Token: {token}")
        raise HTTPException(status_code=403, detail="Não autorizado")

    try:
        payload = await request.json()
        status = payload.get("order_status")
        email = payload.get("Customer", {}).get("email")
        full_name = payload.get("Customer", {}).get("full_name")
        order_id = payload.get("order_id")

        logging.info(f"Recebido Webhook Kiwify: Pedido {order_id} - Status {status}")

        # 1. Registrar o pagamento na tabela de auditoria (independente do sucesso do resto)
        payment_data = {
            "order_id": order_id,
            "customer_email": email,
            "customer_name": full_name,
            "amount": payload.get("total_amount_cents", 0) / 100,
            "status": status,
            "raw": payload
        }
        await supabase_service.log_payment(payment_data)

        # 2. Se o pagamento foi aprovado, inicia o provisionamento
        if status == "paid":
            temp_password = generate_temp_password()

            # Criar registro no banco (com fallback para campos NOT NULL)
            pharmacy_id = await supabase_service.create_pharmacy_onboarding(full_name, email)

            if pharmacy_id:
                # 3. Disparar e-mail com as credenciais
                logging.info(f"Disparando e-mail de boas-vindas para {email}")
                await email_service.send_welcome_email(email, full_name, temp_password)

                return {
                    "status": "success",
                    "message": "Payment logged and pharmacy onboarding initiated",
                    "pharmacy_id": pharmacy_id
                }
            else:
                logging.error(f"Falha ao criar farmácia para o e-mail: {email}")
                return {"status": "error", "message": "Failed to create pharmacy record"}

        return {"status": "received", "order_id": order_id}

    except Exception as e:
        logging.error(f"Erro ao processar webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
