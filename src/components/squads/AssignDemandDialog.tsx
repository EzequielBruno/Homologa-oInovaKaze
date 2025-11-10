import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SquadMember {
  id: string;
  user_id: string;
  full_name: string;
}

interface AssignDemandDialogProps {
  member: SquadMember;
  squadName: string;
  empresa: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignDemandDialog = ({ member, squadName, empresa, onClose, onSuccess }: AssignDemandDialogProps) => {
  const [sprintNumber, setSprintNumber] = useState('');
  const [demandId, setDemandId] = useState('');
  const [demands, setDemands] = useState<any[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDemands();
  }, [empresa, squadName]);

  const loadDemands = async () => {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('empresa', empresa as any)
        .eq('squad', squadName);

      if (error) throw error;
      // Filtrar por status manualmente para evitar problemas de tipo
      const filteredData = (data || []).filter(d => 
        ['Backlog', 'A_Fazer', 'Em_Progresso'].includes(d.status)
      );
      setDemands(filteredData);
    } catch (error: any) {
      console.error('Erro ao carregar demandas:', error);
    }
  };

  const checkFaseamento = async (demandaId: string) => {
    const { data, error } = await supabase
      .from('phases')
      .select('*')
      .eq('demanda_id', demandaId);

    if (error) throw error;
    return data && data.length > 0;
  };

  const handleAssign = async () => {
    if (!sprintNumber || !demandId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const hasFaseamento = await checkFaseamento(demandId);
      const prazoFaseamento = !hasFaseamento 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: userData } = await supabase.auth.getUser();
      
      const { error: assignError } = await supabase
        .from('demand_assignments')
        .insert({
          demand_id: demandId,
          assigned_to: member.user_id,
          assigned_by: userData.user?.id,
          sprint_number: parseInt(sprintNumber),
          faseamento_completo: hasFaseamento,
          prazo_faseamento: prazoFaseamento,
          notificacao_pendente: !hasFaseamento,
        });

      if (assignError) throw assignError;

      // Criar notificação para o membro atribuído
      await supabase.from('notifications').insert({
        user_id: member.user_id,
        tipo: 'atribuicao_demanda',
        title: 'Nova Demanda Atribuída',
        message: `Você foi atribuído à demanda ${selectedDemand?.codigo} na Sprint ${sprintNumber}${
          !hasFaseamento ? '. Faseamento pendente - prazo de 1 dia.' : ''
        }`,
        relacionado_id: demandId,
      });

      // Notificar o Scrum se não houver faseamento
      if (!hasFaseamento) {
        const { data: scrumData } = await supabase
          .from('squad_members')
          .select('user_id')
          .eq('empresa', empresa)
          .eq('squad', squadName)
          .eq('is_scrum', true)
          .single();

        if (scrumData) {
          await supabase.from('notifications').insert({
            user_id: scrumData.user_id,
            tipo: 'faseamento_pendente',
            title: 'Faseamento Pendente',
            message: `Demanda ${selectedDemand?.codigo} atribuída a ${member.full_name} sem faseamento. Prazo: 1 dia.`,
            relacionado_id: demandId,
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Demanda atribuída com sucesso",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (demandId) {
      const demand = demands.find(d => d.id === demandId);
      setSelectedDemand(demand);
    }
  }, [demandId, demands]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Demanda - {member.full_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sprint">Número da Sprint</Label>
            <Input
              id="sprint"
              type="number"
              min="1"
              value={sprintNumber}
              onChange={(e) => setSprintNumber(e.target.value)}
              placeholder="Ex: 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="demand">Demanda</Label>
            <Select value={demandId} onValueChange={setDemandId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma demanda" />
              </SelectTrigger>
              <SelectContent>
                {demands.map((demand) => (
                  <SelectItem key={demand.id} value={demand.id}>
                    {demand.codigo} - {demand.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDemand && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Status:</strong> {selectedDemand.status}<br />
                <strong>Prioridade:</strong> {selectedDemand.prioridade}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            Atribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
