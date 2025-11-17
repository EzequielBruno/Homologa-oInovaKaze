import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DependencyIndicator } from './DependencyIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  BadgeCheck,
  Ban,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  MessageSquarePlus,
  MoreHorizontal,
  PackagePlus,
  Paperclip,
  PauseCircle,
  PenSquare,
  PlayCircle,
  RefreshCcw,
  ShieldAlert,
  Send,
  Undo2,
  Unlock,
  User,
  UserCheck,
  Users,
  Circle,
  XCircle,
} from 'lucide-react';
import {
  isActionAvailable,
  getActionDisabledReason,
  type KanbanAction,
} from '@/utils/kanbanActionRules';
import { validateStatusTransition } from '@/utils/kanbanFlowRules';

type ActionKey =
  | 'view'
  | 'comment'
  | 'requestInput'
  | 'assessRisk'
  | 'parecerTi'
  | 'edit'
  | 'cancel'
  | 'moveToStandBy'
  | 'moveToBacklog'
  | 'revertFaseamento'
  | 'approve'
  | 'reject'
  | 'requestChange'
  | 'start'
  | 'moveToBlocked'
  | 'unblock';

const STATUS_ACTIONS: Partial<Record<string, ActionKey[]>> = {
  Backlog: [
    'view',
    'parecerTi',
    'requestInput',
    'assessRisk',
    'edit',
    'comment',
    'cancel',
    'moveToStandBy',
  ],
  StandBy: ['view', 'parecerTi', 'edit', 'moveToBacklog', 'comment'],
  Aguardando_Validacao_TI: ['view', 'revertFaseamento', 'cancel', 'comment', 'moveToStandBy'],
  Aguardando_Gerente: [
    'view',
    'approve',
    'reject',
    'cancel',
    'comment',
    'requestInput',
    'moveToBacklog',
  ],
  Aguardando_Comite: ['view', 'approve', 'reject', 'comment'],
  Aprovado_GP: ['view', 'start', 'comment', 'requestChange', 'cancel'],
  Aprovado: ['view', 'start', 'comment', 'requestChange', 'cancel'],
  Em_Progresso: ['view', 'comment', 'requestChange', 'cancel', 'moveToBlocked'],
  Bloqueado: ['view', 'comment', 'unblock', 'cancel'],
  Concluido: ['view'],
  Recusado: ['view'],
  Arquivado: ['view'],
};

interface ActionItem {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  disabledReason?: string | null;
  className?: string;
}

const RULE_ACTION_MAP: Partial<Record<ActionKey, KanbanAction>> = {
  view: 'visualizar',
  comment: 'comentar',
  requestInput: 'solicitar_insumo',
  assessRisk: 'avaliar_risco',
  parecerTi: 'parecer_tecnico_ti',
  approve: 'aprovar',
  reject: 'reprovar',
  cancel: 'cancelar',
};

const APPROVABLE_STATUSES = new Set<string>([
  'StandBy',
  'Backlog',
  'Aguardando_Gerente',
  'Aprovado_GP',
  'Aguardando_Comite',
  'Revisao',
  'Aprovado',
  'Em_Progresso',
]);

const ADDITIONAL_ACTIONS_BY_STATUS: Partial<Record<string, ActionKey[]>> = {
  StandBy: ['edit', 'moveToBacklog'],
  Backlog: ['edit', 'moveToStandBy'],
  Aguardando_Validacao_TI: ['revertFaseamento', 'moveToStandBy'],
  Aguardando_Gerente: ['moveToBacklog'],
  Aprovado: ['start', 'requestChange'],
  Em_Progresso: ['requestChange', 'moveToBlocked'],
  Bloqueado: ['unblock'],
};

const BASE_ACTION_ORDER: ActionKey[] = [
  'view',
  'comment',
  'parecerTi',
  'assessRisk',
  'requestInput',
  'approve',
  'reject',
  'cancel',
];

const ADDITIONAL_ACTION_ORDER: ActionKey[] = [
  'edit',
  'requestChange',
  'start',
  'moveToStandBy',
  'moveToBacklog',
  'moveToBlocked',
  'unblock',
  'revertFaseamento',
];

const STATUS_STYLES: Record<
  string,
  {
    icon: LucideIcon;
    className: string;
  }
> = {
  StandBy: {
    icon: PauseCircle,
    className:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-400/40',
  },
  Backlog: {
    icon: ClipboardList,
    className:
      'bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-500/30 dark:border-slate-400/40',
  },
  Aguardando_Gerente: {
    icon: UserCheck,
    className:
      'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 dark:border-sky-400/40',
  },
  Aprovado_GP: {
    icon: ClipboardCheck,
    className:
      'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-400/40',
  },
  Aguardando_Validacao_TI: {
    icon: ShieldAlert,
    className:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 dark:border-indigo-400/40',
  },
  Aguardando_Comite: {
    icon: Users,
    className:
      'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-400/40',
  },
  Revisao: {
    icon: RefreshCcw,
    className:
      'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/30 dark:border-pink-400/40',
  },
  Aprovado: {
    icon: CheckCircle,
    className:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/40',
  },
  Em_Progresso: {
    icon: PlayCircle,
    className:
      'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 dark:border-sky-400/40',
  },
  Bloqueado: {
    icon: AlertTriangle,
    className:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-400/40',
  },
  Concluido: {
    icon: BadgeCheck,
    className:
      'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-400/40',
  },
  Recusado: {
    icon: XCircle,
    className:
      'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30 dark:border-red-400/40',
  },
  Arquivado: {
    icon: Archive,
    className:
      'bg-muted text-muted-foreground border-muted-foreground/30 dark:border-muted-foreground/20',
  },
};

interface KanbanCardProps {
  id: string;
  codigo: string;
  descricao: string;
  prioridade: string;
  empresa: string;
  status: string;
  horas_estimadas: number | null;
  created_at: string;
  documentos_anexados?: string[] | null;
  hasTIApproval?: boolean;
  hasRiskAssessment?: boolean;
  hasFaseamento?: boolean;
  aprovacao_tecnica_coordenador?: string | null;
  aprovacao_comite_percentual?: number | null;
  regulatorio?: boolean;
  squad?: string | null;
  statusOptions: { id: string; title: string }[];
  onStatusChange: (demandId: string, newStatus: string) => void;
  onViewDemand: (demandId: string) => void;
  onParecerTecnicoTI: (demandId: string) => void;
  onAvaliarRisco: (demandId: string) => void;
  onSolicitarInsumo: (demandId: string) => void;
  onAprovar: (demandId: string) => void;
  onReprovar: (demandId: string) => void;
  onCancelar: (demandId: string) => void;
  onBloquear?: (demandId: string) => void;
  onEdit?: (demandId: string) => void;
  onSolicitarChange?: (demandId: string) => void;
  onAddComment?: (demandId: string) => void;
  onReverterFaseamento?: (demandId: string) => void;
}

export const KanbanCard = ({
  id,
  codigo,
  descricao,
  prioridade,
  empresa,
  status,
  horas_estimadas,
  created_at,
  documentos_anexados,
  hasTIApproval = false,
  hasRiskAssessment = false,
  hasFaseamento = false,
  aprovacao_tecnica_coordenador,
  aprovacao_comite_percentual,
  regulatorio,
  squad,
  statusOptions: _statusOptions,
  onStatusChange,
  onViewDemand,
  onParecerTecnicoTI,
  onAvaliarRisco,
  onSolicitarInsumo,
  onAprovar,
  onReprovar,
  onCancelar,
  onBloquear,
  onEdit,
  onSolicitarChange,
  onAddComment,
  onReverterFaseamento,
}: KanbanCardProps) => {
  const getPrioridadeCor = (prioridade: string) => {
    switch (prioridade) {
      case 'Alta':
        return 'bg-destructive/20 text-destructive';
      case 'Média':
        return 'bg-primary/20 text-primary';
      case 'Baixa':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const demand = {
    id,
    status,
    prioridade,
    aprovacao_tecnica_coordenador,
    aprovacao_comite_percentual,
    regulatorio,
    squad,
  };

  const shouldDisplayBaseAction = (action: ActionKey): boolean => {
    const mappedAction = RULE_ACTION_MAP[action];
    if (!mappedAction) {
      return false;
    }

    if (action === 'approve' && !APPROVABLE_STATUSES.has(status)) {
      return false;
    }

    return isActionAvailable(mappedAction, status, hasTIApproval, hasRiskAssessment);
  };

  const statusSpecificActions = STATUS_ACTIONS[status];

  const orderedActionKeys = statusSpecificActions
    ? statusSpecificActions
    : (() => {
        const baseActions = BASE_ACTION_ORDER.filter(shouldDisplayBaseAction);
        const actionsSet = new Set<ActionKey>(baseActions);

        const additionalActions = ADDITIONAL_ACTIONS_BY_STATUS[status] ?? [];
        additionalActions.forEach((action) => actionsSet.add(action));

        return [...BASE_ACTION_ORDER, ...ADDITIONAL_ACTION_ORDER].filter((action) =>
          actionsSet.has(action)
        );
      })();

  const getMoveAction = (targetStatus: string, label: string, icon: LucideIcon): ActionItem => {
    const validation = validateStatusTransition(demand, targetStatus);

    return {
      key: `move-${targetStatus}`,
      label,
      icon,
      disabled: !validation.allowed,
      disabledReason: !validation.allowed ? validation.message ?? 'Transição não permitida.' : null,
      onSelect: () => {
        if (validation.allowed) {
          onStatusChange(id, targetStatus);
        }
      },
    };
  };

  const buildAction = (action: ActionKey): ActionItem | null => {
    switch (action) {
      case 'view':
        return {
          key: 'view',
          label: 'Ver',
          icon: Eye,
          onSelect: () => onViewDemand(id),
        };
      case 'comment':
        if (!onAddComment) return null;
        return {
          key: 'comment',
          label: 'Comentar',
          icon: MessageSquarePlus,
          onSelect: () => onAddComment(id),
        };
      case 'requestInput': {
        if (!onSolicitarInsumo) return null;
        const enabled = isActionAvailable('solicitar_insumo', status, hasTIApproval, hasRiskAssessment);
        return {
          key: 'requestInput',
          label: 'Solicitar Insumo',
          icon: PackagePlus,
          disabled: !enabled,
          disabledReason: getActionDisabledReason('solicitar_insumo', status, hasTIApproval, hasRiskAssessment),
          onSelect: () => {
            if (enabled) {
              onSolicitarInsumo(id);
            }
          },
        };
      }
      case 'assessRisk': {
        if (!onAvaliarRisco) return null;
        const enabled = isActionAvailable('avaliar_risco', status, hasTIApproval, hasRiskAssessment);
        return {
          key: 'assessRisk',
          label: 'Avaliar Risco',
          icon: ShieldAlert,
          disabled: !enabled,
          disabledReason: getActionDisabledReason('avaliar_risco', status, hasTIApproval, hasRiskAssessment),
          onSelect: () => {
            if (enabled) {
              onAvaliarRisco(id);
            }
          },
        };
      }
      case 'parecerTi': {
        const enabled = isActionAvailable('parecer_tecnico_ti', status, hasTIApproval, hasRiskAssessment);
        return {
          key: 'parecerTi',
          label: 'Solicitar Avaliação TI',
          icon: FileText,
          disabled: !enabled,
          disabledReason: getActionDisabledReason('parecer_tecnico_ti', status, hasTIApproval, hasRiskAssessment),
          onSelect: () => {
            if (enabled) {
              onParecerTecnicoTI(id);
            }
          },
        };
      }
      case 'edit':
        if (!onEdit) return null;
        return {
          key: 'edit',
          label: 'Editar',
          icon: PenSquare,
          onSelect: () => onEdit(id),
        };
      case 'cancel': {
        if (!onCancelar) return null;
        const enabled = isActionAvailable('cancelar', status, hasTIApproval);
        return {
          key: 'cancel',
          label: 'Cancelar',
          icon: Ban,
          className: 'text-destructive focus:text-destructive',
          disabled: !enabled,
          disabledReason: getActionDisabledReason('cancelar', status, hasTIApproval),
          onSelect: () => {
            if (enabled) {
              onCancelar(id);
            }
          },
        };
      }
      case 'moveToStandBy':
        return getMoveAction('StandBy', 'StandBy', PauseCircle);
      case 'moveToBacklog':
        return getMoveAction('Backlog', 'Backlog', ClipboardList);
      case 'revertFaseamento':
        if (status !== 'Aguardando_Validacao_TI' || hasFaseamento || !onReverterFaseamento) {
          return null;
        }
        return {
          key: 'revertFaseamento',
          label: 'Reverter Faseamento TI',
          icon: Undo2,
          onSelect: () => onReverterFaseamento(id),
        };
      case 'approve': {
        if (!onAprovar) return null;
        const enabled = isActionAvailable('aprovar', status, hasTIApproval);
        return {
          key: 'approve',
          label: 'Aprovar',
          icon: CheckCircle,
          className: 'text-accent focus:text-accent',
          disabled: !enabled,
          disabledReason: getActionDisabledReason('aprovar', status, hasTIApproval),
          onSelect: () => {
            if (enabled) {
              onAprovar(id);
            }
          },
        };
      }
      case 'reject': {
        if (!onReprovar) return null;
        const enabled = isActionAvailable('reprovar', status, hasTIApproval);
        return {
          key: 'reject',
          label: 'Reprovar',
          icon: XCircle,
          className: 'text-destructive focus:text-destructive',
          disabled: !enabled,
          disabledReason: getActionDisabledReason('reprovar', status, hasTIApproval),
          onSelect: () => {
            if (enabled) {
              onReprovar(id);
            }
          },
        };
      }
      case 'requestChange':
        if (!onSolicitarChange) return null;
        return {
          key: 'requestChange',
          label: 'Solicitar Alteração',
          icon: RefreshCcw,
          onSelect: () => onSolicitarChange(id),
        };
      case 'start':
        return getMoveAction('Em_Progresso', 'Iniciar', PlayCircle);
      case 'moveToBlocked': {
        if (!onBloquear) {
          return getMoveAction('Bloqueado', 'Bloquear', AlertCircle);
        }

        const validation = validateStatusTransition(demand, 'Bloqueado');

        return {
          key: 'moveToBlocked',
          label: 'Bloquear',
          icon: AlertCircle,
          disabled: !validation.allowed,
          disabledReason: !validation.allowed
            ? validation.message ?? 'Transição não permitida.'
            : null,
          onSelect: () => {
            if (!validation.allowed) {
              return;
            }
            onBloquear(id);
          },
        };
      }
      case 'unblock':
        return getMoveAction('Em_Progresso', 'Desbloquear', Unlock);
      default:
        return null;
    }
  };

  const primaryActions = orderedActionKeys
    .map((action) => buildAction(action))
    .filter((item): item is ActionItem => Boolean(item));

  const formatStatusLabel = (currentStatus: string) =>
    currentStatus
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  const currentStatusTitle =
    _statusOptions.find((option) => option.id === status)?.title ?? formatStatusLabel(status);

  const statusStyle =
    STATUS_STYLES[status] ?? {
      icon: Circle,
      className: 'bg-muted text-muted-foreground border-muted-foreground/30 dark:border-muted-foreground/20',
    };

  const StatusIcon = statusStyle.icon;

  return (
    <Card className="hover:shadow-md transition-shadow bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{codigo}</CardTitle>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium capitalize gap-1.5 px-3 py-1',
                statusStyle.className,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              <span>{currentStatusTitle}</span>
            </Badge>
           
            {status === 'Aprovado_GP' && hasFaseamento && (
              <Badge
                className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
                variant="outline"
              >
                <Send className="w-3 h-3 mr-1" />
                Avaliação TI
              </Badge>
            )}
            <DependencyIndicator
              demandId={id}
              codigo={codigo}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prioridade
            </span>
            <Badge className={`${getPrioridadeCor(prioridade)} capitalize`} variant="outline">
              {prioridade}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <TooltipProvider>
                {primaryActions.map((item) => {
                  const menuItem = (
                    <DropdownMenuItem
                      key={item.key}
                      className={`flex items-center gap-2 ${item.className ?? ''}`}
                      disabled={item.disabled}
                      onSelect={(event) => {
                        if (item.disabled) {
                          event.preventDefault();
                          return;
                        }
                        item.onSelect();
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );

                  if (item.disabled && item.disabledReason) {
                    return (
                      <Tooltip key={item.key}>
                        <TooltipTrigger asChild>
                          <div>{menuItem}</div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">{item.disabledReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return menuItem;
                })}

              </TooltipProvider>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-line break-words">
          {descricao}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{getDaysAgo(created_at)}d atrás</span>
            </div>
            {documentos_anexados && documentos_anexados.length > 0 && (
              <div className="flex items-center gap-1 text-primary">
                <Paperclip className="w-3 h-3" />
                <span>{documentos_anexados.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {horas_estimadas && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{horas_estimadas}h</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
