-- Adicionar campos para tipo de cobrança na tabela payment_condition_phases
ALTER TABLE payment_condition_phases
ADD COLUMN tipo_cobranca text DEFAULT 'valor_etapa' CHECK (tipo_cobranca IN ('por_hora', 'valor_etapa'));

ALTER TABLE payment_condition_phases
ADD COLUMN valor_por_hora numeric;