import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

interface PhaseGroup {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  columns: string[];
}

export const PHASE_GROUPS: PhaseGroup[] = [
  {
    id: 'planning',
    title: 'Planejamento',
    icon: '📋',
    color: 'bg-slate-500/10 border-slate-500/20',
    description: 'Demandas em planejamento inicial',
    columns: ['StandBy', 'Backlog']
  },
  {
    id: 'approval',
    title: 'Aprovações',
    icon: '✓',
    color: 'bg-yellow-500/10 border-yellow-500/20',
    description: 'Processos de aprovação e validação',
    columns: ['Aguardando_Gerente', 'Aprovado_GP', 'Aguardando_Comite', 'Aprovado']
  },
  {
    id: 'execution',
    title: 'Execução',
    icon: '⚡',
    color: 'bg-blue-500/10 border-blue-500/20',
    description: 'Demandas em desenvolvimento',
    columns: ['Em_Progresso', 'Bloqueado']
  },
  {
    id: 'final',
    title: 'Finalização',
    icon: '🏁',
    color: 'bg-green-500/10 border-green-500/20',
    description: 'Demandas finalizadas ou canceladas',
    columns: ['Concluido', 'Recusado', 'Arquivado']
  }
];

interface PhaseGroupCardProps {
  group: PhaseGroup;
  demandCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export const PhaseGroupCard = ({
  group,
  demandCount,
  isExpanded,
  onToggle,
  children
}: PhaseGroupCardProps) => {
  return (
    <div className="space-y-2">
      {/* Cabeçalho do grupo */}
      <Card 
        className={`${group.color} cursor-pointer transition-all hover:shadow-md`}
        onClick={onToggle}
      >
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{group.icon}</span>
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {group.title}
                  <Badge variant="secondary" className="text-xs">
                    {demandCount}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
              </div>
            </div>
            <ChevronRight 
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Colunas do grupo */}
      {isExpanded && (
        <div className="ml-4 pl-4 border-l-2 border-border">
          {children}
        </div>
      )}
    </div>
  );
};

export const getPhaseGroupForColumn = (columnId: string): PhaseGroup | null => {
  return PHASE_GROUPS.find(group => group.columns.includes(columnId)) || null;
};
