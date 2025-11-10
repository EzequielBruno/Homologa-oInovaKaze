-- Cria tabela de solicitantes
CREATE TABLE IF NOT EXISTS public.solicitantes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  nome text NOT NULL,
  empresa text NOT NULL,
  cargo text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.solicitantes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view solicitantes"
ON public.solicitantes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage solicitantes"
ON public.solicitantes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);