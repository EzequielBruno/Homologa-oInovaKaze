-- Adiciona coluna link_chamado na tabela payment_conditions
ALTER TABLE payment_conditions 
ADD COLUMN IF NOT EXISTS link_chamado TEXT;