-- Adicionar novos campos e status para o sistema PMO

-- Adicionar novos status ao enum demand_status (one by one to avoid duplicates)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
    CREATE TYPE project_type AS ENUM ('Tradicional', 'Agil');
  END IF;
END $$;

-- Adicionar novos valores ao enum demand_status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Em_Avaliacao_PMO' 
    AND enumtypid = 'demand_status'::regtype
  ) THEN
    ALTER TYPE demand_status ADD VALUE 'Em_Avaliacao_PMO';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Aguardando_Comite' 
    AND enumtypid = 'demand_status'::regtype
  ) THEN
    ALTER TYPE demand_status ADD VALUE 'Aguardando_Comite';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Aprovado' 
    AND enumtypid = 'demand_status'::regtype
  ) THEN
    ALTER TYPE demand_status ADD VALUE 'Aprovado';
  END IF;
END $$;

-- Adicionar novos campos à tabela demands
ALTER TABLE public.demands 
  ADD COLUMN IF NOT EXISTS tipo_projeto project_type,
  ADD COLUMN IF NOT EXISTS pontuacao_selecao numeric,
  ADD COLUMN IF NOT EXISTS roi_estimado numeric,
  ADD COLUMN IF NOT EXISTS roi_realizado numeric,
  ADD COLUMN IF NOT EXISTS data_aprovacao_comite date,
  ADD COLUMN IF NOT EXISTS justificativa_comite text,
  ADD COLUMN IF NOT EXISTS resultados_alcancados text,
  ADD COLUMN IF NOT EXISTS sprint_atual integer DEFAULT 1;

-- Criar tabela para armazenar comentários/histórico de avaliações
CREATE TABLE IF NOT EXISTS public.demand_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL,
  tipo_avaliacao text NOT NULL,
  comentario text,
  pontuacao numeric,
  aprovado boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.demand_evaluations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para demand_evaluations
DROP POLICY IF EXISTS "Users can view all evaluations" ON public.demand_evaluations;
CREATE POLICY "Users can view all evaluations"
ON public.demand_evaluations
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Tech leads and admins can manage evaluations" ON public.demand_evaluations;
CREATE POLICY "Tech leads and admins can manage evaluations"
ON public.demand_evaluations
FOR ALL
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_demand_evaluations_updated_at ON public.demand_evaluations;
CREATE TRIGGER update_demand_evaluations_updated_at
BEFORE UPDATE ON public.demand_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_demand_evaluations_demand_id ON public.demand_evaluations(demand_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON public.demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_empresa ON public.demands(empresa);