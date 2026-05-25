import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carrega as variáveis do .env
load_dotenv()

async def check_last_pharmacy():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    supabase = create_client(url, key)
    
    res = supabase.table("pharmacies").select("*").order("created_at", desc=True).limit(1).execute()
    
    if res.data:
        print(f"SUCESSO: Recebemos um registro!")
        print(f"Nome: {res.data[0]['name']}")
        print(f"E-mail: {res.data[0]['email']}")
        print(f"Data: {res.data[0]['created_at']}")
    else:
        print("Nenhum registro encontrado na tabela de farmácias.")

if __name__ == "__main__":
    asyncio.run(check_last_pharmacy())
