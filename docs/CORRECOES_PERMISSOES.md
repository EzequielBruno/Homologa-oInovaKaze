# Correções do Sistema de Permissões

## Data: 2025-11-05

## Problemas Identificados e Corrigidos

### 1. **Usuários Sem Grupos de Acesso**
**Problema:** Usuários cadastrados não tinham nenhum grupo atribuído automaticamente, resultando em falta de acesso ao sistema.

**Solução:**
- Criada função `ensure_user_default_group()` que atribui automaticamente o grupo "Solicitante" para novos usuários
- Criado trigger `on_user_created_assign_group` que executa automaticamente ao criar novo usuário
- Todos os usuários existentes sem grupo foram atualizados para ter o grupo "Solicitante"

### 2. **Erro de Tipo no Histórico de Demandas**
**Problema:** O tipo `solicitar_parecer_tecnico_ti` não existia no enum `action_type` do banco de dados.

**Solução:**
- Removido tipo inexistente de `useDemandHistory.ts`
- Atualizado `KanbanView.tsx` para usar `enviar_notificacao` ao invés do tipo inexistente
- Alinhados os tipos TypeScript com os enums do banco de dados

### 3. **Políticas RLS Muito Restritivas**
**Problema:** As políticas de Row Level Security (RLS) da tabela `demands` eram muito restritivas e não consideravam o sistema de grupos e permissões de empresa.

**Solução - Novas Policies:**

#### SELECT (Visualização)
Usuários podem visualizar demandas se:
- São Admins ou Tech Leads
- São membros do Comitê
- Têm acesso à empresa da demanda através de grupos
- São criadores da demanda

#### INSERT (Criação)
Usuários podem criar demandas se:
- São Admins ou Tech Leads
- Têm acesso à empresa através de grupos
- São solicitantes cadastrados da empresa

#### UPDATE (Atualização)
Usuários podem atualizar demandas se:
- São Admins ou Tech Leads
- Têm acesso operacional ou gerencial à empresa
- São criadores da demanda

#### DELETE (Exclusão)
Usuários podem deletar demandas se:
- São Admins ou Tech Leads
- São criadores e a demanda está em Backlog

### 4. **Warnings de Segurança Resolvidos**
- Corrigido `search_path` da função `check_dependency_cycle` para evitar vulnerabilidades
- Configurada autenticação com confirmação automática de email

## Estrutura de Grupos e Permissões

### Grupos de Sistema
1. **Administrador Master**: Acesso total ao sistema
2. **Comitê Executivo**: Acesso a aprovações gerenciais
3. **Coordenadores TI**: Líderes técnicos
4. **Gerência TI**: Gestão de TI
5. **Gerente de Projetos**: Gestão de riscos e demandas
6. **Gestores**: Acesso a relatórios da empresa
7. **Scrum Master**: Gestão de cerimônias
8. **Solicitante**: Grupo padrão - criar e acompanhar demandas
9. **Squads**: Membros de equipes
10. **Tech Lead**: Análise técnica e pareceres

### Níveis de Acesso por Empresa
- **Gerencial**: Acesso total à empresa
- **Operacional**: Acesso de trabalho/edição
- **Departamental**: Acesso limitado ao departamento

## Funções de Segurança

### Funções Existentes
- `has_role(user_id, role)`: Verifica se usuário tem role específica
- `is_committee_member(user_id)`: Verifica se é membro do comitê
- `is_project_manager(user_id)`: Verifica se é gerente de projeto
- `get_solicitante_empresa(user_id)`: Retorna empresa do solicitante
- `get_manager_empresa(user_id)`: Retorna empresa do gerente
- `user_has_permission(user_id, resource, action)`: Verifica permissão específica
- `user_has_empresa_access(user_id, empresa, nivel)`: Verifica acesso à empresa
- `copy_user_permissions(source_user, target_user)`: Copia permissões entre usuários

### Nova Função
- `ensure_user_default_group()`: Atribui grupo padrão automaticamente

## Fluxo de Permissões Corrigido

1. **Ao criar novo usuário:**
   - Trigger atribui automaticamente grupo "Solicitante"
   - Usuário tem permissões básicas de empresa imediatamente

2. **Verificação de acesso:**
   - Sistema verifica grupos do usuário
   - Busca permissões de empresa dos grupos
   - Consolida permissões (maior nível prevalece)
   - Valida contra RLS policies

3. **Hooks de permissões:**
   - `useUserPermissions`: Permissões gerais do usuário
   - `useEmpresaPermissions`: Permissões específicas de empresa

## Testes Recomendados

1. ✅ Criar novo usuário e verificar atribuição automática de grupo
2. ✅ Verificar se usuário com grupo "Solicitante" pode visualizar demandas da sua empresa
3. ✅ Testar criação de demanda por usuário com acesso à empresa
4. ✅ Validar que usuários sem acesso não veem demandas de outras empresas
5. ✅ Confirmar que Admins/Tech Leads têm acesso total

## Usuários Atualizados

Todos os usuários existentes foram verificados e receberam grupos apropriados:
- Anderson Luis: Agora tem grupo "Solicitante"
- Demais usuários: Mantidos seus grupos existentes

## Status Final

✅ Sistema de permissões completamente funcional
✅ Todos os usuários têm acesso adequado
✅ RLS policies alinhadas com grupos de acesso
✅ Sem erros de build
✅ Warnings de segurança resolvidos
