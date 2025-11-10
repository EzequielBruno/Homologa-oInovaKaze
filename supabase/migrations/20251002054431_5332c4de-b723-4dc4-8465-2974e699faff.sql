-- Adiciona coluna de cargo aos membros do comitê
ALTER TABLE public.committee_members
ADD COLUMN IF NOT EXISTS cargo text;