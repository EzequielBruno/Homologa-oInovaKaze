-- Criar função para sincronizar roles baseadas em grupos
CREATE OR REPLACE FUNCTION public.sync_user_roles_from_groups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name TEXT;
  v_target_role app_role;
BEGIN
  -- Busca o nome do grupo que foi adicionado/removido
  SELECT nome INTO v_group_name
  FROM access_groups
  WHERE id = NEW.group_id;

  -- Mapeia grupos para roles
  v_target_role := CASE v_group_name
    WHEN 'Administrador Master' THEN 'admin'::app_role
    WHEN 'Tech Lead' THEN 'tech_lead'::app_role
    ELSE 'user'::app_role
  END;

  -- Se for um grupo que mapeia para uma role específica
  IF v_target_role != 'user'::app_role THEN
    -- Adiciona a role se não existir
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, v_target_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar roles quando usuário é adicionado a um grupo
DROP TRIGGER IF EXISTS sync_roles_on_group_add ON user_access_groups;
CREATE TRIGGER sync_roles_on_group_add
  AFTER INSERT ON user_access_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_roles_from_groups();

-- Sincronizar roles existentes baseado nos grupos atuais
-- Adicionar role 'admin' para usuários no grupo "Administrador Master"
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT uag.user_id, 'admin'::app_role
FROM user_access_groups uag
JOIN access_groups ag ON ag.id = uag.group_id
WHERE ag.nome = 'Administrador Master'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = uag.user_id AND ur.role = 'admin'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Adicionar role 'tech_lead' para usuários no grupo "Tech Lead"
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT uag.user_id, 'tech_lead'::app_role
FROM user_access_groups uag
JOIN access_groups ag ON ag.id = uag.group_id
WHERE ag.nome = 'Tech Lead'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = uag.user_id AND ur.role = 'tech_lead'
  )
ON CONFLICT (user_id, role) DO NOTHING;