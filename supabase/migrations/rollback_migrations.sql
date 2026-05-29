-- Rollback das modificações introduzidas pela migration 20260531000000_fix_pharmacy_users_recursion.sql

-- Remover as políticas criadas na migration
DROP POLICY IF EXISTS "Allow users to read their own member record" ON public.pharmacy_users;
DROP POLICY IF EXISTS "Allow owners to manage their pharmacy members" ON public.pharmacy_users;

-- Recriar a política antiga recursiva (que foi removida na migration)
CREATE POLICY "Allow users to read members of the same pharmacy" ON public.pharmacy_users
FOR SELECT TO authenticated
USING (
    pharmacy_id IN (
        SELECT pharmacy_id FROM public.pharmacy_users WHERE user_id = auth.uid()
    )
);

-- Rollback das modificações introduzidas pela migration 20260601000000_add_rag_documents.sql
ALTER TABLE public.pharmacies
DROP COLUMN IF EXISTS rag_documents;
