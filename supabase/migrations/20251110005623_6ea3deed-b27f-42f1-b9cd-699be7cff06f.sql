-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_conditions' AND column_name = 'faseamento_ativo'
  ) THEN
    ALTER TABLE payment_conditions ADD COLUMN faseamento_ativo boolean DEFAULT false;
  END IF;
END $$;

-- Criar tabela para as etapas do faseamento
CREATE TABLE IF NOT EXISTS payment_condition_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_condition_id uuid NOT NULL REFERENCES payment_conditions(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 1,
  etapa_atividade text NOT NULL,
  responsavel_recurso text NOT NULL,
  horas_estimadas numeric,
  data_inicio date,
  data_fim date,
  valor_etapa numeric NOT NULL,
  status text NOT NULL DEFAULT 'Planejada' CHECK (status IN ('Planejada', 'Em Andamento', 'Concluída', 'Validada')),
  percentual_conclusao integer DEFAULT 0 CHECK (percentual_conclusao >= 0 AND percentual_conclusao <= 100),
  observacoes text,
  check_conclusao boolean DEFAULT false,
  data_validacao date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Habilitar RLS na tabela de fases
ALTER TABLE payment_condition_phases ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payment_condition_phases
DROP POLICY IF EXISTS "Authenticated users can view payment condition phases" ON payment_condition_phases;
CREATE POLICY "Authenticated users can view payment condition phases"
  ON payment_condition_phases FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create payment condition phases" ON payment_condition_phases;
CREATE POLICY "Authenticated users can create payment condition phases"
  ON payment_condition_phases FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update payment condition phases" ON payment_condition_phases;
CREATE POLICY "Authenticated users can update payment condition phases"
  ON payment_condition_phases FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins and tech leads can delete payment condition phases" ON payment_condition_phases;
CREATE POLICY "Admins and tech leads can delete payment condition phases"
  ON payment_condition_phases FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'tech_lead'::app_role));

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_payment_condition_phases_updated_at ON payment_condition_phases;
CREATE TRIGGER update_payment_condition_phases_updated_at
  BEFORE UPDATE ON payment_condition_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função e trigger para atualizar updated_by
CREATE OR REPLACE FUNCTION update_payment_condition_phases_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_payment_condition_phases_updated_by_trigger ON payment_condition_phases;
CREATE TRIGGER update_payment_condition_phases_updated_by_trigger
  BEFORE UPDATE ON payment_condition_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_condition_phases_updated_by();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payment_condition_phases_payment_condition_id 
  ON payment_condition_phases(payment_condition_id);
CREATE INDEX IF NOT EXISTS idx_payment_condition_phases_ordem 
  ON payment_condition_phases(payment_condition_id, ordem);