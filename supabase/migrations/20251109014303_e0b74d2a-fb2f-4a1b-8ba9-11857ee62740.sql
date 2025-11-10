-- Add setor enum and column to demands table
DO $$
BEGIN
  CREATE TYPE public.setor_type AS ENUM (
    'Planejamento',
    'Fiscal',
    'Contabilidade',
    'Ecommerce',
    'Financeiro',
    'Comercial',
    'Auditoria',
    'Compras',
    'RH e DP',
    'Tecnologia da Informação'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS setor public.setor_type;

COMMENT ON COLUMN public.demands.setor IS 'Setor solicitante da demanda.';