# Documentação Técnica Completa
## Sistema de Gestão de Demandas de TI

---

## 1. Visão Geral do Sistema

### 1.1 Descrição
Sistema web para gerenciamento completo do ciclo de vida de demandas de desenvolvimento de software, incluindo aprovações, estimativas, faseamento e execução.

### 1.2 Tipo de Sistema
- **Categoria**: Aplicação Web (SPA - Single Page Application)
- **Modelo**: Cliente-Servidor
- **Arquitetura**: Frontend React + Backend Supabase

### 1.3 Tecnologias

#### Frontend
```
- React 18.3.1
- TypeScript 5.x
- Vite 6.x
- Tailwind CSS 3.x
- shadcn/ui
- React Router DOM 6.30.1
- React Hook Form 7.61.1
- Zod 3.25.76 (validação)
- Lucide React (ícones)
- Recharts 2.15.4 (gráficos)
- @dnd-kit (drag and drop)
- date-fns (manipulação de datas)
```

#### Backend
```
- Supabase (plataforma completa)
- PostgreSQL 14+
- PostgREST (API REST automática)
- GoTrue (autenticação)
- Realtime (subscriptions)
```

#### Infraestrutura
```
- Hospedagem: Vercel (frontend) + Supabase (backend)
- SSL/TLS: Automático via Vercel
- CDN: Vercel Edge Network
- Banco de Dados: Supabase (PostgreSQL na AWS)
```

---

## 2. Arquitetura do Sistema

### 2.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO (Browser)                     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React + TypeScript)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Components Layer                                 │   │
│  │  - UI Components (shadcn/ui)                      │   │
│  │  - Business Components (Demand, Kanban, etc)      │   │
│  │  - Layout Components (Header, Sidebar, etc)       │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Application Layer                                │   │
│  │  - Pages (Routes)                                 │   │
│  │  - Context Providers (AuthContext)                │   │
│  │  - Custom Hooks (useUserPermissions, etc)         │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Layer                                    │   │
│  │  - Supabase Client                                │   │
│  │  - API Calls                                      │   │
│  │  - Data Fetching                                  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ REST API / Realtime
                     ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND (Supabase)                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Layer (PostgREST)                            │   │
│  │  - RESTful API automática                         │   │
│  │  - Autenticação JWT                               │   │
│  │  - Row Level Security                             │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Database Layer (PostgreSQL)                      │   │
│  │  - Tables                                         │   │
│  │  - Views                                          │   │
│  │  - Functions                                      │   │
│  │  - Triggers                                       │   │
│  │  - RLS Policies                                   │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Auth Layer (GoTrue)                              │   │
│  │  - User Management                                │   │
│  │  - Session Management                             │   │
│  │  - JWT Tokens                                     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Storage Layer                                    │   │
│  │  - File Upload/Download                           │   │
│  │  - Access Control                                 │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Realtime Layer                                   │   │
│  │  - WebSocket Connections                          │   │
│  │  - Database Changes Stream                        │   │
│  │  - Notifications                                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Fluxo de Dados

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │◄───────►│    React     │◄───────►│   Supabase   │
│              │  HTTPS  │   Frontend   │   API   │   Backend    │
└──────────────┘         └──────────────┘         └──────────────┘
      ▲                         ▲                         ▲
      │                         │                         │
      │ User Actions            │ State Management        │ Data Persistence
      │                         │                         │
      └─────────────────────────┴─────────────────────────┘
```

---

## 3. Estrutura do Projeto

### 3.1 Árvore de Diretórios

```
projeto/
├── public/                      # Arquivos estáticos
│   ├── robots.txt              # SEO
│   └── favicon.ico             # Ícone do site
├── src/                        # Código fonte
│   ├── components/             # Componentes React
│   │   ├── auth/               # Componentes de autenticação
│   │   │   └── ProtectedRoute.tsx
│   │   ├── demands/            # Componentes de demandas
│   │   │   ├── ApprovalDialog.tsx
│   │   │   ├── DemandCard.tsx
│   │   │   ├── DemandDialog.tsx
│   │   │   ├── DemandHistory.tsx
│   │   │   └── FileUpload.tsx
│   │   ├── kanban/             # Componentes Kanban
│   │   │   ├── KanbanCard.tsx
│   │   │   └── KanbanColumn.tsx
│   │   ├── layout/             # Componentes de layout
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/                 # Componentes UI base (shadcn)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       └── ... (50+ componentes)
│   ├── contexts/               # Context Providers
│   │   └── AuthContext.tsx     # Contexto de autenticação
│   ├── hooks/                  # Custom Hooks
│   │   ├── useDemandHistory.ts
│   │   ├── useUserPermissions.ts
│   │   └── use-toast.ts
│   ├── integrations/           # Integrações externas
│   │   └── supabase/
│   │       ├── client.ts       # Cliente Supabase
│   │       └── types.ts        # Tipos TypeScript do DB
│   ├── lib/                    # Bibliotecas e utilities
│   │   └── utils.ts            # Funções utilitárias
│   ├── pages/                  # Páginas (Routes)
│   │   ├── atencao/            # Páginas de atenção
│   │   │   ├── AguardandoInsumos.tsx
│   │   │   ├── AguardandoValidacao.tsx
│   │   │   └── StandBy.tsx
│   │   ├── demands/            # Páginas de demandas
│   │   │   ├── Backlog.tsx
│   │   │   ├── Concluidas.tsx
│   │   │   ├── EmProgresso.tsx
│   │   │   ├── HistoricoAcoes.tsx
│   │   │   └── MinhasSolicitacoes.tsx
│   │   ├── empresa/            # Visão empresa
│   │   │   ├── Arquivadas.tsx
│   │   │   ├── EmpresaDemands.tsx
│   │   │   └── KanbanView.tsx
│   │   ├── technical/          # Análise técnica
│   │   │   ├── Estimativas.tsx
│   │   │   ├── Faseamento.tsx
│   │   │   ├── ParecerTecnicoDialog.tsx
│   │   │   └── PareceresPendentes.tsx
│   │   ├── AgendaPlanning.tsx
│   │   ├── AgendaReviews.tsx
│   │   ├── Aprovacoes.tsx
│   │   ├── Auth.tsx
│   │   ├── CreateDemand.tsx
│   │   ├── Dailys.tsx
│   │   ├── Dashboard.tsx
│   │   ├── NotFound.tsx
│   │   ├── Permissoes.tsx
│   │   ├── Planning.tsx
│   │   ├── Relatorios.tsx
│   │   └── Retrospectiva.tsx
│   ├── types/                  # Definições de tipos
│   │   └── demand.ts
│   ├── utils/                  # Funções utilitárias
│   │   └── demandCodeGenerator.ts
│   ├── App.tsx                 # Componente raiz
│   ├── main.tsx                # Entry point
│   ├── index.css               # Estilos globais
│   └── vite-env.d.ts           # Tipos Vite
├── supabase/                   # Configuração Supabase
│   ├── config.toml             # Configuração
│   └── migrations/             # Migrations SQL
│       └── *.sql               # Arquivos de migração
├── .env                        # Variáveis de ambiente
├── index.html                  # HTML raiz
├── package.json                # Dependências
├── tailwind.config.ts          # Config Tailwind
├── tsconfig.json               # Config TypeScript
├── vite.config.ts              # Config Vite
└── README.md                   # Documentação básica
```

### 3.2 Principais Módulos

#### Módulo de Autenticação
- **Arquivos**: `src/contexts/AuthContext.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/pages/Auth.tsx`
- **Função**: Gerenciar login, logout, sessão e permissões de usuários

#### Módulo de Demandas
- **Arquivos**: `src/components/demands/*`, `src/pages/CreateDemand.tsx`, `src/pages/demands/*`
- **Função**: CRUD de demandas, histórico, aprovações

#### Módulo de Aprovações
- **Arquivos**: `src/pages/Aprovacoes.tsx`, `src/components/demands/ApprovalDialog.tsx`
- **Função**: Fluxo de aprovação multinível

#### Módulo de Análise Técnica
- **Arquivos**: `src/pages/technical/*`
- **Função**: Pareceres técnicos, estimativas, faseamento

#### Módulo Kanban
- **Arquivos**: `src/components/kanban/*`, `src/pages/empresa/KanbanView.tsx`
- **Função**: Visualização e gestão de demandas em execução

#### Módulo de Relatórios
- **Arquivos**: `src/pages/Dashboard.tsx`, `src/pages/Relatorios.tsx`
- **Função**: Dashboards e análises

#### Módulo de Cerimônias
- **Arquivos**: `src/pages/AgendaPlanning.tsx`, `src/pages/AgendaReviews.tsx`, `src/pages/Dailys.tsx`, `src/pages/Retrospectiva.tsx`
- **Função**: Gestão de reuniões e cerimônias ágeis

---

## 4. Banco de Dados

### 4.1 Esquema Completo (PostgreSQL)

#### Tabela: `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Perfis de usuários com informações adicionais

#### Tabela: `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'admin', 'solicitante', 'gerente', 'comite', 'ti', 'tech_lead', 'dev'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Papéis/permissões de usuários

#### Tabela: `committee_members`
```sql
CREATE TABLE committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  empresa TEXT NOT NULL,
  papel TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Membros do comitê técnico

#### Tabela: `solicitantes`
```sql
CREATE TABLE solicitantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  empresa TEXT NOT NULL,
  papel TEXT,
  pode_aprovar BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Usuários solicitantes de demandas

#### Tabela: `demands`
```sql
CREATE TABLE demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  descricao TEXT NOT NULL,
  requisitos_funcionais TEXT,
  prioridade TEXT NOT NULL, -- 'baixa', 'media', 'alta', 'critica'
  status TEXT NOT NULL, -- 'Rascunho', 'Aguardando Aprovação Gerencial', ...
  demanda_regulatoria BOOLEAN DEFAULT false,
  data_limite_regulatoria TIMESTAMP WITH TIME ZONE,
  horas_estimadas NUMERIC,
  custo_estimado NUMERIC,
  observacoes TEXT,
  solicitante_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Demandas principais do sistema

#### Tabela: `demand_history`
```sql
CREATE TABLE demand_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'criou', 'aprovou', 'recusou', 'solicitou_insumos', ...
  status_anterior TEXT,
  status_novo TEXT,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Histórico de todas as ações em demandas

#### Tabela: `approval_levels`
```sql
CREATE TABLE approval_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id),
  nivel TEXT NOT NULL, -- 'gerente', 'comite', 'ti'
  status TEXT NOT NULL, -- 'pendente', 'aprovado', 'recusado', 'solicitado_insumos'
  aprovador_id UUID,
  aprovador_nome TEXT,
  comentario TEXT,
  data_acao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Controle de aprovações por nível

#### Tabela: `demand_phases`
```sql
CREATE TABLE demand_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id),
  numero_fase INTEGER NOT NULL,
  nome_fase TEXT NOT NULL,
  descricao TEXT,
  horas_estimadas NUMERIC,
  status TEXT DEFAULT 'planejada', -- 'planejada', 'em_andamento', 'concluida'
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Fases de projetos grandes

#### Tabela: `technical_reviews`
```sql
CREATE TABLE technical_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id),
  revisor_id UUID NOT NULL,
  revisor_nome TEXT NOT NULL,
  complexidade TEXT, -- 'baixa', 'media', 'alta'
  riscos TEXT,
  sugestoes TEXT,
  impacto TEXT,
  comentarios TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Pareceres técnicos de TI

#### Tabela: `demand_attachments`
```sql
CREATE TABLE demand_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Anexos de documentos e fluxogramas

#### Tabela: `planning_agendas`
```sql
CREATE TABLE planning_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  data_planning TIMESTAMP WITH TIME ZONE NOT NULL,
  convite_enviado BOOLEAN DEFAULT false,
  email_participantes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Agendamento de plannings

#### Tabela: `reviews_agendas`
```sql
CREATE TABLE reviews_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  data_review TIMESTAMP WITH TIME ZONE NOT NULL,
  demands_para_review UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Agendamento de reviews

#### Tabela: `dailys`
```sql
CREATE TABLE dailys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad TEXT NOT NULL,
  data_daily DATE NOT NULL,
  participantes TEXT[],
  impedimentos TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Registro de dailys

#### Tabela: `retrospectivas`
```sql
CREATE TABLE retrospectivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad TEXT NOT NULL,
  data_retrospectiva DATE NOT NULL,
  pontos_positivos TEXT,
  pontos_negativos TEXT,
  acoes_melhoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Propósito**: Registro de retrospectivas

### 4.2 Relacionamentos

```
profiles ──┐
           │
user_roles ──┤
             │
committee_members ──┤
                    ├──► Usuários (auth.users - gerenciado pelo Supabase)
solicitantes ───────┤
                    │
demands.solicitante_id ───┘

demands ──┬──► demand_history
          ├──► approval_levels
          ├──► demand_phases
          ├──► technical_reviews
          └──► demand_attachments
```

### 4.3 Índices Principais

```sql
-- Performance em queries frequentes
CREATE INDEX idx_demands_status ON demands(status);
CREATE INDEX idx_demands_empresa ON demands(empresa);
CREATE INDEX idx_demands_solicitante ON demands(solicitante_id);
CREATE INDEX idx_demand_history_demand ON demand_history(demand_id);
CREATE INDEX idx_approval_levels_demand ON approval_levels(demand_id);
```

---

## 5. Segurança

### 5.1 Autenticação

**Método**: JWT (JSON Web Tokens)

**Fluxo de Login**:
1. Usuário envia email e senha
2. Supabase valida credenciais
3. Retorna JWT token + refresh token
4. Frontend armazena tokens no localStorage
5. Todas requests incluem JWT no header Authorization

**Expiração**: JWT expira em 1 hora, refresh token em 30 dias

### 5.2 Row Level Security (RLS)

**Conceito**: Políticas de segurança no nível do banco de dados que filtram automaticamente os dados baseado no usuário autenticado.

**Exemplo de Política RLS**:
```sql
-- Usuários só veem suas próprias demandas ou de sua empresa
CREATE POLICY "Users can view own demands"
ON demands FOR SELECT
USING (
  solicitante_id = auth.uid() OR
  empresa IN (
    SELECT empresa FROM solicitantes 
    WHERE user_id = auth.uid() AND ativo = true
  )
);
```

### 5.3 Controle de Acesso (RBAC)

**Papéis Definidos**:
- `admin`: Acesso total
- `solicitante`: Cria e visualiza suas demandas
- `gerente`: Aprova demandas da sua área
- `comite`: Aprova demandas no comitê
- `ti`: Gerencia análise técnica
- `tech_lead`: Gerencia execução
- `dev`: Executa demandas

**Implementação**:
```typescript
// Hook personalizado para verificar permissões
const { hasRole } = useUserPermissions();

if (hasRole('admin') || hasRole('comite')) {
  // Mostra funcionalidade
}
```

### 5.4 Validações

**Frontend (React Hook Form + Zod)**:
```typescript
const schema = z.object({
  empresa: z.string().min(1, "Empresa é obrigatória"),
  descricao: z.string().min(10, "Mínimo 10 caracteres"),
  prioridade: z.enum(['baixa', 'media', 'alta', 'critica'])
});
```

**Backend (Database Constraints)**:
```sql
ALTER TABLE demands
ADD CONSTRAINT check_prioridade 
CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica'));
```

### 5.5 Proteção Contra Ataques

**SQL Injection**: Prevenido automaticamente pelo Supabase (prepared statements)

**XSS**: React sanitiza automaticamente outputs

**CSRF**: Tokens JWT com expiraç ão curta

**Brute Force**: Rate limiting no Supabase

---

## 6. APIs e Integrações

### 6.1 API REST (Supabase)

**Base URL**: `https://[project-ref].supabase.co/rest/v1/`

**Autenticação**: Bearer token no header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exemplos de Endpoints**:

```typescript
// GET - Listar demandas
GET /demands?status=eq.Backlog&order=created_at.desc

// POST - Criar demanda
POST /demands
Body: {
  "empresa": "EMP01",
  "squad": "Squad Alpha",
  "descricao": "Nova funcionalidade",
  "prioridade": "alta",
  "status": "Rascunho"
}

// PATCH - Atualizar demanda
PATCH /demands?id=eq.123e4567-e89b-12d3-a456-426614174000
Body: {
  "status": "Em Desenvolvimento"
}

// DELETE - Deletar demanda
DELETE /demands?id=eq.123e4567-e89b-12d3-a456-426614174000
```

### 6.2 Realtime Subscriptions

**WebSocket para atualizações em tempo real**:

```typescript
// Escutar mudanças em demandas
const subscription = supabase
  .channel('demands-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'demands'
  }, (payload) => {
    console.log('Mudança detectada:', payload);
    // Atualizar UI
  })
  .subscribe();
```

### 6.3 Storage API

**Upload de arquivos**:
```typescript
const { data, error } = await supabase.storage
  .from('demand-attachments')
  .upload(`${demandId}/${fileName}`, file);
```

**Download de arquivos**:
```typescript
const { data } = supabase.storage
  .from('demand-attachments')
  .getPublicUrl(`${demandId}/${fileName}`);
```

---

## 7. Fluxos Principais

### 7.1 Fluxo de Criação de Demanda

```
1. Usuário clica em "Nova Demanda"
2. Abre DemandDialog com formulário
3. Preenche campos obrigatórios
4. Faz upload de anexos (opcional)
5. Clica em "Salvar"
6. Sistema valida dados (frontend)
7. Gera código único (EMP-YYYY-NNNN)
8. Insere no banco via API
9. Cria registro no demand_history
10. Envia notificação para gerente
11. Fecha dialog e atualiza lista
12. Toast de sucesso
```

### 7.2 Fluxo de Aprovação

```
1. Gerente acessa página "Aprovações"
2. Sistema filtra demandas pendentes do seu nível
3. Gerente clica em demanda para ver detalhes
4. Clica em "Aprovar", "Recusar" ou "Solicitar Insumos"
5. Abre ApprovalDialog
6. Preenche comentário
7. Confirma ação
8. Sistema atualiza approval_levels
9. Se aprovado, passa para próximo nível
10. Atualiza status da demanda
11. Registra em demand_history
12. Envia notificação para próximo aprovador
13. Toast de confirmação
```

### 7.3 Fluxo de Execução (Kanban)

```
1. Tech Lead acessa Kanban View
2. Seleciona empresa
3. Visualiza colunas por status
4. Arrasta card de "Backlog" para "Em Desenvolvimento"
5. Sistema detecta mudança via @dnd-kit
6. Atualiza status no banco
7. Registra em demand_history
8. Notifica solicitante
9. Card move visualmente para nova coluna
10. Atualiza contadores
```

---

## 8. Componentes Principais

### 8.1 DemandDialog
**Caminho**: `src/components/demands/DemandDialog.tsx`

**Propósito**: Modal para criar/editar demandas

**Props**:
```typescript
interface DemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand?: Demand; // opcional, para edição
  onSuccess: () => void;
}
```

**Principais Features**:
- Formulário completo com validação
- Upload de anexos
- Cálculo automático de custos
- Diferencia criação de edição

### 8.2 ApprovalDialog
**Caminho**: `src/components/demands/ApprovalDialog.tsx`

**Propósito**: Modal para aprovar/recusar demandas

**Props**:
```typescript
interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand: Demand;
  action: 'aprovar' | 'recusar' | 'solicitar_insumos';
  onSuccess: () => void;
}
```

**Lógica de Aprovação**:
- Identifica nível do usuário
- Atualiza approval_levels
- Muda status da demanda conforme nível
- Registra histórico

### 8.3 KanbanBoard
**Caminho**: `src/pages/empresa/KanbanView.tsx`

**Propósito**: Visualização em Kanban

**Features**:
- Drag and drop (@dnd-kit)
- Filtros por empresa e squad
- Atualização em tempo real
- Contadores por coluna

### 8.4 AuthContext
**Caminho**: `src/contexts/AuthContext.tsx`

**Propósito**: Gerenciar autenticação global

**Fornece**:
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

---

## 9. Otimizações e Performance

### 9.1 Code Splitting
React Router faz lazy loading de páginas:
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### 9.2 Memoization
Componentes pesados usam React.memo:
```typescript
export const KanbanCard = React.memo(({ demand }) => {
  // ...
});
```

### 9.3 Debouncing
Buscas usam debounce:
```typescript
const debouncedSearch = useMemo(
  () => debounce((value) => setSearch(value), 300),
  []
);
```

### 9.4 Paginação
Listas grandes usam paginação:
```typescript
const { data } = await supabase
  .from('demands')
  .select('*')
  .range(0, 49); // Primeiros 50
```

### 9.5 Índices no Banco
Queries frequentes têm índices para performance.

---

## 10. Deploy e Configuração

### 10.1 Variáveis de Ambiente

**Arquivo**: `.env`
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=[project-id]
```

### 10.2 Build para Produção

```bash
# Instalar dependências
npm install

# Build otimizado
npm run build

# Output em /dist
```

### 10.3 Deploy Vercel

```bash
# Via CLI
vercel --prod

# Ou via dashboard
# Conectar repositório GitHub
# Build automaticamente a cada push
```

### 10.4 Configuração Supabase

**Database**:
- Executar migrations em ordem
- Configurar RLS policies
- Criar índices

**Auth**:
- Habilitar email/password
- Configurar redirect URLs
- Auto-confirm emails (dev)

**Storage**:
- Criar bucket 'demand-attachments'
- Configurar políticas de acesso

---

## 11. Testes

### 11.1 Testes Manuais Recomendados

**Fluxo Completo**:
1. Criar usuário
2. Atribuir papel
3. Criar demanda
4. Aprovar em 3 níveis
5. Estimar e fasear
6. Mover no Kanban
7. Concluir
8. Visualizar relatórios

**Casos de Borda**:
- Demanda sem empresa
- Upload de arquivo muito grande
- Aprovação sem comentário
- Drag and drop para coluna inválida

### 11.2 Checklist de QA

- [ ] Login/Logout funcionando
- [ ] Criação de demanda com todos campos
- [ ] Upload de anexos
- [ ] Aprovação nos 3 níveis
- [ ] Recusa com comentário
- [ ] Solicitação de insumos
- [ ] Parecer técnico
- [ ] Estimativa e faseamento
- [ ] Kanban drag and drop
- [ ] Notificações aparecendo
- [ ] Histórico completo
- [ ] Relatórios com dados corretos
- [ ] Dashboard com métricas
- [ ] Responsividade mobile
- [ ] Performance (< 3s load)

---

## 12. Manutenção

### 12.1 Logs

**Frontend**: Console do navegador

**Backend**: Dashboard Supabase
- Database Logs
- API Logs
- Auth Logs

### 12.2 Backups

**Automático**: Supabase faz backup diário (plano Pro)

**Manual**:
```bash
# Export SQL
pg_dump -h [host] -U postgres -d [database] > backup.sql
```

### 12.3 Atualizações

**Dependências**:
```bash
npm outdated
npm update
```

**Migrations**:
- Criar nova migration SQL
- Testar em staging
- Aplicar em produção

---

## 13. Troubleshooting

### 13.1 Problemas Comuns

**Erro: "User not authenticated"**
- Verificar token no localStorage
- Checar se token expirou
- Fazer login novamente

**Erro: "Permission denied"**
- Verificar RLS policies
- Checar papel do usuário
- Validar user_id

**Erro: "Network Error"**
- Verificar conectividade
- Checar URL do Supabase
- Validar CORS

**Demandas não aparecem**
- Verificar filtros aplicados
- Checar RLS policies
- Validar query SQL

### 13.2 Debug

**Frontend**:
- React DevTools
- Network tab (F12)
- Console.log estratégicos

**Backend**:
- Supabase Dashboard > Logs
- SQL Editor para queries diretas
- API Inspector

---

## 14. Glossário Técnico

- **SPA**: Single Page Application
- **JWT**: JSON Web Token (autenticação)
- **RLS**: Row Level Security (segurança no DB)
- **RBAC**: Role-Based Access Control
- **API REST**: Interface de programação via HTTP
- **WebSocket**: Conexão bidirecional para realtime
- **PostgreSQL**: Banco de dados relacional open-source
- **TypeScript**: JavaScript com tipagem estática
- **React**: Biblioteca para interfaces de usuário
- **Vite**: Build tool moderno
- **Tailwind**: Framework CSS utility-first
- **shadcn/ui**: Biblioteca de componentes React

---

**Documento gerado em**: 06/10/2025  
**Versão do Sistema**: 1.0.0  
**Autor**: [PREENCHER]
