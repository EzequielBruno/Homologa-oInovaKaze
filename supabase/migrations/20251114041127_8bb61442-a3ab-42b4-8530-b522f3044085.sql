-- Adiciona coluna aguardando_insumo na tabela demands
ALTER TABLE demands ADD COLUMN IF NOT EXISTS aguardando_insumo BOOLEAN DEFAULT false;

-- Adiciona coluna avaliacao_risco_realizada para controlar se a avaliação de risco foi feita
ALTER TABLE demands ADD COLUMN IF NOT EXISTS avaliacao_risco_realizada BOOLEAN DEFAULT false;

-- Cria índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_demands_aguardando_insumo ON demands(aguardando_insumo) WHERE aguardando_insumo = true;