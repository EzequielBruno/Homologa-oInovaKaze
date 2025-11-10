-- Criar enum para os módulos/recursos do sistema
CREATE TYPE permission_resource AS ENUM (
  'dashboard',
  'criar_demanda',
  'minhas_solicitacoes',
  'historico_acoes',
  'demandas_finalizadas',
  'kanban_empresa',
  'backlog_empresa',
  'progresso_empresa',
  'concluidas_empresa',
  'arquivadas_empresa',
  'gestao_riscos_empresa',
  'aguardando_validacao',
  'aguardando_insumos',
  'standby',
  'pareceres_pendentes',
  'faseamento',
  'estimativas',
  'retrospectiva',
  'planning',
  'agenda_reviews',
  'agenda_planning',
  'atualizacao_demandas',
  'aprovacoes',
  'permissoes',
  'relatorios'
);

-- Criar enum para ações nas permissões
CREATE TYPE permission_action AS ENUM (
  'view',    -- Visualizar
  'create',  -- Criar
  'edit',    -- Editar
  'delete',  -- Deletar
  'approve', -- Aprovar
  'manage'   -- Gerenciar (acesso completo)
);

-- Tabela de grupos de acesso
CREATE TABLE public.access_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  is_system_group BOOLEAN DEFAULT false, -- Grupos do sistema não podem ser deletados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de permissões dos grupos
CREATE TABLE public.group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.access_groups(id) ON DELETE CASCADE,
  resource permission_resource NOT NULL,
  action permission_action NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, resource, action)
);

-- Tabela de usuários em grupos
CREATE TABLE public.user_access_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.access_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Tabela de permissões customizadas por usuário (sobrescreve permissões de grupo)
CREATE TABLE public.user_custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource permission_resource NOT NULL,
  action permission_action NOT NULL,
  granted BOOLEAN DEFAULT true, -- true = concede permissão, false = revoga
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, resource, action)
);

-- Enable RLS
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para access_groups
CREATE POLICY "Authenticated users can view access groups"
ON public.access_groups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage access groups"
ON public.access_groups FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para group_permissions
CREATE POLICY "Authenticated users can view group permissions"
ON public.group_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage group permissions"
ON public.group_permissions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para user_access_groups
CREATE POLICY "Users can view their own groups"
ON public.user_access_groups FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage user groups"
ON public.user_access_groups FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para user_custom_permissions
CREATE POLICY "Users can view their own custom permissions"
ON public.user_custom_permissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage custom permissions"
ON public.user_custom_permissions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Função para verificar se usuário tem permissão específica
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id UUID,
  _resource permission_resource,
  _action permission_action
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins têm todas as permissões
  IF has_role(_user_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;

  -- Verifica permissões customizadas (maior prioridade)
  IF EXISTS (
    SELECT 1 FROM public.user_custom_permissions
    WHERE user_id = _user_id
      AND resource = _resource
      AND action = _action
      AND granted = true
  ) THEN
    RETURN true;
  END IF;

  -- Verifica se há revogação customizada
  IF EXISTS (
    SELECT 1 FROM public.user_custom_permissions
    WHERE user_id = _user_id
      AND resource = _resource
      AND action = _action
      AND granted = false
  ) THEN
    RETURN false;
  END IF;

  -- Verifica permissões por grupo
  IF EXISTS (
    SELECT 1 
    FROM public.user_access_groups uag
    JOIN public.group_permissions gp ON gp.group_id = uag.group_id
    WHERE uag.user_id = _user_id
      AND gp.resource = _resource
      AND gp.action = _action
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Função para copiar permissões de um usuário para outro
CREATE OR REPLACE FUNCTION public.copy_user_permissions(
  _source_user_id UUID,
  _target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validação
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem copiar permissões';
  END IF;

  -- Remove grupos atuais do usuário alvo
  DELETE FROM public.user_access_groups WHERE user_id = _target_user_id;
  
  -- Remove permissões customizadas atuais do usuário alvo
  DELETE FROM public.user_custom_permissions WHERE user_id = _target_user_id;

  -- Copia grupos
  INSERT INTO public.user_access_groups (user_id, group_id)
  SELECT _target_user_id, group_id
  FROM public.user_access_groups
  WHERE user_id = _source_user_id;

  -- Copia permissões customizadas
  INSERT INTO public.user_custom_permissions (user_id, resource, action, granted)
  SELECT _target_user_id, resource, action, granted
  FROM public.user_custom_permissions
  WHERE user_id = _source_user_id;
END;
$$;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_access_groups_updated_at
BEFORE UPDATE ON public.access_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir grupos padrão do sistema
INSERT INTO public.access_groups (nome, descricao, is_system_group) VALUES
('Administrador Master', 'Acesso total ao sistema', true),
('Gerência TI', 'Acesso completo para gestão de TI', true),
('Comitê Executivo', 'Membros do comitê com acesso a aprovações', true),
('Gerente de Projetos', 'Gerentes de projetos com acesso a gestão de riscos e demandas', true),
('Scrum Master', 'Acesso para gestão de cerimônias e atualizações', true),
('Tech Lead', 'Acesso para análise técnica e pareceres', true),
('Solicitante', 'Usuário padrão que pode criar e acompanhar demandas', true);

-- Obter IDs dos grupos criados
DO $$
DECLARE
  admin_group_id UUID;
  gerencia_ti_id UUID;
  comite_id UUID;
  gerente_proj_id UUID;
  scrum_master_id UUID;
  tech_lead_id UUID;
  solicitante_id UUID;
  all_resources permission_resource[];
  resource permission_resource;
BEGIN
  -- Buscar IDs dos grupos
  SELECT id INTO admin_group_id FROM public.access_groups WHERE nome = 'Administrador Master';
  SELECT id INTO gerencia_ti_id FROM public.access_groups WHERE nome = 'Gerência TI';
  SELECT id INTO comite_id FROM public.access_groups WHERE nome = 'Comitê Executivo';
  SELECT id INTO gerente_proj_id FROM public.access_groups WHERE nome = 'Gerente de Projetos';
  SELECT id INTO scrum_master_id FROM public.access_groups WHERE nome = 'Scrum Master';
  SELECT id INTO tech_lead_id FROM public.access_groups WHERE nome = 'Tech Lead';
  SELECT id INTO solicitante_id FROM public.access_groups WHERE nome = 'Solicitante';

  -- Array com todos os recursos
  all_resources := ARRAY[
    'dashboard', 'criar_demanda', 'minhas_solicitacoes', 'historico_acoes',
    'demandas_finalizadas', 'kanban_empresa', 'backlog_empresa', 'progresso_empresa',
    'concluidas_empresa', 'arquivadas_empresa', 'gestao_riscos_empresa',
    'aguardando_validacao', 'aguardando_insumos', 'standby',
    'pareceres_pendentes', 'faseamento', 'estimativas',
    'retrospectiva', 'planning', 'agenda_reviews', 'agenda_planning',
    'atualizacao_demandas', 'aprovacoes', 'permissoes', 'relatorios'
  ]::permission_resource[];

  -- Administrador Master: todas as permissões
  FOREACH resource IN ARRAY all_resources LOOP
    INSERT INTO public.group_permissions (group_id, resource, action) VALUES
      (admin_group_id, resource, 'manage'::permission_action);
  END LOOP;

  -- Gerência TI: todas as permissões (igual ao admin)
  FOREACH resource IN ARRAY all_resources LOOP
    INSERT INTO public.group_permissions (group_id, resource, action) VALUES
      (gerencia_ti_id, resource, 'manage'::permission_action);
  END LOOP;

  -- Comitê Executivo: visualizar tudo, aprovar, gerenciar aprovações
  FOREACH resource IN ARRAY all_resources LOOP
    INSERT INTO public.group_permissions (group_id, resource, action) VALUES
      (comite_id, resource, 'view'::permission_action);
  END LOOP;
  INSERT INTO public.group_permissions (group_id, resource, action) VALUES
    (comite_id, 'aprovacoes'::permission_resource, 'manage'::permission_action),
    (comite_id, 'aprovacoes'::permission_resource, 'approve'::permission_action);

  -- Gerente de Projetos
  INSERT INTO public.group_permissions (group_id, resource, action) VALUES
    (gerente_proj_id, 'dashboard'::permission_resource, 'view'::permission_action),
    (gerente_proj_id, 'gestao_riscos_empresa'::permission_resource, 'manage'::permission_action),
    (gerente_proj_id, 'kanban_empresa'::permission_resource, 'view'::permission_action),
    (gerente_proj_id, 'backlog_empresa'::permission_resource, 'view'::permission_action),
    (gerente_proj_id, 'progresso_empresa'::permission_resource, 'view'::permission_action),
    (gerente_proj_id, 'concluidas_empresa'::permission_resource, 'view'::permission_action),
    (gerente_proj_id, 'relatorios'::permission_resource, 'view'::permission_action);

  -- Scrum Master
  INSERT INTO public.group_permissions (group_id, resource, action) VALUES
    (scrum_master_id, 'dashboard'::permission_resource, 'view'::permission_action),
    (scrum_master_id, 'kanban_empresa'::permission_resource, 'manage'::permission_action),
    (scrum_master_id, 'retrospectiva'::permission_resource, 'manage'::permission_action),
    (scrum_master_id, 'planning'::permission_resource, 'manage'::permission_action),
    (scrum_master_id, 'agenda_reviews'::permission_resource, 'manage'::permission_action),
    (scrum_master_id, 'agenda_planning'::permission_resource, 'manage'::permission_action),
    (scrum_master_id, 'atualizacao_demandas'::permission_resource, 'manage'::permission_action);

  -- Tech Lead
  INSERT INTO public.group_permissions (group_id, resource, action) VALUES
    (tech_lead_id, 'dashboard'::permission_resource, 'view'::permission_action),
    (tech_lead_id, 'pareceres_pendentes'::permission_resource, 'manage'::permission_action),
    (tech_lead_id, 'faseamento'::permission_resource, 'manage'::permission_action),
    (tech_lead_id, 'estimativas'::permission_resource, 'manage'::permission_action),
    (tech_lead_id, 'kanban_empresa'::permission_resource, 'view'::permission_action);

  -- Solicitante
  INSERT INTO public.group_permissions (group_id, resource, action) VALUES
    (solicitante_id, 'dashboard'::permission_resource, 'view'::permission_action),
    (solicitante_id, 'criar_demanda'::permission_resource, 'create'::permission_action),
    (solicitante_id, 'minhas_solicitacoes'::permission_resource, 'view'::permission_action),
    (solicitante_id, 'historico_acoes'::permission_resource, 'view'::permission_action);
END $$;

-- Criar índices para performance
CREATE INDEX idx_group_permissions_group_id ON public.group_permissions(group_id);
CREATE INDEX idx_group_permissions_resource ON public.group_permissions(resource);
CREATE INDEX idx_user_access_groups_user_id ON public.user_access_groups(user_id);
CREATE INDEX idx_user_access_groups_group_id ON public.user_access_groups(group_id);
CREATE INDEX idx_user_custom_permissions_user_id ON public.user_custom_permissions(user_id);
CREATE INDEX idx_user_custom_permissions_resource ON public.user_custom_permissions(resource);