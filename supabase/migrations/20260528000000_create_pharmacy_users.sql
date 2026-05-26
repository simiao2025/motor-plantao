-- 1. Criar a Tabela de Usuários da Farmácia
CREATE TABLE IF NOT EXISTS public.pharmacy_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('owner', 'manager', 'salesperson')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Segurança de Linha) para a tabela de usuários
ALTER TABLE public.pharmacy_users ENABLE ROW LEVEL SECURITY;

-- Criar políticas seguras para a tabela de usuários (Leitura apenas para membros da mesma farmácia)
CREATE POLICY "Allow users to read members of the same pharmacy" ON public.pharmacy_users
FOR SELECT TO authenticated
USING (
    pharmacy_id IN (
        SELECT u.pharmacy_id FROM public.pharmacy_users u WHERE u.user_id = auth.uid()
    )
);
