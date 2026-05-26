-- Criação da Tabela de Plantões
CREATE TABLE IF NOT EXISTS public.pharmacy_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Segurança de Linha)
ALTER TABLE public.pharmacy_shifts ENABLE ROW LEVEL SECURITY;

-- Criar política segura para leitura (apenas membros autenticados pertencentes à mesma farmácia)
CREATE POLICY "Allow users to read shifts of the same pharmacy" ON public.pharmacy_shifts
FOR SELECT TO authenticated
USING (
    pharmacy_id IN (
        SELECT u.pharmacy_id FROM public.pharmacy_users u WHERE u.user_id = auth.uid()
    )
);
