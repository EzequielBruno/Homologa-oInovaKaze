import type { Ref } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './KanbanCard';

interface Demand {
  id: string;
  codigo: string;
  descricao: string;
  prioridade: string;
  empresa: string;
  status: string;
  horas_estimadas: number | null;
  created_at: string;
  aprovacao_tecnica_coordenador?: string | null;
  aprovacao_comite_percentual?: number | null;
  regulatorio?: boolean;
  squad?: string | null;
  has_faseamento?: boolean;
}

interface KanbanColumnProps {
  title: string;
  demands: Demand[];
  statusOptions: { id: string; title: string }[];
  onStatusChange: (demandId: string, newStatus: string) => void;
  onViewDemand: (demandId: string) => void;
  onParecerTecnicoTI: (demandId: string) => void;
  onAvaliarRisco: (demandId: string) => void;
  onSolicitarInsumo: (demandId: string) => void;
  onAprovar: (demandId: string) => void;
  onReprovar: (demandId: string) => void;
  onCancelar: (demandId: string) => void;
  onEdit?: (demandId: string) => void;
  onSolicitarChange?: (demandId: string) => void;
  onAddComment?: (demandId: string) => void;
  onReverterFaseamento?: (demandId: string) => void;
  columnRef?: Ref<HTMLDivElement>;
}

export const KanbanColumn = ({
  title,
  demands,
  statusOptions,
  onStatusChange,
  onViewDemand,
  onParecerTecnicoTI,
  onAvaliarRisco,
  onSolicitarInsumo,
  onAprovar,
  onReprovar,
  onCancelar,
  onEdit,
  onSolicitarChange,
  onAddComment,
  onReverterFaseamento,
  columnRef,
}: KanbanColumnProps) => {
  return (
    <div
      ref={columnRef}
      className="flex-shrink-0 w-full min-w-[280px] sm:w-72 md:w-80 lg:w-96 snap-start px-1"
    >
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <Badge variant="secondary">{demands.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-3 min-h-[200px]">
            {demands.map((demand) => (
              <KanbanCard
                key={demand.id}
                id={demand.id}
                codigo={demand.codigo}
                descricao={demand.descricao}
                prioridade={demand.prioridade}
                empresa={demand.empresa}
                horas_estimadas={demand.horas_estimadas}
                created_at={demand.created_at}
                status={demand.status}
                hasTIApproval={Boolean(demand.aprovacao_tecnica_coordenador)}
                hasFaseamento={Boolean(demand.has_faseamento)}
                aprovacao_tecnica_coordenador={demand.aprovacao_tecnica_coordenador}
                aprovacao_comite_percentual={demand.aprovacao_comite_percentual}
                regulatorio={demand.regulatorio}
                squad={demand.squad}
                statusOptions={statusOptions}
                onStatusChange={onStatusChange}
                onViewDemand={onViewDemand}
                onParecerTecnicoTI={onParecerTecnicoTI}
                onAvaliarRisco={onAvaliarRisco}
                onSolicitarInsumo={onSolicitarInsumo}
                onAprovar={onAprovar}
                onReprovar={onReprovar}
                onCancelar={onCancelar}
                onEdit={onEdit}
                onSolicitarChange={onSolicitarChange}
                onAddComment={onAddComment}
                onReverterFaseamento={onReverterFaseamento}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
