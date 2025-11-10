-- Criar tabela para membros das squads
CREATE TABLE public.squad_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  is_scrum BOOLEAN NOT NULL DEFAULT false,
  horas_dia NUMERIC NOT NULL DEFAULT 8,
  cargo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa, squad)
);

-- Criar tabela para atribuições de demandas
CREATE TABLE public.demand_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  sprint_number INTEGER NOT NULL,
  faseamento_completo BOOLEAN NOT NULL DEFAULT false,
  prazo_faseamento TIMESTAMP WITH TIME ZONE,
  notificacao_pendente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para squad_members
CREATE POLICY "Authenticated users can view squad members"
ON public.squad_members
FOR SELECT
USING (true);

CREATE POLICY "Tech leads and admins can manage squad members"
ON public.squad_members
FOR ALL
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies para demand_assignments
CREATE POLICY "Users can view demand assignments"
ON public.demand_assignments
FOR SELECT
USING (true);

CREATE POLICY "Tech leads and admins can create assignments"
ON public.demand_assignments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Tech leads and admins can update assignments"
ON public.demand_assignments
FOR UPDATE
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_squad_members_updated_at
BEFORE UPDATE ON public.squad_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demand_assignments_updated_at
BEFORE UPDATE ON public.demand_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();