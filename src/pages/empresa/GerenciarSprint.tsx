import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { EMPRESA_URL_MAP } from '@/types/demand';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Layers,
  ClipboardList,
  Clock,
  RefreshCw,
  PlusCircle,
  Loader2,
} from 'lucide-react';

type DemandRow = Database['public']['Tables']['demands']['Row'] & {
  profiles?: {
    full_name: string | null;
  } | null;
};

type DemandStatus = Database['public']['Enums']['demand_status'];

const EMPRESA_LABELS: Record<string, string> = {
  zc: 'Zema Consórcio',
  eletro: 'Eletrozema',
  zf: 'Zema Financeira',
  zs: 'Zema Seguros',
};

const statusLabels: Record<DemandStatus, string> = {
  Backlog: 'Backlog',
  Refinamento_TI: 'Refinamento TI',
  Aguardando_Planning: 'Aguardando Planning',
  Em_Analise_Comite: 'Em Análise Comitê',
  Aprovado: 'Aprovado',
  Em_Progresso: 'Em Progresso',
  Revisao: 'Revisão',
  Concluido: 'Concluído',
  StandBy: 'Stand By',
  Nao_Entregue: 'Não Entregue',
  Em_Avaliacao_PMO: 'Em Avaliação PMO',
  Aguardando_Comite: 'Aguardando Comitê',
  Arquivado: 'Arquivado',
  Aguardando_Gerente: 'Aguardando Gerente',
  Aguardando_Validacao_TI: 'Aguardando Validação TI',
  Recusado: 'Recusado',
  Bloqueado: 'Bloqueado',
  Aprovado_GP: 'Aprovado GP',
};

const statusColors: Partial<Record<DemandStatus, string>> = {
  Backlog: 'bg-slate-500',
  Aguardando_Planning: 'bg-amber-500',
  Aprovado: 'status-badge-approved',
  Em_Progresso: 'status-badge-in-progress',
  Revisao: 'bg-orange-500',
  Concluido: 'status-badge-completed',
  StandBy: 'bg-gray-500',
  Bloqueado: 'bg-red-600',
  Nao_Entregue: 'bg-red-500',
  Aprovado_GP: 'status-badge-evaluation',
  Aguardando_Comite: 'status-badge-committee',
  Arquivado: 'bg-gray-600',
};

const statusOptions = Object.keys(statusLabels) as DemandStatus[];

const GerenciarSprint = () => {
  const { empresa } = useParams<{ empresa: string }>();
  const { toast } = useToast();

  const [demands, setDemands] = useState<DemandRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null);
  const [customSprints, setCustomSprints] = useState<number[]>([]);
  const [selectedAvailableDemands, setSelectedAvailableDemands] = useState<string[]>([]);
  const [selectedSprintDemands, setSelectedSprintDemands] = useState<string[]>([]);
  const [moveToProgress, setMoveToProgress] = useState(true);
  const [returnToBacklog, setReturnToBacklog] = useState(true);

  const empresaCode = useMemo(() => {
    if (!empresa) return null;
    return EMPRESA_URL_MAP[empresa.toLowerCase()];
  }, [empresa]);

  const empresaName = empresa ? EMPRESA_LABELS[empresa.toLowerCase()] ?? empresa.toUpperCase() : 'Empresa';

  const fetchDemands = useCallback(async () => {
    if (!empresaCode) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('demands')
        .select(
          `
          id,
          codigo,
          descricao,
          prioridade,
          horas_estimadas,
          status,
          sprint_atual,
          squad,
          departamento,
          created_at,
          solicitante_id,
          data_inicio,
          data_conclusao,
          profiles:solicitante_id(full_name)
        `,
        )
        .eq('empresa', empresaCode)
        .not('status', 'eq', 'Arquivado')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setDemands((data as DemandRow[]) || []);
    } catch (error: any) {
      console.error('Erro ao carregar demandas da sprint:', error);
      toast({
        title: 'Erro ao carregar demandas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [empresaCode, toast]);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  useEffect(() => {
    setSelectedAvailableDemands([]);
    setSelectedSprintDemands([]);
  }, [empresa]);

  useEffect(() => {
    setSelectedAvailableDemands([]);
    setSelectedSprintDemands([]);
  }, [selectedSprint]);

  const sprintOptions = useMemo(() => {
    const sprintNumbers = demands
      .map((demand) => demand.sprint_atual)
      .filter((value): value is number => typeof value === 'number');
    const combined = new Set<number>([...sprintNumbers, ...customSprints]);
    return Array.from(combined).sort((a, b) => a - b);
  }, [demands, customSprints]);

  useEffect(() => {
    if (sprintOptions.length > 0 && (selectedSprint === null || !sprintOptions.includes(selectedSprint))) {
      setSelectedSprint(sprintOptions[sprintOptions.length - 1]);
    }
  }, [sprintOptions, selectedSprint]);

  const currentSprintDemands = useMemo(() => {
    if (!selectedSprint) return [];
    return demands.filter((demand) => demand.sprint_atual === selectedSprint);
  }, [demands, selectedSprint]);

  const availableDemands = useMemo(() => {
    if (!selectedSprint) {
      return demands.filter((demand) => demand.sprint_atual === null);
    }
    return demands.filter((demand) => demand.sprint_atual === null || demand.sprint_atual !== selectedSprint);
  }, [demands, selectedSprint]);

  const totalSprintHours = useMemo(() => {
    return currentSprintDemands.reduce((total, demand) => total + (demand.horas_estimadas ?? 0), 0);
  }, [currentSprintDemands]);

  const totalBacklogHours = useMemo(() => {
    return availableDemands.reduce((total, demand) => total + (demand.horas_estimadas ?? 0), 0);
  }, [availableDemands]);

  const handleCreateSprint = () => {
    const currentMax = sprintOptions.length > 0 ? Math.max(...sprintOptions) : 0;
    const nextSprint = currentMax + 1 || 1;
    if (!customSprints.includes(nextSprint)) {
      setCustomSprints((previous) => [...previous, nextSprint]);
    }
    setSelectedSprint(nextSprint);
    toast({
      title: 'Nova sprint criada',
      description: `Sprint ${nextSprint} pronta para receber demandas.`,
    });
  };

  const toggleAvailableSelection = (id: string, checked: boolean) => {
    setSelectedAvailableDemands((previous) => {
      if (checked) {
        return [...previous, id];
      }
      return previous.filter((demandId) => demandId !== id);
    });
  };

  const toggleSprintSelection = (id: string, checked: boolean) => {
    setSelectedSprintDemands((previous) => {
      if (checked) {
        return [...previous, id];
      }
      return previous.filter((demandId) => demandId !== id);
    });
  };

  const handleAssignToSprint = async () => {
    if (!selectedSprint) {
      toast({
        title: 'Selecione uma sprint',
        description: 'Crie ou selecione uma sprint antes de atribuir demandas.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedAvailableDemands.length === 0) {
      toast({
        title: 'Nenhuma demanda selecionada',
        description: 'Selecione pelo menos uma demanda para mover para a sprint.',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = userData.user?.id;

      await Promise.all(
        selectedAvailableDemands.map(async (demandId) => {
          const demand = demands.find((item) => item.id === demandId);
          if (!demand) return;

          const updates: Database['public']['Tables']['demands']['Update'] = {
            sprint_atual: selectedSprint,
          };

          let newStatus = demand.status;
          let action: Database['public']['Enums']['action_type'] = 'editar';

          if (moveToProgress && demand.status !== 'Em_Progresso') {
            updates.status = 'Em_Progresso';
            newStatus = 'Em_Progresso';
            action = 'mudanca_status';
          }

          const { error } = await supabase
            .from('demands')
            .update(updates)
            .eq('id', demandId);

          if (error) throw error;

          if (userId) {
            await supabase.from('demand_history').insert({
              demand_id: demandId,
              user_id: userId,
              action,
              descricao:
                action === 'mudanca_status'
                  ? `Demanda ${demand.codigo} movida para a sprint ${selectedSprint} e marcada como Em Progresso`
                  : `Demanda ${demand.codigo} movida para a sprint ${selectedSprint}`,
              dados_anteriores: {
                sprint_atual: demand.sprint_atual,
                status: demand.status,
              },
              dados_novos: {
                sprint_atual: selectedSprint,
                status: newStatus,
              },
            });
          }
        }),
      );

      toast({
        title: 'Sprint atualizada',
        description: `Demandas atribuídas à sprint ${selectedSprint}.`,
      });

      setSelectedAvailableDemands([]);
      await fetchDemands();
    } catch (error: any) {
      console.error('Erro ao mover demanda para sprint:', error);
      toast({
        title: 'Erro ao atualizar sprint',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveFromSprint = async () => {
    if (!selectedSprint) return;

    if (selectedSprintDemands.length === 0) {
      toast({
        title: 'Nenhuma demanda selecionada',
        description: 'Selecione ao menos uma demanda para remover da sprint.',
        variant: 'destructive',
      });
      return;
    }

    setRemoving(true);
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = userData.user?.id;

      await Promise.all(
        selectedSprintDemands.map(async (demandId) => {
          const demand = demands.find((item) => item.id === demandId);
          if (!demand) return;

          const updates: Database['public']['Tables']['demands']['Update'] = {
            sprint_atual: null,
          };

          let newStatus = demand.status;
          let action: Database['public']['Enums']['action_type'] = 'editar';

          if (returnToBacklog && demand.status !== 'Backlog') {
            updates.status = 'Backlog';
            newStatus = 'Backlog';
            action = 'mudanca_status';
          }

          const { error } = await supabase
            .from('demands')
            .update(updates)
            .eq('id', demandId);

          if (error) throw error;

          if (userId) {
            await supabase.from('demand_history').insert({
              demand_id: demandId,
              user_id: userId,
              action,
              descricao:
                action === 'mudanca_status'
                  ? `Demanda ${demand.codigo} removida da sprint ${selectedSprint} e retornada ao Backlog`
                  : `Demanda ${demand.codigo} removida da sprint ${selectedSprint}`,
              dados_anteriores: {
                sprint_atual: demand.sprint_atual,
                status: demand.status,
              },
              dados_novos: {
                sprint_atual: null,
                status: newStatus,
              },
            });
          }
        }),
      );

      toast({
        title: 'Demandas removidas',
        description: 'As demandas selecionadas foram removidas da sprint.',
      });

      setSelectedSprintDemands([]);
      await fetchDemands();
    } catch (error: any) {
      console.error('Erro ao remover demanda da sprint:', error);
      toast({
        title: 'Erro ao remover demandas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleUpdateStatus = async (demand: DemandRow, status: DemandStatus) => {
    if (demand.status === status) return;

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = userData.user?.id;

      const { error } = await supabase
        .from('demands')
        .update({ status })
        .eq('id', demand.id);

      if (error) throw error;

      if (userId) {
        await supabase.from('demand_history').insert({
          demand_id: demand.id,
          user_id: userId,
          action: 'mudanca_status',
          descricao: `Status da demanda ${demand.codigo} atualizado para ${statusLabels[status]}`,
          dados_anteriores: {
            status: demand.status,
          },
          dados_novos: {
            status,
          },
        });
      }

      toast({
        title: 'Status atualizado',
        description: `Demanda ${demand.codigo} marcada como ${statusLabels[status]}.`,
      });

      await fetchDemands();
    } catch (error: any) {
      console.error('Erro ao atualizar status da demanda:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatStatus = (status: DemandStatus) => statusLabels[status] ?? status.replaceAll('_', ' ');

  const getStatusColor = (status: DemandStatus) => statusColors[status] ?? 'bg-muted text-foreground';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Layers className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Sprint - {empresaName}</h1>
            <p className="text-muted-foreground">
              Planeje, acompanhe e distribua as demandas das sprints da empresa selecionada.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={fetchDemands} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Atualizar lista
          </Button>
          <Button onClick={handleCreateSprint}>
            <PlusCircle className="mr-2 h-4 w-4" />Criar nova sprint
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Sprint selecionada</CardDescription>
            <CardTitle className="text-4xl font-bold text-primary">
              {selectedSprint ? `Sprint ${selectedSprint}` : 'Nenhuma sprint'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
            <ClipboardList className="h-5 w-5" />
            <span>{currentSprintDemands.length} demandas atribuídas</span>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader className="pb-2">
            <CardDescription>Capacidade estimada</CardDescription>
            <CardTitle className="text-4xl font-bold text-secondary">
              {totalSprintHours}h
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>Horas planejadas para a sprint</span>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader className="pb-2">
            <CardDescription>Backlog disponível</CardDescription>
            <CardTitle className="text-4xl font-bold text-accent">
              {availableDemands.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <span>{totalBacklogHours}h em demandas prontas para planejamento</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Sprint ativa</Label>
              <Select
                value={selectedSprint ? selectedSprint.toString() : undefined}
                onValueChange={(value) => setSelectedSprint(Number(value))}
                disabled={sprintOptions.length === 0}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione uma sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprintOptions.map((sprint) => (
                    <SelectItem key={sprint} value={sprint.toString()}>
                      Sprint {sprint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="h-12" />

            <div className="flex items-center gap-2">
              <Checkbox
                id="move-to-progress"
                checked={moveToProgress}
                onCheckedChange={(value) => setMoveToProgress(value === true)}
              />
              <Label htmlFor="move-to-progress" className="text-sm text-muted-foreground">
                Ao atribuir, mover para Em Progresso
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="return-to-backlog"
                checked={returnToBacklog}
                onCheckedChange={(value) => setReturnToBacklog(value === true)}
              />
              <Label htmlFor="return-to-backlog" className="text-sm text-muted-foreground">
                Ao remover, retornar ao Backlog
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Demandas disponíveis</h2>
              <Button
                onClick={handleAssignToSprint}
                disabled={assigning || selectedAvailableDemands.length === 0 || !selectedSprint}
              >
                {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Adicionar à sprint
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sprint</TableHead>
                    <TableHead>Squad</TableHead>
                    <TableHead>Horas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        Carregando demandas...
                      </TableCell>
                    </TableRow>
                  ) : availableDemands.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        Nenhuma demanda disponível para planejamento.
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableDemands.map((demand) => (
                      <TableRow key={demand.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAvailableDemands.includes(demand.id)}
                            onCheckedChange={(value) => toggleAvailableSelection(demand.id, value === true)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{demand.codigo}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">{demand.descricao}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(demand.status)} text-xs`}>{formatStatus(demand.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          {demand.sprint_atual ? (
                            <Badge variant="secondary">Sprint {demand.sprint_atual}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Sem sprint</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-foreground">{demand.squad ?? '-'}</div>
                          <div className="text-xs text-muted-foreground">{demand.departamento}</div>
                        </TableCell>
                        <TableCell>{demand.horas_estimadas ?? '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Demandas na sprint</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={handleRemoveFromSprint}
                  disabled={removing || selectedSprintDemands.length === 0}
                >
                  {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Remover da sprint
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Atualizar Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        Carregando demandas...
                      </TableCell>
                    </TableRow>
                  ) : currentSprintDemands.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        Nenhuma demanda atribuída à sprint selecionada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentSprintDemands.map((demand) => (
                      <TableRow key={demand.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedSprintDemands.includes(demand.id)}
                            onCheckedChange={(value) => toggleSprintSelection(demand.id, value === true)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{demand.codigo}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">{demand.descricao}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(demand.status)} text-xs`}>{formatStatus(demand.status)}</Badge>
                        </TableCell>
                        <TableCell>{demand.horas_estimadas ?? '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-foreground">
                            {demand.profiles?.full_name ?? 'Não informado'}
                          </div>
                          <div className="text-xs text-muted-foreground">{demand.squad ?? demand.departamento}</div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={demand.status}
                            onValueChange={(value) => handleUpdateStatus(demand, value as DemandStatus)}
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {formatStatus(status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarSprint;
