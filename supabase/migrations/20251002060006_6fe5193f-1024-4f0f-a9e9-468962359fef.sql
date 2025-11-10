-- Cria tabela de agendas de review
CREATE TABLE IF NOT EXISTS public.review_agendas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa text NOT NULL,
  squad text NOT NULL,
  data_review timestamp with time zone NOT NULL,
  email_participantes text[] NOT NULL,
  convite_enviado boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.review_agendas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Everyone can view agendas"
ON public.review_agendas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Committee and tech leads can manage agendas"
ON public.review_agendas
FOR ALL
TO authenticated
USING (
  public.is_committee_member(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'tech_lead'::app_role)
)
WITH CHECK (
  public.is_committee_member(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'tech_lead'::app_role)
);

-- Índice para performance
CREATE INDEX idx_review_agendas_data ON public.review_agendas(data_review);