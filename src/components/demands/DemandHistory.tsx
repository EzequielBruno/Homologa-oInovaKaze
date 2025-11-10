import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryEntry {
  id: string;
  action: string;
  descricao: string;
  created_at: string;
  user_id: string;
  dados_anteriores: any;
  dados_novos: any;
}

interface DemandHistoryProps {
  demandId: string;
}

export const DemandHistory = ({ demandId }: DemandHistoryProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('demand_history_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'demand_history',
          filter: `demand_id=eq.${demandId}`,
        },
        () => {
          loadHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demandId]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('demand_history')
        .select('*')
        .eq('demand_id', demandId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load user profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((entry) => entry.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

        const enrichedData = data.map((entry) => ({
          ...entry,
          userName: profileMap.get(entry.user_id) || 'Usuário desconhecido',
        }));

        setHistory(enrichedData as any);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      criar: 'bg-green-500/20 text-green-700 dark:text-green-400',
      editar: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      reativar: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400',
      excluir: 'bg-red-500/20 text-red-700 dark:text-red-400',
      cancelar: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
      arquivar: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
      aprovar: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
      reprovar: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
      mudar_status: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
      adicionar_fase: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
      atualizar_fase: 'bg-violet-500/20 text-violet-700 dark:text-violet-400',
      solicitar_insumo: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
      enviar_notificacao: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
      solicitar_aprovacao_gerente: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
      aprovar_gerente: 'bg-green-500/20 text-green-700 dark:text-green-400',
      recusar_gerente: 'bg-red-500/20 text-red-700 dark:text-red-400',
      aprovar_comite: 'bg-teal-500/20 text-teal-700 dark:text-teal-400',
      recusar_comite: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
      aprovar_ti: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      recusar_ti: 'bg-pink-500/20 text-pink-700 dark:text-pink-400',
    };
    return colors[action] || 'bg-muted text-muted-foreground';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      criar: 'Criada',
      editar: 'Editada',
      reativar: 'Reativada',
      excluir: 'Excluída',
      cancelar: 'Cancelada',
      arquivar: 'Arquivada',
      aprovar: 'Aprovada',
      reprovar: 'Reprovada',
      mudar_status: 'Status Alterado',
      adicionar_fase: 'Fase Adicionada',
      atualizar_fase: 'Fase Atualizada',
      solicitar_insumo: 'Insumo Solicitado',
      enviar_notificacao: 'Notificação Enviada',
      solicitar_aprovacao_gerente: 'Solicitação de Aprovação - Gerente',
      aprovar_gerente: 'Aprovação - Gerente',
      recusar_gerente: 'Recusa - Gerente',
      aprovar_comite: 'Aprovação - Comitê',
      recusar_comite: 'Recusa - Comitê',
      aprovar_ti: 'Aprovação - TI',
      recusar_ti: 'Recusa - TI',
    };
    return labels[action] || action;
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Carregando histórico...</div>;
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            Nenhuma ação registrada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Ações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge className={getActionColor(entry.action)} variant="outline">
                        {getActionLabel(entry.action)}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {(entry as any).userName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{entry.descricao}</p>
                  {(entry.dados_anteriores || entry.dados_novos) && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver detalhes
                      </summary>
                      <div className="mt-2 p-2 bg-muted rounded-lg space-y-1">
                        {entry.dados_anteriores && (
                          <div>
                            <span className="font-semibold">Antes:</span>{' '}
                            <code className="text-xs">
                              {JSON.stringify(entry.dados_anteriores, null, 2)}
                            </code>
                          </div>
                        )}
                        {entry.dados_novos && (
                          <div>
                            <span className="font-semibold">Depois:</span>{' '}
                            <code className="text-xs">
                              {JSON.stringify(entry.dados_novos, null, 2)}
                            </code>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
