-- Permite que usuários autenticados gerenciem membros do comitê
DROP POLICY IF EXISTS "Admins can manage committee members" ON public.committee_members;

CREATE POLICY "Authenticated users can manage committee members"
ON public.committee_members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permite que usuários autenticados gerenciem scrum masters
DROP POLICY IF EXISTS "Admins can manage scrum masters" ON public.scrum_masters;

CREATE POLICY "Authenticated users can manage scrum masters"
ON public.scrum_masters
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);