import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: string;
  full_name: string;
  email?: string;
  groups: string[];
  custom_permissions: Array<{
    resource: string;
    action: string;
    granted: boolean;
  }>;
}

interface AccessGroup {
  id: string;
  nome: string;
  descricao: string | null;
}

interface EditPermissionsDialogProps {
  user: User;
  accessGroups: AccessGroup[];
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
  { value: 'delete', label: 'Deletar' },
  { value: 'approve', label: 'Aprovar' },
  { value: 'manage', label: 'Gerenciar' },
];

export const EditPermissionsDialog = ({ user, accessGroups, onClose, onSuccess }: EditPermissionsDialogProps) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>(user.groups);
  const [customPermissions, setCustomPermissions] = useState<Array<{resource: string; action: string; granted: boolean}>>(
    user.custom_permissions
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleGroup = (groupName: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const addCustomPermission = () => {
    setCustomPermissions([...customPermissions, { resource: '', action: '', granted: true }]);
  };

  const removeCustomPermission = (index: number) => {
    setCustomPermissions(customPermissions.filter((_, i) => i !== index));
  };

  const updateCustomPermission = (index: number, field: 'resource' | 'action', value: string) => {
    const updated = [...customPermissions];
    updated[index][field] = value;
    setCustomPermissions(updated);
  };

  const togglePermissionGranted = (index: number) => {
    const updated = [...customPermissions];
    updated[index].granted = !updated[index].granted;
    setCustomPermissions(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Atualizar grupos
      // Primeiro remover todos os grupos atuais
      await supabase
        .from('user_access_groups')
        .delete()
        .eq('user_id', user.id);

      // Adicionar novos grupos
      if (selectedGroups.length > 0) {
        const groupIds = accessGroups
          .filter(g => selectedGroups.includes(g.nome))
          .map(g => g.id);

        await supabase
          .from('user_access_groups')
          .insert(groupIds.map(groupId => ({ user_id: user.id, group_id: groupId })));
      }

      // Atualizar permissões customizadas
      // Remover todas as permissões customizadas atuais
      await supabase
        .from('user_custom_permissions')
        .delete()
        .eq('user_id', user.id);

      // Adicionar novas permissões customizadas
      const validPermissions = customPermissions.filter(p => p.resource && p.action);
      if (validPermissions.length > 0) {
        await supabase
          .from('user_custom_permissions')
          .insert(
            validPermissions.map(perm => ({
              user_id: user.id,
              resource: perm.resource as any,
              action: perm.action as any,
              granted: perm.granted,
            }))
          );
      }

      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar permissões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar Permissões - {user.full_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups">Grupos de Acesso</TabsTrigger>
            <TabsTrigger value="custom">Permissões Customizadas</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-4">
            <div className="space-y-2">
              <Label>Grupos de Acesso</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-3">
                {accessGroups.map((group) => (
                  <div key={group.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.nome)}
                      onCheckedChange={() => toggleGroup(group.nome)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`group-${group.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {group.nome}
                      </label>
                      {group.descricao && (
                        <p className="text-xs text-muted-foreground">
                          {group.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedGroups.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedGroups.map((group) => (
                    <Badge key={group} variant="secondary">
                      {group}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Permissões Customizadas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomPermission}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {customPermissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma permissão customizada
                  </p>
                ) : (
                  customPermissions.map((perm, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-md">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Recurso</Label>
                          <Select
                            value={perm.resource}
                            onValueChange={(value) => updateCustomPermission(index, 'resource', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Recurso" />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOURCES.map((res) => (
                                <SelectItem key={res.value} value={res.value}>
                                  {res.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Ação</Label>
                          <Select
                            value={perm.action}
                            onValueChange={(value) => updateCustomPermission(index, 'action', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ação" />
                            </SelectTrigger>
                            <SelectContent>
                              {ACTIONS.map((act) => (
                                <SelectItem key={act.value} value={act.value}>
                                  {act.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <Checkbox
                          checked={perm.granted}
                          onCheckedChange={() => togglePermissionGranted(index)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomPermission(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
