-- Create foreign keys for demands table
-- First, make sure columns are not null where needed
UPDATE public.demands SET solicitante_id = (SELECT id FROM public.profiles LIMIT 1) WHERE solicitante_id IS NULL;

-- Add foreign keys
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'demands_solicitante_id_fkey'
  ) THEN
    ALTER TABLE public.demands 
      ADD CONSTRAINT demands_solicitante_id_fkey 
      FOREIGN KEY (solicitante_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'demands_responsavel_tecnico_id_fkey'
  ) THEN
    ALTER TABLE public.demands 
      ADD CONSTRAINT demands_responsavel_tecnico_id_fkey 
      FOREIGN KEY (responsavel_tecnico_id) 
      REFERENCES auth.users(id) 
      ON DELETE SET NULL;
  END IF;
END $$;