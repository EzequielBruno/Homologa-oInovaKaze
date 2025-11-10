/**
 * Sistema de categorização de ações do histórico
 * Agrupa 23+ tipos de ações em categorias significativas
 */

export type HistoryCategory = 
  | 'lifecycle'      // Criar, arquivar, reativar, excluir
  | 'approval'       // Todas as aprovações/recusas
  | 'status'         // Mudanças de status
  | 'phase'          // Faseamento e estimativas
  | 'communication'  // Notificações, comentários
  | 'editing';       // Edições gerais

export interface CategoryInfo {
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const CATEGORY_INFO: Record<HistoryCategory, CategoryInfo> = {
  lifecycle: {
    label: 'Ciclo de Vida',
    color: 'bg-blue-500',
    icon: '🔄',
    description: 'Criação, exclusão, arquivamento e reativação'
  },
  approval: {
    label: 'Aprovações',
    color: 'bg-green-500',
    icon: '✓',
    description: 'Aprovações e recusas em todos os níveis'
  },
  status: {
    label: 'Status',
    color: 'bg-purple-500',
    icon: '📊',
    description: 'Alterações de status e progressão'
  },
  phase: {
    label: 'Faseamento',
    color: 'bg-orange-500',
    icon: '📋',
    description: 'Estimativas, fases e planejamento técnico'
  },
  communication: {
    label: 'Comunicação',
    color: 'bg-cyan-500',
    icon: '💬',
    description: 'Notificações, comentários e solicitações'
  },
  editing: {
    label: 'Edições',
    color: 'bg-gray-500',
    icon: '✏️',
    description: 'Modificações gerais de dados'
  }
};

/**
 * Mapeamento de ações para categorias
 */
export const ACTION_TO_CATEGORY: Record<string, HistoryCategory> = {
  // Lifecycle
  'criar': 'lifecycle',
  'excluir': 'lifecycle',
  'arquivar': 'lifecycle',
  'reativar': 'lifecycle',
  'cancelar': 'lifecycle',
  
  // Approvals
  'aprovar': 'approval',
  'reprovar': 'approval',
  'aprovar_gerente': 'approval',
  'recusar_gerente': 'approval',
  'aprovar_comite': 'approval',
  'recusar_comite': 'approval',
  'aprovar_ti': 'approval',
  'recusar_ti': 'approval',
  'solicitar_aprovacao_gerente': 'approval',
  
  // Status changes
  'mudar_status': 'status',
  
  // Phase management
  'adicionar_fase': 'phase',
  'atualizar_fase': 'phase',
  
  // Communication
  'enviar_notificacao': 'communication',
  'solicitar_insumo': 'communication',
  
  // Editing
  'editar': 'editing',
};

/**
 * Obtém a categoria de uma ação
 */
export const getActionCategory = (action: string): HistoryCategory => {
  return ACTION_TO_CATEGORY[action] || 'editing';
};

/**
 * Obtém informações da categoria de uma ação
 */
export const getActionCategoryInfo = (action: string): CategoryInfo => {
  const category = getActionCategory(action);
  return CATEGORY_INFO[category];
};

/**
 * Agrupa ações por categoria
 */
export const groupActionsByCategory = (actions: string[]): Record<HistoryCategory, string[]> => {
  const grouped: Record<HistoryCategory, string[]> = {
    lifecycle: [],
    approval: [],
    status: [],
    phase: [],
    communication: [],
    editing: []
  };

  actions.forEach(action => {
    const category = getActionCategory(action);
    grouped[category].push(action);
  });

  return grouped;
};

/**
 * Obtém label amigável para uma ação
 */
export const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    'criar': 'Criada',
    'editar': 'Editada',
    'reativar': 'Reativada',
    'excluir': 'Excluída',
    'cancelar': 'Cancelada',
    'arquivar': 'Arquivada',
    'aprovar': 'Aprovada',
    'reprovar': 'Reprovada',
    'mudar_status': 'Status alterado',
    'adicionar_fase': 'Fase adicionada',
    'atualizar_fase': 'Fase atualizada',
    'solicitar_insumo': 'Insumo solicitado',
    'enviar_notificacao': 'Notificação enviada',
    'solicitar_aprovacao_gerente': 'Aprovação de gerente solicitada',
    'aprovar_gerente': 'Aprovada pelo gerente',
    'recusar_gerente': 'Recusada pelo gerente',
    'aprovar_comite': 'Aprovada pelo comitê',
    'recusar_comite': 'Recusada pelo comitê',
    'aprovar_ti': 'Aprovada pela TI',
    'recusar_ti': 'Recusada pela TI',
  };

  return labels[action] || action;
};

/**
 * Filtra histórico por categoria
 */
export const filterHistoryByCategory = <T extends { action: string }>(
  history: T[],
  categories: HistoryCategory[]
): T[] => {
  if (categories.length === 0) return history;
  
  return history.filter(item => 
    categories.includes(getActionCategory(item.action))
  );
};
