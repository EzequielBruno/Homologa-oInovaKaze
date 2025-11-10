-- Cria tabela de daily updates
CREATE TABLE IF NOT EXISTS public.daily_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id uuid NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  update_text text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.daily_updates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Everyone can view daily updates"
ON public.daily_updates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Committee and tech leads can create updates"
ON public.daily_updates
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.is_committee_member(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'tech_lead'::app_role)
  )
);

-- Índice para performance
CREATE INDEX idx_daily_updates_demand_id ON public.daily_updates(demand_id);
CREATE INDEX idx_daily_updates_created_at ON public.daily_updates(created_at DESC);