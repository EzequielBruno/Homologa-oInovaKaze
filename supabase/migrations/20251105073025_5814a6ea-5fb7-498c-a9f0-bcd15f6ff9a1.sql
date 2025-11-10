-- Tabela de configurações de auto-transição
CREATE TABLE IF NOT EXISTS public.auto_transition_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  criticidade TEXT NOT NULL,
  auto_transition BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa, criticidade)
);

-- RLS para configurações
ALTER TABLE public.auto_transition_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar configurações"
  ON public.auto_transition_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admins e Tech Leads podem gerenciar configurações"
  ON public.auto_transition_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'tech_lead'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'tech_lead'::app_role));

-- Tabela de preferências de notificação
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_type)
);

-- RLS para preferências
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias preferências"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar suas próprias preferências"
  ON public.notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_auto_transition_config_updated_at
  BEFORE UPDATE ON public.auto_transition_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Dados iniciais de configuração (todas desabilitadas por padrão)
INSERT INTO public.auto_transition_config (empresa, criticidade, auto_transition)
VALUES 
  ('ZC', 'Baixa', true),
  ('ZC', 'Média', true),
  ('ZC', 'Alta', false),
  ('ZC', 'Crítica', false),
  ('Eletro', 'Baixa', true),
  ('Eletro', 'Média', true),
  ('Eletro', 'Alta', false),
  ('Eletro', 'Crítica', false),
  ('ZF', 'Baixa', true),
  ('ZF', 'Média', true),
  ('ZF', 'Alta', false),
  ('ZF', 'Crítica', false),
  ('ZS', 'Baixa', true),
  ('ZS', 'Média', true),
  ('ZS', 'Alta', false),
  ('ZS', 'Crítica', false)
ON CONFLICT (empresa, criticidade) DO NOTHING;