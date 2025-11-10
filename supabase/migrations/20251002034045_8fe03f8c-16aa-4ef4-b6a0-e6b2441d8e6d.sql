-- Add squad column to demands table
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS squad text;

-- Add functional requirements column
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS requisitos_funcionais text;

-- Add attachments column (array of URLs)
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS documentos_anexados text[];

-- Create storage bucket for demand documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demand-documents',
  'demand-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for demand documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'demand-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'demand-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'demand-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'demand-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Tech leads and admins can view all documents
CREATE POLICY "Tech leads and admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'demand-documents' AND
  (has_role(auth.uid(), 'tech_lead'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Add index for squad filtering
CREATE INDEX IF NOT EXISTS idx_demands_empresa_squad ON public.demands(empresa, squad);