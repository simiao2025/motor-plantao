import logging


class EmailService:
    async def send_welcome_email(self, email: str, name: str, temp_password: str):
        """
        Simula o envio de e-mail de boas-vindas com credenciais.
        Link de acesso, E-mail cadastrado e Senha Temporária.
        """
        access_link = "http://localhost:3000/login" # Em produção seria o domínio real

        logging.info(f"Enviando e-mail de boas-vindas para {email}")

        # Simulando corpo do e-mail no terminal
        print("\n" + "="*50)
        print("========= MOCK EMAIL (BEM-VINDO) =========")
        print(f"PARA: {email}")
        print(f"ASSUNTO: Bem-vindo ao Motor de Plantão IA, {name}!")
        print("-" * 50)
        print(f"Olá {name}, sua assinatura foi confirmada!")
        print("\nAcesse o seu painel administrativo pelo link abaixo:")
        print(f"🔗 LINK: {access_link}")
        print("\nSuas credenciais de primeiro acesso:")
        print(f"📧 E-MAIL: {email}")
        print(f"🔑 SENHA TEMPORÁRIA: {temp_password}")
        print("\n* Por segurança, altere sua senha no primeiro acesso.")
        print("="*50 + "\n")

        # Aqui integraria com Resend ou SMTP
        # if settings.RESEND_API_KEY:
        #     ... código de envio real ...

        return True

email_service = EmailService()
