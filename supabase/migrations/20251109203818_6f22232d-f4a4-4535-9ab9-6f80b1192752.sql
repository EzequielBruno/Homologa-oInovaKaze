-- Create enums for functional requirements
CREATE TYPE functional_requirement_status AS ENUM ('rascunho', 'pendente', 'assinado', 'rejeitado');
CREATE TYPE functional_requirement_signature_status AS ENUM ('pendente', 'assinado', 'rejeitado');

-- Create functional_requirements table
CREATE TABLE IF NOT EXISTS public.functional_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  setor TEXT NOT NULL,
  approver_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  current_approver_id UUID,
  status functional_requirement_status NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create functional_requirement_signatures table
CREATE TABLE IF NOT EXISTS public.functional_requirement_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.functional_requirements(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL,
  status functional_requirement_signature_status NOT NULL DEFAULT 'pendente',
  signed_at TIMESTAMP WITH TIME ZONE,
  comment TEXT,
  signature_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_functional_requirements_created_by ON public.functional_requirements(created_by);
CREATE INDEX idx_functional_requirements_current_approver ON public.functional_requirements(current_approver_id);
CREATE INDEX idx_functional_requirements_status ON public.functional_requirements(status);
CREATE INDEX idx_functional_requirement_signatures_requirement ON public.functional_requirement_signatures(requirement_id);
CREATE INDEX idx_functional_requirement_signatures_signer ON public.functional_requirement_signatures(signer_id);

-- Enable RLS
ALTER TABLE public.functional_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.functional_requirement_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for functional_requirements
CREATE POLICY "Users can view requirements they created or are approvers"
  ON public.functional_requirements
  FOR SELECT
  USING (
    auth.uid() = created_by OR 
    auth.uid() = ANY(approver_ids) OR
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'tech_lead'::app_role)
  );

CREATE POLICY "Authenticated users can create requirements"
  ON public.functional_requirements
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Creators and admins can update requirements"
  ON public.functional_requirements
  FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    auth.uid() = current_approver_id OR
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'tech_lead'::app_role)
  );

CREATE POLICY "Admins and tech leads can delete requirements"
  ON public.functional_requirements
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'tech_lead'::app_role)
  );

-- RLS Policies for functional_requirement_signatures
CREATE POLICY "Users can view signatures for requirements they have access to"
  ON public.functional_requirement_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.functional_requirements fr
      WHERE fr.id = requirement_id
        AND (
          auth.uid() = fr.created_by OR 
          auth.uid() = ANY(fr.approver_ids) OR
          has_role(auth.uid(), 'admin'::app_role) OR 
          has_role(auth.uid(), 'tech_lead'::app_role)
        )
    )
  );

CREATE POLICY "System can create signatures"
  ON public.functional_requirement_signatures
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Signers can update their own signatures"
  ON public.functional_requirement_signatures
  FOR UPDATE
  USING (auth.uid() = signer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_functional_requirements_updated_at
  BEFORE UPDATE ON public.functional_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();