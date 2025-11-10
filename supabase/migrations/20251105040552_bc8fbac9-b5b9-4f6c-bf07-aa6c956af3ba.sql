-- Adicionar função para atribuir grupo padrão a usuários sem grupo
CREATE OR REPLACE FUNCTION public.ensure_user_default_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_group_id UUID;
BEGIN
  -- Busca o ID do grupo "Solicitante" (grupo padrão)
  SELECT id INTO default_group_id
  FROM access_groups
  WHERE nome = 'Solicitante'
  LIMIT 1;

  -- Se o grupo existe, atribui ao novo usuário
  IF default_group_id IS NOT NULL THEN
    INSERT INTO user_access_groups (user_id, group_id)
    VALUES (NEW.id, default_group_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para atribuir grupo padrão automaticamente
DROP TRIGGER IF EXISTS on_user_created_assign_group ON auth.users;
CREATE TRIGGER on_user_created_assign_group
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_default_group();

-- Atribuir grupo "Solicitante" para usuários existentes sem grupo
INSERT INTO user_access_groups (user_id, group_id)
SELECT p.id, ag.id
FROM profiles p
CROSS JOIN access_groups ag
WHERE ag.nome = 'Solicitante'
  AND NOT EXISTS (
    SELECT 1 FROM user_access_groups uag WHERE uag.user_id = p.id
  )
ON CONFLICT DO NOTHING;