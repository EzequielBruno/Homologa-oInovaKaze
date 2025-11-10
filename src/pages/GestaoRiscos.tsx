import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RiskAssessmentDialog } from '@/components/risk/RiskAssessmentDialog';
import { RiskMatrix } from '@/components/risk/RiskMatrix';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Clock, ArrowUpDown, ArrowUp, ArrowDown, X, Eye } from 'lucide-react';
import { EMPRESAS } from '@/types/demand';
import { EMPRESA_URL_MAP } from '@/types/demand';
import { format } from 'date-fns';
import { DemandDetailsDialog } from '@/components/demands/DemandDetailsDialog';

interface Demand {
  id: string;
  codigo: string;
  descricao: string;
  squad: string;
  prioridade: string;
  status: string;
  classificacao: string;
  data_limite_regulatorio: string | null;
  empresa: string;
  created_at: string;
}

interface RiskAssessment {
  id: string;
  indice_risco: number;
  status: string;
  probabilidade: string;
  impacto: string;
  classificacao_gerente: string;
}

interface ProjectManager {
  nome: string;
  empresa: string;
}

export default function GestaoRiscos() {
  const { user } = useAuth();
  const { empresa } = useParams<{ empresa: string }>();
  const empresaSelecionada = EMPRESA_URL_MAP[empresa?.toLowerCase() || ''] || '';
  
  // Mapeamento de nomes para exibição
  const getNomeEmpresa = (empresaCode: string) => {
    const empresaInfo = EMPRESAS.find(e => e.value === empresaCode);
    return empresaInfo?.label || empresaCode;
  };
  
  const [demandas, setDemandas] = useState<Demand[]>([]);
  const [demandasFiltradas, setDemandasFiltradas] = useState<Demand[]>([]);
  const [gerenteResponsavel, setGerenteResponsavel] = useState<ProjectManager | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [riskAssessments, setRiskAssessments] = useState<Record<string, RiskAssessment>>({});
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [squadFilter, setSquadFilter] = useState('');
  const [squads, setSquads] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statuses, setStatuses] = useState<string[]>([]);

  const formatStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      Backlog: 'Backlog',
      Aprovado_GP: 'Aprovado GP',
      Aguardando_Gerente: 'Aguardando Gerente',
      Aguardando_Comite: 'Aguardando Comitê',
      Aprovado: 'Aprovado',
      Em_Progresso: 'Em Progresso',
      Revisao: 'Revisão',
      Concluido: 'Concluído',
      StandBy: 'Stand By',
      Bloqueado: 'Bloqueado',
      Nao_Entregue: 'Não Entregue',
      Arquivado: 'Arquivado',
    };
    return statusLabels[status] || status?.replace(/_/g, ' ');
  };

  useEffect(() => {
    if (empresaSelecionada) {
      loadData();
    }
  }, [empresaSelecionada, user]);

  useEffect(() => {
    filtrarDemandas();
  }, [demandas, dataInicio, dataFim, squadFilter, statusFilter, sortColumn, sortDirection]);

  const filtrarDemandas = () => {
    let filtered = [...demandas];

    if (dataInicio) {
      filtered = filtered.filter(d => new Date(d.created_at) >= new Date(dataInicio));
    }

    if (dataFim) {
      filtered = filtered.filter(d => new Date(d.created_at) <= new Date(dataFim + 'T23:59:59'));
    }

    if (squadFilter && squadFilter !== 'all') {
      filtered = filtered.filter(d => d.squad === squadFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Ordenação
      if (sortColumn) {
        filtered.sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;

          switch (sortColumn) {
            case 'codigo':
              aValue = a.codigo;
              bValue = b.codigo;
              break;
            case 'descricao':
              aValue = a.descricao.toLowerCase();
              bValue = b.descricao.toLowerCase();
              break;
            case 'squad':
              aValue = a.squad?.toLowerCase() || '';
              bValue = b.squad?.toLowerCase() || '';
              break;
            case 'prioridade': {
              const prioridadeOrder: Record<string, number> = {
                'Crítica': 4,
                'Alta': 3,
                'Média': 2,
                'Baixa': 1,
              };
              aValue = prioridadeOrder[a.prioridade] || 0;
              bValue = prioridadeOrder[b.prioridade] || 0;
              break;
            }
            case 'status': {
              aValue = a.status;
              bValue = b.status;
              break;
            }
            case 'classificacao': {
              const assessmentA = riskAssessments[a.id];
              const assessmentB = riskAssessments[b.id];
              aValue = assessmentA?.classificacao_gerente || a.classificacao || '';
              bValue = assessmentB?.classificacao_gerente || b.classificacao || '';
              break;
            }
            case 'created_at':
              aValue = new Date(a.created_at).getTime();
              bValue = new Date(b.created_at).getTime();
              break;
            case 'indice_risco':
              aValue = riskAssessments[a.id]?.indice_risco || -1;
              bValue = riskAssessments[b.id]?.indice_risco || -1;
              break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setDemandasFiltradas(filtered);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1 inline" />
      : <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  const limparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setSquadFilter('all');
    setStatusFilter('all');
    setSortColumn(null);
    setSortDirection('asc');
  };

  const loadData = async () => {
    if (!user || !empresaSelecionada) return;
    
    setLoading(true);
    try {
      // Carregar squads cadastradas da empresa
      const { data: squadsData } = await supabase
        .from('squads')
        .select('nome')
        .eq('empresa', empresaSelecionada)
        .eq('ativo', true)
        .order('nome');
      
      if (squadsData) {
        setSquads(squadsData.map(s => s.nome));
      }

      // Carregar gerente responsável
      const { data: manager } = await supabase
        .from('project_managers')
        .select('nome, empresa')
        .eq('empresa', empresaSelecionada)
        .eq('ativo', true)
        .single();
      
      setGerenteResponsavel(manager);

      // Carregar demandas com histórico completo
      const { data: demandsData, error: demandsError } = await supabase
        .from('demands')
        .select('*')
        .eq('empresa', empresaSelecionada as any);

      if (demandsError) throw demandsError;
      setDemandas(demandsData || []);

      if (demandsData) {
        const uniqueStatuses = Array.from(
          new Set(demandsData.map(d => d.status).filter(Boolean))
        );
        uniqueStatuses.sort();
        setStatuses(uniqueStatuses);
      } else {
        setStatuses([]);
      }

      // Carregar avaliações de risco existentes
      if (demandsData && demandsData.length > 0) {
        const demandIds = demandsData.map(d => d.id);
        const { data: assessments } = await supabase
          .from('risk_assessments')
          .select('*')
          .in('demand_id', demandIds);

        if (assessments) {
          const assessmentMap: Record<string, RiskAssessment> = {};
          assessments.forEach(assessment => {
            assessmentMap[assessment.demand_id] = assessment;
          });
          setRiskAssessments(assessmentMap);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAvaliarRisco = (demand: Demand) => {
    setSelectedDemand(demand);
    setAssessmentDialogOpen(true);
  };

  const handleAssessmentComplete = () => {
    loadData();
    setAssessmentDialogOpen(false);
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const colors = {
      Crítica: 'bg-red-500',
      Alta: 'bg-orange-500',
      Média: 'bg-yellow-500',
      Baixa: 'bg-green-500',
    };
    return <Badge className={colors[prioridade as keyof typeof colors]}>{prioridade}</Badge>;
  };

  const getRiskStatusIcon = (demandId: string) => {
    const assessment = riskAssessments[demandId];
    if (!assessment) return <Clock className="h-4 w-4 text-muted-foreground" />;
    
    if (assessment.status === 'encaminhado_comite') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (assessment.status === 'aprovado') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const handleOpenDemandDetails = (demandId: string) => {
    setSelectedDemandId(demandId);
    setDetailsDialogOpen(true);
  };

  const handleDetailsDialogOpenChange = (open: boolean) => {
    setDetailsDialogOpen(open);
    if (!open) {
      setSelectedDemandId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {empresaSelecionada && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Gestão de Riscos - {getNomeEmpresa(empresaSelecionada)}
              </CardTitle>
              {gerenteResponsavel && (
                <p className="text-sm text-muted-foreground">
                  Responsável: <span className="font-medium">{gerenteResponsavel.nome}</span>
                </p>
              )}
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demandas e Avaliações de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="squad">Squad</Label>
                  <Select value={squadFilter} onValueChange={setSquadFilter}>
                    <SelectTrigger id="squad">
                      <SelectValue placeholder="Todas as squads" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as squads</SelectItem>
                      {squads.map(squad => (
                        <SelectItem key={squad} value={squad}>{squad}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {formatStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={limparFiltros}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>

              {loading ? (
                <p>Carregando...</p>
              ) : demandasFiltradas.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma demanda encontrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status Risco</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSort('codigo')}
                      >
                        Código {getSortIcon('codigo')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSort('descricao')}
                      >
                        Descrição {getSortIcon('descricao')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSort('squad')}
                      >
                        Squad {getSortIcon('squad')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSort('prioridade')}
                      >
                        Prioridade {getSortIcon('prioridade')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSort('status')}
                      >
                        Status {getSortIcon('status')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSort('classificacao')}
                      >
                        Classificação {getSortIcon('classificacao')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSort('created_at')}
                      >
                        Data Solicitação {getSortIcon('created_at')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleSort('indice_risco')}
                      >
                        Índice Risco {getSortIcon('indice_risco')}
                      </TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demandasFiltradas.map((demand) => {
                      const assessment = riskAssessments[demand.id];
                      return (
                        <TableRow key={demand.id}>
                          <TableCell>{getRiskStatusIcon(demand.id)}</TableCell>
                          <TableCell className="font-mono text-sm">{demand.codigo}</TableCell>
                          <TableCell className="max-w-xs truncate">{demand.descricao}</TableCell>
                          <TableCell>{demand.squad}</TableCell>
                          <TableCell>{getPrioridadeBadge(demand.prioridade)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatStatus(demand.status)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {assessment?.classificacao_gerente || demand.classificacao || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(demand.created_at), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            {assessment ? (
                              <Badge
                                className={
                                  assessment.indice_risco > 90
                                    ? 'bg-red-500'
                                    : assessment.indice_risco >= 30
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }
                              >
                                {assessment.indice_risco.toFixed(0)}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDemandDetails(demand.id)}
                                title="Visualizar demanda"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAvaliarRisco(demand)}
                                variant={assessment ? 'outline' : 'default'}
                              >
                                {assessment ? 'Revisar' : 'Avaliar'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <RiskMatrix assessments={Object.values(riskAssessments)} />
        </>
      )}

      {selectedDemand && (
        <RiskAssessmentDialog
          open={assessmentDialogOpen}
          onOpenChange={setAssessmentDialogOpen}
          demand={selectedDemand}
          existingAssessment={riskAssessments[selectedDemand.id]}
          onComplete={handleAssessmentComplete}
        />
      )}

      <DemandDetailsDialog
        demandId={selectedDemandId}
        open={detailsDialogOpen}
        onOpenChange={handleDetailsDialogOpenChange}
      />
    </div>
  );
}
