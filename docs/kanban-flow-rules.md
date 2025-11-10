# Regras de Fluxo do Kanban

Este documento descreve as regras de transição entre colunas implementadas no sistema de demandas/kanban.

## Visão Geral

O fluxo do Kanban segue regras específicas baseadas no status atual da demanda, sua criticidade e aprovações recebidas.

## Estados (Colunas)

1. **StandBy** - Demandas pausadas temporariamente
2. **Backlog** - Fila de demandas aguardando priorização
3. **Aprovadas GP** (Em_Avaliacao_PMO) - Aprovadas pelo Gerente de Projeto
4. **Aguardando Comitê** - Demandas de alta criticidade aguardando comitê
5. **Aprovação Diretoria** (Revisao) - Aguardando decisão da diretoria
6. **Aprovadas Diretoria** (Aprovado) - Aprovadas pela diretoria
7. **Em Progresso** - Demandas em desenvolvimento
8. **Concluídas** (Concluido) - Demandas finalizadas
9. **Canceladas** (Arquivado) - Demandas canceladas

## Regras de Transição Detalhadas

### 1. StandBy

**Pode mover para:**
- **Backlog** - Sem restrições
- **Aprovadas GP** - Sem restrições

**Condições especiais:**
- Sem necessidade de análise de risco
- Status regulatório pode ser usado para GP remover data

**Não pode mover para:** Outras colunas

---

### 2. Backlog

**Pode mover para:**
- **Aprovadas GP** - Sem restrições
- **StandBy** - Sem restrições

**Não pode mover para:** Outras colunas

---

### 3. Aprovadas GP (Em_Avaliacao_PMO)

**Pode mover para:**
- **Backlog** - Retorno sem restrições
- **StandBy** - Retorno sem restrições
- **Em Progresso** - Requer:
  - ✅ Análise de risco concluída
  - ✅ Criticidade Baixa ou Média
  - ❌ Bloqueado se criticidade Alta ou Crítica
- **Aguardando Comitê** - Requer:
  - ✅ Análise de risco concluída
  - ✅ Parecer do Coordenador e/ou Técnico TI
  - ⚠️ Recomendado para criticidade Alta/Crítica

**Regras:**
- Se criticidade **Baixa/Média**: Pode pular o comitê e ir direto para Em Progresso
- Se criticidade **Alta/Crítica**: Deve passar pelo Comitê

**Não pode mover para:** Outras colunas

---

### 4. Aguardando Comitê

**Pode mover para:**
- **Aprovadas GP** - Retorno para reavaliação (requer confirmação)
- **Aprovação Diretoria** - Requer:
  - ✅ Aprovação ≥ 80% do comitê
  - ❌ Bloqueado se < 80%

**Condições:**
- Necessário parecer do Coordenador e/ou Técnico TI
- Encaminha para GP → Scrum/Squad

**Não pode mover para:** Outras colunas

---

### 5. Aprovação Diretoria (Revisao)

**Pode mover para:**
- **Aguardando Comitê** - Retorno sem restrições
- **Aprovadas Diretoria** - Após aprovação
- **Canceladas** - Se reprovado (< 80%)

**Regras:**
- Se menos de 80% reprovar → vai para Canceladas
- Estado intermediário antes de diretoria aprovar

**Não pode mover para:** Outras colunas

---

### 6. Aprovadas Diretoria (Aprovado)

**Pode mover para:**
- **Em Progresso** - Requer:
  - ✅ Squad alocada
  - ❌ Bloqueado se não houver squad

**Condições:**
- Se não houver equipe disponível, deve escolher "Terceirizar"

**Não pode mover para:** Outras colunas

---

### 7. Em Progresso

**Pode mover para:**
- **Aprovadas Diretoria** - Retorno (requer confirmação)
- **Aprovadas GP** - Retorno se criticidade baixa (requer confirmação)
- **Concluídas** - Após execução (requer confirmação)
- **Canceladas** - Com justificativa

**Condições:**
- Precisa de recursos disponíveis
- Se não houver equipe, deve escolher "Terceirizar"

**Não pode mover para:** Outras colunas

---

### 8. Concluídas (Concluido)

**Pode mover para:** Nenhuma

**Regras:**
- Estado final
- Apenas após execução completa
- Fim de ciclo para a demanda

---

### 9. Canceladas (Arquivado)

**Pode mover para:** Nenhuma

**Regras:**
- Estado final
- Reprovadas em qualquer etapa (GP, Comitê < 80%, Diretoria)
- Fim de ciclo para a demanda

---

## Fluxograma de Decisão

```
┌─────────────┐
│   StandBy   │
└──────┬──────┘
       │
       ↓
┌─────────────┐     ┌──────────────────┐
│   Backlog   │ ←→  │  Aprovadas GP    │
└─────────────┘     └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
            Criticidade          Criticidade
            Baixa/Média         Alta/Crítica
                    │                 │
                    ↓                 ↓
            ┌──────────────┐   ┌─────────────────┐
            │Em Progresso  │   │Aguardando Comitê│
            └──────┬───────┘   └────────┬────────┘
                   │                    │
                   │              ≥80% aprovação
                   │                    │
                   │            ┌───────↓──────────┐
                   │            │Aprovação Diretoria│
                   │            └───────┬───────────┘
                   │                    │
                   │            ┌───────↓──────────┐
                   │            │Aprovadas Diretoria│
                   │            └───────┬───────────┘
                   │                    │
                   └────────────────────┘
                            │
                            ↓
                   ┌─────────────────┐
                   │   Concluídas    │
                   └─────────────────┘
```

## Implementação Técnica

### Arquivos

1. **`src/utils/kanbanFlowRules.ts`**
   - Contém todas as regras de validação
   - Função principal: `validateStatusTransition()`
   - Retorna: `{ allowed, message, requiresConfirmation, confirmationMessage }`

2. **`src/pages/empresa/KanbanView.tsx`**
   - Integra validações no `handleStatusChange()`
   - Mostra mensagens de erro/confirmação
   - Registra mudanças no histórico

3. **`src/components/kanban/KanbanCard.tsx`**
   - Filtra status disponíveis no dropdown
   - Mostra apenas transições permitidas

### Exemplo de Uso

```typescript
import { validateStatusTransition } from '@/utils/kanbanFlowRules';

const validation = validateStatusTransition(demand, newStatus);

if (!validation.allowed) {
  toast.error(validation.message);
  return;
}

if (validation.requiresConfirmation) {
  const confirmed = window.confirm(validation.confirmationMessage);
  if (!confirmed) return;
}

// Procede com a mudança de status
```

## Campos Utilizados nas Validações

- **status**: Status atual da demanda
- **prioridade**: Criticidade (Baixa, Média, Alta, Crítica)
- **aprovacao_risco**: Indica se análise de risco foi concluída
- **aprovacao_tecnica_coordenador**: Parecer técnico do coordenador TI
- **aprovacao_comite_percentual**: Percentual de aprovação do comitê
- **regulatorio**: Flag indicando se é regulatória
- **squad_id**: Squad alocada para a demanda

## Mensagens de Validação

As mensagens são contextuais e explicam:
- Por que a transição não é permitida
- O que precisa ser feito para permitir a transição
- Avisos quando há alternativas mais adequadas

## Testes Recomendados

1. ✅ Verificar que demandas de baixa criticidade podem pular o comitê
2. ✅ Verificar que demandas de alta criticidade são bloqueadas para ir direto para Em Progresso
3. ✅ Verificar que Concluídas e Canceladas não podem ser movidas
4. ✅ Verificar validação de análise de risco
5. ✅ Verificar validação de aprovação TI
6. ✅ Verificar validação de aprovação do comitê (≥80%)
7. ✅ Verificar validação de squad alocada
8. ✅ Verificar confirmações quando requeridas
