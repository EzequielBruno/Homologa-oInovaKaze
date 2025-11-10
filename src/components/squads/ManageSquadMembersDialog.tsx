import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, MoveRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SquadMember {
  id: string;
  user_id: string;
  squad: string;
  is_scrum: boolean;
  horas_dia: number;
  profiles: {
    full_name: string;
    cargo: string | null;
  };
}

interface ManageSquadMembersDialogProps {
  squadName: string;
  empresa: string;
  members: SquadMember[];
  availableSquads: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ManageSquadMembersDialog = ({ 
  squadName, 
  empresa,
  members,
  availableSquads,
  onClose, 
  onSuccess 
}: ManageSquadMembersDialogProps) => {
  const [selectedMember, setSelectedMember] = useState<SquadMember | null>(null);
  const [targetSquad, setTargetSquad] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const otherSquads = availableSquads.filter(s => s !== squadName);

  const handleDeleteClick = (member: SquadMember) => {
    setSelectedMember(member);
    setShowDeleteDialog(true);
  };

  const handleMoveClick = (member: SquadMember) => {
    setSelectedMember(member);
    setTargetSquad('');
    setShowMoveDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedMember.profiles.full_name} foi removido da squad`,
      });

      setShowDeleteDialog(false);
      setSelectedMember(null);
      onSuccess();
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

  const handleMoveConfirm = async () => {
    if (!selectedMember || !targetSquad) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('squad_members')
        .update({ squad: targetSquad })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedMember.profiles.full_name} foi movido para ${targetSquad}`,
      });

      setShowMoveDialog(false);
      setSelectedMember(null);
      setTargetSquad('');
      onSuccess();
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Membros - {squadName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum membro nesta squad
              </p>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(member.profiles.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles.cargo || 'Cargo não definido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.horas_dia}h/dia {member.is_scrum && '• Scrum Master'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {otherSquads.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveClick(member)}
                        title="Mover para outra squad"
                      >
                        <MoveRight className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(member)}
                      title="Remover da squad"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{selectedMember?.profiles.full_name}</strong> da squad <strong>{squadName}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedMember(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={loading}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Mover <strong>{selectedMember?.profiles.full_name}</strong> da squad <strong>{squadName}</strong> para:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Select value={targetSquad} onValueChange={setTargetSquad}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a squad destino" />
            </SelectTrigger>
            <SelectContent>
              {otherSquads.map((squad) => (
                <SelectItem key={squad} value={squad}>
                  {squad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowMoveDialog(false);
              setSelectedMember(null);
              setTargetSquad('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMoveConfirm} 
              disabled={loading || !targetSquad}
            >
              Mover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
