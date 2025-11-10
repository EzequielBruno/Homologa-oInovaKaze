import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { PlayCircle, Eye, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DemandDetailsDialog } from '@/components/demands/DemandDetailsDialog';
import { SQUADS } from '@/types/demand';

type SortField = 'codigo' | 'descricao' | 'departamento' | 'squad' | 'prioridade' | 'horas_estimadas' | 'created_at';
type SortDirection = 'asc' | 'desc' | null;

const empresaNames: Record<string, string> = {
  'zs': 'Zema Seguros',
  'zc': 'Zema Consórcio',
  'eletro': 'Eletrozema',
  'zf': 'Zema Financeira'
};

const empresaCodes: Record<string, string> = {
  'zs': 'ZS',
  'zc': 'ZC',
  'eletro': 'Eletro',
  'zf': 'ZF'
};

const SprintAtual = () => {
  const { empresa } = useParams<{ empresa: string }>();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [availableSquads, setAvailableSquads] = useState<string[]>([]);
  
  // Filtros
  const [filterSquad, setFilterSquad] = useState<string>('');
  const [filterSolicitante, setFilterSolicitante] = useState<string>('');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('');
  
  // Ordenação
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    if (empresa) {
      fetchInProgressDemands();
      loadSquads();
    }
  }, [empresa]);

  const loadSquads = async () => {
    if (!empresa) return;
    
    const empresaCode = empresaCodes[empresa.toLowerCase()];
    if (!empresaCode) return;

    try {
      const defaultSquads = SQUADS[empresaCode] || [];
      
      const { data: customSquads } = await supabase
        .from('squads')
        .select('nome')
        .eq('empresa', empresaCode)
        .eq('ativo', true);

      const { data: inactiveSquads } = await supabase
        .from('squads')
        .select('nome')
        .eq('empresa', empresaCode)
        .eq('ativo', false);

      const inactiveSet = new Set(inactiveSquads?.map(s => s.nome) || []);
      const activeDefaults = defaultSquads.filter(s => !inactiveSet.has(s));
      const customs = customSquads?.map(s => s.nome) || [];
      const combined = [...activeDefaults, ...customs];
      
      const sortedCombined = Array.from(new Set(combined)).sort((a, b) =>
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
      );
      setAvailableSquads(['Avaliar', ...sortedCombined]);
    } catch (error) {
      console.error('Erro ao carregar squads:', error);
      const empresaCode = empresaCodes[empresa.toLowerCase()];
      const fallbackSquads = [...(SQUADS[empresaCode] || [])].sort((a, b) =>
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
      );
      setAvailableSquads(['Avaliar', ...fallbackSquads]);
    }
  };

  const fetchInProgressDemands = async () => {
    if (!empresa) return;

    setLoading(true);
    try {
      const empresaCode = empresaCodes[empresa.toLowerCase()];
      if (!empresaCode) {
        console.log('Empresa code not found for:', empresa);
        setLoading(false);
        return;
      }
      
      console.log('Fetching demands for empresa:', empresaCode);
      
      const { data, error } = await supabase
        .from('demands')
        .select('*, profiles:solicitante_id(full_name)')
        .eq('status', 'Em_Progresso')
        .eq('empresa', empresaCode as 'ZS' | 'ZC' | 'Eletro' | 'ZF')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Demands fetched:', data?.length);
      setDemands(data || []);
    } catch (error) {
      console.error('Error fetching in progress demands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (demandId: string) => {
    setSelectedDemandId(demandId);
    setDetailsOpen(true);
  };

  const handleClearFilters = () => {
    setFilterSquad('');
    setFilterSolicitante('');
    setFilterPrioridade('');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4 ml-1" />;
    return <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // Listas únicas para os filtros
  const uniqueSquads = useMemo(() => {
    const squads = demands.map(d => d.squad).filter(Boolean);
    return [...new Set(squads)].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [demands]);

  const uniqueSolicitantes = useMemo(() => {
    const solicitantes = demands.map(d => d.profiles?.full_name).filter(Boolean);
    return [...new Set(solicitantes)].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }, [demands]);

  const prioridades = useMemo(() => {
    const values = demands.map(demand => demand.prioridade).filter(Boolean) as string[];
    return Array.from(new Set(values)).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [demands]);

  // Aplicar filtros e ordenação
  const filteredDemands = useMemo(() => {
    let filtered = demands.filter(demand => {
      if (filterSquad && demand.squad !== filterSquad) return false;
      if (filterSolicitante && demand.profiles?.full_name !== filterSolicitante) return false;
      if (filterPrioridade && demand.prioridade !== filterPrioridade) return false;
      return true;
    });

    // Aplicar ordenação
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Tratamento especial para diferentes tipos de campos
        if (sortField === 'prioridade') {
          const prioOrder = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
          aVal = prioOrder[aVal as keyof typeof prioOrder] || 0;
          bVal = prioOrder[bVal as keyof typeof prioOrder] || 0;
        } else if (sortField === 'horas_estimadas') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (sortField === 'created_at') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        } else {
          aVal = String(aVal || '').toLowerCase();
          bVal = String(bVal || '').toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [demands, filterSquad, filterSolicitante, filterPrioridade, sortField, sortDirection]);

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  const empresaName = empresa ? empresaNames[empresa.toLowerCase()] : '';
  const hasActiveFilters = filterSquad || filterSolicitante || filterPrioridade;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <PlayCircle className="w-8 h-8 text-secondary" />
          Sprint Atual - {empresaName}
        </h1>
        <p className="text-muted-foreground">
          Demandas atualmente em desenvolvimento na sprint
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Squad
            </label>
            <Select value={filterSquad} onValueChange={setFilterSquad}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as squads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as squads</SelectItem>
                {availableSquads.map(squad => (
                  <SelectItem key={squad} value={squad}>{squad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Solicitante
            </label>
            <Select value={filterSolicitante} onValueChange={setFilterSolicitante}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os solicitantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os solicitantes</SelectItem>
                {uniqueSolicitantes.map(solicitante => (
                  <SelectItem key={solicitante} value={solicitante}>{solicitante}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Prioridade
            </label>
            <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                {prioridades.map(prioridade => (
                  <SelectItem key={prioridade} value={prioridade}>{prioridade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('codigo')} className="hover:bg-transparent p-0 h-auto font-medium">
                  Código {getSortIcon('codigo')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('descricao')} className="hover:bg-transparent p-0 h-auto font-medium">
                  Descrição {getSortIcon('descricao')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('departamento')} className="hover:bg-transparent p-0 h-auto font-medium">
                  Departamento {getSortIcon('departamento')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('squad')} className="hover:bg-transparent p-0 h-auto font-medium">
                  Squad {getSortIcon('squad')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('prioridade')} className="hover:bg-transparent p-0 h-auto font-medium">
                  Prioridade {getSortIcon('prioridade')}
                </Button>
              </TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('horas_estimadas')} className="hover:bg-transparent p-0 h-auto font-medium">
                  Horas Est. {getSortIcon('horas_estimadas')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('created_at')} className="hover:bg-transparent p-0 h-auto font-medium">
                  Data Criação {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDemands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  {demands.length === 0 ? 'Nenhuma demanda em progresso' : 'Nenhuma demanda encontrada com os filtros aplicados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDemands.map((demand) => (
                <TableRow key={demand.id}>
                  <TableCell className="font-medium">{demand.codigo}</TableCell>
                  <TableCell className="max-w-xs truncate">{demand.descricao}</TableCell>
                  <TableCell>{demand.setor || demand.departamento}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{demand.squad || '-'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={demand.prioridade === 'Alta' ? 'destructive' : demand.prioridade === 'Média' ? 'default' : 'secondary'}>
                      {demand.prioridade}
                    </Badge>
                  </TableCell>
                  <TableCell>{demand.profiles?.full_name || '-'}</TableCell>
                  <TableCell>{demand.horas_estimadas || '-'}h</TableCell>
                  <TableCell>
                    {format(new Date(demand.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(demand.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DemandDetailsDialog
        demandId={selectedDemandId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};

export default SprintAtual;
