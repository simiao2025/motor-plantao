import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Carrega as variaveis do .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def create_admin():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao encontradas no .env")
        return

    # Usamos a SERVICE_ROLE_KEY para ignorar politicas de RLS e criar usuarios
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    admin_email = "admin@motorplantao.com.br"
    admin_password = "AdminMotor2026@" 

    print(f"Iniciando criacao do usuario administrador: {admin_email}...")

    try:
        # 1. Criar usuario no Auth
        user = supabase.auth.admin.create_user({
            "email": admin_email,
            "password": admin_password,
            "email_confirm": True
        })
        
        user_id = user.user.id
        print(f"Usuario criado no Auth com ID: {user_id}")

        print(f"\nCREDENCIAIS DE ACESSO:")
        print(f"Email: {admin_email}")
        print(f"Senha: {admin_password}")
        print(f"\nIMPORTANTE: Use estas credenciais na tela de login.")

    except Exception as e:
        if "already registered" in str(e):
            print(f"O usuario {admin_email} ja existe no sistema.")
        else:
            print(f"Erro ao criar admin: {str(e)}")

if __name__ == "__main__":
    asyncio.run(create_admin())
