-- Adicionar novos status ao enum
ALTER TYPE demand_status ADD VALUE IF NOT EXISTS 'Aguardando_Gerente';
ALTER TYPE demand_status ADD VALUE IF NOT EXISTS 'Aguardando_Validacao_TI';
ALTER TYPE demand_status ADD VALUE IF NOT EXISTS 'Recusado';

-- Criar enum para níveis de aprovação
CREATE TYPE approval_level AS ENUM ('gerente', 'comite', 'ti');

-- Criar enum para status de aprovação
CREATE TYPE approval_status AS ENUM ('pendente', 'aprovado', 'recusado');

-- Tabela de aprovações individuais
CREATE TABLE IF NOT EXISTS public.demand_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid REFERENCES public.demands(id) ON DELETE CASCADE NOT NULL,
  approver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  approval_level approval_level NOT NULL,
  status approval_status NOT NULL DEFAULT 'pendente',
  motivo_recusa text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(demand_id, approver_id, approval_level)
);

-- Tabela de membros do comitê
CREATE TABLE IF NOT EXISTS public.committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de scrum masters por squad
CREATE TABLE IF NOT EXISTS public.scrum_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa text NOT NULL,
  squad text NOT NULL,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa, squad)
);

-- Enable RLS
ALTER TABLE public.demand_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrum_masters ENABLE ROW LEVEL SECURITY;

-- RLS Policies para demand_approvals
CREATE POLICY "Users can view all approvals"
  ON public.demand_approvals FOR SELECT
  USING (true);

CREATE POLICY "Approvers can create their approvals"
  ON public.demand_approvals FOR INSERT
  WITH CHECK (auth.uid() = approver_id);

CREATE POLICY "Approvers can update their approvals"
  ON public.demand_approvals FOR UPDATE
  USING (auth.uid() = approver_id);

-- RLS Policies para committee_members
CREATE POLICY "Users can view committee members"
  ON public.committee_members FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage committee members"
  ON public.committee_members FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies para scrum_masters
CREATE POLICY "Users can view scrum masters"
  ON public.scrum_masters FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage scrum masters"
  ON public.scrum_masters FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at em demand_approvals
CREATE TRIGGER update_demand_approvals_updated_at
  BEFORE UPDATE ON public.demand_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar action types ao demand_history
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'solicitar_aprovacao_gerente';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'aprovar_gerente';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'recusar_gerente';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'aprovar_comite';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'recusar_comite';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'aprovar_ti';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'recusar_ti';