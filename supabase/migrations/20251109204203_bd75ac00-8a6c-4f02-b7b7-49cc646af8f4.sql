-- Add foreign key constraints to functional_requirements table
ALTER TABLE public.functional_requirements
  ADD CONSTRAINT functional_requirements_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.functional_requirements
  ADD CONSTRAINT functional_requirements_current_approver_id_fkey 
  FOREIGN KEY (current_approver_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add foreign key constraint to functional_requirement_signatures table
ALTER TABLE public.functional_requirement_signatures
  ADD CONSTRAINT functional_requirement_signatures_signer_id_fkey 
  FOREIGN KEY (signer_id) REFERENCES auth.users(id) ON DELETE CASCADE;