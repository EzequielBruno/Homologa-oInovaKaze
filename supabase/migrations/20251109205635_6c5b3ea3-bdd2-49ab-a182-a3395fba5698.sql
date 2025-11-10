-- Criar tabela de empresas
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  nome_exibicao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem visualizar empresas ativas"
ON public.empresas
FOR SELECT
USING (ativo = true);

CREATE POLICY "Admins podem gerenciar empresas"
ON public.empresas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_empresas_updated_at
BEFORE UPDATE ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Popular com as empresas existentes
INSERT INTO public.empresas (codigo, nome_completo, nome_exibicao, ordem) VALUES
  ('ZS', 'Zema Seguros', 'Zema Seguros', 1),
  ('ZC', 'Zema Consórcio', 'Zema Consórcio', 2),
  ('Eletro', 'Eletrozema', 'Eletrozema', 3),
  ('ZF', 'Zema Financeira', 'Zema Financeira', 4);