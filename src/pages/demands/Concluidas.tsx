import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Calendar, Filter, Building2, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EMPRESAS, SQUADS } from '@/types/demand';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Concluidas = () => {
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('all');
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [availableSquadsOptions, setAvailableSquadsOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    fetchCompletedDemands();
  }, [selectedEmpresa, selectedSquad]);

  useEffect(() => {
    // Reset squad ao mudar empresa
    setSelectedSquad('all');
  }, [selectedEmpresa]);

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

  const fetchCompletedDemands = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('demands')
        .select('*')
        .eq('status', 'Concluido')
        .order('data_conclusao', { ascending: false });

      if (selectedEmpresa !== 'all') {
        query = query.eq('empresa', selectedEmpresa as any);
      }

      if (selectedSquad !== 'all') {
        query = query.eq('squad', selectedSquad);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDemands(data || []);
    } catch (error) {
      console.error('Error fetching completed demands:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedEmpresa('all');
    setSelectedSquad('all');
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  const empresasFilter = [
    { value: 'all', label: 'Todas as Empresas' },
    ...[...EMPRESAS]
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }))
      .map((e) => ({ value: e.value, label: e.label })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-accent" />
          Demandas Concluídas
        </h1>
        <p className="text-muted-foreground">
          Histórico completo de demandas finalizadas com sucesso
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {empresasFilter.map((empresa) => (
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Demandas Finalizadas
            <Badge variant="secondary" className="ml-auto">
              {demands.length} {demands.length === 1 ? 'demanda' : 'demandas'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demands.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Nenhuma demanda concluída encontrada
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {demands.map((demand) => (
                  <Card key={demand.id} className="bg-background/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="font-mono">
                              {demand.codigo}
                            </Badge>
                            <Badge variant="outline">{demand.empresa}</Badge>
                            {demand.squad && (
                              <Badge variant="outline" className="text-xs">
                                {demand.squad}
                              </Badge>
                            )}
                            <Badge className="bg-green-500/20 text-green-700">
                              Concluído
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {demand.descricao}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {demand.data_conclusao && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Concluído em</p>
                              <p className="font-medium">
                                {format(new Date(demand.data_conclusao), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                        {demand.horas_estimadas && (
                          <div>
                            <p className="text-muted-foreground">Horas</p>
                            <p className="font-medium">{demand.horas_estimadas}h</p>
                          </div>
                        )}
                        {demand.custo_estimado && (
                          <div>
                            <p className="text-muted-foreground">Custo</p>
                            <p className="font-medium">
                              R$ {demand.custo_estimado.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Prioridade</p>
                          <Badge variant="outline" className="text-xs">
                            {demand.prioridade}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Concluidas;
