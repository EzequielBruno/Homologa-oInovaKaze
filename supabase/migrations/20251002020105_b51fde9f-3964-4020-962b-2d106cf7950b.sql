-- Add DELETE policy for demands
CREATE POLICY "Users can delete own demands or admins can delete all"
ON public.demands
FOR DELETE
USING (
  auth.uid() = solicitante_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'tech_lead'::app_role)
);

-- Insert fictional demands for testing
INSERT INTO public.demands (
  codigo,
  empresa,
  departamento,
  descricao,
  prioridade,
  regulatorio,
  status,
  solicitante_id,
  horas_estimadas,
  custo_estimado
) VALUES
  ('ZS_SQ_001', 'ZS', 'Squad App', 'Implementar autenticação biométrica no app mobile', 'Alta', false, 'Backlog', (SELECT id FROM auth.users LIMIT 1), 120, 15000),
  ('ZS_BI_002', 'ZS', 'Squad BI', 'Dashboard de analytics em tempo real', 'Média', false, 'Em_Progresso', (SELECT id FROM auth.users LIMIT 1), 80, 10000),
  ('ZC_RH_003', 'ZC', 'Recursos Humanos', 'Sistema de gestão de férias e ponto', 'Crítica', true, 'Aguardando_Planning', (SELECT id FROM auth.users LIMIT 1), 200, 25000),
  ('EL_FI_004', 'Eletro', 'Fiscal', 'Integração com SEFAZ para NF-e', 'Alta', true, 'Refinamento_TI', (SELECT id FROM auth.users LIMIT 1), 150, 20000),
  ('ZF_CO_005', 'ZF', 'Comercial', 'CRM para gestão de leads e vendas', 'Média', false, 'Backlog', (SELECT id FROM auth.users LIMIT 1), 180, 22000),
  ('ZS_BO_006', 'ZS', 'Squad BackOffice', 'Automação de processos internos', 'Alta', false, 'Em_Progresso', (SELECT id FROM auth.users LIMIT 1), 100, 12000),
  ('ZC_DP_007', 'ZC', 'Departamento Pessoal', 'Folha de pagamento automatizada', 'Crítica', false, 'Concluido', (SELECT id FROM auth.users LIMIT 1), 160, 18000),
  ('EL_CO_008', 'Eletro', 'Contabilidade', 'Sistema de conciliação bancária', 'Média', false, 'Revisao', (SELECT id FROM auth.users LIMIT 1), 90, 11000),
  ('ZF_LO_009', 'ZF', 'Logística', 'Rastreamento de entregas em tempo real', 'Alta', false, 'Em_Progresso', (SELECT id FROM auth.users LIMIT 1), 140, 17000),
  ('ZS_TI_010', 'ZS', 'Tecnologia da Informação', 'Portal de documentação técnica', 'Baixa', false, 'Backlog', (SELECT id FROM auth.users LIMIT 1), 60, 8000);