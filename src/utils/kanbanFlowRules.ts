/**
 * Regras de fluxo entre colunas do Kanban
 * Define quais transições são permitidas e suas condições
 */

export type KanbanStatus =
  | 'StandBy'
  | 'Backlog'
  | 'Aguardando_Gerente'
  | 'Aguardando_Validacao_TI'
  | 'Aprovado_GP' // Aprovado GP
  | 'Aguardando_Comite'
  | 'Revisao' // Aprovação Diretoria
  | 'Aprovado' // Aguardando Aprovação Diretoria / Aprovadas Comitê
  | 'Em_Progresso'
  | 'Bloqueado'
  | 'Concluido'
  | 'Arquivado'; // Canceladas

export type Criticidade = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

interface Demand {
  id: string;
  status: string;
  prioridade?: string;
  aprovacao_tecnica_coordenador?: string | null;
  aprovacao_comite_percentual?: number | null;
  regulatorio?: boolean;
  squad?: string | null;
}

interface TransitionValidation {
  allowed: boolean;
  message?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

/**
 * Mapeia os status permitidos para cada coluna de origem
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  StandBy: ['Backlog', 'Aprovado_GP'],
  Backlog: ['Aprovado_GP', 'StandBy'],
  Aguardando_Gerente: ['Aguardando_Comite', 'Backlog', 'Aprovado_GP', 'Aprovado'],
  Aprovado_GP: ['Backlog', 'StandBy', 'Em_Progresso', 'Aguardando_Comite', 'Aguardando_Validacao_TI'],
  Aguardando_Validacao_TI: ['Backlog', 'StandBy', 'Aprovado_GP'],
  Aguardando_Comite: ['Aprovado_GP', 'Revisao'],
  Revisao: ['Aguardando_Comite', 'Aprovado', 'Arquivado'],
  Aprovado: ['Em_Progresso'],
  Em_Progresso: ['Aprovado', 'Aprovado_GP', 'Concluido', 'Arquivado', 'Bloqueado'],
  Bloqueado: ['Em_Progresso', 'Arquivado'],
  Concluido: [],
  Arquivado: [],
};

/**
 * Valida se uma transição de status é permitida
 */
export const validateStatusTransition = (
  demand: Demand,
  newStatus: string
): TransitionValidation => {
  const currentStatus = demand.status;

  // Não pode mover de Concluído ou Arquivado
  if (currentStatus === 'Concluido') {
    return {
      allowed: false,
      message: 'Demandas concluídas não podem ser movidas. O ciclo foi finalizado.',
    };
  }

  if (currentStatus === 'Arquivado') {
    return {
      allowed: false,
      message: 'Demandas canceladas não podem ser movidas. O ciclo foi encerrado.',
    };
  }

  // Verifica se a transição está na lista de permitidas
  const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedStatuses.includes(newStatus)) {
    return {
      allowed: false,
      message: `Não é possível mover de ${getStatusLabel(currentStatus)} para ${getStatusLabel(newStatus)}.`,
    };
  }

  // Regras específicas por transição
  return validateSpecificRules(demand, currentStatus, newStatus);
};

/**
 * Valida regras específicas para cada tipo de transição
 */
const validateSpecificRules = (
  demand: Demand,
  fromStatus: string,
  toStatus: string
): TransitionValidation => {
  
  // 1. StandBy → Aprovado GP
  if (fromStatus === 'StandBy' && toStatus === 'Aprovado_GP') {
    return {
      allowed: true,
      message: 'Demanda será enviada para avaliação do GP.',
    };
  }

  // 2. Backlog → Aprovado GP ou StandBy
  if (fromStatus === 'Backlog') {
    return { allowed: true };
  }

  if (fromStatus === 'Aguardando_Gerente' && toStatus === 'Backlog') {
    return {
      allowed: true,
      message: 'Demanda retornará para o Backlog para novos ajustes.',
    };
  }

  if (fromStatus === 'Aguardando_Gerente' && toStatus === 'Aguardando_Comite') {
    return {
      allowed: true,
      message: 'Demanda aprovada pelo Gerente e será encaminhada para Comitê.',
    };
  }

  if (fromStatus === 'Aguardando_Gerente' && toStatus === 'Aprovado') {
    const prioridade = demand.prioridade as Criticidade;
    const isMediumOrLow = prioridade === 'Média' || prioridade === 'Baixa';

    if (!isMediumOrLow) {
      return {
        allowed: false,
        message: 'Apenas demandas de prioridade Média ou Baixa podem ser aprovadas diretamente pelo gerente.',
      };
    }

    return {
      allowed: true,
      message: 'Demanda aprovada pelo Gerente e movida para Aprovadas Diretoria.',
    };
  }

  if (fromStatus === 'Aguardando_Gerente' && toStatus === 'Aprovado_GP') {
    return {
      allowed: true,
      message: 'Demanda foi classificada como aprovada pelo Gerente/GP.',
    };
  }

  if (fromStatus === 'Aprovado_GP' && toStatus === 'Aguardando_Validacao_TI') {
    return {
      allowed: true,
      message: 'Demanda seguirá para faseamento da TI.',
    };
  }

  if (fromStatus === 'Aguardando_Validacao_TI') {
    if (toStatus === 'Backlog') {
      return {
        allowed: true,
        message: 'Demanda retornará para o Backlog.',
      };
    }

    if (toStatus === 'StandBy') {
      return {
        allowed: true,
        message: 'Demanda será movida para StandBy.',
      };
    }

    if (toStatus === 'Aprovado_GP') {
      return {
        allowed: true,
        message: 'Demanda retornará para a avaliação do GP.',
      };
    }
  }


  // 3. Aprovado GP → Em Progresso (requer análise de risco e criticidade baixa/média)
  if (fromStatus === 'Aprovado_GP' && toStatus === 'Em_Progresso') {
    const criticidade = demand.prioridade as Criticidade;
    if (criticidade === 'Alta' || criticidade === 'Crítica') {
      return {
        allowed: false,
        message: 'Demandas de criticidade Alta ou Crítica precisam passar pelo Comitê antes de entrar em progresso.',
      };
    }

    return {
      allowed: true,
      requiresConfirmation: true,
      confirmationMessage: 'A demanda tem criticidade baixa/média e pode ir direto para Em Progresso. Confirma?',
    };
  }

  // 4. Aprovado GP → Aguardando Comitê (criticidade alta)
  if (fromStatus === 'Aprovado_GP' && toStatus === 'Aguardando_Comite') {
    if (!demand.aprovacao_tecnica_coordenador) {
      return {
        allowed: false,
        message: 'É necessário o parecer do Coordenador e/ou Técnico TI antes de encaminhar ao Comitê.',
      };
    }

    return {
      allowed: true,
      message: 'Demanda será encaminhada para aprovação do Comitê.',
    };
  }

  // 5. Aguardando Comitê → Aprovação Diretoria (≥80% aprovação)
  if (fromStatus === 'Aguardando_Comite' && toStatus === 'Revisao') {
    const percentualAprovacao = demand.aprovacao_comite_percentual || 0;
    if (percentualAprovacao < 80) {
      return {
        allowed: false,
        message: 'É necessário pelo menos 80% de aprovação do Comitê para encaminhar à Diretoria.',
      };
    }

    return {
      allowed: true,
      message: 'Demanda aprovada pelo Comitê e será encaminhada para Diretoria.',
    };
  }

  if (fromStatus === 'Revisao' && toStatus === 'Aguardando_Comite') {
    return {
      allowed: true,
      message: 'Demanda retornará para reavaliação do Comitê.',
    };
  }

  // 6. Aguardando Comitê → Aprovado GP (retorno)
  if (fromStatus === 'Aguardando_Comite' && toStatus === 'Aprovado_GP') {
    return {
      allowed: true,
      requiresConfirmation: true,
      confirmationMessage: 'Retornar a demanda para reavaliação do GP?',
    };
  }

  // 7. Aprovação Diretoria → Canceladas (< 80% reprovação)
  if (fromStatus === 'Revisao' && toStatus === 'Arquivado') {
    return {
      allowed: true,
      message: 'Demanda será cancelada.',
    };
  }

  // 8. Aprovação Diretoria → Aprovadas Comitê
  if (fromStatus === 'Revisao' && toStatus === 'Aprovado') {
    return {
      allowed: true,
      message: 'Demanda aprovada pela Diretoria.',
    };
  }

  // 9. Aprovado (Aguardando Aprovação Diretoria) → Em Progresso
  if (fromStatus === 'Aprovado' && toStatus === 'Em_Progresso') {
    if (!demand.squad) {
      return {
        allowed: false,
        message: 'É necessário alocar uma Squad antes de iniciar o desenvolvimento. Se não houver equipe disponível, considere terceirizar.',
      };
    }

    return {
      allowed: true,
      message: 'Demanda será iniciada.',
    };
  }

  // 10. Em Progresso → Concluído
  if (fromStatus === 'Em_Progresso' && toStatus === 'Concluido') {
    return {
      allowed: true,
      requiresConfirmation: true,
      confirmationMessage: 'Confirma que a demanda foi concluída e validada?',
    };
  }

  // 11. Em Progresso → Aprovado GP/Diretoria (retorno criticidade baixa)
  if (fromStatus === 'Em_Progresso' && (toStatus === 'Aprovado_GP' || toStatus === 'Aprovado')) {
    return {
      allowed: true,
      requiresConfirmation: true,
      confirmationMessage: 'Retornar a demanda para reavaliação?',
    };
  }

  if (fromStatus === 'Em_Progresso' && toStatus === 'Bloqueado') {
    return {
      allowed: true,
      message: 'Demanda será marcada como bloqueada.',
    };
  }

  if (fromStatus === 'Bloqueado' && toStatus === 'Em_Progresso') {
    return {
      allowed: true,
      message: 'Demanda retomará o andamento.',
    };
  }

  // 12. Qualquer → Canceladas
  if (toStatus === 'Arquivado') {
    return {
      allowed: true,
      requiresConfirmation: true,
      confirmationMessage: 'Confirma o cancelamento desta demanda? Esta ação encerrará o ciclo.',
    };
  }

  // Transição permitida por padrão
  return { allowed: true };
};

/**
 * Retorna o label amigável do status
 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    StandBy: 'StandBy',
    Backlog: 'Backlog',
    Aguardando_Gerente: 'Aguardando Gerente',
    Aprovado_GP: 'Aprovado GP',
    Aguardando_Validacao_TI: 'Faseamento TI',
    Aguardando_Comite: 'Aguardando Comitê',
    Revisao: 'Aprovação Diretoria',
    Aprovado: 'Aprovadas Diretoria',
    Em_Progresso: 'Em Progresso',
    Bloqueado: 'Bloqueado',
    Concluido: 'Concluídas',
    Arquivado: 'Canceladas',
  };
  return labels[status] || status;
};

/**
 * Retorna apenas os status permitidos para uma demanda específica
 */
export const getAllowedStatusesForDemand = (demand: Demand): string[] => {
  const allowedStatuses = ALLOWED_TRANSITIONS[demand.status] || [];
  
  return allowedStatuses.filter(status => {
    const validation = validateStatusTransition(demand, status);
    return validation.allowed;
  });
};

/**
 * Verifica se StandBy pode ser usado para remover data regulatória
 */
export const canRemoveRegulatoryDate = (demand: Demand): boolean => {
  return demand.status === 'StandBy' && Boolean(demand.regulatorio);
};
