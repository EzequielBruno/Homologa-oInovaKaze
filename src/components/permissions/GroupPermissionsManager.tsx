import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save } from 'lucide-react';

interface AccessGroup {
  id: string;
  nome: string;
}

interface GroupPermission {
  id: string;
  resource: string;
  action: string;
}

const RESOURCES = [
  { value: 'dashboard', label: 'Dashboard', category: 'Visualização' },
  { value: 'criar_demanda', label: 'Criar Demanda', category: 'Demandas' },
  { value: 'minhas_solicitacoes', label: 'Minhas Solicitações', category: 'Demandas' },
  { value: 'historico_acoes', label: 'Histórico de Ações', category: 'Demandas' },
  { value: 'demandas_finalizadas', label: 'Demandas Finalizadas', category: 'Demandas' },
  { value: 'kanban_empresa', label: 'Kanban da Empresa', category: 'Empresa' },
  { value: 'backlog_empresa', label: 'Backlog da Empresa', category: 'Empresa' },
  { value: 'progresso_empresa', label: 'Em Progresso (Empresa)', category: 'Empresa' },
  { value: 'concluidas_empresa', label: 'Concluídas (Empresa)', category: 'Empresa' },
  { value: 'arquivadas_empresa', label: 'Arquivadas (Empresa)', category: 'Empresa' },
  { value: 'gestao_riscos_empresa', label: 'Gestão de Riscos', category: 'Empresa' },
  { value: 'aguardando_validacao', label: 'Aguardando Validação', category: 'Atenção' },
  { value: 'aguardando_insumos', label: 'Aguardando Insumos', category: 'Atenção' },
  { value: 'standby', label: 'Stand By', category: 'Atenção' },
  { value: 'pareceres_pendentes', label: 'Pareceres Pendentes', category: 'Técnico' },
  { value: 'faseamento', label: 'Faseamento', category: 'Técnico' },
  { value: 'estimativas', label: 'Estimativas', category: 'Técnico' },
  { value: 'retrospectiva', label: 'Retrospectiva', category: 'Cerimônias' },
  { value: 'planning', label: 'Planning', category: 'Cerimônias' },
  { value: 'agenda_reviews', label: 'Agendar Reviews', category: 'Cerimônias' },
  { value: 'agenda_planning', label: 'Agendar Planning', category: 'Cerimônias' },
  { value: 'atualizacao_demandas', label: 'Atualização de Demandas', category: 'Operacional' },
  { value: 'aprovacoes', label: 'Aprovações', category: 'Gestão' },
  { value: 'permissoes', label: 'Permissões', category: 'Gestão' },
  { value: 'relatorios', label: 'Relatórios', category: 'Gestão' },
  { value: 'coordenador_ti', label: 'Coordenador de TI', category: 'Gestão' },
];

const CATEGORIES = Array.from(new Set(RESOURCES.map(r => r.category)));

const ACTIONS = [
  { value: 'view', label: 'Visualizar' },
  { value: 'create', label: 'Criar' },
  { value: 'edit', label: 'Editar' },
  { value: 'delete', label: 'Deletar' },
  { value: 'approve', label: 'Aprovar' },
  { value: 'manage', label: 'Gerenciar (Completo)' },
];

export function GroupPermissionsManager() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [permissions, setPermissions] = useState<GroupPermission[]>([]);
  const [permissionState, setPermissionState] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadPermissions();
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('access_groups')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar grupos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_permissions')
        .select('*')
        .eq('group_id', selectedGroupId);

      if (error) throw error;
      setPermissions(data || []);

      // Organize permissions by resource
      const state: Record<string, Set<string>> = {};
      (data || []).forEach((perm) => {
        if (!state[perm.resource]) {
          state[perm.resource] = new Set();
        }
        state[perm.resource].add(perm.action);
      });
      setPermissionState(state);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar permissões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (resource: string, action: string) => {
    const newState = { ...permissionState };
    if (!newState[resource]) {
      newState[resource] = new Set();
    }

    if (newState[resource].has(action)) {
      newState[resource].delete(action);
      if (newState[resource].size === 0) {
        delete newState[resource];
      }
    } else {
      newState[resource].add(action);
    }

    setPermissionState(newState);
  };

  const handleSavePermissions = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      // Delete all existing permissions for this group
      await supabase
        .from('group_permissions')
        .delete()
        .eq('group_id', selectedGroupId);

      // Insert new permissions
      const newPermissions: any[] = [];
      Object.entries(permissionState).forEach(([resource, actions]) => {
        actions.forEach((action) => {
          newPermissions.push({
            group_id: selectedGroupId,
            resource,
            action,
          });
        });
      });

      if (newPermissions.length > 0) {
        const { error } = await supabase
          .from('group_permissions')
          .insert(newPermissions);

        if (error) throw error;
      }

      toast({ title: 'Permissões salvas com sucesso' });
      loadPermissions();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar permissões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configurar Permissões do Grupo
          </CardTitle>
          {selectedGroupId && (
            <Button onClick={handleSavePermissions} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Permissões
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Selecione um Grupo</Label>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um grupo" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGroupId && !loading && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold">Permissões por Módulo</h3>
              <Badge variant="secondary">{Object.keys(permissionState).length} módulos com permissões</Badge>
            </div>

            <div className="space-y-6">
              {CATEGORIES.map((category) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-base font-semibold text-primary">{category}</h3>
                  <div className="grid gap-4">
                    {RESOURCES.filter(r => r.category === category).map((resource) => (
                      <div key={resource.value} className="p-4 border rounded-lg bg-background/50">
                        <h4 className="font-medium text-sm mb-3">{resource.label}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {ACTIONS.map((action) => (
                            <div key={action.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${resource.value}-${action.value}`}
                                checked={permissionState[resource.value]?.has(action.value) || false}
                                onCheckedChange={() => togglePermission(resource.value, action.value)}
                              />
                              <Label
                                htmlFor={`${resource.value}-${action.value}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {action.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedGroupId && loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando permissões...</p>
          </div>
        )}

        {!selectedGroupId && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Selecione um grupo para configurar permissões</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}