-- Adicionar campo de classificação da demanda
ALTER TABLE public.demands
ADD COLUMN classificacao TEXT CHECK (classificacao IN ('Melhoria', 'Projeto')) DEFAULT 'Projeto';

-- Adicionar campos para perguntas de melhoria
ALTER TABLE public.demands
ADD COLUMN melhoria_problema_atual TEXT,
ADD COLUMN melhoria_beneficio_esperado TEXT,
ADD COLUMN melhoria_alternativas TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.demands.classificacao IS 'Tipo de demanda: Melhoria ou Projeto';
COMMENT ON COLUMN public.demands.melhoria_problema_atual IS 'Para melhorias: Qual problema atual esta melhoria resolve?';
COMMENT ON COLUMN public.demands.melhoria_beneficio_esperado IS 'Para melhorias: Qual o benefício esperado?';
COMMENT ON COLUMN public.demands.melhoria_alternativas IS 'Para melhorias: Existem alternativas para resolver este problema?';