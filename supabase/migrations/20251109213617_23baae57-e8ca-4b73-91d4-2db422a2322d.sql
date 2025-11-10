-- Adiciona campo para portal de suporte do fornecedor
ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS portal_suporte text;

COMMENT ON COLUMN public.fornecedores.portal_suporte IS 'URL do portal de atendimento/suporte do fornecedor';