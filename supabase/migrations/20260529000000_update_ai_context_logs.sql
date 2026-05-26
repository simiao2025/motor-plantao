-- Adicionar colunas de triagem e celular do usuário à tabela de logs de contexto de IA
ALTER TABLE public.ai_context_logs 
ADD COLUMN IF NOT EXISTS user_phone TEXT,
ADD COLUMN IF NOT EXISTS triage_level TEXT DEFAULT 'VERDE';

COMMENT ON COLUMN public.ai_context_logs.triage_level IS 'Nível detectado pela IA: VERDE, AMARELO, VERMELHO';
