import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Trash2, Copy } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
}

interface AccessGroup {
  id: string;
  nome: string;
}

interface UserGroup {
  id: string;
  user_id: string;
  group_id: string;
  access_groups: {
    nome: string;
  };
}

export function UserGroupsManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Add user to group dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newGroupId, setNewGroupId] = useState('');
  
  // Copy permissions dialog
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [sourceUserId, setSourceUserId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserGroups();
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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

  const loadUserGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_access_groups')
        .select('*, access_groups(nome)')
        .eq('user_id', selectedUserId);

      if (error) throw error;
      setUserGroups(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar grupos do usuário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserToGroup = async () => {
    if (!selectedUserId || !newGroupId) {
      toast({
        title: 'Erro',
        description: 'Selecione um grupo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_access_groups')
        .insert({
          user_id: selectedUserId,
          group_id: newGroupId,
        });

      if (error) throw error;

      toast({ title: 'Usuário adicionado ao grupo com sucesso' });
      setAddDialogOpen(false);
      setNewGroupId('');
      loadUserGroups();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar usuário ao grupo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveUserFromGroup = async (userGroupId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário do grupo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_access_groups')
        .delete()
        .eq('id', userGroupId);

      if (error) throw error;

      toast({ title: 'Usuário removido do grupo' });
      loadUserGroups();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover usuário do grupo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCopyPermissions = async () => {
    if (!sourceUserId || !targetUserId) {
      toast({
        title: 'Erro',
        description: 'Selecione o usuário de origem e destino',
        variant: 'destructive',
      });
      return;
    }

    if (sourceUserId === targetUserId) {
      toast({
        title: 'Erro',
        description: 'Usuários de origem e destino devem ser diferentes',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('copy_user_permissions', {
        _source_user_id: sourceUserId,
        _target_user_id: targetUserId,
      });

      if (error) throw error;

      toast({
        title: 'Permissões copiadas com sucesso',
        description: 'Todas as permissões foram espelhadas para o usuário destino',
      });

      setCopyDialogOpen(false);
      setSourceUserId('');
      setTargetUserId('');
      
      if (selectedUserId === targetUserId) {
        loadUserGroups();
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao copiar permissões',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Atribuir Grupos aos Usuários
            </CardTitle>
            <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Permissões
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Copiar Permissões Entre Usuários</DialogTitle>
                  <DialogDescription>
                    Copie todos os grupos e permissões customizadas de um usuário para outro
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Usuário de Origem (copiar de)</Label>
                    <Select value={sourceUserId} onValueChange={setSourceUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o usuário origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Usuário de Destino (copiar para)</Label>
                    <Select value={targetUserId} onValueChange={setTargetUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o usuário destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ Atenção: Esta ação irá substituir todos os grupos e permissões customizadas do usuário destino
                    </p>
                  </div>

                  <Button onClick={handleCopyPermissions} className="w-full">
                    Copiar Permissões
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecione um Usuário</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Grupos do Usuário</h3>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar ao Grupo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Usuário ao Grupo</DialogTitle>
                      <DialogDescription>
                        Selecione um grupo para adicionar o usuário
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Grupo</Label>
                        <Select value={newGroupId} onValueChange={setNewGroupId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups
                              .filter(g => !userGroups.some(ug => ug.group_id === g.id))
                              .map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.nome}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleAddUserToGroup} className="w-full">
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : userGroups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Usuário não está em nenhum grupo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userGroups.map((ug) => (
                    <div
                      key={ug.id}
                      className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
                    >
                      <Badge variant="secondary">{ug.access_groups.nome}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUserFromGroup(ug.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!selectedUserId && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Selecione um usuário para gerenciar grupos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}