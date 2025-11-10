import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DemandCard from '@/components/demands/DemandCard';
import DemandDialog from '@/components/demands/DemandDialog';
import { SQUADS, EMPRESA_URL_MAP } from '@/types/demand';
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

const EmpresaDemands = () => {
  const { empresa, status } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [demandToDelete, setDemandToDelete] = useState<string | null>(null);
  const [selectedSquad, setSelectedSquad] = useState<string>(searchParams.get('squad') || 'all');
  const [availableSquads, setAvailableSquads] = useState<string[]>([]);

  // Normalizar empresa da URL
  const empresaNormalizada = EMPRESA_URL_MAP[empresa?.toLowerCase() || ''] || empresa?.toUpperCase() || '';

  const empresaLabel: Record<string, string> = {
    'ZS': 'Zema Seguros',
    'ZC': 'Zema Consórcio',
    'Eletro': 'Eletrozema',
    'ZF': 'Zema Financeira',
  };

  const statusMap: Record<string, string> = {
    'backlog': 'Backlog',
    'em-progresso': 'Em_Progresso',
    'concluidas': 'Concluido',
  };

  const statusLabel: Record<string, string> = {
    'backlog': 'Backlog',
    'em-progresso': 'Em Progresso',
    'concluidas': 'Concluídas',
  };

  useEffect(() => {
    fetchDemands();
  }, [empresa, status, selectedSquad]);

  useEffect(() => {
    const loadSquads = async () => {
      if (!empresa) {
        setAvailableSquads([]);
        return;
      }

      try {
        const defaultSquads = SQUADS[empresaNormalizada] || [];
        
        // Carregar squads customizadas do banco
        const { data: customSquads, error } = await supabase
          .from('squads')
          .select('nome, ativo')
          .eq('empresa', empresaNormalizada)
          .eq('ativo', true);

        if (error) throw error;

        // Buscar squads padrão que foram desativadas
        const { data: inactiveSquads } = await supabase
          .from('squads')
          .select('nome')
          .eq('empresa', empresaNormalizada)
          .eq('ativo', false);

        const inactiveSquadNames = new Set(inactiveSquads?.map(s => s.nome) || []);

        // Combinar squads padrão (removendo as inativas) com customizadas
        const activeDefaultSquads = defaultSquads.filter(s => !inactiveSquadNames.has(s));
        const customSquadNames = customSquads?.map(s => s.nome) || [];
        const combined = [...activeDefaultSquads, ...customSquadNames];
        
        // SEMPRE incluir "Avaliar" e remover duplicatas
        const unique = ['Avaliar', ...Array.from(new Set(combined)).sort()];
        setAvailableSquads(unique);
      } catch (error: any) {
        console.error('Erro ao carregar squads:', error);
        setAvailableSquads(['Avaliar', ...(SQUADS[empresaNormalizada] || [])]);
      }
    };

    loadSquads();
  }, [empresa, empresaNormalizada]);

  const fetchDemands = async () => {
    if (!empresa || !status) return;
    
    setLoading(true);
    try {
      const statusCode = statusMap[status] as any;

      let query = supabase
        .from('demands')
        .select('*')
        .eq('empresa', empresaNormalizada as any)
        .eq('status', statusCode);

      if (selectedSquad && selectedSquad !== 'all') {
        query = query.eq('squad', selectedSquad);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setDemands(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar demandas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSquadChange = (value: string) => {
    setSelectedSquad(value);
    if (value === 'all') {
      searchParams.delete('squad');
    } else {
      searchParams.set('squad', value);
    }
    setSearchParams(searchParams);
  };

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

      fetchDemands();
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

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  const currentStatus = status || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            {empresaLabel[empresaNormalizada]} - {statusLabel[currentStatus]}
          </h1>
          <p className="text-muted-foreground">
            {demands.length} {demands.length === 1 ? 'demanda' : 'demandas'}
          </p>
        </div>
        <Button onClick={() => { setSelectedDemand(null); setDialogOpen(true); }}>
          Nova Demanda
        </Button>
      </div>

      <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
        <Users className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium">Filtrar por Squad:</span>
        <Select value={selectedSquad} onValueChange={handleSquadChange}>
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Squads</SelectItem>
            {availableSquads.map((squad) => (
              <SelectItem key={squad} value={squad}>
                {squad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {demands.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-lg border">
          <p className="text-muted-foreground">Nenhuma demanda encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demands.map((demand) => (
            <DemandCard
              key={demand.id}
              demand={demand}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <DemandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        demand={selectedDemand}
        onSuccess={fetchDemands}
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

export default EmpresaDemands;
