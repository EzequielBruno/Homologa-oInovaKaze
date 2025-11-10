import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DemandDialog from '@/components/demands/DemandDialog';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MinhasSolicitacoes = () => {
  const { toast } = useToast();
  const permissions = useUserPermissions();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [demandToDelete, setDemandToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [squadFilter, setSquadFilter] = useState<string>('all');

  const fetchMyDemands = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setDemands([]);
        return;
      }

      let query = supabase
        .from('demands')
        .select('*, profiles:solicitante_id(full_name)')
        .order('created_at', { ascending: false });

      if (!permissions.hasManageAccess) {
        query = query.eq('solicitante_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDemands(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [permissions.hasManageAccess, toast]);

  useEffect(() => {
    if (!permissions.loading) {
      fetchMyDemands();
    }
  }, [permissions.loading, permissions.hasManageAccess, fetchMyDemands]);

  const handleEdit = (demand: any) => {
    setSelectedDemand(demand);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!demandToDelete) return;

    try {
      const { error } = await supabase
        .from('demands')
        .delete()
        .eq('id', demandToDelete);

      if (error) throw error;

      toast({
        title: 'Demanda excluída',
        description: 'A demanda foi removida com sucesso.',
      });

      fetchMyDemands();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDemandToDelete(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDemandToDelete(id);
    setDeleteDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSquadFilter('all');
  };

  const formatStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      'Backlog': 'Backlog',
      'Aprovado_GP': 'Aprovado GP',
      'Aguardando_Comite': 'Aguardando Comitê',
      'Aprovado': 'Aprovado',
      'Em_Progresso': 'Em Progresso',
      'Revisao': 'Revisão',
      'Concluido': 'Concluído',
      'StandBy': 'Stand By',
      'Bloqueado': 'Bloqueado',
      'Nao_Entregue': 'Não Entregue',
      'Arquivado': 'Arquivado',
    };
    return statusLabels[status] || status?.replace(/_/g, ' ');
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Crítica': 'bg-red-500 hover:bg-red-600',
      'Alta': 'bg-orange-500 hover:bg-orange-600',
      'Média': 'bg-yellow-500 hover:bg-yellow-600',
      'Baixa': 'bg-green-500 hover:bg-green-600',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const filteredDemands = useMemo(() => {
    return demands.filter((demand) => {
      const matchesSearch = searchTerm
        ? [
            demand.codigo,
            demand.descricao,
            demand.titulo,
            demand.profiles?.full_name,
            demand.squad,
            demand.departamento,
          ]
            .filter(Boolean)
            .some((field) =>
              String(field).toLowerCase().includes(searchTerm.toLowerCase()),
            )
        : true;

      const matchesStatus = statusFilter === 'all' ? true : demand.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' ? true : demand.prioridade === priorityFilter;
      const matchesSquad = squadFilter === 'all' ? true : demand.squad === squadFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSquad;
    });
  }, [demands, priorityFilter, searchTerm, squadFilter, statusFilter]);

  const uniqueStatuses = useMemo(
    () =>
      Array.from(new Set(demands.map((demand) => demand.status).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' }),
      ),
    [demands],
  );

  const uniquePriorities = useMemo(
    () =>
      Array.from(new Set(demands.map((demand) => demand.prioridade).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' }),
      ),
    [demands],
  );

  const uniqueSquads = useMemo(
    () =>
      Array.from(new Set(demands.map((demand) => demand.squad).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' }),
      ),
    [demands],
  );

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Minhas Solicitações
          </h1>
          <p className="text-muted-foreground">
            {demands.length} {demands.length === 1 ? 'demanda' : 'demandas'}
          </p>
        </div>
        <Button onClick={() => { setSelectedDemand(null); setDialogOpen(true); }}>
          Nova Demanda
        </Button>
      </div>

      {demands.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">Você ainda não criou nenhuma demanda</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, descrição ou solicitante"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                {uniquePriorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={squadFilter} onValueChange={setSquadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Squad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as squads</SelectItem>
                {uniqueSquads.map((squad) => (
                  <SelectItem key={squad} value={squad}>
                    {squad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || squadFilter !== 'all' || searchTerm) && (
            <div className="flex justify-end">
              <Button variant="ghost" onClick={resetFilters}>
                Limpar filtros
              </Button>
            </div>
          )}

          {filteredDemands.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-lg border">
              <p className="text-muted-foreground">Nenhuma demanda encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Squad</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data de criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDemands.map((demand) => (
                  <TableRow key={demand.id}>
                    <TableCell className="font-medium">{demand.codigo}</TableCell>
                    <TableCell className="max-w-[240px]">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {demand.descricao || demand.titulo || 'Sem descrição'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {demand.departamento || demand.setor || demand.empresa}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatStatus(demand.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {demand.prioridade ? (
                        <Badge className={getPriorityColor(demand.prioridade)}>
                          {demand.prioridade}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{demand.squad || '—'}</TableCell>
                    <TableCell>{demand.profiles?.full_name || '—'}</TableCell>
                    <TableCell>
                      {demand.created_at
                        ? format(new Date(demand.created_at), "dd/MM/yyyy", { locale: ptBR })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(demand)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(demand.id)}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <DemandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        demand={selectedDemand}
        onSuccess={fetchMyDemands}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MinhasSolicitacoes;
