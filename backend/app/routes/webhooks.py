import logging

from app.services.evolution_service import evolution_service
from app.services.supabase_service import supabase_service
from fastapi import APIRouter, Header, Request

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/payment")
async def marketplace_webhook(
    request: Request,
    _x_marketplace_token: str = Header(None)
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

@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    Recebe mensagens do WhatsApp via Evolution API e processa com IA.
    """
    from app.agent.motor import pharmacy_agent

    data = await request.json()
    event = data.get("event")

    if event != "messages.upsert":
        return {"status": "ignored"}

    message_data = data.get("data", {})
    instance = data.get("instance")
    remote_jid = message_data.get("key", {}).get("remoteJid")
    is_from_me = message_data.get("key", {}).get("fromMe")

    # Ignorar mensagens enviadas por mim mesmo para evitar loops
    if is_from_me:
        return {"status": "ignored"}

    text = message_data.get("message", {}).get("conversation") or \
           message_data.get("message", {}).get("extendedTextMessage", {}).get("text")

    if not text:
        return {"status": "no_text"}

    logging.info(f"Mensagem recebida de {remote_jid}: {text}")

    # 1. Processar com o Agente de IA
    try:
        response_text = await pharmacy_agent.run(text)

        # 2. Identificar o Nível de Triagem na resposta (para o banco de dados)
        triage_level = "VERDE"
        if "VERMELHO" in response_text.upper(): triage_level = "VERMELHO"
        elif "AMARELO" in response_text.upper(): triage_level = "AMARELO"

        # 3. Buscar a farmácia associada a esta instância
        pharmacy_id = await supabase_service.get_pharmacy_by_instance(instance)

        # 4. Salvar no Banco de Dados (Supabase)
        await supabase_service.log_context(
            pharmacy_id=pharmacy_id,
            content=text,
            response=response_text,
            user_phone=remote_jid,
            triage_level=triage_level
        )

        # 5. Enviar resposta de volta via Evolution API
        await evolution_service.send_text(instance, remote_jid, response_text)

        logging.info(f"IA Respondeu para {remote_jid} [{triage_level}]: {response_text}")

        return {"status": "success", "response": response_text}
    except Exception as e:
        logging.error(f"Erro no processamento da IA: {str(e)}")
        return {"status": "error", "detail": str(e)}
