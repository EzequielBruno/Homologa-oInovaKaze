# Mapeamento Completo do Sistema

## Índice
1. [Tabelas e Campos](#tabelas-e-campos)
2. [Mapeamento Código-Banco](#mapeamento-código-banco)
3. [Fluxos por Funcionalidade](#fluxos-por-funcionalidade)

---

## Tabelas e Campos

### 1. **demands** - Tabela Principal de Demandas

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | Identificador único | Todos os componentes de demanda |
| codigo | text | Não | Código da demanda (ex: ZC_SQ_RH_001) | `DemandCard.tsx`, `CreateDemand.tsx` |
| empresa | enum | Não | Empresa (ZC/Eletro/ZF/ZS) | `CreateDemand.tsx`, `EmpresaDemands.tsx` |
| departamento | text | Não | Departamento (legado) | `CreateDemand.tsx` |
| squad | text | Sim | Squad responsável | `CreateDemand.tsx`, `SquadsView.tsx` |
| descricao | text | Não | Descrição da demanda | `DemandDialog.tsx`, `CreateDemand.tsx` |
| requisitos_funcionais | text | Sim | Requisitos funcionais | `DemandDialog.tsx` |
| documentos_anexados | text[] | Sim | URLs dos documentos | `FileUpload.tsx`, `DemandDialog.tsx` |
| estudo_viabilidade_url | text | Sim | URL do estudo | `CreateDemand.tsx` |
| prioridade | enum | Não | Baixa/Média/Alta/Crítica | `DemandCard.tsx`, `CreateDemand.tsx` |
| regulatorio | boolean | Sim | Se é regulatório | `CreateDemand.tsx` |
| data_limite_regulatorio | date | Sim | Prazo regulatório | `CreateDemand.tsx` |
| status | enum | Não | Status da demanda | `KanbanView.tsx`, `Backlog.tsx`, etc |
| solicitante_id | uuid | Não | ID do solicitante | `CreateDemand.tsx`, `MinhasSolicitacoes.tsx` |
| responsavel_tecnico_id | uuid | Sim | ID do responsável técnico | `PareceresPendentes.tsx` |
| horas_estimadas | numeric | Sim | Horas estimadas | `Estimativas.tsx` |
| custo_estimado | numeric | Sim | Custo estimado | `Estimativas.tsx` |
| data_conclusao | date | Sim | Data de conclusão | `Concluidas.tsx` |
| classificacao | text | Sim | Melhoria/Projeto | `CreateDemand.tsx` |
| melhoria_problema_atual | text | Sim | Problema (se melhoria) | `CreateDemand.tsx` |
| melhoria_beneficio_esperado | text | Sim | Benefício (se melhoria) | `CreateDemand.tsx` |
| melhoria_alternativas | text | Sim | Alternativas (se melhoria) | `CreateDemand.tsx` |
| tipo_projeto | enum | Sim | Tipo do projeto | `CreateDemand.tsx` |
| pontuacao_selecao | numeric | Sim | Pontuação de seleção | Sistema de scoring |
| roi_estimado | numeric | Sim | ROI estimado | `Relatorios.tsx` |
| roi_realizado | numeric | Sim | ROI realizado | `Relatorios.tsx` |
| data_aprovacao_comite | date | Sim | Data aprovação comitê | `Aprovacoes.tsx` |
| sprint_atual | integer | Sim | Sprint atual | `Planning.tsx`, `SquadsView.tsx` |
| data_inicio | date | Sim | Data de início | `EmProgresso.tsx` |
| resultados_alcancados | text | Sim | Resultados obtidos | `Concluidas.tsx` |
| justificativa_comite | text | Sim | Justificativa do comitê | `Aprovacoes.tsx` |
| observacoes | text | Sim | Observações gerais | `DemandDialog.tsx` |
| created_at | timestamp | Sim | Data de criação | Todos |
| updated_at | timestamp | Sim | Data de atualização | Todos |

**Arquivos principais:**
- `src/pages/CreateDemand.tsx` - Criação
- `src/components/demands/DemandCard.tsx` - Visualização
- `src/components/demands/DemandDialog.tsx` - Detalhes/Edição
- `src/pages/demands/*.tsx` - Listagens por status
- `src/types/demand.ts` - Definições de tipos

---

### 2. **profiles** - Perfis de Usuários

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do usuário (FK auth.users) | `AuthContext.tsx` |
| full_name | text | Sim | Nome completo | `UserManagement.tsx`, `Header.tsx` |
| avatar_url | text | Sim | URL do avatar | `Header.tsx`, `Perfil.tsx` |
| telefone | text | Sim | Telefone | `Perfil.tsx` |
| cargo | text | Sim | Cargo | `UserManagement.tsx` |
| departamento | text | Sim | Departamento | `UserManagement.tsx` |
| empresa | enum | Sim | Empresa | `UserManagement.tsx` |
| is_active | boolean | Sim | Se está ativo | `UserManagement.tsx` |
| force_password_change | boolean | Sim | Forçar troca de senha | `Auth.tsx` |
| password_expires_at | timestamp | Sim | Expiração da senha | Sistema de autenticação |
| password_expiry_months | integer | Sim | Meses para expirar | Sistema de autenticação |
| blocked_at | timestamp | Sim | Data de bloqueio | `UserManagement.tsx` |
| created_at | timestamp | Sim | Data de criação | `UserManagement.tsx` |
| updated_at | timestamp | Sim | Data de atualização | `UserManagement.tsx` |

**Arquivos principais:**
- `src/contexts/AuthContext.tsx` - Autenticação
- `src/pages/Perfil.tsx` - Perfil do usuário
- `src/components/permissions/UserManagement.tsx` - Gestão de usuários

---

### 3. **user_roles** - Papéis/Funções dos Usuários

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `useUserPermissions.ts` |
| role | enum | Não | Papel (admin/user/tech_lead) | `useUserPermissions.ts` |
| created_at | timestamp | Sim | Data de criação | - |

**Valores de role:**
- `admin` - Administrador
- `user` - Usuário padrão
- `tech_lead` - Líder técnico

**Arquivos principais:**
- `src/hooks/useUserPermissions.ts` - Verificação de permissões
- `src/components/permissions/UserManagement.tsx` - Gestão de papéis

---

### 4. **committee_members** - Membros do Comitê

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `Aprovacoes.tsx` |
| nome | text | Não | Nome do membro | `Aprovacoes.tsx` |
| cargo | text | Sim | Cargo | `Aprovacoes.tsx` |
| ativo | boolean | Não | Se está ativo | `Aprovacoes.tsx` |
| created_at | timestamp | Não | Data de criação | - |

**Arquivos principais:**
- `src/pages/Aprovacoes.tsx` - Aprovações do comitê
- `src/hooks/useUserPermissions.ts` - Verificação de membros

---

### 5. **solicitantes** - Solicitantes de Demandas

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `CreateDemand.tsx` |
| nome | text | Não | Nome do solicitante | `MinhasSolicitacoes.tsx` |
| empresa | text | Não | Empresa | `CreateDemand.tsx` |
| cargo | text | Não | Cargo | - |
| ativo | boolean | Não | Se está ativo | `CreateDemand.tsx` |
| created_at | timestamp | Não | Data de criação | - |

**Arquivos principais:**
- `src/pages/CreateDemand.tsx` - Criação de demandas
- `src/pages/demands/MinhasSolicitacoes.tsx` - Demandas do solicitante

---

### 6. **demand_history** - Histórico de Ações

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| demand_id | uuid | Não | ID da demanda | `DemandHistory.tsx` |
| user_id | uuid | Não | ID do usuário | `DemandHistory.tsx` |
| action | enum | Não | Tipo de ação | `useDemandHistory.ts` |
| descricao | text | Não | Descrição da ação | `DemandHistory.tsx` |
| dados_anteriores | jsonb | Sim | Dados antes da mudança | `DemandHistory.tsx` |
| dados_novos | jsonb | Sim | Dados depois da mudança | `DemandHistory.tsx` |
| created_at | timestamp | Não | Data da ação | `DemandHistory.tsx` |

**Valores de action:**
- `criar`, `editar`, `reativar`, `excluir`, `cancelar`, `arquivar`
- `aprovar`, `reprovar`, `mudar_status`
- `adicionar_fase`, `atualizar_fase`
- `solicitar_insumo`, `enviar_notificacao`
- `solicitar_aprovacao_gerente`, `aprovar_gerente`, `recusar_gerente`
- `aprovar_comite`, `recusar_comite`
- `aprovar_ti`, `recusar_ti`

**Arquivos principais:**
- `src/components/demands/DemandHistory.tsx` - Visualização
- `src/hooks/useDemandHistory.ts` - Registro de ações
- `src/pages/demands/HistoricoAcoes.tsx` - Página de histórico

---

### 7. **demand_approvals** - Aprovações de Demandas

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| demand_id | uuid | Não | ID da demanda | `ApprovalDialog.tsx` |
| approver_id | uuid | Não | ID do aprovador | `Aprovacoes.tsx` |
| approval_level | enum | Não | Nível de aprovação | `ApprovalDialog.tsx` |
| status | enum | Não | Status da aprovação | `ApprovalDialog.tsx` |
| motivo_recusa | text | Sim | Motivo da recusa | `ApprovalDialog.tsx` |
| created_at | timestamp | Não | Data de criação | `Aprovacoes.tsx` |
| updated_at | timestamp | Não | Data de atualização | `Aprovacoes.tsx` |

**Valores de approval_level:**
- `gerente` - Aprovação do gerente
- `comite` - Aprovação do comitê
- `ti` - Aprovação da TI

**Valores de status:**
- `pendente` - Aguardando aprovação
- `aprovado` - Aprovado
- `recusado` - Recusado

**Arquivos principais:**
- `src/components/demands/ApprovalDialog.tsx` - Dialog de aprovação
- `src/pages/Aprovacoes.tsx` - Página de aprovações

---

### 8. **phases** - Fases de Demandas

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| demanda_id | uuid | Não | ID da demanda | `Faseamento.tsx` |
| fase_numero | integer | Não | Número da fase | `Faseamento.tsx` |
| nome_fase | text | Não | Nome da fase | `Faseamento.tsx` |
| descricao_fase | text | Sim | Descrição | `Faseamento.tsx` |
| horas_estimadas | numeric | Não | Horas estimadas | `Faseamento.tsx` |
| ordem_execucao | integer | Não | Ordem de execução | `Faseamento.tsx` |
| dependencias | text | Sim | Dependências | `Faseamento.tsx` |
| status | enum | Sim | Status da fase | `Faseamento.tsx` |
| created_at | timestamp | Sim | Data de criação | - |
| updated_at | timestamp | Sim | Data de atualização | - |

**Arquivos principais:**
- `src/pages/technical/Faseamento.tsx` - Gestão de fases
- `src/types/demand.ts` - Interface Phase

---

### 9. **demand_assignments** - Atribuições de Demandas

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| demand_id | uuid | Não | ID da demanda | `AssignDemandDialog.tsx` |
| assigned_to | uuid | Não | Atribuído para | `AssignDemandDialog.tsx` |
| assigned_by | uuid | Não | Atribuído por | `AssignDemandDialog.tsx` |
| sprint_number | integer | Não | Número da sprint | `Planning.tsx` |
| faseamento_completo | boolean | Não | Faseamento completo | `AssignDemandDialog.tsx` |
| prazo_faseamento | timestamp | Sim | Prazo para faseamento | `AssignDemandDialog.tsx` |
| notificacao_pendente | boolean | Não | Notificação pendente | Sistema de notificações |
| created_at | timestamp | Não | Data de criação | - |
| updated_at | timestamp | Não | Data de atualização | - |

**Arquivos principais:**
- `src/components/squads/AssignDemandDialog.tsx` - Atribuição de demandas
- `src/pages/Planning.tsx` - Planejamento de sprints

---

### 10. **squad_members** - Membros de Squads

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `SquadColumn.tsx` |
| empresa | text | Não | Empresa | `SquadsView.tsx` |
| squad | text | Não | Squad | `SquadsView.tsx` |
| cargo | text | Sim | Cargo | `MemberDetailsDialog.tsx` |
| horas_dia | numeric | Não | Horas por dia | `MemberDetailsDialog.tsx` |
| is_scrum | boolean | Não | Se é Scrum Master | `SquadColumn.tsx` |
| created_at | timestamp | Não | Data de criação | - |
| updated_at | timestamp | Não | Data de atualização | - |

**Arquivos principais:**
- `src/pages/empresa/SquadsView.tsx` - Visualização de squads
- `src/components/squads/SquadColumn.tsx` - Coluna de squad
- `src/components/squads/MemberDetailsDialog.tsx` - Detalhes do membro

---

### 11. **squads** - Squads

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| empresa | text | Não | Empresa | `CreateSquadDialog.tsx` |
| nome | text | Não | Nome do squad | `CreateSquadDialog.tsx` |
| descricao | text | Sim | Descrição | `CreateSquadDialog.tsx` |
| ativo | boolean | Não | Se está ativo | `SquadsView.tsx` |
| created_at | timestamp | Não | Data de criação | - |
| updated_at | timestamp | Não | Data de atualização | - |

**Arquivos principais:**
- `src/components/squads/CreateSquadDialog.tsx` - Criar squad
- `src/pages/empresa/SquadsView.tsx` - Visualização

---

### 12. **project_managers** - Gerentes de Projeto

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `GestaoRiscos.tsx` |
| nome | text | Não | Nome do gerente | `GestaoRiscos.tsx` |
| empresa | text | Não | Empresa | `GestaoRiscos.tsx` |
| squad | text | Sim | Squad | `GestaoRiscos.tsx` |
| ativo | boolean | Sim | Se está ativo | `GestaoRiscos.tsx` |
| created_at | timestamp | Sim | Data de criação | - |

**Arquivos principais:**
- `src/pages/GestaoRiscos.tsx` - Gestão de riscos

---

### 13. **risk_assessments** - Avaliações de Risco

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| demand_id | uuid | Não | ID da demanda | `RiskMatrix.tsx` |
| manager_id | uuid | Não | ID do gerente | `RiskAssessmentDialog.tsx` |
| probabilidade | text | Não | Probabilidade | `RiskAssessmentDialog.tsx` |
| impacto | text | Não | Impacto | `RiskAssessmentDialog.tsx` |
| indice_risco | numeric | Não | Índice calculado | `RiskMatrix.tsx` |
| acoes_mitigadoras | text | Sim | Ações mitigadoras | `RiskAssessmentDialog.tsx` |
| resposta_risco | text | Sim | Resposta ao risco | `RiskAssessmentDialog.tsx` |
| classificacao_gerente | text | Sim | Classificação | `RiskAssessmentDialog.tsx` |
| status | text | Sim | Status | `GestaoRiscos.tsx` |
| created_at | timestamp | Sim | Data de criação | - |
| updated_at | timestamp | Sim | Data de atualização | - |

**Arquivos principais:**
- `src/pages/GestaoRiscos.tsx` - Página de gestão de riscos
- `src/components/risk/RiskMatrix.tsx` - Matriz de riscos
- `src/components/risk/RiskAssessmentDialog.tsx` - Dialog de avaliação
- `src/hooks/useRiskAssessment.ts` - Hook de riscos

---

### 14. **reviews** - Reviews/Retrospectivas

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| review_number | integer | Não | Número da review | `Retrospectiva.tsx` |
| empresa | text | Não | Empresa | `Retrospectiva.tsx` |
| data_review | date | Não | Data da review | `Retrospectiva.tsx` |
| demandas_entregues | text[] | Sim | Demandas entregues | `Retrospectiva.tsx` |
| pontos_positivos | text | Sim | Pontos positivos | `Retrospectiva.tsx` |
| pontos_melhoria | text | Sim | Pontos de melhoria | `Retrospectiva.tsx` |
| solicitacoes_apoio | text | Sim | Solicitações de apoio | `Retrospectiva.tsx` |
| participantes | text[] | Sim | Participantes | `Retrospectiva.tsx` |
| velocidade_sprint | numeric | Sim | Velocidade da sprint | `Retrospectiva.tsx` |
| qualidade_entrega | numeric | Sim | Qualidade de entrega | `Retrospectiva.tsx` |
| created_by | uuid | Não | Criado por | `Retrospectiva.tsx` |
| created_at | timestamp | Sim | Data de criação | - |
| updated_at | timestamp | Sim | Data de atualização | - |

**Arquivos principais:**
- `src/pages/Retrospectiva.tsx` - Gestão de retrospectivas
- `src/types/demand.ts` - Interface Review

---

### 15. **notifications** - Notificações

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `NotificationBell.tsx` |
| title | text | Não | Título | `NotificationBell.tsx` |
| message | text | Não | Mensagem | `NotificationBell.tsx` |
| tipo | text | Não | Tipo de notificação | `NotificationBell.tsx` |
| relacionado_id | uuid | Sim | ID relacionado | `NotificationBell.tsx` |
| lida | boolean | Não | Se foi lida | `NotificationBell.tsx` |
| created_at | timestamp | Não | Data de criação | `NotificationBell.tsx` |
| updated_at | timestamp | Não | Data de atualização | - |

**Arquivos principais:**
- `src/components/layout/NotificationBell.tsx` - Sino de notificações

---

### 16. **access_groups** - Grupos de Acesso

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| nome | text | Não | Nome do grupo | `AccessGroupsManager.tsx` |
| descricao | text | Sim | Descrição | `AccessGroupsManager.tsx` |
| is_system_group | boolean | Sim | Se é grupo do sistema | `AccessGroupsManager.tsx` |
| created_at | timestamp | Sim | Data de criação | - |
| updated_at | timestamp | Sim | Data de atualização | - |

**Arquivos principais:**
- `src/components/permissions/AccessGroupsManager.tsx` - Gestão de grupos

---

### 17. **group_permissions** - Permissões de Grupos

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| group_id | uuid | Não | ID do grupo | `GroupPermissionsManager.tsx` |
| resource | enum | Não | Recurso | `GroupPermissionsManager.tsx` |
| action | enum | Não | Ação | `GroupPermissionsManager.tsx` |
| created_at | timestamp | Sim | Data de criação | - |

**Arquivos principais:**
- `src/components/permissions/GroupPermissionsManager.tsx` - Gestão de permissões

---

### 18. **user_access_groups** - Usuários em Grupos

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `UserGroupsManager.tsx` |
| group_id | uuid | Não | ID do grupo | `UserGroupsManager.tsx` |
| created_at | timestamp | Sim | Data de criação | - |

**Arquivos principais:**
- `src/components/permissions/UserGroupsManager.tsx` - Gestão de usuários em grupos

---

### 19. **user_custom_permissions** - Permissões Customizadas

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `EditPermissionsDialog.tsx` |
| resource | enum | Não | Recurso | `EditPermissionsDialog.tsx` |
| action | enum | Não | Ação | `EditPermissionsDialog.tsx` |
| granted | boolean | Sim | Se foi concedida | `EditPermissionsDialog.tsx` |
| created_at | timestamp | Sim | Data de criação | - |

**Arquivos principais:**
- `src/components/permissions/EditPermissionsDialog.tsx` - Edição de permissões

---

### 20. **user_activity_log** - Log de Atividades

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | Sistema de auditoria |
| action | text | Não | Ação realizada | Sistema de auditoria |
| description | text | Sim | Descrição | Sistema de auditoria |
| changed_by | uuid | Sim | Alterado por | Sistema de auditoria |
| metadata | jsonb | Sim | Metadados | Sistema de auditoria |
| created_at | timestamp | Sim | Data de criação | - |

**Arquivos principais:**
- Trigger automático no banco de dados

---

### 21. **demand_evaluations** - Avaliações Técnicas

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| demand_id | uuid | Não | ID da demanda | `PareceresPendentes.tsx` |
| evaluator_id | uuid | Não | ID do avaliador | `ParecerTecnicoDialog.tsx` |
| tipo_avaliacao | text | Não | Tipo de avaliação | `ParecerTecnicoDialog.tsx` |
| aprovado | boolean | Sim | Se foi aprovado | `ParecerTecnicoDialog.tsx` |
| pontuacao | numeric | Sim | Pontuação | `ParecerTecnicoDialog.tsx` |
| comentario | text | Sim | Comentário | `ParecerTecnicoDialog.tsx` |
| created_at | timestamp | Sim | Data de criação | - |
| updated_at | timestamp | Sim | Data de atualização | - |

**Arquivos principais:**
- `src/pages/technical/PareceresPendentes.tsx` - Pareceres pendentes
- `src/pages/technical/ParecerTecnicoDialog.tsx` - Dialog de parecer

---

### 22. **daily_updates** - Atualizações Diárias (Dailys)

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| demand_id | uuid | Não | ID da demanda | `Dailys.tsx` |
| created_by | uuid | Não | Criado por | `Dailys.tsx` |
| update_text | text | Não | Texto da atualização | `Dailys.tsx` |
| created_at | timestamp | Não | Data de criação | `Dailys.tsx` |

**Arquivos principais:**
- `src/pages/Dailys.tsx` - Página de dailys

---

### 23. **scrum_masters** - Scrum Masters

| Campo | Tipo | Nullable | Descrição | Usado em |
|-------|------|----------|-----------|----------|
| id | uuid | Não | ID do registro | - |
| user_id | uuid | Não | ID do usuário | `SquadsView.tsx` |
| nome | text | Não | Nome | `SquadsView.tsx` |
| empresa | text | Não | Empresa | `SquadsView.tsx` |
| squad | text | Não | Squad | `SquadsView.tsx` |
| ativo | boolean | Não | Se está ativo | `SquadsView.tsx` |
| created_at | timestamp | Não | Data de criação | - |

**Arquivos principais:**
- `src/pages/empresa/SquadsView.tsx` - Visualização de squads

---

## Mapeamento Código-Banco

### Páginas e suas Tabelas

| Página | Arquivo | Tabelas Usadas |
|--------|---------|----------------|
| Dashboard | `src/pages/Dashboard.tsx` | demands, demand_approvals, reviews |
| Criar Demanda | `src/pages/CreateDemand.tsx` | demands, solicitantes, demand_history |
| Minhas Solicitações | `src/pages/demands/MinhasSolicitacoes.tsx` | demands, profiles |
| Backlog | `src/pages/demands/Backlog.tsx` | demands, profiles |
| Em Progresso | `src/pages/demands/EmProgresso.tsx` | demands, demand_assignments, profiles |
| Concluídas | `src/pages/demands/Concluidas.tsx` | demands, profiles |
| Histórico de Ações | `src/pages/demands/HistoricoAcoes.tsx` | demand_history, demands, profiles |
| Aprovações | `src/pages/Aprovacoes.tsx` | demands, demand_approvals, committee_members |
| Planning | `src/pages/Planning.tsx` | demands, demand_assignments, squad_members |
| Dailys | `src/pages/Dailys.tsx` | daily_updates, demands, profiles |
| Retrospectiva | `src/pages/Retrospectiva.tsx` | reviews, demands |
| Gestão de Riscos | `src/pages/GestaoRiscos.tsx` | risk_assessments, demands, project_managers |
| Pareceres Pendentes | `src/pages/technical/PareceresPendentes.tsx` | demands, demand_evaluations, profiles |
| Estimativas | `src/pages/technical/Estimativas.tsx` | demands, phases |
| Faseamento | `src/pages/technical/Faseamento.tsx` | demands, phases |
| Relatórios | `src/pages/Relatorios.tsx` | demands, reviews, risk_assessments |
| Permissões | `src/pages/Permissoes.tsx` | profiles, user_roles, access_groups, group_permissions |
| Perfil | `src/pages/Perfil.tsx` | profiles |
| Squads | `src/pages/empresa/SquadsView.tsx` | squads, squad_members, demands |
| Kanban | `src/pages/empresa/KanbanView.tsx` | demands, squad_members |
| Demandas Empresa | `src/pages/empresa/EmpresaDemands.tsx` | demands, profiles |
| Arquivadas | `src/pages/empresa/Arquivadas.tsx` | demands, profiles |
| Aguardando Insumos | `src/pages/atencao/AguardandoInsumos.tsx` | demands, profiles |
| Aguardando Validação | `src/pages/atencao/AguardandoValidacao.tsx` | demands, profiles |
| Stand By | `src/pages/atencao/StandBy.tsx` | demands, profiles |

---

### Componentes e suas Tabelas

| Componente | Arquivo | Tabelas Usadas |
|------------|---------|----------------|
| DemandCard | `src/components/demands/DemandCard.tsx` | demands |
| DemandDialog | `src/components/demands/DemandDialog.tsx` | demands, phases, risk_assessments |
| DemandHistory | `src/components/demands/DemandHistory.tsx` | demand_history, profiles |
| ApprovalDialog | `src/components/demands/ApprovalDialog.tsx` | demand_approvals, demands |
| FileUpload | `src/components/demands/FileUpload.tsx` | demands (storage bucket) |
| KanbanCard | `src/components/kanban/KanbanCard.tsx` | demands |
| KanbanColumn | `src/components/kanban/KanbanColumn.tsx` | demands |
| SquadColumn | `src/components/squads/SquadColumn.tsx` | squad_members, demands |
| AssignDemandDialog | `src/components/squads/AssignDemandDialog.tsx` | demand_assignments, demands |
| AssignUserDialog | `src/components/squads/AssignUserDialog.tsx` | squad_members, profiles |
| CreateSquadDialog | `src/components/squads/CreateSquadDialog.tsx` | squads |
| MemberDetailsDialog | `src/components/squads/MemberDetailsDialog.tsx` | squad_members, profiles |
| RiskMatrix | `src/components/risk/RiskMatrix.tsx` | risk_assessments, demands |
| RiskAssessmentDialog | `src/components/risk/RiskAssessmentDialog.tsx` | risk_assessments, demands |
| UserManagement | `src/components/permissions/UserManagement.tsx` | profiles, user_roles |
| UserRegistration | `src/components/permissions/UserRegistration.tsx` | profiles, user_roles |
| AccessGroupsManager | `src/components/permissions/AccessGroupsManager.tsx` | access_groups |
| GroupPermissionsManager | `src/components/permissions/GroupPermissionsManager.tsx` | group_permissions, access_groups |
| UserGroupsManager | `src/components/permissions/UserGroupsManager.tsx` | user_access_groups, access_groups |
| EditPermissionsDialog | `src/components/permissions/EditPermissionsDialog.tsx` | user_custom_permissions |
| EditGroupPermissionsDialog | `src/components/permissions/EditGroupPermissionsDialog.tsx` | group_permissions |
| NotificationBell | `src/components/layout/NotificationBell.tsx` | notifications |
| Header | `src/components/layout/Header.tsx` | profiles, notifications |
| Sidebar | `src/components/layout/Sidebar.tsx` | - |

---

### Hooks e suas Tabelas

| Hook | Arquivo | Tabelas Usadas |
|------|---------|----------------|
| useUserPermissions | `src/hooks/useUserPermissions.ts` | user_roles, committee_members, solicitantes, profiles |
| useDemandHistory | `src/hooks/useDemandHistory.ts` | demand_history |
| useRiskAssessment | `src/hooks/useRiskAssessment.ts` | risk_assessments |

---

### Utilitários e suas Tabelas

| Utilitário | Arquivo | Tabelas Usadas |
|------------|---------|----------------|
| demandCodeGenerator | `src/utils/demandCodeGenerator.ts` | demands |

---

## Fluxos por Funcionalidade

### 1. Criação de Demanda

**Fluxo:**
1. Usuário preenche formulário em `CreateDemand.tsx`
2. Sistema valida se usuário é solicitante (tabela `solicitantes`)
3. Gera código único (`demandCodeGenerator.ts` → tabela `demands`)
4. Insere demanda (tabela `demands`)
5. Registra ação no histórico (`useDemandHistory.ts` → tabela `demand_history`)
6. Cria notificação para comitê (tabela `notifications`)

**Arquivos envolvidos:**
- `src/pages/CreateDemand.tsx`
- `src/utils/demandCodeGenerator.ts`
- `src/hooks/useDemandHistory.ts`

**Tabelas:**
- `demands`, `solicitantes`, `demand_history`, `notifications`

---

### 2. Aprovação de Demanda

**Fluxo:**
1. Demanda aparece em `Aprovacoes.tsx`
2. Membro do comitê abre `ApprovalDialog.tsx`
3. Aprova ou recusa (tabela `demand_approvals`)
4. Status da demanda é atualizado (tabela `demands`)
5. Ação é registrada (tabela `demand_history`)
6. Notificação enviada ao solicitante (tabela `notifications`)

**Arquivos envolvidos:**
- `src/pages/Aprovacoes.tsx`
- `src/components/demands/ApprovalDialog.tsx`
- `src/hooks/useDemandHistory.ts`

**Tabelas:**
- `demand_approvals`, `demands`, `demand_history`, `committee_members`, `notifications`

---

### 3. Atribuição a Squad

**Fluxo:**
1. Tech lead acessa `SquadsView.tsx`
2. Abre `AssignDemandDialog.tsx`
3. Atribui demanda a membro do squad (tabela `demand_assignments`)
4. Define prazo para faseamento
5. Status da demanda muda para "Em_Progresso" (tabela `demands`)
6. Notificação enviada ao responsável (tabela `notifications`)

**Arquivos envolvidos:**
- `src/pages/empresa/SquadsView.tsx`
- `src/components/squads/AssignDemandDialog.tsx`
- `src/hooks/useDemandHistory.ts`

**Tabelas:**
- `demand_assignments`, `demands`, `squad_members`, `demand_history`, `notifications`

---

### 4. Faseamento

**Fluxo:**
1. Responsável técnico acessa `Faseamento.tsx`
2. Cria fases da demanda (tabela `phases`)
3. Define horas, ordem e dependências
4. Marca faseamento como completo (tabela `demand_assignments`)
5. Ação registrada (tabela `demand_history`)

**Arquivos envolvidos:**
- `src/pages/technical/Faseamento.tsx`
- `src/hooks/useDemandHistory.ts`

**Tabelas:**
- `phases`, `demands`, `demand_assignments`, `demand_history`

---

### 5. Gestão de Riscos

**Fluxo:**
1. Gerente de projeto acessa `GestaoRiscos.tsx`
2. Abre `RiskAssessmentDialog.tsx`
3. Avalia probabilidade e impacto (tabela `risk_assessments`)
4. Sistema calcula índice de risco
5. Define ações mitigadoras
6. Matriz de risco atualizada (`RiskMatrix.tsx`)

**Arquivos envolvidos:**
- `src/pages/GestaoRiscos.tsx`
- `src/components/risk/RiskAssessmentDialog.tsx`
- `src/components/risk/RiskMatrix.tsx`
- `src/hooks/useRiskAssessment.ts`

**Tabelas:**
- `risk_assessments`, `demands`, `project_managers`

---

### 6. Planning e Sprints

**Fluxo:**
1. Scrum Master acessa `Planning.tsx`
2. Seleciona demandas para sprint
3. Atribui membros do squad (tabela `demand_assignments`)
4. Define sprint_number
5. Kanban é atualizado (`KanbanView.tsx`)

**Arquivos envolvidos:**
- `src/pages/Planning.tsx`
- `src/pages/empresa/KanbanView.tsx`
- `src/components/kanban/KanbanColumn.tsx`

**Tabelas:**
- `demand_assignments`, `demands`, `squad_members`

---

### 7. Daily Updates

**Fluxo:**
1. Membro do squad acessa `Dailys.tsx`
2. Adiciona update sobre demanda (tabela `daily_updates`)
3. Updates são exibidos na timeline
4. Equipe acompanha progresso

**Arquivos envolvidos:**
- `src/pages/Dailys.tsx`

**Tabelas:**
- `daily_updates`, `demands`, `profiles`

---

### 8. Retrospectiva

**Fluxo:**
1. Scrum Master acessa `Retrospectiva.tsx`
2. Cria nova retrospectiva (tabela `reviews`)
3. Lista demandas entregues
4. Registra pontos positivos e de melhoria
5. Avalia velocidade e qualidade

**Arquivos envolvidos:**
- `src/pages/Retrospectiva.tsx`

**Tabelas:**
- `reviews`, `demands`

---

### 9. Gestão de Permissões

**Fluxo:**
1. Admin acessa `Permissoes.tsx`
2. Gerencia usuários (`UserManagement.tsx`)
3. Cria grupos de acesso (`AccessGroupsManager.tsx`)
4. Define permissões de grupo (`GroupPermissionsManager.tsx`)
5. Atribui usuários a grupos (`UserGroupsManager.tsx`)
6. Define permissões customizadas (`EditPermissionsDialog.tsx`)

**Arquivos envolvidos:**
- `src/pages/Permissoes.tsx`
- `src/components/permissions/*.tsx`

**Tabelas:**
- `profiles`, `user_roles`, `access_groups`, `group_permissions`, `user_access_groups`, `user_custom_permissions`

---

### 10. Notificações

**Fluxo:**
1. Evento gera notificação (várias fontes)
2. Notificação inserida (tabela `notifications`)
3. Sino atualiza contador (`NotificationBell.tsx`)
4. Usuário clica e visualiza
5. Notificação marcada como lida

**Arquivos envolvidos:**
- `src/components/layout/NotificationBell.tsx`

**Tabelas:**
- `notifications`

---

## Enums e Constantes

### Status de Demanda (demand_status)
```typescript
'Backlog' | 'Em_Avaliacao_PMO' | 'Aguardando_Comite' | 'Aprovado' | 
'Em_Progresso' | 'Revisao' | 'Concluido' | 'StandBy' | 'Nao_Entregue'
```

### Prioridade (demand_priority)
```typescript
'Baixa' | 'Média' | 'Alta' | 'Crítica'
```

### Empresa (company_enum)
```typescript
'ZC' | 'Eletro' | 'ZF' | 'ZS'
```

### Papéis (app_role)
```typescript
'admin' | 'user' | 'tech_lead'
```

### Nível de Aprovação (approval_level)
```typescript
'gerente' | 'comite' | 'ti'
```

### Status de Aprovação (approval_status)
```typescript
'pendente' | 'aprovado' | 'recusado'
```

### Recursos de Permissão (permission_resource)
```typescript
'demands' | 'approvals' | 'users' | 'reports' | 'phases' | 
'risks' | 'squads' | 'planning' | 'reviews'
```

### Ações de Permissão (permission_action)
```typescript
'create' | 'read' | 'update' | 'delete' | 'approve' | 'assign'
```

---

## Storage Buckets

### demand-documents
**Bucket:** `demand-documents`  
**Público:** Não  
**Uso:** Armazenamento de documentos anexados às demandas

**Arquivos que usam:**
- `src/components/demands/FileUpload.tsx`
- `src/components/demands/DemandDialog.tsx`

**Estrutura de pastas:**
```
demand-documents/
  └── {demand_id}/
      └── {filename}
```

---

## Edge Functions

### request-password-reset
**Arquivo:** `supabase/functions/request-password-reset/index.ts`  
**Função:** Solicita reset de senha para admins  
**Tabelas:** `user_roles`, `notifications`

### reset-master-password
**Arquivo:** `supabase/functions/reset-master-password/index.ts`  
**Função:** Reset de senha master  
**Tabelas:** `profiles`, `auth.users`

### admin-reset-password
**Arquivo:** `supabase/functions/admin-reset-password/index.ts`  
**Função:** Admin reseta senha de usuário  
**Tabelas:** `profiles`, `user_roles`, `auth.users`

---

## Funções do Banco de Dados

### has_role(user_id, role)
**Retorna:** boolean  
**Uso:** Verifica se usuário tem papel específico  
**Usada em:** RLS policies, verificações de permissão

### is_committee_member(user_id)
**Retorna:** boolean  
**Uso:** Verifica se usuário é membro do comitê  
**Usada em:** RLS policies, aprovações

### is_project_manager(user_id)
**Retorna:** boolean  
**Uso:** Verifica se usuário é gerente de projeto  
**Usada em:** Gestão de riscos

### get_solicitante_empresa(user_id)
**Retorna:** text  
**Uso:** Retorna empresa do solicitante  
**Usada em:** RLS policies, filtros

### get_manager_empresa(user_id)
**Retorna:** text  
**Uso:** Retorna empresa do gerente  
**Usada em:** Filtros de gestão

### user_has_permission(user_id, resource, action)
**Retorna:** boolean  
**Uso:** Verifica permissões granulares  
**Usada em:** Sistema de permissões

### copy_user_permissions(source_user_id, target_user_id)
**Retorna:** void  
**Uso:** Copia permissões entre usuários  
**Usada em:** Gestão de usuários

---

## Resumo de Arquivos Principais

### Core
- `src/App.tsx` - Roteamento principal
- `src/main.tsx` - Entry point
- `src/index.css` - Design system

### Contextos
- `src/contexts/AuthContext.tsx` - Autenticação

### Hooks Customizados
- `src/hooks/useUserPermissions.ts` - Permissões
- `src/hooks/useDemandHistory.ts` - Histórico
- `src/hooks/useRiskAssessment.ts` - Riscos

### Tipos
- `src/types/demand.ts` - Tipos de demandas
- `src/integrations/supabase/types.ts` - Tipos do banco (auto-gerado)

### Utilitários
- `src/utils/demandCodeGenerator.ts` - Geração de códigos
- `src/lib/utils.ts` - Utilitários gerais

### Layout
- `src/components/layout/Layout.tsx` - Layout principal
- `src/components/layout/Header.tsx` - Cabeçalho
- `src/components/layout/Sidebar.tsx` - Menu lateral
- `src/components/layout/NotificationBell.tsx` - Notificações

---

Esta documentação mapeia completamente o sistema, conectando cada campo do banco de dados aos arquivos de código que o utilizam.
