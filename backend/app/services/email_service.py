import logging
import httpx
from app.core.config import settings

class EmailService:
    async def _send_resend_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """
        Método auxiliar interno para enviar e-mails usando a API oficial do Resend.com.
        Se nenhuma chave de API estiver definida, faz o fallback para simulação no terminal.
        """
        api_key = settings.RESEND_API_KEY
        from_email = settings.RESEND_FROM_EMAIL

        # Fallback de Desenvolvimento local se sem chave de API
        if not api_key:
            logging.info(f"[RESEND SIMULATION] Envio de e-mail mockado para {to_email}")
            print("\n" + "="*60)
            print("========= SIMULAÇÃO DE E-MAIL (RESEND MOCK) =========")
            print(f"DE: {from_email}")
            print(f"PARA: {to_email}")
            print(f"ASSUNTO: {subject}")
            print("-" * 60)
            print(html_content)
            print("="*60 + "\n")
            return True

        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, headers=headers, timeout=10.0)
                
            if res.status_code in [200, 201]:
                logging.info(f"E-mail enviado via Resend para {to_email} com ID: {res.json().get('id')}")
                return True
            else:
                logging.error(f"Erro ao disparar Resend: {res.status_code} - {res.text}")
                return False
        except Exception as e:
            logging.error(f"Falha de rede ou timeout na API do Resend: {str(e)}")
            return False

    async def send_welcome_email(self, email: str, name: str, temp_password: str):
        """
        Dispara e-mail de boas-vindas com a senha provisória de acesso (Fluxo Kiwify).
        """
        access_link = f"{settings.PUBLIC_URL}/login" if settings.PUBLIC_URL != "https://your-public-url.com" else "http://localhost:3000/login"
        
        subject = f"Bem-vindo ao {settings.APP_NAME}, {name}!"
        
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f43f5e; font-size: 28px; margin: 0; text-transform: uppercase; letter-spacing: -1px;">Motor de Plantão <span style="color: #f97316;">IA</span></h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Seu Assistente Inteligente 24h de Triagem e Vendas</p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />
            
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">Olá <strong>{name}</strong>,</p>
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">Sua assinatura foi confirmada com sucesso! A partir de agora, sua farmácia contará com uma inteligência artificial SDR autônoma no WhatsApp para triar sintomas de pacientes de forma acolhedora e eficaz.</p>
            
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase;">Credenciais de Primeiro Acesso</p>
                <p style="margin: 4px 0; font-size: 16px; color: #1e293b;"><strong>E-MAIL:</strong> {email}</p>
                <p style="margin: 4px 0; font-size: 16px; color: #1e293b;"><strong>SENHA TEMPORÁRIA:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{temp_password}</span></p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="{access_link}" style="background-image: linear-gradient(to right, #f43f5e, #f97316); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(244,63,94,0.3);">
                    ACESSAR PAINEL ADMINISTRATIVO
                </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
                * Por segurança, você será convidado a definir uma nova senha no seu primeiro login.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 32px; margin-bottom: 16px;" />
            
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                Este e-mail foi enviado automaticamente. Por favor, não responda diretamente a esta mensagem.
            </p>
        </div>
        """
        
        return await self._send_resend_email(email, subject, html_content)

    async def send_verification_email(self, email: str, name: str, token: str):
        """
        Dispara e-mail de ativação de conta com link seguro após registro manual.
        """
        confirm_link = f"{settings.PUBLIC_URL}/admin/auth/confirm-email?token={token}" if settings.PUBLIC_URL != "https://your-public-url.com" else f"http://localhost:8000/admin/auth/confirm-email?token={token}"
        
        subject = f"Confirme sua conta no {settings.APP_NAME}"
        
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f43f5e; font-size: 28px; margin: 0; text-transform: uppercase; letter-spacing: -1px;">Motor de Plantão <span style="color: #f97316;">IA</span></h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Ativação e Segurança de Conta</p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />
            
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">Olá <strong>{name}</strong>,</p>
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">Obrigado por se registrar no Motor de Plantão. Para ativar sua conta administrativa e iniciar a configuração do assistente IA da sua farmácia, por favor confirme seu e-mail clicando no botão abaixo:</p>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="{confirm_link}" style="background-image: linear-gradient(to right, #f43f5e, #f97316); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(244,63,94,0.3);">
                    CONFIRMAR MEU E-MAIL
                </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
                Ou copie e cole o link abaixo no seu navegador:<br />
                <a href="{confirm_link}" style="color: #f43f5e; word-break: break-all;">{confirm_link}</a>
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 32px; margin-bottom: 16px;" />
            
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                Se você não realizou este cadastro, por favor ignore este e-mail de forma segura.
            </p>
        </div>
        """
        
        return await self._send_resend_email(email, subject, html_content)

email_service = EmailService()
