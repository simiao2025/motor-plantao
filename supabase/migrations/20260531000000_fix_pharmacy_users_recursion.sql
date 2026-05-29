-- Remover a política antiga recursiva que causava erro de recursão infinita (estouro de pilha) no SELECT
DROP POLICY IF EXISTS "Allow users to read members of the same pharmacy" ON public.pharmacy_users;

-- 1. Permitir que qualquer usuário autenticado leia seu próprio registro de membro
CREATE POLICY "Allow users to read their own member record" ON public.pharmacy_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2. Permitir que o proprietário da farmácia (owner) gerencie (SELECT, INSERT, UPDATE, DELETE) todos os membros de sua farmácia
-- Cruzamos o ID da farmácia diretamente a partir da tabela pharmacies que está indexada e segura, evitando recursão infinita!
CREATE POLICY "Allow owners to manage their pharmacy members" ON public.pharmacy_users
FOR ALL TO authenticated
USING (
    pharmacy_id IN (
        SELECT id FROM public.pharmacies WHERE owner_id = auth.uid()
    )
);
