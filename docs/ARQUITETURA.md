# Arquitetura do Sistema
## Sistema de Gestão de Demandas de TI

---

## 1. Visão Geral da Arquitetura

### 1.1 Padrão Arquitetural

O sistema utiliza a arquitetura **Cliente-Servidor** com modelo **SPA (Single Page Application)**.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Cliente   │◄───────►│   Servidor  │◄───────►│  Banco de   │
│  (Browser)  │  HTTPS  │  (Supabase) │   SQL   │    Dados    │
│   React     │         │  PostgREST  │         │ PostgreSQL  │
└─────────────┘         └─────────────┘         └─────────────┘
```

### 1.2 Camadas da Aplicação

**Camada de Apresentação (Frontend)**
- Tecnologia: React + TypeScript
- Responsabilidade: Interface do usuário, validações, navegação

**Camada de Aplicação (API)**
- Tecnologia: Supabase PostgREST
- Responsabilidade: API REST automática, autenticação, autorização

**Camada de Domínio (Business Logic)**
- Tecnologia: PostgreSQL Functions & Triggers
- Responsabilidade: Regras de negócio, cálculos, automações

**Camada de Persistência (Database)**
- Tecnologia: PostgreSQL
- Responsabilidade: Armazenamento de dados, integridade

---

## 2. Arquitetura Frontend (React)

### 2.1 Estrutura de Componentes

```
App (Raiz)
│
├── AuthProvider (Contexto Global)
│   └── user, loading, signIn, signOut
│
├── Router (React Router)
│   ├── Public Routes
│   │   └── /auth (Login)
│   │
│   └── Protected Routes (requer autenticação)
│       ├── Layout
│       │   ├── Header
│       │   │   ├── Logo
│       │   │   ├── NotificationBell
│       │   │   └── UserMenu
│       │   │
│       │   ├── Sidebar
│       │   │   └── Navigation Links
│       │   │
│       │   └── Content Area
│       │       └── <Outlet> (páginas)
│       │
│       └── Pages
│           ├── Dashboard
│           ├── CreateDemand
│           ├── Aprovacoes
│           ├── Kanban
│           ├── Relatorios
│           └── ...
│
└── Toaster (Notificações Toast)
```

### 2.2 Padrão de Componentes

**Componentes de Apresentação (Presentational)**
- Recebem dados via props
- Não fazem chamadas API
- Focados em UI
- Exemplos: `Button`, `Card`, `Input`

**Componentes Containers (Smart)**
- Gerenciam estado
- Fazem chamadas API
- Contêm lógica de negócio
- Exemplos: `Aprovacoes`, `Dashboard`, `KanbanView`

**Componentes de Layout**
- Estruturam páginas
- Exemplos: `Layout`, `Header`, `Sidebar`

### 2.3 Gerenciamento de Estado

**Estado Local**
- `useState` para estado de componente
- `useReducer` para estado complexo

**Estado Global**
- Context API (`AuthContext`) para autenticação
- Sem Redux (simplicidade)

**Estado Servidor**
- React Query (opcional, não usado atualmente)
- Fetch direto do Supabase

### 2.4 Roteamento

```typescript
<Routes>
  {/* Públicas */}
  <Route path="/auth" element={<Auth />} />
  
  {/* Protegidas */}
  <Route element={<ProtectedRoute />}>
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/criar-demanda" element={<CreateDemand />} />
      <Route path="/aprovacoes" element={<Aprovacoes />} />
      {/* ... outras rotas */}
    </Route>
  </Route>
  
  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

**ProtectedRoute**: HOC que verifica autenticação antes de renderizar

### 2.5 Hooks Personalizados

**useUserPermissions**
- Verifica papéis do usuário
- Retorna: `hasRole()`, `isAdmin()`, `canApprove()`, etc.

**useDemandHistory**
- Busca histórico de demandas
- Atualiza em tempo real

**useToast**
- Exibe notificações toast
- Tipos: success, error, info, warning

### 2.6 Comunicação com Backend

```typescript
// Importar cliente
import { supabase } from '@/integrations/supabase/client';

// SELECT
const { data, error } = await supabase
  .from('demands')
  .select('*')
  .eq('status', 'Backlog');

// INSERT
const { data, error } = await supabase
  .from('demands')
  .insert({ 
    empresa: 'EMP01',
    descricao: 'Nova demanda'
  });

// UPDATE
const { data, error } = await supabase
  .from('demands')
  .update({ status: 'Em Desenvolvimento' })
  .eq('id', demandId);

// DELETE
const { data, error } = await supabase
  .from('demands')
  .delete()
  .eq('id', demandId);
```

---

## 3. Arquitetura Backend (Supabase)

### 3.1 Camadas do Supabase

```
┌─────────────────────────────────────────────────┐
│              Supabase Backend                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │   API Gateway (Kong)                   │    │
│  │   - Rate limiting                      │    │
│  │   - Authentication                     │    │
│  │   - Request validation                 │    │
│  └─────────────────┬──────────────────────┘    │
│                    │                            │
│  ┌─────────────────┴──────────────────────┐    │
│  │   PostgREST (API REST)                 │    │
│  │   - Automatic endpoints                │    │
│  │   - JWT validation                     │    │
│  │   - Query optimization                 │    │
│  └─────────────────┬──────────────────────┘    │
│                    │                            │
│  ┌─────────────────┴──────────────────────┐    │
│  │   GoTrue (Auth)                        │    │
│  │   - User management                    │    │
│  │   - JWT generation                     │    │
│  │   - Password hashing                   │    │
│  └─────────────────┬──────────────────────┘    │
│                    │                            │
│  ┌─────────────────┴──────────────────────┐    │
│  │   Realtime Engine                      │    │
│  │   - WebSocket server                   │    │
│  │   - Postgres replication               │    │
│  │   - Pub/Sub                            │    │
│  └─────────────────┬──────────────────────┘    │
│                    │                            │
│  ┌─────────────────┴──────────────────────┐    │
│  │   PostgreSQL Database                  │    │
│  │   - Tables & Schemas                   │    │
│  │   - RLS Policies                       │    │
│  │   - Functions & Triggers               │    │
│  │   - Indexes                            │    │
│  └────────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 3.2 PostgREST (API Layer)

**Funcionamento**:
1. Cliente faz request HTTP
2. Kong valida JWT token
3. PostgREST traduz para SQL
4. PostgreSQL executa com RLS
5. Resultado retorna como JSON

**Operadores Suportados**:
- `eq` (igual): `?id=eq.123`
- `neq` (diferente): `?status=neq.Concluída`
- `gt` / `gte` (maior que): `?horas_estimadas=gt.10`
- `lt` / `lte` (menor que): `?custo_estimado=lt.5000`
- `like` / `ilike` (como): `?descricao=ilike.*sistema*`
- `in` (dentro de): `?status=in.(Backlog,Em Desenvolvimento)`
- `is` (é nulo): `?aprovador_id=is.null`

**Joins**:
```typescript
const { data } = await supabase
  .from('demands')
  .select(`
    *,
    demand_history(*),
    approval_levels(*)
  `)
  .eq('id', demandId);
```

### 3.3 Row Level Security (RLS)

**Conceito**: Políticas de segurança que filtram dados automaticamente baseado no usuário autenticado.

**Função Disponível**:
- `auth.uid()`: Retorna ID do usuário logado

**Exemplo de Política**:
```sql
-- Usuários só veem demandas da sua empresa
CREATE POLICY "Users view own company demands"
ON demands FOR SELECT
USING (
  empresa IN (
    SELECT empresa 
    FROM solicitantes 
    WHERE user_id = auth.uid() AND ativo = true
  )
);
```

**Políticas do Sistema**:

1. **demands**: Usuário vê demandas:
   - Que ele criou OU
   - Da sua empresa (se solicitante) OU
   - Todas (se admin/comitê/ti)

2. **approval_levels**: Usuário vê aprovações:
   - De demandas que ele tem acesso

3. **demand_history**: Usuário vê histórico:
   - De demandas que ele tem acesso

4. **user_roles**: Apenas admin insere/atualiza

5. **committee_members**: Apenas admin gerencia

### 3.4 Database Functions

**Funções SQL Customizadas**:

```sql
-- Verificar se usuário é do comitê
CREATE OR REPLACE FUNCTION is_committee_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM committee_members
    WHERE user_id = user_uuid AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar papel do usuário
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gerar código de demanda
CREATE OR REPLACE FUNCTION generate_demand_code(empresa_code TEXT)
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INT;
  new_code TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(codigo FROM '[0-9]+$') AS INT)
  ), 0) + 1
  INTO next_number
  FROM demands
  WHERE codigo LIKE empresa_code || '-' || current_year || '-%';
  
  new_code := empresa_code || '-' || current_year || '-' || 
              LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

### 3.5 Triggers

**Automações no Banco**:

```sql
-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demands_updated_at
  BEFORE UPDATE ON demands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar histórico automaticamente
CREATE OR REPLACE FUNCTION create_demand_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    INSERT INTO demand_history (
      demand_id,
      user_id,
      user_name,
      action,
      status_anterior,
      status_novo
    ) VALUES (
      NEW.id,
      auth.uid(),
      'Sistema',
      'mudou_status',
      OLD.status,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_demand_history
  AFTER UPDATE ON demands
  FOR EACH ROW
  EXECUTE FUNCTION create_demand_history();
```

### 3.6 Realtime Subscriptions

**WebSocket para Atualizações em Tempo Real**:

```typescript
// Escutar mudanças em demandas
const channel = supabase
  .channel('custom-channel')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'demands'
    },
    (payload) => {
      console.log('Mudança detectada:', payload);
      // Atualizar estado local
      setDemands(prevDemands => {
        if (payload.eventType === 'INSERT') {
          return [...prevDemands, payload.new];
        } else if (payload.eventType === 'UPDATE') {
          return prevDemands.map(d =>
            d.id === payload.new.id ? payload.new : d
          );
        } else if (payload.eventType === 'DELETE') {
          return prevDemands.filter(d => d.id !== payload.old.id);
        }
        return prevDemands;
      });
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

---

## 4. Modelo de Segurança

### 4.1 Autenticação

**Fluxo de Login**:
```
1. Usuário envia email + senha
   └─► POST /auth/v1/token
   
2. Supabase valida credenciais
   └─► Verifica hash bcrypt
   
3. Se válido, gera JWT
   └─► { access_token, refresh_token }
   
4. Cliente armazena tokens
   └─► localStorage.setItem('supabase.auth.token', ...)
   
5. Todas requests incluem JWT
   └─► Header: Authorization: Bearer <token>
```

**Estrutura do JWT**:
```json
{
  "sub": "user-uuid",
  "email": "usuario@empresa.com",
  "role": "authenticated",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Expiração**:
- Access token: 1 hora
- Refresh token: 30 dias
- Auto-refresh: Cliente renova automaticamente

### 4.2 Autorização (RBAC)

**Papéis Definidos**:
```typescript
type Role = 
  | 'admin'
  | 'solicitante'
  | 'gerente'
  | 'comite'
  | 'ti'
  | 'tech_lead'
  | 'dev';
```

**Matriz de Permissões**:

| Funcionalidade | Solicitante | Gerente | Comitê | TI | Admin |
|----------------|-------------|---------|--------|-----|-------|
| Criar demanda | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver próprias demandas | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver demandas da empresa | ❌ | ✅ | ✅ | ✅ | ✅ |
| Ver todas demandas | ❌ | ❌ | ✅ | ✅ | ✅ |
| Aprovar (Gerente) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Aprovar (Comitê) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Aprovar (TI) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Parecer técnico | ❌ | ❌ | ❌ | ✅ | ✅ |
| Estimar/Fasear | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gerenciar Kanban | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ver relatórios | ❌ | ✅ | ✅ | ✅ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ❌ | ❌ | ✅ |

**Implementação no Frontend**:
```typescript
const { hasRole } = useUserPermissions();

if (hasRole('admin') || hasRole('ti')) {
  return <AdminFeature />;
}
```

**Implementação no Backend (RLS)**:
```sql
CREATE POLICY "Only admin can manage users"
ON user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

### 4.3 Proteção de Dados Sensíveis

**Informações Protegidas**:
- Senhas: Hashed com bcrypt (nunca armazenadas em texto)
- E-mails: Visíveis apenas para admin e próprio usuário
- Dados financeiros: Criptografados em repouso

**HTTPS Obrigatório**:
- Toda comunicação usa TLS 1.3
- Certificados SSL via Vercel/Supabase

**CORS Configurado**:
```typescript
// Apenas domínios autorizados
const allowedOrigins = [
  'https://seu-dominio.com',
  'https://www.seu-dominio.com'
];
```

---

## 5. Padrões de Projeto Utilizados

### 5.1 Frontend

**Component Pattern**
- Separação entre apresentação e lógica
- Reutilização máxima

**Hooks Pattern**
- Encapsular lógica complexa
- Compartilhar comportamento entre componentes

**Context Provider Pattern**
- Estado global sem prop drilling
- AuthContext para autenticação

**Higher-Order Component (HOC)**
- ProtectedRoute: adiciona autenticação a rotas

**Compound Components**
- Componentes que trabalham juntos (ex: Dialog)

### 5.2 Backend

**Repository Pattern**
- Supabase abstrai acesso a dados
- Não precisa escrever SQL diretamente

**Active Record**
- Tabelas mapeadas para entidades
- CRUD automático via PostgREST

**Observer Pattern**
- Realtime subscriptions
- Escutar mudanças no banco

**Strategy Pattern**
- RLS policies definem estratégias de acesso

---

## 6. Escalabilidade

### 6.1 Estratégias de Escalabilidade

**Horizontal (Adicionar mais servidores)**:
- Vercel escala automaticamente (serverless)
- Supabase distribui carga entre replicas

**Vertical (Aumentar recursos)**:
- Upgrade de plano no Supabase
- Mais CPU, RAM, Storage

**Cache**:
- CDN da Vercel para assets estáticos
- Cache de queries no PostgreSQL

### 6.2 Limites Atuais

**Supabase Free Tier**:
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth/mês
- 50,000 monthly active users (MAU)

**Supabase Pro** (recomendado para 130 usuários):
- 8 GB database
- 100 GB file storage
- 250 GB bandwidth/mês
- Unlimited MAU
- 7 days PITR (Point-in-Time Recovery)

### 6.3 Otimizações Implementadas

**Frontend**:
- Code splitting (lazy loading de rotas)
- Tree shaking (remover código não usado)
- Minificação de JS/CSS
- Compressão de imagens

**Backend**:
- Índices nas colunas mais consultadas
- Queries otimizadas (select apenas campos necessários)
- Paginação em listas grandes
- Connection pooling

---

## 7. Monitoramento e Logs

### 7.1 Logs Disponíveis

**Supabase Dashboard**:
- **Database Logs**: Queries lentas, erros SQL
- **API Logs**: Requests, responses, erros
- **Auth Logs**: Logins, signups, falhas

**Vercel Dashboard**:
- **Deployment Logs**: Build, deploy
- **Runtime Logs**: Erros no cliente
- **Analytics**: Pageviews, performance

### 7.2 Métricas Importantes

**Performance**:
- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3s

**Disponibilidade**:
- Uptime: 99.9% (SLA Vercel + Supabase)
- Latência API: < 100ms (mesma região)

**Uso**:
- MAU (Monthly Active Users)
- Demandas criadas/mês
- API calls/mês

---

## 8. Considerações de Segurança

### 8.1 OWASP Top 10

**A01: Broken Access Control**
- ✅ Mitigado: RLS Policies + RBAC

**A02: Cryptographic Failures**
- ✅ Mitigado: HTTPS, bcrypt, dados em repouso criptografados

**A03: Injection**
- ✅ Mitigado: PostgREST usa prepared statements

**A04: Insecure Design**
- ✅ Mitigado: Aprovações multinível, validações

**A05: Security Misconfiguration**
- ⚠️ Atenção: Revisar RLS antes de produção

**A06: Vulnerable Components**
- ✅ Mitigado: Dependências atualizadas

**A07: Identification and Authentication Failures**
- ✅ Mitigado: JWT, expiração de sessão

**A08: Software and Data Integrity Failures**
- ✅ Mitigado: Backups automáticos, PITR

**A09: Security Logging & Monitoring Failures**
- ✅ Mitigado: Logs completos no Supabase

**A10: Server-Side Request Forgery (SSRF)**
- ✅ Não aplicável: Sem proxy/fetch de URLs externas

---

## 9. Considerações Finais

### 9.1 Vantagens da Arquitetura Escolhida

✅ **Desenvolvimento Rápido**: Supabase elimina boilerplate de backend  
✅ **Escalabilidade**: Infraestrutura serverless escala automaticamente  
✅ **Segurança**: RLS garante proteção no nível do banco  
✅ **Manutenibilidade**: Código organizado, componentes reutilizáveis  
✅ **Performance**: CDN global, otimizações automáticas  

### 9.2 Trade-offs

⚠️ **Vendor Lock-in**: Dependência de Supabase/Vercel  
⚠️ **Customização Limitada**: Menos controle que backend próprio  
⚠️ **Custo Crescente**: À medida que escala, custos aumentam  

### 9.3 Evoluções Futuras

🔮 **Curto Prazo**:
- Testes automatizados (Jest, React Testing Library)
- CI/CD pipeline (GitHub Actions)
- Monitoring avançado (Sentry)

🔮 **Médio Prazo**:
- Mobile app (React Native)
- Integrações (Slack, Teams, Jira)
- Dashboards mais avançados (BI)

🔮 **Longo Prazo**:
- Machine Learning (previsão de prazos)
- Internacionalização (i18n)
- Microservices (se necessário)

---

**Documento gerado em**: 06/10/2025  
**Versão**: 1.0  
**Autor**: [PREENCHER]
