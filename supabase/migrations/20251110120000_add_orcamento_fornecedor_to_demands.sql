-- Adiciona relacionamento entre demandas e fornecedores para orçamento
ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS orcamento_fornecedor_id UUID REFERENCES public.fornecedores(id);

COMMENT ON COLUMN public.demands.orcamento_fornecedor_id IS 'Fornecedor associado ao orçamento da demanda.';
