/**
 * Sistema de consolidação de status
 * Agrupa múltiplos status intermediários em estados lógicos
 */

export type ConsolidatedStatus = 
  | 'backlog'           // Backlog inicial
  | 'awaiting_approval' // Todos os tipos de aprovação
  | 'approved'          // Aprovado e pronto
  | 'in_progress'       // Em execução
  | 'standby'           // Pausado/Aguardando
  | 'completed'         // Concluído
  | 'rejected';         // Recusado/Cancelado

export type OriginalStatus = 
  | 'Backlog'
  | 'Aguardando_Gerente'
  | 'Aguardando_Comite'
  | 'Aprovado_GP'
  | 'Aguardando_Validacao_TI'
  | 'Aprovado_Comite'
  | 'Em_Progresso'
  | 'StandBy'
  | 'Concluido'
  | 'Recusado'
  | 'Cancelado';

export interface ApprovalStage {
  id: string;
  label: string;
  completed: boolean;
  order: number;
}

export interface ConsolidatedStatusInfo {
  consolidated: ConsolidatedStatus;
  label: string;
  color: string;
  approvalStages?: ApprovalStage[];
  description: string;
}

/**
 * Mapeamento de status originais para consolidados
 */
export const STATUS_CONSOLIDATION_MAP: Record<OriginalStatus, ConsolidatedStatus> = {
  'Backlog': 'backlog',
  'Aguardando_Gerente': 'awaiting_approval',
  'Aguardando_Comite': 'awaiting_approval',
  'Aprovado_GP': 'awaiting_approval',
  'Aguardando_Validacao_TI': 'awaiting_approval',
  'Aprovado_Comite': 'approved',
  'Em_Progresso': 'in_progress',
  'StandBy': 'standby',
  'Concluido': 'completed',
  'Recusado': 'rejected',
  'Cancelado': 'rejected',
};

/**
 * Informações dos status consolidados
 */
export const CONSOLIDATED_STATUS_INFO: Record<ConsolidatedStatus, Omit<ConsolidatedStatusInfo, 'consolidated' | 'approvalStages'>> = {
  backlog: {
    label: 'Backlog',
    color: 'bg-slate-500',
    description: 'Aguardando triagem inicial'
  },
  awaiting_approval: {
    label: 'Em Aprovação',
    color: 'bg-yellow-500',
    description: 'Passando por processo de aprovação'
  },
  approved: {
    label: 'Aprovado',
    color: 'bg-green-500',
    description: 'Aprovado e pronto para execução'
  },
  in_progress: {
    label: 'Em Progresso',
    color: 'bg-blue-500',
    description: 'Em desenvolvimento'
  },
  standby: {
    label: 'Stand By',
    color: 'bg-orange-500',
    description: 'Pausado temporariamente'
  },
  completed: {
    label: 'Concluído',
    color: 'bg-emerald-600',
    description: 'Finalizado com sucesso'
  },
  rejected: {
    label: 'Rejeitado',
    color: 'bg-red-500',
    description: 'Recusado ou cancelado'
  }
};

/**
 * Define os estágios de aprovação baseado no status original
 */
export const getApprovalStages = (originalStatus: OriginalStatus): ApprovalStage[] => {
  const stages: ApprovalStage[] = [
    {
      id: 'gerente',
      label: 'Aprovação Gerente',
      completed: false,
      order: 1
    },
    {
      id: 'gp',
      label: 'Aprovação GP',
      completed: false,
      order: 2
    },
    {
      id: 'ti',
      label: 'Validação TI',
      completed: false,
      order: 3
    },
    {
      id: 'comite',
      label: 'Aprovação Comitê',
      completed: false,
      order: 4
    }
  ];

  // Marcar estágios como completos baseado no status
  switch (originalStatus) {
    case 'Aguardando_Gerente':
      // Nenhum completo ainda
      break;
    case 'Aprovado_GP':
      stages[0].completed = true; // Gerente
      stages[1].completed = true; // GP
      break;
    case 'Aguardando_Validacao_TI':
      stages[0].completed = true;
      stages[1].completed = true;
      break;
    case 'Aguardando_Comite':
      stages[0].completed = true;
      stages[1].completed = true;
      stages[2].completed = true; // TI
      break;
    case 'Aprovado_Comite':
      stages.forEach(s => s.completed = true);
      break;
  }

  return stages;
};

/**
 * Obtém informações do status consolidado
 */
export const getConsolidatedStatusInfo = (originalStatus: OriginalStatus): ConsolidatedStatusInfo => {
  const consolidated = STATUS_CONSOLIDATION_MAP[originalStatus];
  const baseInfo = CONSOLIDATED_STATUS_INFO[consolidated];
  
  const info: ConsolidatedStatusInfo = {
    consolidated,
    ...baseInfo
  };

  // Adicionar estágios de aprovação se aplicável
  if (consolidated === 'awaiting_approval') {
    info.approvalStages = getApprovalStages(originalStatus);
  }

  return info;
};

/**
 * Verifica se um status está em processo de aprovação
 */
export const isAwaitingApproval = (status: OriginalStatus): boolean => {
  return STATUS_CONSOLIDATION_MAP[status] === 'awaiting_approval';
};

/**
 * Obtém o próximo estágio de aprovação pendente
 */
export const getNextApprovalStage = (originalStatus: OriginalStatus): ApprovalStage | null => {
  if (!isAwaitingApproval(originalStatus)) return null;
  
  const stages = getApprovalStages(originalStatus);
  return stages.find(s => !s.completed) || null;
};

/**
 * Obtém porcentagem de conclusão das aprovações
 */
export const getApprovalProgress = (originalStatus: OriginalStatus): number => {
  if (!isAwaitingApproval(originalStatus)) return 0;
  
  const stages = getApprovalStages(originalStatus);
  const completed = stages.filter(s => s.completed).length;
  return Math.round((completed / stages.length) * 100);
};

/**
 * Filtra demandas por status consolidado
 */
export const filterByConsolidatedStatus = <T extends { status: OriginalStatus }>(
  demands: T[],
  consolidatedStatuses: ConsolidatedStatus[]
): T[] => {
  return demands.filter(demand => 
    consolidatedStatuses.includes(STATUS_CONSOLIDATION_MAP[demand.status])
  );
};
