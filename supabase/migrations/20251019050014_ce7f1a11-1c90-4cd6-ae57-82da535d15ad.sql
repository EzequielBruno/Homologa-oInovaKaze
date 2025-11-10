-- Adiciona coluna checklist_entrega na tabela demands
ALTER TABLE public.demands 
ADD COLUMN IF NOT EXISTS checklist_entrega TEXT;