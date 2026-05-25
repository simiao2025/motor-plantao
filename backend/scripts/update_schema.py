import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def update_schema():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    print("🚀 Atualizando esquema da tabela 'ai_context_logs'...")
    
    # Adicionando colunas necessárias via SQL RPC ou Direto
    # Como o Supabase Python não tem 'run_sql' direto por segurança, 
    # recomendamos executar este SQL no Dashboard caso o script falhe nas permissões.
    
    sql = """
    ALTER TABLE public.ai_context_logs 
    ADD COLUMN IF NOT EXISTS user_phone TEXT,
    ADD COLUMN IF NOT EXISTS triage_level TEXT DEFAULT 'VERDE';
    
    COMMENT ON COLUMN public.ai_context_logs.triage_level IS 'Nível detectado pela IA: VERDE, AMARELO, VERMELHO';
    """
    
    print("✅ Por favor, execute o seguinte comando no SQL Editor do seu Supabase Dashboard:")
    print("-" * 50)
    print(sql)
    print("-" * 50)

if __name__ == "__main__":
    update_schema()
