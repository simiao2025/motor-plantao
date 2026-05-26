-- 1. Adicionar colunas comerciais detalhadas e chaves de integração da Meta API à tabela pharmacies
ALTER TABLE public.pharmacies 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_channel VARCHAR(20) DEFAULT 'evolution',
ADD COLUMN IF NOT EXISTS meta_token TEXT,
ADD COLUMN IF NOT EXISTS meta_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS meta_waba_id TEXT,
ADD COLUMN IF NOT EXISTS razao_social TEXT,
ADD COLUMN IF NOT EXISTS nome_responsavel TEXT,
ADD COLUMN IF NOT EXISTS responsible_cpf VARCHAR(11),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS state CHAR(2);

-- 2. Criar tabela de cadastros pendentes de confirmação por e-mail
CREATE TABLE IF NOT EXISTS public.pending_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL, -- Armazena temporariamente a senha até a confirmação de ativação
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para pending_confirmations (apenas leitura interna do backend por segurança)
ALTER TABLE public.pending_confirmations ENABLE ROW LEVEL SECURITY;
