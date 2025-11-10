-- Corrigir search_path da função check_dependency_cycle
CREATE OR REPLACE FUNCTION public.check_dependency_cycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  has_cycle BOOLEAN;
BEGIN
  -- Verifica se adicionar esta dependência criaria um ciclo
  WITH RECURSIVE dep_chain AS (
    SELECT NEW.demand_id as current_demand, NEW.depends_on_demand_id as depends_on, 1 as depth
    UNION ALL
    SELECT dc.current_demand, dd.depends_on_demand_id, dc.depth + 1
    FROM dep_chain dc
    JOIN public.demand_dependencies dd ON dd.demand_id = dc.depends_on
    WHERE dc.depth < 50
  )
  SELECT EXISTS(
    SELECT 1 FROM dep_chain WHERE depends_on = NEW.demand_id
  ) INTO has_cycle;
  
  IF has_cycle THEN
    RAISE EXCEPTION 'Esta dependência criaria um ciclo circular';
  END IF;
  
  RETURN NEW;
END;
$function$;