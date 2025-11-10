import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SquadMember {
  id: string;
  user_id: string;
  full_name: string;
  cargo: string | null;
  is_scrum: boolean;
  horas_dia: number;
}

interface MemberDetailsDialogProps {
  member: SquadMember;
  squadName: string;
  empresa: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const MemberDetailsDialog = ({ member, squadName, empresa, onClose, onUpdate }: MemberDetailsDialogProps) => {
  const [horasDia, setHorasDia] = useState(member.horas_dia);
  const [isScrum, setIsScrum] = useState(member.is_scrum);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Se está marcando como Scrum Master, verificar se já existe outro
      if (isScrum && !member.is_scrum) {
        const { data: existingScrum, error: scrumError } = await supabase
          .from('squad_members')
          .select('id')
          .eq('empresa', empresa)
          .eq('squad', squadName)
          .eq('is_scrum', true)
          .neq('id', member.id)
          .limit(1);

        if (scrumError) throw scrumError;

        if (existingScrum && existingScrum.length > 0) {
          toast({
            title: "Erro",
            description: "Esta squad já possui um Scrum Master. Remova o Scrum Master atual antes de adicionar outro.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('squad_members')
        .update({ 
          horas_dia: horasDia,
          is_scrum: isScrum
        })
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Informações atualizadas com sucesso",
      });
      onUpdate();
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Membro - {squadName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-lg">{member.full_name}</p>
          </div>

          {member.cargo && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{member.cargo}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="scrum"
              checked={isScrum}
              onCheckedChange={(checked) => setIsScrum(checked as boolean)}
            />
            <Label htmlFor="scrum" className="cursor-pointer">
              Scrum Master
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="horas_dia">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horas de Trabalho por Dia
              </div>
            </Label>
            <Input
              id="horas_dia"
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={horasDia}
              onChange={(e) => setHorasDia(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
