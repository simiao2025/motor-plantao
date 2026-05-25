import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

async def check_setup():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)
    
    cities = supabase.table("cities").select("count", count="exact").execute()
    users = supabase.table("pharmacies").select("owner_id").limit(1).execute() # Tenta ver se há algum owner já
    
    print(f"Cidades cadastradas: {cities.count}")
    
    # Verifica usuários do Auth (via rpc ou metadados se possível, ou apenas tenta listar auth.users)
    # No Supabase, listar auth.users direto via client service role às vezes requer configuração.
    # Vamos tentar criar uma cidade se estiver vazio.
    if cities.count == 0:
        print("Criando cidade padrão para testes...")
        supabase.table("cities").insert({
            "name": "Cidade Teste",
            "state": "SC",
            "slug": "cidade-teste"
        }).execute()
        print("Cidade criada!")

if __name__ == "__main__":
    asyncio.run(check_setup())
