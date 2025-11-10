-- Adiciona campos para rastrear quem criou e atualizou as condições de pagamento
ALTER TABLE payment_conditions
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Atualiza registros existentes com o usuário atual (se possível)
UPDATE payment_conditions
SET created_by = auth.uid()
WHERE created_by IS NULL;

-- Cria função para atualizar automaticamente o updated_by
CREATE OR REPLACE FUNCTION update_payment_condition_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cria trigger para atualizar updated_by automaticamente
CREATE TRIGGER set_payment_condition_updated_by
BEFORE UPDATE ON payment_conditions
FOR EACH ROW
EXECUTE FUNCTION update_payment_condition_updated_by();