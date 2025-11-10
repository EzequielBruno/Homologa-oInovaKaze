-- Criar tabela para squads customizadas
CREATE TABLE public.squads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa, nome)
);

-- Enable RLS
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view squads"
ON public.squads
FOR SELECT
USING (true);

CREATE POLICY "Tech leads and admins can manage squads"
ON public.squads
FOR ALL
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_squads_updated_at
BEFORE UPDATE ON public.squads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();