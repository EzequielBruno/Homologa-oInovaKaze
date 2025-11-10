-- Função auxiliar para verificar se usuário é membro do comitê
CREATE OR REPLACE FUNCTION public.is_committee_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.committee_members
    WHERE user_id = _user_id
      AND ativo = true
  )
$$;

-- Função auxiliar para obter a empresa do solicitante
CREATE OR REPLACE FUNCTION public.get_solicitante_empresa(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa
  FROM public.solicitantes
  WHERE user_id = _user_id
    AND ativo = true
  LIMIT 1
$$;

-- Atualiza políticas RLS da tabela demands para restringir acesso por empresa
DROP POLICY IF EXISTS "Users can view all demands" ON public.demands;

CREATE POLICY "Users can view demands based on role"
ON public.demands
FOR SELECT
TO authenticated
USING (
  -- Membros do comitê veem tudo
  public.is_committee_member(auth.uid())
  OR
  -- Admin vê tudo
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Tech lead vê tudo
  public.has_role(auth.uid(), 'tech_lead'::app_role)
  OR
  -- Solicitantes só veem demandas da sua empresa (com cast explícito)
  (
    public.get_solicitante_empresa(auth.uid()) IS NOT NULL
    AND empresa::text = public.get_solicitante_empresa(auth.uid())
  )
  OR
  -- Criador da demanda sempre vê sua própria demanda
  solicitante_id = auth.uid()
);

-- Atualiza política de criação de demands
DROP POLICY IF EXISTS "Authenticated users can create demands" ON public.demands;

CREATE POLICY "Solicitantes can create demands for their company"
ON public.demands
FOR INSERT
TO authenticated
WITH CHECK (
  -- Apenas solicitantes ou admins podem criar demandas
  (
    public.get_solicitante_empresa(auth.uid()) IS NOT NULL
    AND empresa::text = public.get_solicitante_empresa(auth.uid())
  )
  OR
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  public.has_role(auth.uid(), 'tech_lead'::app_role)
);

-- Atualiza política de aprovações
DROP POLICY IF EXISTS "Approvers can create their approvals" ON public.demand_approvals;

CREATE POLICY "Committee and managers can create approvals"
ON public.demand_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = approver_id
  AND (
    -- Membros do comitê podem aprovar
    public.is_committee_member(auth.uid())
    OR
    -- Admins e tech leads podem aprovar
    public.has_role(auth.uid(), 'admin'::app_role)
    OR
    public.has_role(auth.uid(), 'tech_lead'::app_role)
  )
);