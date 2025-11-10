import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditSquadDialogProps {
  squadId: string;
  empresa: string;
  currentNome: string;
  currentDescricao: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface CoordenadorTI {
  id: string;
  full_name: string;
}

export const EditSquadDialog = ({ 
  squadId, 
  empresa, 
  currentNome, 
  currentDescricao, 
  onClose, 
  onSuccess 
}: EditSquadDialogProps) => {
  const [nome, setNome] = useState(currentNome);
  const [descricao, setDescricao] = useState(currentDescricao || '');
  const [coordenadorTiId, setCoordenadorTiId] = useState<string>('none');
  const [coordenadoresTI, setCoordenadoresTI] = useState<CoordenadorTI[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setNome(currentNome);
    setDescricao(currentDescricao || '');
    loadCoordenadoresTI();
    loadCurrentCoordenador();
  }, [currentNome, currentDescricao, squadId]);

  const loadCoordenadoresTI = async () => {
    try {
      // Buscar grupo "Coordenadores TI"
      const { data: group } = await supabase
        .from('access_groups')
        .select('id')
        .eq('nome', 'Coordenadores TI')
        .single();

      if (!group) return;

      // Buscar usuários deste grupo
      const { data: userGroups } = await supabase
        .from('user_access_groups')
        .select('user_id')
        .eq('group_id', group.id);

      if (!userGroups || userGroups.length === 0) return;

      const userIds = userGroups.map(ug => ug.user_id);

      // Buscar perfis dos usuários
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
        .eq('empresa', empresa as any)
        .order('full_name');

      setCoordenadoresTI(profiles || []);
    } catch (error: any) {
      console.error('Erro ao carregar coordenadores TI:', error);
    }
  };

  const loadCurrentCoordenador = async () => {
    try {
      const { data } = await supabase
        .from('squads')
        .select('coordenador_ti_id')
        .eq('id', squadId)
        .single();

      if (data?.coordenador_ti_id) {
        setCoordenadorTiId(data.coordenador_ti_id);
      } else {
        setCoordenadorTiId('none');
      }
    } catch (error: any) {
      console.error('Erro ao carregar coordenador atual:', error);
    }
  };

  const handleUpdate = async () => {
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da squad é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const nomeChanged = nome.trim() !== currentNome;

      // Atualizar a squad
      const { error } = await supabase
        .from('squads')
        .update({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          coordenador_ti_id: coordenadorTiId === 'none' ? null : coordenadorTiId,
        })
        .eq('id', squadId);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Erro",
            description: "Já existe uma squad com esse nome para esta empresa",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Se o nome mudou, atualizar referências em outras tabelas
      if (nomeChanged) {
        // Atualizar squad_members
        await supabase
          .from('squad_members')
          .update({ squad: nome.trim() })
          .eq('empresa', empresa as any)
          .eq('squad', currentNome);

        // Atualizar demands
        await supabase
          .from('demands')
          .update({ squad: nome.trim() })
          .eq('empresa', empresa as any)
          .eq('squad', currentNome);

        // Atualizar custom_squad_forms
        await supabase
          .from('custom_squad_forms')
          .update({ squad: nome.trim() })
          .eq('empresa', empresa as any)
          .eq('squad', currentNome);
      }

      toast({
        title: "Sucesso",
        description: "Squad atualizada com sucesso",
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
          <DialogTitle>Editar Squad</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Squad *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fiscal, BI, RH"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição da squad"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordenador">Coordenador de TI Responsável</Label>
            <Select value={coordenadorTiId} onValueChange={setCoordenadorTiId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um coordenador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {coordenadoresTI.map((coord) => (
                  <SelectItem key={coord.id} value={coord.id}>
                    {coord.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
