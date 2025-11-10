import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Copy, CheckSquare, XSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AccessGroup {
  id: string;
  nome: string;
  descricao: string | null;
  is_system_group: boolean;
}

interface GroupPermission {
  resource: string;
  action: string;
}

interface EditGroupPermissionsDialogProps {
  group: AccessGroup;
  onClose: () => void;
  onSuccess: () => void;
}

const RESOURCES = [
  { value: 'dashboard', label: 'Painel Inicial' },
  { value: 'criar_demanda', label: 'Criar Solicitação' },
  { value: 'minhas_solicitacoes', label: 'Minhas Solicitações' },
  { value: 'historico_acoes', label: 'Histórico de Ações' },
  { value: 'demandas_finalizadas', label: 'Demandas Finalizadas' },
  { value: 'kanban_empresa', label: 'Kanban Empresa' },
  { value: 'backlog_empresa', label: 'Backlog Empresa' },
  { value: 'progresso_empresa', label: 'Em Progresso Empresa' },
  { value: 'concluidas_empresa', label: 'Concluídas Empresa' },
  { value: 'arquivadas_empresa', label: 'Arquivadas Empresa' },
  { value: 'gestao_riscos_empresa', label: 'Gestão de Riscos' },
  { value: 'aguardando_validacao', label: 'Aguardando Validação' },
  { value: 'aguardando_insumos', label: 'Aguardando Insumos' },
  { value: 'standby', label: 'Stand By' },
  { value: 'pareceres_pendentes', label: 'Pareceres Pendentes' },
  { value: 'faseamento', label: 'Faseamento' },
  { value: 'estimativas', label: 'Estimativas' },
  { value: 'retrospectiva', label: 'Retrospectiva' },
  { value: 'planning', label: 'Planning' },
  { value: 'agenda_reviews', label: 'Agenda Reviews' },
  { value: 'agenda_planning', label: 'Agenda Planning' },
  { value: 'atualizacao_demandas', label: 'Atualizações/Dailys' },
  { value: 'aprovacoes', label: 'Aprovações' },
  { value: 'permissoes', label: 'Permissões' },
  { value: 'relatorios', label: 'Relatórios' },
];

const ACTIONS = [
  { value: 'view', label: 'Visualizar' },
  { value: 'create', label: 'Criar' },
  { value: 'edit', label: 'Editar' },
  { value: 'delete', label: 'Excluir' },
  { value: 'approve', label: 'Aprovar' },
  { value: 'manage', label: 'Gerenciar' },
];

export const EditGroupPermissionsDialog = ({ group, onClose, onSuccess }: EditGroupPermissionsDialogProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [availableGroups, setAvailableGroups] = useState<AccessGroup[]>([]);
  const [selectedSourceGroup, setSelectedSourceGroup] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadGroupPermissions();
    loadAvailableGroups();
  }, [group.id]);

  const loadAvailableGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('access_groups')
        .select('id, nome, descricao, is_system_group')
        .neq('id', group.id)
        .order('nome');

      if (error) throw error;
      setAvailableGroups(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar grupos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadGroupPermissions = async (groupId?: string) => {
    setLoadingPermissions(true);
    try {
      const targetGroupId = groupId || group.id;
      const { data, error } = await supabase
        .from('group_permissions')
        .select('resource, action')
        .eq('group_id', targetGroupId);

      if (error) throw error;

      const permSet = new Set<string>();
      data?.forEach((p) => {
        permSet.add(`${p.resource}:${p.action}`);
      });
      setSelectedPermissions(permSet);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar permissões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleMirrorPermissions = async () => {
    if (!selectedSourceGroup || selectedSourceGroup === 'none') {
      toast({
        title: 'Selecione um grupo',
        description: 'Escolha um grupo para espelhar as permissões',
        variant: 'destructive',
      });
      return;
    }

    await loadGroupPermissions(selectedSourceGroup);
    toast({
      title: 'Permissões espelhadas',
      description: 'As permissões foram copiadas. Clique em "Salvar" para confirmar.',
    });
    setSelectedSourceGroup('none');
  };

  const handleSelectAll = () => {
    const allPermissions = new Set<string>();
    RESOURCES.forEach((resource) => {
      ACTIONS.forEach((action) => {
        allPermissions.add(`${resource.value}:${action.value}`);
      });
    });
    setSelectedPermissions(allPermissions);
    toast({
      title: 'Todas as permissões selecionadas',
      description: 'Clique em "Salvar" para confirmar.',
    });
  };

  const handleDeselectAll = () => {
    setSelectedPermissions(new Set());
    toast({
      title: 'Todas as permissões desmarcadas',
      description: 'Clique em "Salvar" para confirmar.',
    });
  };

  const togglePermission = (resource: string, action: string) => {
    const key = `${resource}:${action}`;
    const newSet = new Set(selectedPermissions);
    
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    
    setSelectedPermissions(newSet);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Remove todas as permissões atuais do grupo
      const { error: deleteError } = await supabase
        .from('group_permissions')
        .delete()
        .eq('group_id', group.id);

      if (deleteError) {
        console.error('Erro ao deletar permissões:', deleteError);
        throw deleteError;
      }

      // Adiciona as novas permissões selecionadas
      if (selectedPermissions.size > 0) {
        const permissionsToInsert = Array.from(selectedPermissions).map((perm) => {
          const [resource, action] = perm.split(':');
          return {
            group_id: group.id,
            resource: resource as any,
            action: action as any,
          };
        });

        console.log('Inserindo permissões:', permissionsToInsert);

        const { error: insertError } = await supabase
          .from('group_permissions')
          .insert(permissionsToInsert);

        if (insertError) {
          console.error('Erro ao inserir permissões:', insertError);
          throw insertError;
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro geral ao salvar:', error);
      toast({
        title: 'Erro ao atualizar permissões',
        description: error.message || 'Verifique se você tem permissão de administrador',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Gerenciar Permissões - {group.nome}
          </DialogTitle>
        </DialogHeader>

        {loadingPermissions ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="space-y-6">
            {/* Mirror Permissions Section */}
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-3">
                <Copy className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-base font-semibold">Espelhar Acessos</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Copie todas as permissões de outro grupo existente
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedSourceGroup} onValueChange={setSelectedSourceGroup}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um grupo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {availableGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nome}
                            {g.descricao && (
                              <span className="text-xs text-muted-foreground ml-2">
                                - {g.descricao}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleMirrorPermissions}
                      disabled={!selectedSourceGroup || selectedSourceGroup === 'none'}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Ou selecione manualmente as permissões
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Selecionar Todas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  <XSquare className="w-4 h-4 mr-2" />
                  Desmarcar Todas
                </Button>
              </div>
            </div>

            {RESOURCES.map((resource) => (
              <div key={resource.value} className="border rounded-lg p-4">
                <Label className="text-base font-semibold mb-3 block">
                  {resource.label}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ACTIONS.map((action) => {
                    const key = `${resource.value}:${action.value}`;
                    const isChecked = selectedPermissions.has(key);

                    return (
                      <div key={action.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={isChecked}
                          onCheckedChange={() => togglePermission(resource.value, action.value)}
                        />
                        <label
                          htmlFor={key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {action.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || loadingPermissions}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
