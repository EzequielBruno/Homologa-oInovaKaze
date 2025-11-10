# Transição Automática de Demandas

## Funcionalidade

Demandas de **criticidade Baixa ou Média** que são movidas para **Aprovadas GP** (Em_Avaliacao_PMO) seguem **automaticamente** para **Em Progresso**.

✅ Criticidade Baixa → Vai direto para Em Progresso  
✅ Criticidade Média → Vai direto para Em Progresso  
❌ Criticidade Alta → Fica em Aprovadas GP (deve ir para Comitê)  
❌ Criticidade Crítica → Fica em Aprovadas GP (deve ir para Comitê)

## Fluxo Automático

```
┌─────────────────┐
│ Qualquer Status │
└────────┬────────┘
         │
         ↓
  ┌──────────────┐
  │Aprovadas GP  │
  └──────┬───────┘
         │
    ┌────▼─────────────────────┐
    │ Criticidade Baixa/Média? │
    └────┬────────────┬─────────┘
         │ SIM        │ NÃO
         ↓            ↓
    ┌──────────┐ ┌─────────────┐
    │    Em    │ │  Fica em    │
    │ Progresso│ │ Aprovadas GP│
    │    ✅    │ │ (Alta/Crít.)│
    └──────────┘ └─────────────┘
```

## Comportamento Detalhado

### Caso 1: Criticidade Baixa ou Média

**Ação**: Transição automática para Em Progresso

```typescript
Status inicial: Backlog (ou qualquer outro)
    ↓ (movida para)
Aprovadas GP
    ↓ (AUTOMÁTICO - IMEDIATO)
Em Progresso ✅
```

**Notificação ao usuário:**
> "Demanda aprovada e iniciada - Demanda de criticidade baixa/média movida automaticamente para Em Progresso."

### Caso 2: Criticidade Alta ou Crítica

**Ação**: Fica em Aprovadas GP (deve ir para Comitê)

```typescript
Status inicial: Backlog
    ↓ (movida para)
Aprovadas GP
    ↓ (manual)
Aguardando Comitê
```

**Comportamento**: Não há transição automática, pois demandas de alta criticidade devem passar pelo Comitê antes de entrarem em progresso.

## Implementação Técnica

### Arquivo: `KanbanView.tsx`

```typescript
// Transição automática: Aprovadas GP → Em Progresso (criticidade baixa/média)
if (newStatus === 'Em_Avaliacao_PMO') {
  const criticidade = demand.prioridade;
  const isBaixaOuMedia = criticidade === 'Baixa' || criticidade === 'Média';

  if (isBaixaOuMedia) {
    // Move automaticamente para Em Progresso
    await supabase
      .from('demands')
      .update({ status: 'Em_Progresso' })
      .eq('id', demandId);
      
    // Log da ação
    await logAction({
      demandId,
      action: 'mudar_status',
      descricao: 'Movida automaticamente para Em Progresso (criticidade baixa/média)',
      dadosAnteriores: { status: 'Em_Avaliacao_PMO' },
      dadosNovos: { status: 'Em_Progresso' },
    });
    
    // Recarrega as demandas
    await loadDemands();
  }
}
```

## Registro no Histórico

Todas as transições automáticas são registradas no histórico da demanda com:

- **Ação**: `mudar_status`
- **Descrição**: "Movida automaticamente para Em Progresso (criticidade baixa/média com análise de risco concluída)"
- **Dados Anteriores**: `{ status: 'Em_Avaliacao_PMO' }`
- **Dados Novos**: `{ status: 'Em_Progresso' }`

## Quando a Transição Ocorre

A transição automática **OCORRE** quando:

- ✅ Criticidade é Baixa ou Média
- ✅ Demanda está sendo movida para Aprovadas GP

## Quando a Transição NÃO Ocorre

A transição automática **NÃO ocorre** quando:

- ❌ Criticidade é Alta ou Crítica
- ❌ Demanda já está em outro status
- ❌ Erro ao tentar realizar a transição

## Benefícios

1. **Agilidade**: Reduz etapas manuais para demandas de baixa complexidade
2. **Automação**: Menos cliques e interação manual
3. **Rastreabilidade**: Todas as ações são registradas no histórico
4. **Inteligente**: Considera criticidade e análise de risco
5. **Segurança**: Mantém validação para demandas críticas

## Testes Recomendados

1. ✅ Mover demanda Baixa para Aprovadas GP → Deve ir automaticamente para Em Progresso
2. ✅ Mover demanda Média para Aprovadas GP → Deve ir automaticamente para Em Progresso
3. ✅ Mover demanda Alta para Aprovadas GP → Deve ficar em Aprovadas GP
4. ✅ Mover demanda Crítica para Aprovadas GP → Deve ficar em Aprovadas GP
5. ✅ Verificar registro no histórico da transição automática
6. ✅ Verificar notificação exibida ao usuário
7. ✅ Verificar que demanda aparece na coluna Em Progresso após transição
