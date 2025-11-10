# Memorial Descritivo do Sistema de Gestão de Demandas de TI

## 1. Identificação da Obra

**Título**: Sistema de Gestão de Demandas de TI

**Natureza**: Software Aplicativo Web

**Campo de Aplicação**: Gestão Empresarial, Tecnologia da Informação, Gerenciamento de Projetos

---

## 2. Autor(es) da Obra

**Nome**: [PREENCHER]  
**CPF**: [PREENCHER]  
**Nacionalidade**: [PREENCHER]  
**Endereço**: [PREENCHER]  

---

## 3. Titular dos Direitos

**Nome/Razão Social**: [PREENCHER]  
**CPF/CNPJ**: [PREENCHER]  
**Endereço**: [PREENCHER]  

---

## 4. Descrição da Obra

### 4.1 Objetivo e Finalidade

O Sistema de Gestão de Demandas de TI é uma solução completa para gerenciamento do ciclo de vida de solicitações de desenvolvimento de software em ambientes corporativos. O sistema automatiza e controla todo o processo desde a criação de uma demanda até sua conclusão, passando por múltiplas etapas de aprovação, estimativa, faseamento e execução.

### 4.2 Problema Resolvido

O sistema resolve os seguintes problemas empresariais:

1. **Falta de Controle**: Demandas dispersas em e-mails, planilhas e conversas informais
2. **Processo Manual**: Aprovações lentas e sem rastreabilidade
3. **Falta de Priorização**: Dificuldade em definir quais demandas executar primeiro
4. **Ausência de Métricas**: Impossibilidade de medir produtividade e custos
5. **Comunicação Fragmentada**: Informações perdidas entre solicitantes e equipe técnica
6. **Falta de Histórico**: Perda de contexto sobre decisões e mudanças

### 4.3 Solução Implementada

O sistema oferece uma plataforma web unificada onde:

- **Solicitantes** podem criar demandas de forma estruturada
- **Gerentes** podem aprovar ou recusar demandas do seu departamento
- **Comitê Técnico** pode avaliar viabilidade e priorização estratégica
- **Equipe de TI** pode estimar esforço, fasear projetos e executar
- **Todos** podem acompanhar o status em tempo real

---

## 5. Características Técnicas

### 5.1 Tipo de Software
- Aplicação Web Responsiva (SPA - Single Page Application)
- Arquitetura Cliente-Servidor
- Acesso via navegador web (Chrome, Firefox, Safari, Edge)

### 5.2 Tecnologias Utilizadas

**Frontend:**
- React 18.3.1 (biblioteca JavaScript para interfaces)
- TypeScript (superset tipado de JavaScript)
- Vite (build tool de alta performance)
- Tailwind CSS (framework de estilização)
- shadcn/ui (biblioteca de componentes UI)

**Backend:**
- Supabase (plataforma de backend completa)
- PostgreSQL (banco de dados relacional)
- Row Level Security (RLS) para segurança de dados
- Edge Functions (funções serverless)

**Autenticação:**
- Sistema de autenticação baseado em JWT
- Controle de acesso baseado em papéis (RBAC)
- Proteção de rotas por permissão

**Infraestrutura:**
- Hospedagem em cloud
- SSL/TLS para comunicação segura
- Backup automático de dados
- Escalabilidade horizontal

### 5.3 Plataformas Suportadas
- Web (todos navegadores modernos)
- Desktop (Windows, macOS, Linux via navegador)
- Mobile (iOS, Android via navegador)

---

## 6. Funcionalidades Principais

### 6.1 Gestão de Demandas

**Criação de Demandas:**
- Formulário estruturado com campos obrigatórios
- Upload de documentos e fluxogramas
- Classificação por empresa, squad e prioridade
- Marcação de demandas regulatórias com prazo

**Aprovações em Múltiplos Níveis:**
- Nível 1: Aprovação Gerencial (gerente da área solicitante)
- Nível 2: Comitê Técnico (avaliação estratégica)
- Nível 3: TI (validação técnica final)
- Ações: Aprovar, Recusar, Solicitar Insumos/Informações

**Status de Demandas:**
- Rascunho
- Aguardando Aprovação Gerencial
- Aguardando Comitê
- Aguardando TI
- Aprovada
- Recusada
- Em Backlog
- Em Análise Técnica
- Em Desenvolvimento
- Em Homologação
- Aguardando Validação
- Stand By
- Concluída
- Arquivada

### 6.2 Análise Técnica

**Parecer Técnico:**
- Avaliação de complexidade
- Identificação de riscos
- Sugestões de abordagem
- Análise de impacto

**Estimativa de Esforço:**
- Cálculo de horas por atividade
- Cálculo de custo baseado em hora/desenvolvedor
- Ajuste de estimativas por fase
- Histórico de estimativas vs real

**Faseamento de Projetos:**
- Divisão em fases/sprints
- Definição de escopo por fase
- Estimativa de horas por fase
- Priorização de fases

### 6.3 Controle de Execução

**Backlog:**
- Lista de demandas aprovadas aguardando início
- Ordenação por prioridade
- Visualização de esforço total
- Capacidade de iniciar demanda

**Kanban Board:**
- Visualização por empresa
- Colunas por status de execução
- Drag & drop para mudança de status
- Filtros por squad, prioridade
- Cards com informações resumidas

**Acompanhamento:**
- Status em tempo real
- Histórico completo de ações
- Notificações de mudanças
- Anexos e comentários

### 6.4 Gestão de Atenção

**Demandas que Precisam de Atenção:**
- Aguardando Insumos (solicitante precisa complementar)
- Stand By (bloqueadas temporariamente)
- Aguardando Validação (aguardando aprovação de entrega)

### 6.5 Planejamento e Cerimônias

**Agenda de Planning:**
- Agendamento de reuniões de planejamento
- Convite automático por e-mail
- Organização por empresa e squad
- Histórico de plannings

**Agenda de Reviews:**
- Agendamento de revisões de sprint
- Convite para stakeholders
- Lista de demandas para review

**Dailys:**
- Registro de daily meetings
- Acompanhamento de impedimentos
- Histórico de dailys por squad

**Retrospectiva:**
- Registro de pontos positivos e negativos
- Definição de ações de melhoria
- Acompanhamento de ações

### 6.6 Relatórios e Dashboards

**Dashboard Principal:**
- Total de demandas (geral e por status)
- Horas totais estimadas e executadas
- Custos totais
- Taxa de conclusão
- Gráficos de tendência

**Relatórios por Empresa:**
- Demandas por empresa
- Custos por empresa
- Performance por empresa
- Comparativos

**Relatórios por Squad:**
- Horas trabalhadas por squad
- Produtividade por squad
- Demandas por squad
- Capacidade vs demanda

**Relatórios de Performance:**
- Tempo médio de aprovação
- Tempo médio de execução
- Acurácia de estimativas
- Taxa de retrabalho

### 6.7 Controle de Acesso e Permissões

**Perfis de Usuário:**
- Admin (acesso total)
- Solicitante (cria demandas da sua empresa)
- Gerente (aprova demandas da sua área)
- Comitê (avalia demandas estratégicas)
- TI / Tech Lead (gerencia execução)
- Desenvolvedor (executa demandas)

**Controle Granular:**
- Permissões por funcionalidade
- Acesso baseado em papel
- Segregação de dados por empresa
- Auditoria de acessos

### 6.8 Notificações

**Sistema de Notificações:**
- Notificações em tempo real
- Badge de contador de notificações
- Alertas de ações necessárias
- Histórico de notificações

**Tipos de Notificações:**
- Nova demanda criada
- Demanda aprovada/recusada
- Solicitação de insumos
- Mudança de status
- Atraso em prazo regulatório

---

## 7. Diferenciais Técnicos

### 7.1 Inovações Implementadas

1. **Fluxo de Aprovação Multinível Configurável**: Sistema único de aprovação em três níveis com possibilidade de solicitar informações em cada nível

2. **Estimativa Automatizada de Custos**: Cálculo automático de custos baseado em horas estimadas e valor/hora configurável

3. **Faseamento Inteligente**: Capacidade de dividir demandas grandes em fases menores com estimativas independentes

4. **Controle de Demandas Regulatórias**: Marcação e alertas específicos para demandas com prazo regulatório

5. **Geração Automática de Códigos**: Sistema de geração de códigos únicos por empresa (formato: EMP-YYYY-NNNN)

6. **Kanban Multicamada**: Visualização em Kanban com filtros por empresa e squad

7. **Histórico Completo de Ações**: Rastreabilidade total de todas as ações e mudanças em cada demanda

8. **Sistema de Anexos Integrado**: Upload e gerenciamento de documentos técnicos e fluxogramas

9. **Dashboard Analítico Completo**: Métricas e KPIs para tomada de decisão

10. **Gestão de Cerimônias Ágeis**: Agendamento e controle de plannings, reviews, dailys e retrospectivas

### 7.2 Segurança

- Autenticação obrigatória para acesso
- Criptografia de senhas (bcrypt)
- Row Level Security no banco de dados
- Proteção contra SQL Injection
- Proteção contra XSS (Cross-Site Scripting)
- HTTPS obrigatório
- Validação de inputs no frontend e backend
- Auditoria de todas as ações

### 7.3 Performance

- Carregamento otimizado (code splitting)
- Cache de dados
- Paginação de listas grandes
- Índices no banco de dados
- Queries otimizadas
- Lazy loading de componentes

### 7.4 Usabilidade

- Interface intuitiva e moderna
- Design responsivo (desktop e mobile)
- Feedback visual imediato
- Mensagens de erro claras
- Tooltips e ajudas contextuais
- Atalhos de teclado
- Modo escuro/claro

---

## 8. Arquitetura do Sistema

### 8.1 Camada de Apresentação (Frontend)
- React com TypeScript
- Componentes reutilizáveis
- Gerenciamento de estado com Context API
- Roteamento com React Router
- Formulários com React Hook Form

### 8.2 Camada de Negócio (Backend)
- Supabase (PostgreSQL + Edge Functions)
- RLS Policies para segurança
- Triggers para automações
- Functions para cálculos complexos

### 8.3 Camada de Dados
- PostgreSQL (banco relacional)
- Tabelas normalizadas
- Índices para performance
- Constraints para integridade
- Backups automáticos

### 8.4 Integração
- API REST (Supabase)
- Realtime subscriptions
- Autenticação JWT
- Upload de arquivos

---

## 9. Modelo de Dados Simplificado

### Principais Entidades:

**demands** (Demandas)
- Informações da demanda
- Status e prioridade
- Estimativas e custos
- Relacionamentos com empresa e squad

**demand_history** (Histórico)
- Log de todas as ações
- Usuário, data e tipo de ação
- Valores anteriores e novos

**approval_levels** (Níveis de Aprovação)
- Aprovações por nível (gerente, comitê, ti)
- Status de cada aprovação
- Comentários e justificativas

**demand_phases** (Fases)
- Faseamento de projetos
- Estimativas por fase
- Status de execução

**technical_reviews** (Pareceres Técnicos)
- Análise técnica da demanda
- Complexidade e riscos
- Sugestões de implementação

**user_roles** (Papéis de Usuário)
- Atribuição de permissões
- Relacionamento usuário-papel

**committee_members** (Membros do Comitê)
- Usuários do comitê técnico
- Status ativo/inativo

**solicitantes** (Solicitantes)
- Usuários solicitantes
- Empresa associada
- Permissões especiais

---

## 10. Fluxo de Uso Típico

1. **Solicitante** cria nova demanda preenchendo formulário
2. Sistema gera código único e envia para aprovação
3. **Gerente** recebe notificação e aprova ou recusa
4. Se aprovado, **Comitê** avalia e aprova ou recusa
5. Se aprovado, **TI** faz parecer técnico e estimativa
6. **TI** aprova tecnicamente e demanda vai para backlog
7. **Tech Lead** prioriza e inicia demanda (move para kanban)
8. **Desenvolvedor** executa e atualiza status
9. Ao concluir, **Solicitante** valida a entrega
10. Se validado, demanda é marcada como concluída

---

## 11. Requisitos Mínimos

### Servidor:
- 2 CPU cores
- 4 GB RAM
- 20 GB Storage
- PostgreSQL 14+

### Cliente (Usuário):
- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Conexão de internet (mínimo 1 Mbps)
- Resolução mínima: 1024x768

---

## 12. Originalidade e Ineditismo

Este sistema foi desenvolvido do zero, com arquitetura e funcionalidades originais. Os principais pontos de originalidade são:

1. Combinação única de gestão de demandas + aprovações + estimativas + faseamento + kanban + cerimônias ágeis em uma única plataforma

2. Fluxo de aprovação em três níveis configurável com possibilidade de solicitar complementações

3. Sistema de geração de códigos automático por empresa

4. Controle específico de demandas regulatórias com alertas de prazo

5. Dashboard analítico com métricas de performance e custos

Não há conhecimento de sistema similar com todas estas características integradas.

---

## 13. Data de Criação e Divulgação

**Data de Criação**: [PREENCHER - primeiro commit ou início do desenvolvimento]

**Data de Conclusão da Versão 1.0**: [PREENCHER]

**Data de Primeira Divulgação/Publicação**: [PREENCHER - se já foi publicado]

**Inédito**: [ ] Sim  [X] Não (se já foi publicado)

---

## 14. Declaração de Autoria

Declaro, para os devidos fins, que sou autor(a) da obra acima descrita, a qual é fruto de criação intelectual própria, não constituindo cópia, imitação, plágio ou violação de direitos autorais de terceiros.

---

**Assinatura do(s) Autor(es)**: _______________________________

**Local e Data**: _______________________________________________

---

**Observações**:
- Este memorial descritivo faz parte da documentação para registro de programa de computador no INPI
- Todos os direitos patrimoniais são do titular identificado acima
- O código fonte completo está disponível em anexo
