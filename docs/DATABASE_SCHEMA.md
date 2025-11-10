# Schema do Banco de Dados
## Sistema de Gestão de Demandas de TI

---

## 1. Visão Geral

**Banco de Dados**: PostgreSQL 14+  
**Total de Tabelas**: 15 tabelas principais  
**Relacionamentos**: Múltiplas foreign keys e constraints  
**Segurança**: Row Level Security (RLS) em todas as tabelas  

---

## 2. Tabelas Detalhadas

### 2.1 profiles
**Propósito**: Armazenar informações adicionais de perfil dos usuários

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são visíveis por todos autenticados"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);
```

**Colunas**:
- `id`: Identificador único do perfil
- `user_id`: Referência ao usuário (auth.users)
- `full_name`: Nome completo do usuário
- `avatar_url`: URL do avatar/foto
- `created_at`: Data de criação

---

### 2.2 user_roles
**Propósito**: Controlar papéis/permissões dos usuários

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'admin', 'solicitante', 'gerente', 'comite', 'ti', 'tech_lead', 'dev'
  )),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Índices
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprios papéis"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Apenas admin pode gerenciar papéis"
ON user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

**Colunas**:
- `id`: Identificador único
- `user_id`: Referência ao usuário
- `role`: Papel do usuário (enum)
- `created_at`: Data de atribuição

**Valores de role**:
- `admin`: Administrador do sistema
- `solicitante`: Cria demandas
- `gerente`: Aprova demandas do seu departamento
- `comite`: Membro do comitê técnico
- `ti`: Equipe de TI
- `tech_lead`: Líder técnico
- `dev`: Desenvolvedor

---

### 2.3 committee_members
**Propósito**: Gerenciar membros do comitê técnico

```sql
CREATE TABLE public.committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  empresa TEXT NOT NULL,
  papel TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_committee_members_user_id ON committee_members(user_id);
CREATE INDEX idx_committee_members_ativo ON committee_members(ativo);

-- RLS
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver membros do comitê"
ON committee_members FOR SELECT
USING (true);

CREATE POLICY "Apenas admin pode gerenciar comitê"
ON committee_members FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

**Colunas**:
- `id`: Identificador único
- `user_id`: Referência ao usuário
- `nome`: Nome do membro
- `empresa`: Empresa do membro
- `papel`: Papel no comitê (ex: "Diretor de TI")
- `ativo`: Se está ativo no comitê
- `created_at`: Data de entrada

---

### 2.4 solicitantes
**Propósito**: Gerenciar usuários que podem solicitar demandas

```sql
CREATE TABLE public.solicitantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  empresa TEXT NOT NULL,
  papel TEXT,
  pode_aprovar BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_solicitantes_user_id ON solicitantes(user_id);
CREATE INDEX idx_solicitantes_empresa ON solicitantes(empresa);
CREATE INDEX idx_solicitantes_ativo ON solicitantes(ativo);

-- RLS
ALTER TABLE solicitantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver solicitantes"
ON solicitantes FOR SELECT
USING (true);

CREATE POLICY "Apenas admin pode gerenciar solicitantes"
ON solicitantes FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

**Colunas**:
- `id`: Identificador único
- `user_id`: Referência ao usuário
- `nome`: Nome do solicitante
- `empresa`: Empresa do solicitante
- `papel`: Cargo/papel na empresa
- `pode_aprovar`: Se pode aprovar como gerente
- `ativo`: Se está ativo
- `created_at`: Data de cadastro

---

### 2.5 demands
**Propósito**: Tabela principal de demandas

```sql
CREATE TABLE public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  descricao TEXT NOT NULL,
  requisitos_funcionais TEXT,
  prioridade TEXT NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  status TEXT NOT NULL DEFAULT 'Rascunho',
  demanda_regulatoria BOOLEAN NOT NULL DEFAULT false,
  data_limite_regulatoria TIMESTAMP WITH TIME ZONE,
  horas_estimadas NUMERIC,
  custo_estimado NUMERIC,
  observacoes TEXT,
  solicitante_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_demands_codigo ON demands(codigo);
CREATE INDEX idx_demands_empresa ON demands(empresa);
CREATE INDEX idx_demands_squad ON demands(squad);
CREATE INDEX idx_demands_status ON demands(status);
CREATE INDEX idx_demands_prioridade ON demands(prioridade);
CREATE INDEX idx_demands_solicitante_id ON demands(solicitante_id);
CREATE INDEX idx_demands_created_at ON demands(created_at DESC);

-- RLS
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem demandas que têm acesso"
ON demands FOR SELECT
USING (
  solicitante_id = auth.uid() OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'comite') OR
  has_role(auth.uid(), 'ti') OR
  has_role(auth.uid(), 'tech_lead') OR
  empresa IN (
    SELECT empresa FROM solicitantes 
    WHERE user_id = auth.uid() AND ativo = true
  )
);

CREATE POLICY "Solicitantes podem criar demandas"
ON demands FOR INSERT
WITH CHECK (
  solicitante_id = auth.uid()
);

CREATE POLICY "Criador e TI podem atualizar demandas"
ON demands FOR UPDATE
USING (
  solicitante_id = auth.uid() OR
  has_role(auth.uid(), 'ti') OR
  has_role(auth.uid(), 'tech_lead') OR
  has_role(auth.uid(), 'admin')
);
```

**Colunas**:
- `id`: Identificador único UUID
- `codigo`: Código da demanda (ex: EMP01-2025-0001)
- `empresa`: Código da empresa solicitante
- `squad`: Nome do squad responsável
- `descricao`: Descrição da demanda
- `requisitos_funcionais`: Requisitos detalhados
- `prioridade`: Nível de prioridade (enum)
- `status`: Status atual da demanda
- `demanda_regulatoria`: Se é demanda regulatória
- `data_limite_regulatoria`: Prazo limite (se regulatória)
- `horas_estimadas`: Horas estimadas para desenvolvimento
- `custo_estimado`: Custo estimado em reais
- `observacoes`: Observações adicionais
- `solicitante_id`: ID do usuário solicitante
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

**Valores de status**:
- `Rascunho`
- `Aguardando Aprovação Gerencial`
- `Aguardando Comitê`
- `Aguardando TI`
- `Aprovada`
- `Recusada`
- `Backlog`
- `Em Análise Técnica`
- `Em Desenvolvimento`
- `Em Homologação`
- `Aguardando Insumos`
- `Aguardando Validação`
- `Stand By`
- `Concluída`
- `Arquivada`

**Valores de prioridade**:
- `baixa`: Pode esperar
- `media`: Importante mas não urgente
- `alta`: Urgente
- `critica`: Bloqueador, máxima urgência

---

### 2.6 demand_history
**Propósito**: Histórico completo de todas ações em demandas

```sql
CREATE TABLE public.demand_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_demand_history_demand_id ON demand_history(demand_id);
CREATE INDEX idx_demand_history_created_at ON demand_history(created_at DESC);

-- RLS
ALTER TABLE demand_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem histórico de demandas que têm acesso"
ON demand_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM demands
    WHERE demands.id = demand_history.demand_id
    AND (
      demands.solicitante_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'comite') OR
      has_role(auth.uid(), 'ti')
    )
  )
);

CREATE POLICY "Sistema pode criar histórico"
ON demand_history FOR INSERT
WITH CHECK (true);
```

**Colunas**:
- `id`: Identificador único
- `demand_id`: Referência à demanda
- `user_id`: ID do usuário que fez a ação
- `user_name`: Nome do usuário (desnormalizado para histórico)
- `action`: Tipo de ação realizada
- `status_anterior`: Status antes da ação
- `status_novo`: Status após a ação
- `comentario`: Comentário/observação da ação
- `created_at`: Data/hora da ação

**Valores de action**:
- `criou`: Criou a demanda
- `aprovou`: Aprovou a demanda
- `recusou`: Recusou a demanda
- `solicitou_insumos`: Solicitou mais informações
- `complementou_insumos`: Complementou informações
- `mudou_status`: Mudou status
- `atualizou`: Atualizou campos
- `adicionou_parecer`: Adicionou parecer técnico
- `estimou`: Adicionou estimativa
- `faseou`: Criou faseamento
- `comentou`: Adicionou comentário
- `validou`: Validou entrega

---

### 2.7 approval_levels
**Propósito**: Controlar aprovações por nível (gerente, comitê, TI)

```sql
CREATE TABLE public.approval_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  nivel TEXT NOT NULL CHECK (nivel IN ('gerente', 'comite', 'ti')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'aprovado', 'recusado', 'solicitado_insumos'
  )),
  aprovador_id UUID,
  aprovador_nome TEXT,
  comentario TEXT,
  data_acao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(demand_id, nivel)
);

-- Índices
CREATE INDEX idx_approval_levels_demand_id ON approval_levels(demand_id);
CREATE INDEX idx_approval_levels_nivel ON approval_levels(nivel);
CREATE INDEX idx_approval_levels_status ON approval_levels(status);

-- RLS
ALTER TABLE approval_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem aprovações de demandas que têm acesso"
ON approval_levels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM demands
    WHERE demands.id = approval_levels.demand_id
    AND (
      demands.solicitante_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'comite') OR
      has_role(auth.uid(), 'gerente') OR
      has_role(auth.uid(), 'ti')
    )
  )
);

CREATE POLICY "Sistema pode gerenciar aprovações"
ON approval_levels FOR ALL
USING (true)
WITH CHECK (true);
```

**Colunas**:
- `id`: Identificador único
- `demand_id`: Referência à demanda
- `nivel`: Nível de aprovação (enum)
- `status`: Status da aprovação (enum)
- `aprovador_id`: ID do aprovador
- `aprovador_nome`: Nome do aprovador
- `comentario`: Comentário da aprovação/recusa
- `data_acao`: Data/hora da ação
- `created_at`: Data de criação do registro

**Valores de nivel**:
- `gerente`: Aprovação gerencial
- `comite`: Aprovação do comitê
- `ti`: Aprovação técnica da TI

**Valores de status**:
- `pendente`: Aguardando aprovação
- `aprovado`: Aprovado neste nível
- `recusado`: Recusado neste nível
- `solicitado_insumos`: Solicitou mais informações

---

### 2.8 demand_phases
**Propósito**: Faseamento de projetos grandes em fases menores

```sql
CREATE TABLE public.demand_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  numero_fase INTEGER NOT NULL,
  nome_fase TEXT NOT NULL,
  descricao TEXT,
  horas_estimadas NUMERIC,
  status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN (
    'planejada', 'em_andamento', 'concluida'
  )),
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_demand_phases_demand_id ON demand_phases(demand_id);
CREATE INDEX idx_demand_phases_ordem ON demand_phases(ordem);

-- RLS
ALTER TABLE demand_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem fases de demandas que têm acesso"
ON demand_phases FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM demands
    WHERE demands.id = demand_phases.demand_id
    AND (
      demands.solicitante_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'comite') OR
      has_role(auth.uid(), 'ti')
    )
  )
);

CREATE POLICY "TI pode gerenciar fases"
ON demand_phases FOR ALL
USING (
  has_role(auth.uid(), 'ti') OR
  has_role(auth.uid(), 'tech_lead') OR
  has_role(auth.uid(), 'admin')
);
```

**Colunas**:
- `id`: Identificador único
- `demand_id`: Referência à demanda
- `numero_fase`: Número da fase (1, 2, 3, ...)
- `nome_fase`: Nome/título da fase
- `descricao`: Descrição da fase
- `horas_estimadas`: Horas estimadas para esta fase
- `status`: Status da fase (enum)
- `ordem`: Ordem de execução
- `created_at`: Data de criação

**Valores de status**:
- `planejada`: Ainda não iniciada
- `em_andamento`: Em execução
- `concluida`: Finalizada

---

### 2.9 technical_reviews
**Propósito**: Pareceres técnicos da TI sobre demandas

```sql
CREATE TABLE public.technical_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  revisor_id UUID NOT NULL,
  revisor_nome TEXT NOT NULL,
  complexidade TEXT CHECK (complexidade IN ('baixa', 'media', 'alta')),
  riscos TEXT,
  sugestoes TEXT,
  impacto TEXT,
  comentarios TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_technical_reviews_demand_id ON technical_reviews(demand_id);

-- RLS
ALTER TABLE technical_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem pareceres de demandas que têm acesso"
ON technical_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM demands
    WHERE demands.id = technical_reviews.demand_id
    AND (
      demands.solicitante_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'comite') OR
      has_role(auth.uid(), 'ti')
    )
  )
);

CREATE POLICY "TI pode criar pareceres"
ON technical_reviews FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'ti') OR
  has_role(auth.uid(), 'tech_lead') OR
  has_role(auth.uid(), 'admin')
);
```

**Colunas**:
- `id`: Identificador único
- `demand_id`: Referência à demanda
- `revisor_id`: ID do revisor técnico
- `revisor_nome`: Nome do revisor
- `complexidade`: Nível de complexidade técnica
- `riscos`: Riscos identificados
- `sugestoes`: Sugestões de implementação
- `impacto`: Análise de impacto
- `comentarios`: Comentários adicionais
- `created_at`: Data do parecer

**Valores de complexidade**:
- `baixa`: Simples, poucos riscos
- `media`: Moderada, alguns riscos
- `alta`: Complexa, muitos riscos

---

### 2.10 demand_attachments
**Propósito**: Anexos de documentos e fluxogramas

```sql
CREATE TABLE public.demand_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_demand_attachments_demand_id ON demand_attachments(demand_id);

-- RLS
ALTER TABLE demand_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem anexos de demandas que têm acesso"
ON demand_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM demands
    WHERE demands.id = demand_attachments.demand_id
    AND (
      demands.solicitante_id = auth.uid() OR
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'comite') OR
      has_role(auth.uid(), 'ti')
    )
  )
);

CREATE POLICY "Usuários podem adicionar anexos a demandas que criaram"
ON demand_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM demands
    WHERE demands.id = demand_attachments.demand_id
    AND demands.solicitante_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'ti') OR
  has_role(auth.uid(), 'admin')
);
```

**Colunas**:
- `id`: Identificador único
- `demand_id`: Referência à demanda
- `file_name`: Nome do arquivo
- `file_url`: URL do arquivo no storage
- `file_size`: Tamanho do arquivo em bytes
- `uploaded_by`: ID do usuário que fez upload
- `created_at`: Data do upload

---

### 2.11 planning_agendas
**Propósito**: Agendamento de reuniões de planning

```sql
CREATE TABLE public.planning_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  data_planning TIMESTAMP WITH TIME ZONE NOT NULL,
  convite_enviado BOOLEAN NOT NULL DEFAULT false,
  email_participantes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_planning_agendas_data ON planning_agendas(data_planning);
CREATE INDEX idx_planning_agendas_empresa ON planning_agendas(empresa);

-- RLS
ALTER TABLE planning_agendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver plannings"
ON planning_agendas FOR SELECT
USING (true);

CREATE POLICY "TI pode gerenciar plannings"
ON planning_agendas FOR ALL
USING (
  has_role(auth.uid(), 'ti') OR
  has_role(auth.uid(), 'tech_lead') OR
  has_role(auth.uid(), 'admin')
);
```

**Colunas**:
- `id`: Identificador único
- `empresa`: Empresa do planning
- `squad`: Squad participante
- `data_planning`: Data/hora do planning
- `convite_enviado`: Se convite por e-mail foi enviado
- `email_participantes`: Lista de e-mails convidados
- `created_at`: Data de criação

---

### 2.12 reviews_agendas
**Propósito**: Agendamento de reuniões de review

```sql
CREATE TABLE public.reviews_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  squad TEXT NOT NULL,
  data_review TIMESTAMP WITH TIME ZONE NOT NULL,
  demands_para_review UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_reviews_agendas_data ON reviews_agendas(data_review);

-- RLS (similar a planning_agendas)
```

**Colunas**:
- `id`: Identificador único
- `empresa`: Empresa do review
- `squad`: Squad participante
- `data_review`: Data/hora do review
- `demands_para_review`: Array de IDs de demandas para review
- `created_at`: Data de criação

---

### 2.13 dailys
**Propósito**: Registro de daily meetings

```sql
CREATE TABLE public.dailys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad TEXT NOT NULL,
  data_daily DATE NOT NULL,
  participantes TEXT[],
  impedimentos TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE dailys ENABLE ROW LEVEL SECURITY;
```

**Colunas**:
- `id`: Identificador único
- `squad`: Squad da daily
- `data_daily`: Data da daily
- `participantes`: Lista de participantes
- `impedimentos`: Impedimentos reportados
- `observacoes`: Observações gerais
- `created_at`: Data de criação

---

### 2.14 retrospectivas
**Propósito**: Registro de retrospectivas de sprint

```sql
CREATE TABLE public.retrospectivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad TEXT NOT NULL,
  data_retrospectiva DATE NOT NULL,
  pontos_positivos TEXT,
  pontos_negativos TEXT,
  acoes_melhoria TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE retrospectivas ENABLE ROW LEVEL SECURITY;
```

**Colunas**:
- `id`: Identificador único
- `squad`: Squad da retrospectiva
- `data_retrospectiva`: Data da retrospectiva
- `pontos_positivos`: O que foi bom
- `pontos_negativos`: O que pode melhorar
- `acoes_melhoria`: Ações definidas para melhoria
- `created_at`: Data de criação

---

## 3. Relacionamentos (Diagrama ER)

```
profiles ──┐
           │
user_roles ──┤
             │
committee_members ──┤
                    ├──► auth.users (Supabase Auth)
solicitantes ───────┤
                    │
demands.solicitante_id ───┘

demands (1) ──┬──► (N) demand_history
              ├──► (N) approval_levels
              ├──► (N) demand_phases
              ├──► (N) technical_reviews
              └──► (N) demand_attachments
```

---

## 4. Funções Auxiliares

### has_role
```sql
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### is_committee_member
```sql
CREATE OR REPLACE FUNCTION is_committee_member(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM committee_members
    WHERE user_id = user_uuid AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### generate_demand_code
```sql
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

---

## 5. Triggers

### Auto-update updated_at
```sql
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
```

### Auto-create history
```sql
CREATE OR REPLACE FUNCTION create_demand_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    INSERT INTO demand_history (
      demand_id, user_id, user_name, action,
      status_anterior, status_novo
    ) VALUES (
      NEW.id, auth.uid(), 'Sistema', 'mudou_status',
      OLD.status, NEW.status
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

---

## 6. Índices de Performance

```sql
-- demands (queries mais frequentes)
CREATE INDEX idx_demands_status ON demands(status);
CREATE INDEX idx_demands_empresa ON demands(empresa);
CREATE INDEX idx_demands_created_at ON demands(created_at DESC);

-- demand_history (histórico cronológico)
CREATE INDEX idx_demand_history_demand_id ON demand_history(demand_id);
CREATE INDEX idx_demand_history_created_at ON demand_history(created_at DESC);

-- approval_levels (filtrar aprovações pendentes)
CREATE INDEX idx_approval_levels_status ON approval_levels(status);
CREATE INDEX idx_approval_levels_nivel ON approval_levels(nivel);
```

---

## 7. Constraints e Validações

```sql
-- demands
ALTER TABLE demands ADD CONSTRAINT check_prioridade 
  CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica'));

ALTER TABLE demands ADD CONSTRAINT check_horas_positivas
  CHECK (horas_estimadas IS NULL OR horas_estimadas > 0);

ALTER TABLE demands ADD CONSTRAINT check_custo_positivo
  CHECK (custo_estimado IS NULL OR custo_estimado > 0);

-- approval_levels
ALTER TABLE approval_levels ADD CONSTRAINT unique_demand_nivel
  UNIQUE (demand_id, nivel);

-- demand_phases
ALTER TABLE demand_phases ADD CONSTRAINT check_numero_fase_positivo
  CHECK (numero_fase > 0);
```

---

## 8. Backup e Restore

### Backup Manual
```bash
pg_dump -h [host] -U postgres -d [database] -F c -f backup.dump
```

### Restore
```bash
pg_restore -h [host] -U postgres -d [database] backup.dump
```

### Backup Automático (Supabase Pro)
- Backups diários automáticos
- 7 days Point-in-Time Recovery (PITR)
- Retenção de 30 dias

---

**Documento gerado em**: 06/10/2025  
**Versão**: 1.0
