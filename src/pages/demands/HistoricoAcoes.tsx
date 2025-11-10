import { useState, useEffect } from 'react';
import { History, Filter, Calendar as CalendarIcon, Building2, Users, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EMPRESAS, SQUADS } from '@/types/demand';

interface HistoryEntry {
  id: string;
  action: string;
  descricao: string;
  created_at: string;
  user_id: string;
  demand_id: string;
  demands: {
    codigo: string;
    empresa: string;
    squad: string | null;
  };
  userName?: string;
  dados_anteriores?: any;
  dados_novos?: any;
}

const EMPRESAS_FILTER = [
  { value: 'all', label: 'Todas as Empresas' },
  ...EMPRESAS.map((e) => ({ value: e.value, label: e.label })),
];

const STATUS_FILTER = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'aprovar', label: 'Aprovado' },
  { value: 'reprovar', label: 'Recusada' },
  { value: 'solicitar_insumo', label: 'Insumo Solicitado' },
  { value: 'arquivar', label: 'Arquivado' },
  { value: 'reativar', label: 'Reaberta' },
  { value: 'mudar_status', label: 'Pendente de Aprovação Comitê' },
  { value: 'solicitar_atualizacao', label: 'Atualização Solicitada' },
  { value: 'atribuir_responsavel', label: 'Responsável Atribuído' },
  { value: 'solicitar_change', label: 'Change Solicitada' },
  { value: 'registrar_daily', label: 'Daily Registrada' },
  { value: 'mudanca_escopo', label: 'Mudança de Escopo' },
];

const HistoricoAcoes = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('all');
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableSquadsOptions, setAvailableSquadsOptions] = useState<Array<{ value: string; label: string }>>([]);

  const normalizeHistoryData = (data: any): Record<string, any> => {
    if (!data) return {};

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, any>;
        }
        return { valor: parsed } as Record<string, any>;
      } catch (error) {
        return { valor: data } as Record<string, any>;
      }
    }

    if (typeof data === 'object') {
      return data as Record<string, any>;
    }

    return { valor: data } as Record<string, any>;
  };

  const formatChangeValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        return String(value);
      }
    }

    return String(value);
  };

  const getChangeDetails = (entry: HistoryEntry) => {
    const previous = normalizeHistoryData(entry.dados_anteriores);
    const next = normalizeHistoryData(entry.dados_novos);

    const keys = Array.from(new Set([...Object.keys(previous || {}), ...Object.keys(next || {})]));

    return keys
      .map((key) => {
        const prevValue = previous ? previous[key] : undefined;
        const nextValue = next ? next[key] : undefined;

        if (JSON.stringify(prevValue) === JSON.stringify(nextValue)) {
          return null;
        }

        return {
          key,
          previous: prevValue,
          next: nextValue,
        };
      })
      .filter((item): item is { key: string; previous: any; next: any } => Boolean(item));
  };

  useEffect(() => {
    // Reset squad quando mudar empresa
    setSelectedSquad('all');
  }, [selectedEmpresa]);

  useEffect(() => {
    loadHistory();
  }, [selectedEmpresa, selectedSquad, selectedStatus, selectedMonth]);

  useEffect(() => {
    const loadSquads = async () => {
      try {
        // Carregar todas as squads customizadas
        const { data: customSquads, error } = await supabase
          .from('squads')
          .select('nome, empresa, ativo')
          .eq('ativo', true);

        if (error) throw error;

        const customSquadsByEmpresa: Record<string, string[]> = {};
        customSquads?.forEach(sq => {
          if (!customSquadsByEmpresa[sq.empresa]) {
            customSquadsByEmpresa[sq.empresa] = [];
          }
          customSquadsByEmpresa[sq.empresa].push(sq.nome);
        });

        // Buscar squads padrão que foram desativadas
        const { data: allInactiveSquads } = await supabase
          .from('squads')
          .select('nome, empresa')
          .eq('ativo', false);

        const inactiveSquadsByEmpresa: Record<string, Set<string>> = {};
        allInactiveSquads?.forEach(sq => {
          if (!inactiveSquadsByEmpresa[sq.empresa]) {
            inactiveSquadsByEmpresa[sq.empresa] = new Set();
          }
          inactiveSquadsByEmpresa[sq.empresa].add(sq.nome);
        });

        if (selectedEmpresa === 'all') {
          const allSquads = new Set<string>();
          
          // Adicionar squads padrão (removendo as inativas)
          Object.entries(SQUADS).forEach(([empresa, squads]) => {
            const inactiveSet = inactiveSquadsByEmpresa[empresa] || new Set();
            squads.forEach((squad) => {
              if (!inactiveSet.has(squad)) {
                allSquads.add(squad);
              }
            });
          });
          
          // Adicionar squads customizadas
          Object.values(customSquadsByEmpresa).forEach(squads => {
            squads.forEach(squad => allSquads.add(squad));
          });

          const sortedSquads = Array.from(allSquads).sort((a, b) =>
            a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
          );
          setAvailableSquadsOptions([
            { value: 'all', label: 'Todos os Squads' },
            { value: 'Avaliar', label: 'Avaliar' },
            ...sortedSquads.map((squad) => ({ value: squad, label: squad })),
          ]);
        } else {
          const defaultSquads = SQUADS[selectedEmpresa] || [];
          const inactiveSet = inactiveSquadsByEmpresa[selectedEmpresa] || new Set();
          const customEmpresaSquads = customSquadsByEmpresa[selectedEmpresa] || [];
          
          const activeDefaultSquads = defaultSquads.filter(s => !inactiveSet.has(s));
          const combined = [...activeDefaultSquads, ...customEmpresaSquads];
          const unique = Array.from(new Set(combined)).sort((a, b) =>
            a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
          );

          setAvailableSquadsOptions([
            { value: 'all', label: 'Todos os Squads' },
            { value: 'Avaliar', label: 'Avaliar' },
            ...unique.map((squad) => ({ value: squad, label: squad })),
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar squads:', error);
        // Fallback para squads padrão
        if (selectedEmpresa === 'all') {
          const allSquads = new Set<string>();
          Object.values(SQUADS).forEach((squads) => {
            squads.forEach((squad) => allSquads.add(squad));
          });
          const sortedSquads = Array.from(allSquads).sort((a, b) =>
            a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
          );
          setAvailableSquadsOptions([
            { value: 'all', label: 'Todos os Squads' },
            { value: 'Avaliar', label: 'Avaliar' },
            ...sortedSquads.map((squad) => ({ value: squad, label: squad })),
          ]);
        } else {
          const squads = SQUADS[selectedEmpresa] || [];
          const sortedSquads = [...squads].sort((a, b) =>
            a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
          );
          setAvailableSquadsOptions([
            { value: 'all', label: 'Todos os Squads' },
            { value: 'Avaliar', label: 'Avaliar' },
            ...sortedSquads.map((squad) => ({ value: squad, label: squad })),
          ]);
        }
      }
    };

    loadSquads();
  }, [selectedEmpresa]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      let query = supabase
        .from('demand_history')
        .select(
          `
          *,
          demands!inner (
            codigo,
            empresa,
            squad
          )
        `
        )
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (selectedEmpresa !== 'all') {
        query = query.eq('demands.empresa', selectedEmpresa as any);
      }

      if (selectedSquad !== 'all') {
        query = query.eq('demands.squad', selectedSquad);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('action', selectedStatus as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Load user profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((entry: any) => entry.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

        const enrichedData = data.map((entry: any) => ({
          ...entry,
          userName: profileMap.get(entry.user_id) || 'Usuário desconhecido',
        }));

        setHistory(enrichedData);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
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
      solicitar_atualizacao: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
      atribuir_responsavel: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      solicitar_change: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
      registrar_daily: 'bg-teal-500/20 text-teal-700 dark:text-teal-400',
      mudanca_escopo: 'bg-pink-500/20 text-pink-700 dark:text-pink-400',
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
      solicitar_atualizacao: 'Atualização Solicitada',
      atribuir_responsavel: 'Responsável Atribuído',
      solicitar_change: 'Change Solicitada',
      registrar_daily: 'Daily Registrada',
      mudanca_escopo: 'Mudança de Escopo',
    };
    return labels[action] || action;
  };

  const clearFilters = () => {
    setSelectedEmpresa('all');
    setSelectedSquad('all');
    setSelectedStatus('all');
    setSelectedMonth(new Date());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          Histórico de Ações
        </h1>
        <p className="text-muted-foreground">
          Visualize todas as ações realizadas nas demandas com filtros avançados
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto text-xs"
              >
                Limpar filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro de Empresa */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </label>
                <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPRESAS_FILTER.map((empresa) => (
                      <SelectItem key={empresa.value} value={empresa.value}>
                        {empresa.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Squad */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Squad
                </label>
                <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSquadsOptions.map((squad) => (
                      <SelectItem key={squad.value} value={squad.value}>
                        {squad.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Status
                </label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Mês */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Período
                </label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedMonth(date);
                          setShowCalendar(false);
                        }
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">
                Nenhuma ação encontrada com os filtros selecionados
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {history.length} {history.length === 1 ? 'ação encontrada' : 'ações encontradas'}
                </p>
              </div>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="mt-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <History className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getActionColor(entry.action)} variant="outline">
                                {getActionLabel(entry.action)}
                              </Badge>
                              <Badge variant="secondary">
                                {entry.demands.codigo}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {entry.demands.empresa}
                              </span>
                              {entry.demands.squad && (
                                <span className="text-xs text-muted-foreground">
                                  • {entry.demands.squad}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium">{entry.userName}</p>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            {format(new Date(entry.created_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                            <br />
                            {format(new Date(entry.created_at), "HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                        <p className="text-sm text-foreground">{entry.descricao}</p>
                        {(() => {
                          const changes = getChangeDetails(entry);
                          if (changes.length === 0) return null;

                          return (
                            <div className="rounded-lg border bg-muted/30 p-3">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">
                                Detalhes da alteração
                              </p>
                              <div className="mt-3 space-y-3">
                                {changes.map((change) => (
                                  <div
                                    key={`${entry.id}-${change.key}`}
                                    className="grid gap-2 sm:grid-cols-[160px,1fr,1fr]"
                                  >
                                    <div className="text-xs font-semibold uppercase text-muted-foreground break-words">
                                      {change.key}
                                    </div>
                                    <div className="rounded border bg-background p-2 text-xs whitespace-pre-wrap break-words">
                                      {formatChangeValue(change.previous)}
                                    </div>
                                    <div className="rounded border border-primary/40 bg-primary/5 p-2 text-xs whitespace-pre-wrap break-words">
                                      {formatChangeValue(change.next)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricoAcoes;
