-- Adicionar 'mudanca_escopo' ao enum action_type (usado pela tabela demand_history)
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'mudanca_escopo';