-- Melhorar as policies RLS da tabela demands para permitir acesso baseado em grupos de empresa

-- Remove a policy antiga de SELECT e cria uma nova mais abrangente
DROP POLICY IF EXISTS "Users can view demands based on role" ON demands;

CREATE POLICY "Users can view demands based on permissions"
ON demands
FOR SELECT
USING (
  -- Admins e Tech Leads podem ver tudo
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'tech_lead'::app_role) OR
  -- Membros do comitê podem ver tudo
  is_committee_member(auth.uid()) OR
  -- Usuários com acesso à empresa da demanda
  user_has_empresa_access(auth.uid(), empresa::text) OR
  -- Criador da demanda
  solicitante_id = auth.uid()
);

-- Melhorar policy de INSERT
DROP POLICY IF EXISTS "Solicitantes can create demands for their company" ON demands;

CREATE POLICY "Users can create demands with empresa access"
ON demands
FOR INSERT
WITH CHECK (
  -- Admins e Tech Leads podem criar para qualquer empresa
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'tech_lead'::app_role) OR
  -- Usuários com acesso à empresa podem criar demandas
  user_has_empresa_access(auth.uid(), empresa::text) OR
  -- Solicitantes da empresa podem criar
  ((get_solicitante_empresa(auth.uid()) IS NOT NULL) AND (empresa::text = get_solicitante_empresa(auth.uid())))
);

-- Melhorar policy de UPDATE
DROP POLICY IF EXISTS "Users can update own demands or tech leads can update all" ON demands;

CREATE POLICY "Users can update demands with permissions"
ON demands
FOR UPDATE
USING (
  -- Admins e Tech Leads podem atualizar tudo
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'tech_lead'::app_role) OR
  -- Usuários com acesso gerencial ou operacional à empresa
  user_has_empresa_access(auth.uid(), empresa::text, 'operacional') OR
  user_has_empresa_access(auth.uid(), empresa::text, 'gerencial') OR
  -- Criador da demanda
  solicitante_id = auth.uid()
);

-- Melhorar policy de DELETE
DROP POLICY IF EXISTS "Users can delete own demands or admins can delete all" ON demands;

CREATE POLICY "Users can delete demands with permissions"
ON demands
FOR DELETE
USING (
  -- Apenas admins e Tech Leads podem deletar
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'tech_lead'::app_role) OR
  -- Criador pode deletar próprias demandas em Backlog
  (solicitante_id = auth.uid() AND status = 'Backlog')
);