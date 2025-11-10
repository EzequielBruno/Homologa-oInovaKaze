-- Create enum for action types
CREATE TYPE action_type AS ENUM (
  'criar',
  'editar',
  'reativar',
  'excluir',
  'cancelar',
  'arquivar',
  'aprovar',
  'reprovar',
  'mudar_status',
  'adicionar_fase',
  'atualizar_fase',
  'solicitar_insumo',
  'enviar_notificacao'
);

-- Create demand_history table
CREATE TABLE IF NOT EXISTS public.demand_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action action_type NOT NULL,
  descricao text NOT NULL,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demand_history ENABLE ROW LEVEL SECURITY;

-- Users can view history of demands they have access to
CREATE POLICY "Users can view demand history"
ON public.demand_history
FOR SELECT
USING (true);

-- Authenticated users can create history entries
CREATE POLICY "Authenticated users can create history"
ON public.demand_history
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX idx_demand_history_demand_id ON public.demand_history(demand_id);
CREATE INDEX idx_demand_history_created_at ON public.demand_history(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_history;