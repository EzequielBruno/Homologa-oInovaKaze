-- Add foreign key relationship for manager_id
ALTER TABLE public.demand_comments
ADD CONSTRAINT demand_comments_manager_id_fkey
FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Project managers can create comments" ON public.demand_comments;

-- Create new policy allowing authenticated users to create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.demand_comments
  FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

-- Update update policy to allow any comment owner to update
DROP POLICY IF EXISTS "Project managers can update own comments" ON public.demand_comments;
CREATE POLICY "Users can update own comments"
  ON public.demand_comments
  FOR UPDATE
  USING (auth.uid() = manager_id);

-- Update delete policy to allow any comment owner to delete
DROP POLICY IF EXISTS "Project managers can delete own comments" ON public.demand_comments;
CREATE POLICY "Users can delete own comments"
  ON public.demand_comments
  FOR DELETE
  USING (auth.uid() = manager_id);