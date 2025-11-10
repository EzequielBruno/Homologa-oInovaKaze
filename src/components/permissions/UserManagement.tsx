import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Lock, Unlock, Edit, History, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { format } from 'date-fns';

interface UserWithDetails {
  id: string;
  full_name: string;
  email?: string;
  empresa?: string;
  created_at: string;
  blocked_at?: string;
  is_active: boolean;
  password_expires_at?: string;
  password_expiry_months?: number;
  groups: string[];
  custom_permissions: Array<{
    resource: string;
    action: string;
    granted: boolean;
  }>;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
  changed_by?: string;
}

export const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState<'block' | 'unblock' | 'delete' | null>(null);
  const [editEmpresaDialogOpen, setEditEmpresaDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, empresaFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      const usersWithDetails = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: userGroups } = await supabase
            .from('user_access_groups')
            .select('group_id, access_groups(nome)')
            .eq('user_id', profile.id);

          const { data: customPerms } = await supabase
            .from('user_custom_permissions')
            .select('resource, action, granted')
            .eq('user_id', profile.id);

          const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
          const authUser = authUsers?.find((u: any) => u.id === profile.id);

          return {
            id: profile.id,
            full_name: profile.full_name || 'Sem nome',
            email: authUser?.email,
            empresa: profile.empresa || undefined,
            created_at: profile.created_at || '',
            blocked_at: profile.blocked_at || undefined,
            is_active: profile.is_active ?? true,
            password_expires_at: profile.password_expires_at || undefined,
            password_expiry_months: profile.password_expiry_months || undefined,
            groups: userGroups?.map((ug: { access_groups: { nome: string } | null }) => ug.access_groups?.nome).filter(Boolean) || [],
            custom_permissions: customPerms || [],
          };
        })
      );

      setUsers(usersWithDetails);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (empresaFilter !== 'all') {
      filtered = filtered.filter((user) => user.empresa === empresaFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((user) => user.is_active);
    } else if (statusFilter === 'blocked') {
      filtered = filtered.filter((user) => !user.is_active);
    }

    setFilteredUsers(filtered);
  };

  const loadActivityLogs = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      setActivityLogs(data || []);
      setShowActivityDialog(true);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          blocked_at: new Date().toISOString()
        })
        .eq('id', userId);

      toast({
        title: 'Sucesso',
        description: 'Usuário bloqueado com sucesso',
      });

      setActionDialogOpen(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao bloquear usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ 
          is_active: true,
          blocked_at: null
        })
        .eq('id', userId);

      toast({
        title: 'Sucesso',
        description: 'Usuário reativado com sucesso',
      });

      setActionDialogOpen(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao reativar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEmpresa = async () => {
    if (!selectedUser) return;

    try {
      const empresaValue = selectedEmpresa === 'none' ? null : selectedEmpresa;
      await supabase
        .from('profiles')
        .update({ empresa: empresaValue as any })
        .eq('id', selectedUser.id);

      toast({
        title: 'Sucesso',
        description: 'Empresa atualizada com sucesso',
      });

      setEditEmpresaDialogOpen(false);
      setSelectedUser(null);
      setSelectedEmpresa(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar empresa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };



  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                <SelectItem value="ZS">ZS</SelectItem>
                <SelectItem value="ZC">ZC</SelectItem>
                <SelectItem value="ZF">ZF</SelectItem>
                <SelectItem value="Eletro">Eletro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Grupos</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.empresa ? (
                            <Badge variant="outline">{user.empresa}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedEmpresa(user.empresa || 'none');
                              setEditEmpresaDialogOpen(true);
                            }}
                            title="Editar empresa"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.groups.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {user.groups.slice(0, 2).map((group, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {group}
                              </Badge>
                            ))}
                            {user.groups.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.groups.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Ativo' : 'Bloqueado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadActivityLogs(user.id)}
                            title="Ver histórico"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          {user.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialogOpen('block');
                              }}
                              title="Bloquear usuário"
                            >
                              <Lock className="w-4 h-4 text-destructive" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialogOpen('unblock');
                              }}
                              title="Reativar usuário"
                            >
                              <Unlock className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Atividades</DialogTitle>
            <DialogDescription>
              Registro de todas as alterações e ações realizadas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {activityLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma atividade registrada
              </p>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 border rounded-lg bg-background/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen === 'block'} onOpenChange={() => setActionDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Bloqueio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja bloquear o usuário {selectedUser?.full_name}? 
              O usuário não poderá mais acessar o sistema até ser reativado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleBlockUser(selectedUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen === 'unblock'} onOpenChange={() => setActionDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reativação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reativar o usuário {selectedUser?.full_name}?
              O usuário poderá acessar o sistema novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUser && handleUnblockUser(selectedUser.id)}>
              Reativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Empresa Dialog */}
      <Dialog open={editEmpresaDialogOpen} onOpenChange={setEditEmpresaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Alterar Empresa
            </DialogTitle>
            <DialogDescription>
              Alterar a empresa do usuário {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedEmpresa || 'none'} onValueChange={setSelectedEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="ZS">ZS - Zema Seguros</SelectItem>
                  <SelectItem value="ZC">ZC - Zema Consórcio</SelectItem>
                  <SelectItem value="Eletro">Eletro - Eletrozema</SelectItem>
                  <SelectItem value="ZF">ZF - Zema Financeira</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditEmpresaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateEmpresa}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
