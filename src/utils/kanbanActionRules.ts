/**
 * Regras de exibição e permissão de ações por coluna do Kanban
 */

export type KanbanAction =
  | 'visualizar'
  | 'comentar'
  | 'parecer_tecnico_ti'
  | 'avaliar_risco'
  | 'solicitar_insumo'
  | 'aprovar'
  | 'reprovar'
  | 'cancelar';

export type KanbanStatus =
  | 'StandBy'
  | 'Backlog'
  | 'Aguardando_Gerente'
  | 'Aguardando_Validacao_TI'
  | 'Aprovado_GP'
  | 'Aguardando_Comite'
  | 'Revisao'
  | 'Aprovado'
  | 'Em_Progresso'
  | 'Bloqueado'
  | 'Concluido'
  | 'Recusado'
  | 'Arquivado'
  | 'Novas'
  | 'Alteracao_Escopo';

interface ActionRules {
  [key: string]: {
    allowedStatuses: KanbanStatus[] | 'all';
    excludedStatuses?: KanbanStatus[];
    requiresJustification?: boolean;
    requiresTIApproval?: boolean;
  };
}

const ACTION_RULES: ActionRules = {
  visualizar: {
    allowedStatuses: 'all',
  },
  comentar: {
    allowedStatuses: 'all',
  },
  parecer_tecnico_ti: {
    allowedStatuses: ['StandBy', 'Backlog', 'Arquivado', 'Novas', 'Alteracao_Escopo'],
  },
  avaliar_risco: {
    allowedStatuses: ['StandBy', 'Backlog', 'Arquivado', 'Novas', 'Alteracao_Escopo'],
    requiresTIApproval: true,
  },
  solicitar_insumo: {
    allowedStatuses: [
      'StandBy',
      'Backlog',
      'Aguardando_Gerente',
      'Arquivado',
      'Novas',
      'Alteracao_Escopo',
    ],
  },
  aprovar: {
    allowedStatuses: 'all',
    excludedStatuses: ['Concluido', 'Arquivado', 'Recusado'],
  },
  reprovar: {
    allowedStatuses: 'all',
    excludedStatuses: ['Em_Progresso', 'Concluido'],
    requiresJustification: true,
  },
  cancelar: {
    allowedStatuses: 'all',
    requiresJustification: true,
  },
};

/**
 * Verifica se uma ação está disponível para uma determinada coluna/status
 */
export const isActionAvailable = (
  action: KanbanAction,
  status: string,
  hasTIApproval: boolean = false
): boolean => {
  const rule = ACTION_RULES[action];
  if (!rule) return false;

  // Ações sempre disponíveis
  if (rule.allowedStatuses === 'all') {
    // Verifica se há exclusões
    if (rule.excludedStatuses && rule.excludedStatuses.includes(status as KanbanStatus)) {
      return false;
    }
    return true;
  }

  // Verifica se o status está na lista de permitidos
  const isAllowed = rule.allowedStatuses.includes(status as KanbanStatus);
  
  // Se requer aprovação TI e a ação é avaliar risco, só permite se já tiver aprovação TI
  if (action === 'avaliar_risco' && rule.requiresTIApproval) {
    return isAllowed && hasTIApproval;
  }

  return isAllowed;
};

/**
 * Verifica se uma ação requer justificativa
 */
export const requiresJustification = (action: KanbanAction): boolean => {
  const rule = ACTION_RULES[action];
  return rule?.requiresJustification ?? false;
};

/**
 * Obtém todas as ações disponíveis para um status específico
 */
export const getAvailableActions = (
  status: string,
  hasTIApproval: boolean = false
): KanbanAction[] => {
  const actions: KanbanAction[] = [
    'visualizar',
    'comentar',
    'parecer_tecnico_ti',
    'avaliar_risco',
    'solicitar_insumo',
    'aprovar',
    'reprovar',
    'cancelar',
  ];

  return actions.filter((action) => isActionAvailable(action, status, hasTIApproval));
};

/**
 * Obtém a razão pela qual uma ação está desabilitada
 */
export const getActionDisabledReason = (
  action: KanbanAction,
  status: string,
  hasTIApproval: boolean = false
): string | null => {
  const rule = ACTION_RULES[action];
  if (!rule) return 'Ação não configurada';

  // Se está disponível, não há razão
  if (isActionAvailable(action, status, hasTIApproval)) {
    return null;
  }

  // Ações sempre disponíveis
  if (rule.allowedStatuses === 'all') {
    if (rule.excludedStatuses?.includes(status as KanbanStatus)) {
      return `Não disponível para status "${status}"`;
    }
    return null;
  }

  // Verifica status
  if (!rule.allowedStatuses.includes(status as KanbanStatus)) {
    const statusList = rule.allowedStatuses.join(', ');
    return `Disponível apenas em: ${statusList}`;
  }

  // Verifica aprovação TI
  if (action === 'avaliar_risco' && rule.requiresTIApproval && !hasTIApproval) {
    return 'Requer parecer técnico da TI primeiro';
  }

  return 'Ação indisponível neste momento';
};

/**
 * Mapeia os nomes de status do banco para o tipo KanbanStatus
 */
export const normalizeStatus = (status: string): KanbanStatus => {
  // Mapeamento de status do banco para o tipo esperado
  const statusMap: Record<string, KanbanStatus> = {
    'StandBy': 'StandBy',
    'Backlog': 'Backlog',
    'Aprovado_GP': 'Aprovado_GP',
    'Aguardando_Validacao_TI': 'Aguardando_Validacao_TI',
    'Aguardando_Comite': 'Aguardando_Comite',
    'Revisao': 'Revisao',
    'Aprovado': 'Aprovado',
    'Em_Progresso': 'Em_Progresso',
    'Bloqueado': 'Bloqueado',
    'Concluido': 'Concluido',
    'Recusado': 'Recusado',
    'Arquivado': 'Arquivado',
  };

  return statusMap[status] || status as KanbanStatus;
};
