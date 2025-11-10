import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, GitBranch, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DependencyIndicatorProps {
  demandId: string;
  codigo: string;
}

interface Dependency {
  id: string;
  depends_on_codigo: string;
  depends_on_status: string;
  tipo_dependencia: string;
  descricao: string | null;
}

interface BlockedBy {
  id: string;
  blocking_codigo: string;
  blocking_status: string;
  tipo_dependencia: string;
  descricao: string | null;
}

export const DependencyIndicator = ({ demandId, codigo }: DependencyIndicatorProps) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [blockedBy, setBlockedBy] = useState<BlockedBy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDependencies();
  }, [demandId]);

  const loadDependencies = async () => {
    try {
      // Buscar demandas das quais esta depende
      const { data: depsData } = await supabase
        .from('demand_dependencies')
        .select(`
          id,
          tipo_dependencia,
          descricao,
          depends_on:depends_on_demand_id (
            codigo,
            status
          )
        `)
        .eq('demand_id', demandId);

      // Buscar demandas que dependem desta
      const { data: blockers } = await supabase
        .from('demand_dependencies')
        .select(`
          id,
          tipo_dependencia,
          descricao,
          blocking:demand_id (
            codigo,
            status
          )
        `)
        .eq('depends_on_demand_id', demandId);

      const deps: Dependency[] = (depsData || []).map((d: any) => ({
        id: d.id,
        depends_on_codigo: d.depends_on?.codigo || 'N/A',
        depends_on_status: d.depends_on?.status || 'N/A',
        tipo_dependencia: d.tipo_dependencia,
        descricao: d.descricao,
      }));

      const blocked: BlockedBy[] = (blockers || []).map((b: any) => ({
        id: b.id,
        blocking_codigo: b.blocking?.codigo || 'N/A',
        blocking_status: b.blocking?.status || 'N/A',
        tipo_dependencia: b.tipo_dependencia,
        descricao: b.descricao,
      }));

      setDependencies(deps);
      setBlockedBy(blocked);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || (dependencies.length === 0 && blockedBy.length === 0)) {
    return null;
  }

  const hasBlockingDeps = dependencies.some(
    d => d.depends_on_status !== 'Concluido' && d.depends_on_status !== 'Aprovado'
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={hasBlockingDeps ? 'destructive' : 'secondary'}
            className="text-xs gap-1 cursor-help"
          >
            {hasBlockingDeps ? (
              <Lock className="h-3 w-3" />
            ) : (
              <GitBranch className="h-3 w-3" />
            )}
            {dependencies.length + blockedBy.length}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            {dependencies.length > 0 && (
              <div>
                <p className="font-semibold text-xs mb-1">Depende de:</p>
                {dependencies.map((dep) => (
                  <div key={dep.id} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{dep.depends_on_codigo}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1 py-0 h-4 ${
                          dep.depends_on_status === 'Concluido' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                        }`}
                      >
                        {dep.depends_on_status}
                      </Badge>
                    </div>
                    {dep.descricao && (
                      <p className="text-muted-foreground text-[10px]">{dep.descricao}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {blockedBy.length > 0 && (
              <div>
                <p className="font-semibold text-xs mb-1">Bloqueia:</p>
                {blockedBy.map((block) => (
                  <div key={block.id} className="text-xs">
                    <span className="font-medium">{block.blocking_codigo}</span>
                    {block.descricao && (
                      <p className="text-muted-foreground text-[10px]">{block.descricao}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {hasBlockingDeps && (
              <div className="flex items-start gap-1 pt-1 border-t border-border">
                <AlertCircle className="h-3 w-3 text-destructive mt-0.5" />
                <p className="text-[10px] text-destructive">
                  Possui dependências não concluídas
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
