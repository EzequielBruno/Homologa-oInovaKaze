-- Create payment_conditions table
CREATE TABLE IF NOT EXISTS public.payment_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  demand_id UUID REFERENCES public.demands(id) ON DELETE SET NULL,
  tipo_pagamento TEXT NOT NULL CHECK (tipo_pagamento IN ('hora_tecnica', 'pacote_horas', 'etapa', 'mensalidade_fixa')),
  
  -- Campos para Hora Técnica
  valor_hora NUMERIC,
  cargo_perfil TEXT,
  limite_mensal_horas INTEGER,
  
  -- Campos para Pacote de Horas
  quantidade_total_horas INTEGER,
  valor_total_pacote NUMERIC,
  validade_meses INTEGER,
  
  -- Campos para Etapa/Milestone
  descricao_etapa TEXT,
  valor_etapa NUMERIC,
  data_prevista_entrega DATE,
  condicao_pagamento_etapa TEXT,
  
  -- Campos para Mensalidade Fixa
  valor_mensal_fixo NUMERIC,
  horas_inclusas INTEGER,
  servicos_abrangidos TEXT,
  valor_hora_excedente NUMERIC,
  dia_faturamento INTEGER,
  
  -- Campos comuns
  periodicidade_faturamento TEXT,
  prazo_pagamento_dias INTEGER,
  forma_pagamento TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'concluido')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_payment_conditions_fornecedor ON public.payment_conditions(fornecedor_id);
CREATE INDEX idx_payment_conditions_demand ON public.payment_conditions(demand_id);

-- Enable RLS
ALTER TABLE public.payment_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view payment conditions"
  ON public.payment_conditions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create payment conditions"
  ON public.payment_conditions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payment conditions"
  ON public.payment_conditions
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and tech leads can delete payment conditions"
  ON public.payment_conditions
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'tech_lead'::app_role)
  );

-- Add trigger for updated_at
CREATE TRIGGER update_payment_conditions_updated_at
  BEFORE UPDATE ON public.payment_conditions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();