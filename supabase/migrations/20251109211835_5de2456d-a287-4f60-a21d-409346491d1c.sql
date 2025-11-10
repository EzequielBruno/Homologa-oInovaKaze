-- Adicionar novos campos na tabela payment_conditions para suportar grupos, modalidades e modo manual

-- Adicionar campos para identificar grupo e modalidade
ALTER TABLE payment_conditions
ADD COLUMN IF NOT EXISTS grupo_condicao TEXT,
ADD COLUMN IF NOT EXISTS modalidade TEXT,
ADD COLUMN IF NOT EXISTS descricao_modalidade TEXT,
ADD COLUMN IF NOT EXISTS tipo_cadastro TEXT DEFAULT 'padrao' CHECK (tipo_cadastro IN ('padrao', 'manual')),
ADD COLUMN IF NOT EXISTS data_conclusao DATE,
ADD COLUMN IF NOT EXISTS data_pagamento_prevista DATE,
ADD COLUMN IF NOT EXISTS responsavel_financeiro TEXT,
ADD COLUMN IF NOT EXISTS documentos_anexados TEXT[];

-- Adicionar comentários para documentação
COMMENT ON COLUMN payment_conditions.grupo_condicao IS 'Grupo da condição: Desenvolvimento/Suporte, Infraestrutura, Cloud/Licenciamento, Contratos Especiais';
COMMENT ON COLUMN payment_conditions.modalidade IS 'Modalidade específica dentro do grupo selecionado';
COMMENT ON COLUMN payment_conditions.tipo_cadastro IS 'Tipo de cadastro: padrao (via grupos/modalidades) ou manual (campos livres)';
COMMENT ON COLUMN payment_conditions.data_conclusao IS 'Data de conclusão/entrega (obrigatória no modo manual)';
COMMENT ON COLUMN payment_conditions.data_pagamento_prevista IS 'Data de pagamento prevista (obrigatória no modo manual)';

-- Tornar tipo_pagamento opcional (não é necessário no modo manual)
ALTER TABLE payment_conditions
ALTER COLUMN tipo_pagamento DROP NOT NULL;