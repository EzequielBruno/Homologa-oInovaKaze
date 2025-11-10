-- Adiciona campos de número de chamado e orçamento
ALTER TABLE public.payment_conditions
ADD COLUMN IF NOT EXISTS numero_chamado text,
ADD COLUMN IF NOT EXISTS numero_orcamento text;

COMMENT ON COLUMN public.payment_conditions.numero_chamado IS 'Número do chamado/ticket relacionado';
COMMENT ON COLUMN public.payment_conditions.numero_orcamento IS 'Número do orçamento fornecido';

-- Cria bucket para documentos de condições de pagamento
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-conditions-docs', 'payment-conditions-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para permitir usuários autenticados visualizar seus arquivos
CREATE POLICY "Usuários autenticados podem visualizar documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-conditions-docs');

-- RLS para permitir usuários autenticados fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-conditions-docs');

-- RLS para permitir usuários autenticados deletar seus arquivos
CREATE POLICY "Usuários autenticados podem deletar documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-conditions-docs');