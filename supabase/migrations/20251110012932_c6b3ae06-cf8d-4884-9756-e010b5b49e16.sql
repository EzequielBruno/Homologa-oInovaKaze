-- Remover a constraint antiga de status
ALTER TABLE payment_condition_phases 
DROP CONSTRAINT IF EXISTS payment_condition_phases_status_check;

-- Adicionar nova constraint com os status atualizados
ALTER TABLE payment_condition_phases
ADD CONSTRAINT payment_condition_phases_status_check 
CHECK (status IN ('Em avaliação', 'Planejada', 'Em Andamento', 'Concluída'));