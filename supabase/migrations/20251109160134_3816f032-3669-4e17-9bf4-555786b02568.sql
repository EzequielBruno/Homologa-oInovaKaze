-- Adicionar status 'Bloqueado' ao enum demand_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'demand_status' AND e.enumlabel = 'Bloqueado'
  ) THEN
    ALTER TYPE demand_status ADD VALUE 'Bloqueado';
  END IF;
END $$;