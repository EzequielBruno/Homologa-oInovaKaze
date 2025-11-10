-- Tabela para gerentes de projetos por empresa
CREATE TABLE public.project_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  empresa TEXT NOT NULL,
  squad TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para avaliações de risco
CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id),
  classificacao_gerente TEXT CHECK (classificacao_gerente IN ('Melhoria', 'Projeto')),
  probabilidade TEXT NOT NULL CHECK (probabilidade IN ('<30%', '30-90%', '>90%')),
  impacto TEXT NOT NULL CHECK (impacto IN ('Baixo', 'Médio', 'Alto')),
  indice_risco NUMERIC NOT NULL,
  resposta_risco TEXT CHECK (resposta_risco IN ('Aceitar', 'Mitigar', 'Evitar')),
  acoes_mitigadoras TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'encaminhado_comite', 'em_analise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.project_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para project_managers
CREATE POLICY "Users can view project managers"
ON public.project_managers FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage project managers"
ON public.project_managers FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas RLS para risk_assessments
CREATE POLICY "Users can view risk assessments"
ON public.risk_assessments FOR SELECT
USING (true);

CREATE POLICY "Project managers can create risk assessments"
ON public.risk_assessments FOR INSERT
WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Project managers can update their assessments"
ON public.risk_assessments FOR UPDATE
USING (auth.uid() = manager_id);

-- Função para verificar se usuário é gerente de projetos
CREATE OR REPLACE FUNCTION public.is_project_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_managers
    WHERE user_id = _user_id
      AND ativo = true
  )
$$;

-- Função para obter empresa do gerente de projetos
CREATE OR REPLACE FUNCTION public.get_manager_empresa(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa
  FROM public.project_managers
  WHERE user_id = _user_id
    AND ativo = true
  LIMIT 1
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_risk_assessments_updated_at
BEFORE UPDATE ON public.risk_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_risk_assessments_demand_id ON public.risk_assessments(demand_id);
CREATE INDEX idx_risk_assessments_manager_id ON public.risk_assessments(manager_id);
CREATE INDEX idx_project_managers_user_id ON public.project_managers(user_id);
CREATE INDEX idx_project_managers_empresa ON public.project_managers(empresa);