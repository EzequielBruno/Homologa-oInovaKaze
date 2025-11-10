-- Adicionar colunas para ramificação lógica avançada
ALTER TABLE public.form_questions 
ADD COLUMN IF NOT EXISTS permite_outro boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS acao_ramificacao text CHECK (acao_ramificacao IN ('mostrar', 'pular', 'encerrar')),
ADD COLUMN IF NOT EXISTS pular_para_pergunta_id uuid;