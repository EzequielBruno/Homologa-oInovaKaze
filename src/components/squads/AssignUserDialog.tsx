import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssignUserDialogProps {
  empresa: string;
  squad: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignUserDialog = ({ empresa, squad, onClose, onSuccess }: AssignUserDialogProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isScrum, setIsScrum] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Buscar todos os usuários ativos
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, cargo, empresa')
        .or('is_active.eq.true,is_active.is.null')
        .order('full_name');

      if (usersError) throw usersError;

      // Buscar membros já atribuídos a esta squad
      const { data: existingMembers, error: membersError } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('empresa', empresa)
        .eq('squad', squad);

      if (membersError) throw membersError;

      // Filtrar usuários que ainda não estão na squad (permitir usuários de qualquer empresa)
      const existingUserIds = new Set(existingMembers?.map(m => m.user_id) || []);
      const availableUsers = (allUsers || []).filter(u => !existingUserIds.has(u.id));
      
      setUsers(availableUsers);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione um usuário",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar se já existe um Scrum Master nesta squad
      if (isScrum) {
        const { data: existingScrum, error: scrumError } = await supabase
          .from('squad_members')
          .select('id')
          .eq('empresa', empresa)
          .eq('squad', squad)
          .eq('is_scrum', true)
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

      const horasPadrao = isScrum ? 6 : 8;
      
      const { error } = await supabase
        .from('squad_members')
        .insert({
          user_id: selectedUser,
          empresa,
          squad,
          is_scrum: isScrum,
          horas_dia: horasPadrao,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Erro",
            description: "Usuário já está atribuído a esta squad",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Usuário atribuído com sucesso",
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Usuário - {squad}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Usuário</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Nenhum usuário disponível
                  </div>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} {user.cargo && `- ${user.cargo}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

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
