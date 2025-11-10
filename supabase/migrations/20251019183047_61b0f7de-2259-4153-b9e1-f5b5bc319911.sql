-- Adicionar campo de coordenador TI nas squads
ALTER TABLE squads ADD COLUMN IF NOT EXISTS coordenador_ti_id uuid REFERENCES auth.users(id);

-- Criar tabela para permissões de empresa com níveis
CREATE TABLE IF NOT EXISTS empresa_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
  empresa text NOT NULL,
  nivel_acesso text NOT NULL CHECK (nivel_acesso IN ('gerencial', 'operacional', 'departamental')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, empresa)
);

-- Habilitar RLS
ALTER TABLE empresa_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para empresa_permissions
CREATE POLICY "Admins can manage empresa permissions"
ON empresa_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view empresa permissions"
ON empresa_permissions FOR SELECT
USING (true);

-- Adicionar novas permissões de recursos
DO $$
BEGIN
  -- Adicionar novos valores ao enum se ainda não existem
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'permission_resource' AND e.enumlabel = 'relatorios') THEN
    ALTER TYPE permission_resource ADD VALUE 'relatorios';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'permission_resource' AND e.enumlabel = 'coordenador_ti') THEN
    ALTER TYPE permission_resource ADD VALUE 'coordenador_ti';
  END IF;
END$$;

-- Função para verificar se usuário tem acesso a uma empresa
CREATE OR REPLACE FUNCTION user_has_empresa_access(_user_id uuid, _empresa text, _nivel text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Admins e Tech Leads têm acesso a tudo
  IF has_role(_user_id, 'admin'::app_role) OR has_role(_user_id, 'tech_lead'::app_role) THEN
    RETURN true;
  END IF;

  -- Verifica se usuário tem acesso através de grupos
  IF _nivel IS NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM user_access_groups uag
      JOIN empresa_permissions ep ON ep.group_id = uag.group_id
      WHERE uag.user_id = _user_id
        AND ep.empresa = _empresa
    );
  ELSE
    RETURN EXISTS (
      SELECT 1
      FROM user_access_groups uag
      JOIN empresa_permissions ep ON ep.group_id = uag.group_id
      WHERE uag.user_id = _user_id
        AND ep.empresa = _empresa
        AND ep.nivel_acesso = _nivel
    );
  END IF;
END;
$$;

-- Inserir permissões de empresa para grupos existentes
INSERT INTO empresa_permissions (group_id, empresa, nivel_acesso)
SELECT 
  ag.id,
  'ZF',
  CASE 
    WHEN ag.nome IN ('Administrador Master', 'Tech Lead') THEN 'gerencial'
    WHEN ag.nome IN ('Coordenadores TI', 'Gerente de Projetos', 'Comitê Executivo', 'Scrum Master') THEN 'gerencial'
    WHEN ag.nome IN ('Gestores') THEN 'departamental'
    ELSE 'operacional'
  END
FROM access_groups ag
WHERE NOT EXISTS (
  SELECT 1 FROM empresa_permissions ep WHERE ep.group_id = ag.id AND ep.empresa = 'ZF'
);

INSERT INTO empresa_permissions (group_id, empresa, nivel_acesso)
SELECT 
  ag.id,
  'Eletro',
  CASE 
    WHEN ag.nome IN ('Administrador Master', 'Tech Lead') THEN 'gerencial'
    WHEN ag.nome IN ('Coordenadores TI', 'Gerente de Projetos', 'Comitê Executivo', 'Scrum Master') THEN 'gerencial'
    WHEN ag.nome IN ('Gestores') THEN 'departamental'
    ELSE 'operacional'
  END
FROM access_groups ag
WHERE NOT EXISTS (
  SELECT 1 FROM empresa_permissions ep WHERE ep.group_id = ag.id AND ep.empresa = 'Eletro'
);

-- Adicionar permissão de relatórios para grupos gerenciais
INSERT INTO group_permissions (group_id, resource, action)
SELECT ag.id, 'relatorios'::permission_resource, 'view'::permission_action
FROM access_groups ag
WHERE ag.nome IN ('Administrador Master', 'Tech Lead', 'Gerência TI', 'Comitê Executivo', 'Gerente de Projetos')
AND NOT EXISTS (
  SELECT 1 FROM group_permissions gp 
  WHERE gp.group_id = ag.id 
  AND gp.resource = 'relatorios'::permission_resource 
  AND gp.action = 'view'::permission_action
);