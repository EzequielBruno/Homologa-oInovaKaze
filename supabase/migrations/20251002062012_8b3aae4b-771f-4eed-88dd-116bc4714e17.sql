-- Criar tabela para agendas de planning
CREATE TABLE IF NOT EXISTS public.planning_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  data_planning TIMESTAMP WITH TIME ZONE NOT NULL,
  convite_enviado BOOLEAN NOT NULL DEFAULT false,
  email_participantes TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.planning_agendas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para planning_agendas
CREATE POLICY "Committee and tech leads can manage planning agendas"
ON public.planning_agendas
FOR ALL
USING (
  is_committee_member(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'tech_lead'::app_role)
)
WITH CHECK (
  is_committee_member(auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'tech_lead'::app_role)
);

CREATE POLICY "Everyone can view planning agendas"
ON public.planning_agendas
FOR SELECT
USING (true);