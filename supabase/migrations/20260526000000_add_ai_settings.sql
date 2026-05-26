-- Adicionar configurações de IA na tabela pharmacies
ALTER TABLE public.pharmacies 
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS rag_base TEXT,
ADD COLUMN IF NOT EXISTS auto_response BOOLEAN DEFAULT true;
