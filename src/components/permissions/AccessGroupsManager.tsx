import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Shield, Lock, Eye, Settings } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditGroupPermissionsDialog } from './EditGroupPermissionsDialog';

interface AccessGroup {
  id: string;
  nome: string;
  descricao: string | null;
  is_system_group: boolean;
  created_at: string;
}

interface GroupPermission {
  id: string;
  resource: string;
  action: string;
}

export function AccessGroupsManager() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccessGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [viewPermissionsGroup, setViewPermissionsGroup] = useState<AccessGroup | null>(null);
  const [editPermissionsGroup, setEditPermissionsGroup] = useState<AccessGroup | null>(null);
  const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('access_groups')
        .select('*')
        .order('nome');

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar grupos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (group?: AccessGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.nome);
      setGroupDescription(group.descricao || '');
    } else {
      setEditingGroup(null);
      setGroupName('');
      setGroupDescription('');
    }
    setDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do grupo é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingGroup) {
        if (editingGroup.is_system_group) {
          toast({
            title: 'Erro',
            description: 'Grupos do sistema não podem ser editados',
            variant: 'destructive',
          });
          return;
        }

        const { error } = await supabase
          .from('access_groups')
          .update({
            nome: groupName.trim(),
            descricao: groupDescription.trim() || null,
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
        toast({ title: 'Grupo atualizado com sucesso' });
      } else {
        const { error } = await supabase
          .from('access_groups')
          .insert({
            nome: groupName.trim(),
            descricao: groupDescription.trim() || null,
            is_system_group: false,
          });

        if (error) throw error;
        toast({ title: 'Grupo criado com sucesso' });
      }

      setDialogOpen(false);
      setGroupName('');
      setGroupDescription('');
      setEditingGroup(null);
      loadGroups();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar grupo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGroup = async (group: AccessGroup) => {
    if (group.is_system_group) {
      toast({
        title: 'Erro',
        description: 'Grupos do sistema não podem ser excluídos',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o grupo "${group.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('access_groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;

      toast({ title: 'Grupo excluído com sucesso' });
      loadGroups();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir grupo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadGroupPermissions = async (groupId: string) => {
    setLoadingPermissions(true);
    try {
      const { data, error } = await supabase
        .from('group_permissions')
        .select('id, resource, action')
        .eq('group_id', groupId);

      if (error) throw error;

      setGroupPermissions(data || []);
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

  const handleViewPermissions = (group: AccessGroup) => {
    setViewPermissionsGroup(group);
    loadGroupPermissions(group.id);
  };

  const getResourceLabel = (resource: string) => {
    const labels: Record<string, string> = {
      'dashboard': 'Painel Inicial',
      'criar_demanda': 'Criar Solicitação',
      'gerenciar_demandas': 'Minhas Solicitações',
      'aprovar_demandas': 'Aprovações',
      'avaliar_demandas': 'Pareceres Técnicos',
      'relatorios': 'Relatórios',
      'gestao_riscos': 'Gestão de Riscos',
      'planejamento': 'Planejamento',
      'retrospectivas': 'Retrospectiva',
      'dailys': 'Dailys',
      'permissoes': 'Permissões',
      'backlog': 'Backlog',
      'em_progresso': 'Em Progresso',
      'concluidas': 'Concluídas',
      'arquivadas': 'Arquivadas',
    };
    return labels[resource] || resource;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'view': 'Visualizar',
      'create': 'Criar',
      'update': 'Editar',
      'delete': 'Excluir',
      'approve': 'Aprovar',
      'evaluate': 'Avaliar',
      'export': 'Exportar',
      'manage': 'Gerenciar',
      'read': 'Ler',
      'write': 'Escrever',
    };
    return labels[action.toLowerCase()] || action;
  };

  const getPermissionDescription = (resource: string, action: string) => {
    const descriptions: Record<string, Record<string, string>> = {
      'dashboard': {
        'view': 'Pode visualizar o painel inicial com estatísticas e indicadores gerais',
      },
      'criar_demanda': {
        'view': 'Pode acessar o formulário de criação de solicitações',
        'create': 'Pode criar novas solicitações no sistema',
      },
      'gerenciar_demandas': {
        'view': 'Pode visualizar suas próprias solicitações',
        'update': 'Pode editar suas solicitações',
        'delete': 'Pode excluir suas solicitações',
      },
      'aprovar_demandas': {
        'view': 'Pode visualizar solicitações pendentes de aprovação',
        'approve': 'Pode aprovar ou recusar solicitações',
        'update': 'Pode editar informações durante aprovação',
      },
      'avaliar_demandas': {
        'view': 'Pode visualizar solicitações pendentes de parecer',
        'evaluate': 'Pode emitir pareceres técnicos sobre solicitações',
        'create': 'Pode criar novos pareceres técnicos',
      },
      'relatorios': {
        'view': 'Pode visualizar relatórios gerenciais e indicadores',
        'export': 'Pode exportar relatórios para PDF ou Excel',
      },
      'gestao_riscos': {
        'view': 'Pode visualizar análises de risco dos projetos',
        'create': 'Pode criar novas avaliações de risco',
        'update': 'Pode atualizar avaliações de risco existentes',
      },
      'planejamento': {
        'view': 'Pode visualizar o planejamento de sprints',
        'create': 'Pode criar novos planejamentos de sprint',
        'update': 'Pode editar planejamentos existentes',
      },
      'retrospectivas': {
        'view': 'Pode visualizar retrospectivas de sprints',
        'create': 'Pode criar novas retrospectivas',
        'update': 'Pode editar retrospectivas existentes',
      },
      'dailys': {
        'view': 'Pode visualizar atualizações diárias das equipes',
        'create': 'Pode registrar novas atualizações diárias',
      },
      'permissoes': {
        'view': 'Pode visualizar usuários e permissões do sistema',
        'create': 'Pode cadastrar novos usuários e grupos',
        'update': 'Pode editar usuários, grupos e permissões',
        'delete': 'Pode excluir usuários e grupos',
      },
      'backlog': {
        'view': 'Pode visualizar demandas no backlog',
      },
      'em_progresso': {
        'view': 'Pode visualizar demandas em andamento',
        'update': 'Pode atualizar status de demandas em progresso',
      },
      'concluidas': {
        'view': 'Pode consultar histórico de demandas concluídas',
      },
      'arquivadas': {
        'view': 'Pode acessar demandas arquivadas',
      },
    };

    return descriptions[resource]?.[action] || `Permissão de ${getActionLabel(action).toLowerCase()} para ${getResourceLabel(resource)}`;
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Grupos de Acesso
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? 'Editar Grupo' : 'Criar Novo Grupo'}
                </DialogTitle>
                <DialogDescription>
                  {editingGroup 
                    ? 'Edite as informações do grupo de acesso'
                    : 'Crie um novo grupo de acesso para organizar permissões'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Nome do Grupo *</Label>
                  <Input
                    id="group-name"
                    placeholder="Ex: Analistas"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-desc">Descrição</Label>
                  <Textarea
                    id="group-desc"
                    placeholder="Descreva o propósito deste grupo"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <Button onClick={handleSaveGroup} className="w-full">
                  {editingGroup ? 'Salvar Alterações' : 'Criar Grupo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum grupo cadastrado
          </p>
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="p-4 bg-background/50 rounded-lg border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{group.nome}</h3>
                      {group.is_system_group && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Sistema
                        </Badge>
                      )}
                    </div>
                    {group.descricao && (
                      <p className="text-sm text-muted-foreground">{group.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewPermissions(group)}
                      title="Ver permissões"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditPermissionsGroup(group)}
                      title="Alterar permissões"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    {!group.is_system_group && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(group)}
                          title="Editar grupo"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group)}
                          title="Excluir grupo"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* View Permissions Dialog */}
      <Dialog open={!!viewPermissionsGroup} onOpenChange={() => setViewPermissionsGroup(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões: {viewPermissionsGroup?.nome}</DialogTitle>
            <DialogDescription>
              Funcionalidades que este grupo tem acesso
            </DialogDescription>
          </DialogHeader>
          {loadingPermissions ? (
            <div className="text-center py-8">Carregando...</div>
          ) : groupPermissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Este grupo ainda não possui permissões configuradas.
            </p>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Aba / Funcionalidade</TableHead>
                    <TableHead className="w-[120px]">Permissão</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">
                        {getResourceLabel(permission.resource)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getActionLabel(permission.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getPermissionDescription(permission.resource, permission.action)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      {editPermissionsGroup && (
        <EditGroupPermissionsDialog
          group={editPermissionsGroup}
          onClose={() => setEditPermissionsGroup(null)}
          onSuccess={() => {
            setEditPermissionsGroup(null);
            loadGroups();
          }}
        />
      )}
    </Card>
  );
}