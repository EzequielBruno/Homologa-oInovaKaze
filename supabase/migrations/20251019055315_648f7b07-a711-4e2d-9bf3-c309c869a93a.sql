-- Criar tabela de formulários personalizados por squad
CREATE TABLE public.custom_squad_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(empresa, squad)
);

-- Criar tabela de perguntas do formulário
CREATE TABLE public.form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.custom_squad_forms(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'textarea', 'escolha_unica', 'escolha_multipla', 'classificacao', 'data', 'numero')),
  opcoes TEXT[], -- Para escolha_unica e escolha_multipla
  obrigatoria BOOLEAN NOT NULL DEFAULT false,
  condicao_pergunta_id UUID REFERENCES public.form_questions(id),
  condicao_resposta TEXT, -- Valor que ativa esta pergunta
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de respostas dos formulários
CREATE TABLE public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
  resposta TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(demand_id, question_id)
);

-- Enable RLS
ALTER TABLE public.custom_squad_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_squad_forms
CREATE POLICY "Authenticated users can view custom forms"
ON public.custom_squad_forms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tech leads, admins and project managers can manage forms"
ON public.custom_squad_forms
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  is_project_manager(auth.uid())
);

-- RLS Policies for form_questions
CREATE POLICY "Authenticated users can view questions"
ON public.form_questions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tech leads, admins and project managers can manage questions"
ON public.form_questions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  is_project_manager(auth.uid())
);

-- RLS Policies for form_responses
CREATE POLICY "Users can view responses for demands they can see"
ON public.form_responses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create responses"
ON public.form_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their responses"
ON public.form_responses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.demands d
    WHERE d.id = demand_id AND d.solicitante_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'tech_lead'::app_role)
);

-- Trigger para updated_at
CREATE TRIGGER update_custom_squad_forms_updated_at
BEFORE UPDATE ON public.custom_squad_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();