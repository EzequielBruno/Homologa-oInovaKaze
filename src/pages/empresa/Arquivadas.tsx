import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import DemandCard from '@/components/demands/DemandCard';
import { Button } from '@/components/ui/button';
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

interface Demand {
  id: string;
  codigo: string;
  descricao: string;
  prioridade: string;
  empresa: string;
  status: string;
  data_conclusao: string | null;
  created_at: string;
}

const EMPRESA_MAP: Record<string, string> = {
  'zs': 'ZS',
  'zc': 'ZC',
  'eletro': 'Eletro',
  'zf': 'ZF',
};

const Arquivadas = () => {
  const { empresa } = useParams<{ empresa: string }>();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    loadDemands();
  }, [empresa]);

  const loadDemands = async () => {
    if (!empresa) return;

    const empresaValue = EMPRESA_MAP[empresa];
    if (!empresaValue) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('empresa', empresaValue as any)
        .eq('status', 'Arquivado')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDemands(data || []);
    } catch (error) {
      console.error('Error loading archived demands:', error);
      setDemands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReativar = (demand: Demand) => {
    setSelectedDemand(demand);
    setShowDialog(true);
  };

  const confirmReativar = async () => {
    if (!selectedDemand) return;

    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: 'Backlog' as any })
        .eq('id', selectedDemand.id);

      if (error) throw error;

      // Log action
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('demand_history').insert({
          demand_id: selectedDemand.id,
          user_id: userData.user.id,
          action: 'reativar',
          descricao: `Demanda ${selectedDemand.codigo} foi reativada e movida para o Backlog`,
          dados_anteriores: { status: 'Arquivado' },
          dados_novos: { status: 'Backlog' },
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Demanda reativada e movida para o Backlog',
      });

      setShowDialog(false);
      setSelectedDemand(null);
      loadDemands();
    } catch (error) {
      console.error('Error reactivating demand:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao reativar demanda',
        variant: 'destructive',
      });
    }
  };

  const getEmpresaLabel = () => {
    if (!empresa) return '';
    const labels: Record<string, string> = {
      'zs': 'Zema Seguros',
      'zc': 'Zema Consórcio',
      'eletro': 'Eletrozema',
      'zf': 'Zema Financeira',
    };
    return labels[empresa] || empresa;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando demandas arquivadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Archive className="w-8 h-8 text-muted-foreground" />
          Demandas Arquivadas - {getEmpresaLabel()}
        </h1>
        <p className="text-muted-foreground">
          Histórico de demandas arquivadas desta empresa
        </p>
      </div>

      {demands.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground text-lg">
            Nenhuma demanda arquivada encontrada
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {demands.map((demand) => (
            <div key={demand.id} className="relative">
              <DemandCard demand={demand} />
              <div className="absolute top-4 right-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReativar(demand)}
                >
                  Reativar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reativar Demanda</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja reativar a demanda {selectedDemand?.codigo}? Ela será movida
              para o Backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReativar}>
              Reativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Arquivadas;
