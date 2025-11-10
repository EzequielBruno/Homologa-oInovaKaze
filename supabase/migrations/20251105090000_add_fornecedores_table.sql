-- Criação da tabela de fornecedores para cadastro completo via portal
DO $$
BEGIN
  CREATE TYPE public.fornecedor_status AS ENUM ('ativo', 'inativo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  inscricao_estadual TEXT,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  celular TEXT,
  site TEXT,
  cep TEXT NOT NULL,
  endereco TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  pais TEXT NOT NULL,
  contato_nome TEXT NOT NULL,
  contato_email TEXT NOT NULL,
  contato_telefone TEXT NOT NULL,
  categoria TEXT NOT NULL,
  servicos_oferecidos TEXT NOT NULL,
  observacoes TEXT,
  status public.fornecedor_status NOT NULL DEFAULT 'ativo',
  prazo_pagamento TEXT NOT NULL,
  limite_credito NUMERIC,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  pix TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS fornecedores_cnpj_key ON public.fornecedores (cnpj);

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar fornecedores"
  ON public.fornecedores
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem cadastrar fornecedores"
  ON public.fornecedores
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Administradores podem atualizar fornecedores"
  ON public.fornecedores
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'tech_lead'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'tech_lead'::app_role)
  );

CREATE POLICY "Administradores podem remover fornecedores"
  ON public.fornecedores
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'tech_lead'::app_role)
  );

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
