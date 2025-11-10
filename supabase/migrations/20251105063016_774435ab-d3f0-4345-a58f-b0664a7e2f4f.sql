-- Create demand_comments table
CREATE TABLE IF NOT EXISTS public.demand_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demand_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view comments
CREATE POLICY "Users can view demand comments"
  ON public.demand_comments
  FOR SELECT
  USING (true);

-- Policy: Only project managers can create comments
CREATE POLICY "Project managers can create comments"
  ON public.demand_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = manager_id AND is_project_manager(auth.uid())
  );

-- Policy: Project managers can update their own comments
CREATE POLICY "Project managers can update own comments"
  ON public.demand_comments
  FOR UPDATE
  USING (auth.uid() = manager_id AND is_project_manager(auth.uid()));

-- Policy: Project managers can delete their own comments
CREATE POLICY "Project managers can delete own comments"
  ON public.demand_comments
  FOR DELETE
  USING (auth.uid() = manager_id AND is_project_manager(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_demand_comments_updated_at
  BEFORE UPDATE ON public.demand_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_demand_comments_demand_id ON public.demand_comments(demand_id);
CREATE INDEX idx_demand_comments_manager_id ON public.demand_comments(manager_id);