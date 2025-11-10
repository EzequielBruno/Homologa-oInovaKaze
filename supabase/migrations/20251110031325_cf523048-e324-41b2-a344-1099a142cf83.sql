-- Adicionar campos de versionamento na tabela demands
ALTER TABLE public.demands
ADD COLUMN IF NOT EXISTS versao integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS codigo_base text;

-- Preencher codigo_base com o código atual para demandas existentes
UPDATE public.demands
SET codigo_base = codigo
WHERE codigo_base IS NULL;

-- Criar índice para melhorar performance de consultas por codigo_base
CREATE INDEX IF NOT EXISTS idx_demands_codigo_base ON public.demands(codigo_base);

-- Adicionar coluna para guardar snapshot completo no histórico
ALTER TABLE public.demand_history
ADD COLUMN IF NOT EXISTS snapshot_completo jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.demands.versao IS 'Número da versão da demanda, incrementado a cada mudança de escopo';
COMMENT ON COLUMN public.demands.codigo_base IS 'Código base da demanda sem o sufixo de versão (ex: ZS-00040-112025)';
COMMENT ON COLUMN public.demand_history.snapshot_completo IS 'Snapshot completo da demanda antes da mudança de escopo';