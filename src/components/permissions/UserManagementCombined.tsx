import { useState, useEffect } from 'react';
import { Eye, EyeOff, Search, Lock, Unlock, Edit, History, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Copy, Trash2, AlertCircle, KeyRound, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EMPRESAS } from '@/types/demand';
import { EditPermissionsDialog } from './EditPermissionsDialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface User {
  id: string;
  full_name: string;
  email?: string;
  empresa?: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
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

interface AccessGroup {
  id: string;
  nome: string;
  descricao: string | null;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
  changed_by?: string;
}

interface UserManagementCombinedProps {
  focusUserId?: string;
  onResetPasswordIntentHandled?: () => void;
}

const RESOURCES = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'criar_demanda', label: 'Criar Demanda' },
  { value: 'minhas_solicitacoes', label: 'Minhas Solicitações' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'permissoes', label: 'Permissões' },
  { value: 'aprovacoes', label: 'Aprovações' },
];

const ACTIONS = [
  { value: 'view', label: 'Visualizar' },
  { value: 'create', label: 'Criar' },
  { value: 'edit', label: 'Editar' },
  { value: 'delete', label: 'Deletar' },
  { value: 'approve', label: 'Aprovar' },
  { value: 'manage', label: 'Gerenciar' },
];

const ALLOWED_DOMAINS = [
  'zema.com',
  'zemafinanceira.com',
  'zemaseguros.com',
  'consorciozema.com'
];

const isAllowedDomain = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
};

export const UserManagementCombined = ({
  focusUserId,
  onResetPasswordIntentHandled,
}: UserManagementCombinedProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [accessGroups, setAccessGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
  
  // Add User Dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [customPermissions, setCustomPermissions] = useState<Array<{resource: string; action: string}>>([]);
  const [passwordExpiryMonths, setPasswordExpiryMonths] = useState(6);
  const [passwordError, setPasswordError] = useState('');
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  
  // Copy permissions states
  const [copyPermissionsOpen, setCopyPermissionsOpen] = useState(false);
  const [sourceUserId, setSourceUserId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  
  // Edit user info states
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editInfoUser, setEditInfoUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmpresa, setEditEmpresa] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editDepartamento, setEditDepartamento] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  
  // Reset password states
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Edit permissions states
  const [editPermissionsUser, setEditPermissionsUser] = useState<User | null>(null);
  
  // Management states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState<'block' | 'unblock' | null>(null);
  const [editEmpresaDialogOpen, setEditEmpresaDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, empresaFilter, statusFilter]);

  useEffect(() => {
    if (loading || !focusUserId) {
      return;
    }

    const targetUser = users.find((user) => user.id === focusUserId);

    if (!targetUser) {
      toast({
        title: 'Usuário não encontrado',
        description: 'Não foi possível localizar o usuário associado a esta notificação.',
        variant: 'destructive',
      });
      onResetPasswordIntentHandled?.();
      return;
    }

    setEmpresaFilter('all');
    setStatusFilter('all');
    setSearchTerm(targetUser.full_name);
    setHighlightedUserId(targetUser.id);
    setResetPasswordUserId(targetUser.id);
    setResetPasswordOpen(true);
    setShowResetPassword(false);
    setNewPasswordForUser('');
    setPasswordError('');
    onResetPasswordIntentHandled?.();
  }, [focusUserId, loading, users, toast, onResetPasswordIntentHandled]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users with their profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      // Load access groups
      const { data: groups } = await supabase
        .from('access_groups')
        .select('*')
        .order('nome');

      setAccessGroups(groups || []);

      // Load user groups and custom permissions for each user
      const usersWithPermissions = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: userGroups } = await supabase
            .from('user_access_groups')
            .select('group_id, access_groups(nome)')
            .eq('user_id', profile.id);

          const { data: customPerms } = await supabase
            .from('user_custom_permissions')
            .select('resource, action, granted')
            .eq('user_id', profile.id);

          return {
            id: profile.id,
            full_name: profile.full_name || 'Sem nome',
            email: undefined,
            empresa: profile.empresa || undefined,
            telefone: profile.telefone || undefined,
            cargo: profile.cargo || undefined,
            departamento: profile.departamento || undefined,
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

      setUsers(usersWithPermissions);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
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

  const handleAddUser = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (!isAllowedDomain(email)) {
      toast({
        title: 'E-mail não permitido',
        description: 'Este e-mail não faz parte de empresas do Grupo Zema. Use um e-mail corporativo (@zema.com, @zemafinanceira.com, @zemaseguros.com ou @consorciozema.com)',
        variant: 'destructive',
      });
      return;
    }

    const hasGroup = selectedGroups.length > 0;
    const hasCustomPermissions = customPermissions.some(p => p.resource && p.action);
    
    if (!hasGroup && !hasCustomPermissions) {
      toast({
        title: 'Erro de validação',
        description: 'Selecione um grupo de acesso OU adicione pelo menos uma permissão customizada',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      const passwordExpiresAt = new Date();
      passwordExpiresAt.setMonth(passwordExpiresAt.getMonth() + passwordExpiryMonths);
      
      await supabase
        .from('profiles')
        .update({ 
          empresa: empresa ? empresa as 'ZS' | 'ZC' | 'ZF' | 'Eletro' : null,
          password_expiry_months: passwordExpiryMonths,
          password_expires_at: passwordExpiresAt.toISOString(),
          force_password_change: true,
          is_active: true
        })
        .eq('id', authData.user.id);

      if (selectedGroups.length > 0) {
        const groupIds = accessGroups
          .filter(g => selectedGroups.includes(g.nome))
          .map(g => g.id);

        await supabase
          .from('user_access_groups')
          .insert(groupIds.map(groupId => ({ user_id: authData.user.id, group_id: groupId })));
      }

      if (customPermissions.length > 0) {
        await supabase
          .from('user_custom_permissions')
          .insert(
            customPermissions
              .filter(perm => perm.resource && perm.action)
              .map(perm => ({
                user_id: authData.user.id,
                resource: perm.resource as any,
                action: perm.action as any,
                granted: true,
              }))
          );
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        }
      );

      if (resetError) {
        console.error('Erro ao gerar link de acesso:', resetError);
      }

      setNewUserEmail(email);
      setAccessLink(`${window.location.origin}/auth?email=${encodeURIComponent(email)}`);

      toast({
        title: 'Sucesso',
        description: 'Usuário criado! Link de acesso gerado.',
      });

      setAddUserOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCopyPermissions = async () => {
    if (!sourceUserId || !targetUserId) {
      toast({
        title: 'Erro',
        description: 'Selecione os usuários de origem e destino',
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
        title: 'Sucesso',
        description: 'Permissões copiadas com sucesso',
      });

      setCopyPermissionsOpen(false);
      setSourceUserId('');
      setTargetUserId('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao copiar permissões',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const validatePassword = (pwd: string): boolean => {
    const minLength = pwd.length >= 6;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    if (!minLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setPasswordError('Senha não atende todos os requisitos');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setEmpresa('');
    setSelectedGroups([]);
    setCustomPermissions([]);
    setPasswordExpiryMonths(6);
    setPasswordError('');
  };

  const toggleGroup = (groupName: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const addCustomPermission = () => {
    setCustomPermissions([...customPermissions, { resource: '', action: '' }]);
  };

  const removeCustomPermission = (index: number) => {
    setCustomPermissions(customPermissions.filter((_, i) => i !== index));
  };

  const updateCustomPermission = (index: number, field: 'resource' | 'action', value: string) => {
    const updated = [...customPermissions];
    updated[index][field] = value;
    setCustomPermissions(updated);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPasswordForUser) {
      toast({
        title: 'Erro',
        description: 'Digite a nova senha',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePassword(newPasswordForUser)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { 
          userId: resetPasswordUserId,
          newPassword: newPasswordForUser 
        },
      });

      if (error) throw error;

      toast({
        title: 'Senha redefinida',
        description: 'A senha foi redefinida com sucesso. O usuário deverá trocá-la no próximo acesso.',
      });

      setResetPasswordOpen(false);
      setResetPasswordUserId(null);
      setNewPasswordForUser('');
    } catch (error: any) {
      toast({
        title: 'Erro ao redefinir senha',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditUserInfo = async () => {
    if (!editInfoUser || !editFullName) {
      toast({
        title: 'Erro',
        description: 'Nome completo é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName,
          empresa: editEmpresa ? (editEmpresa as 'ZS' | 'ZC' | 'ZF' | 'Eletro') : null,
          cargo: editCargo || null,
          departamento: editDepartamento || null,
          telefone: editTelefone || null,
        })
        .eq('id', editInfoUser.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Informações do usuário atualizadas',
      });

      setEditUserOpen(false);
      setEditInfoUser(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
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
      loadData();
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
      loadData();
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
      loadData();
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>
                Cadastre, visualize e gerencie todos os usuários e suas permissões no sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={copyPermissionsOpen} onOpenChange={setCopyPermissionsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Permissões
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Copiar Permissões</DialogTitle>
                    <DialogDescription>
                      Espelhe as permissões de um usuário para outro
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Usuário Origem (modelo)</Label>
                      <Select value={sourceUserId} onValueChange={setSourceUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o usuário modelo" />
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
                      <Label>Usuário Destino</Label>
                      <Select value={targetUserId} onValueChange={setTargetUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o usuário destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.id !== sourceUserId).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCopyPermissions} className="w-full">
                      Copiar Permissões
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo usuário e defina suas permissões
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo *</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nome do usuário"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Senha inicial"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${password.length >= 6 ? 'bg-green-500' : 'bg-muted'}`}>
                            {password.length >= 6 && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-xs ${password.length >= 6 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            Mínimo 6 caracteres
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-muted'}`}>
                            {/[A-Z]/.test(password) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-xs ${/[A-Z]/.test(password) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            Letra maiúscula
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-muted'}`}>
                            {/[a-z]/.test(password) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-xs ${/[a-z]/.test(password) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            Letra minúscula
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/\d/.test(password) ? 'bg-green-500' : 'bg-muted'}`}>
                            {/\d/.test(password) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-xs ${/\d/.test(password) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            Número
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-500' : 'bg-muted'}`}>
                            {/[!@#$%^&*(),.?":{}|<>]/.test(password) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            Caractere especial
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        O usuário será solicitado a alterar a senha no primeiro acesso.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="empresa">Empresa</Label>
                        <Select value={empresa} onValueChange={setEmpresa}>
                          <SelectTrigger id="empresa">
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPRESAS.map((emp) => (
                              <SelectItem key={emp.value} value={emp.value}>
                                {emp.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passwordExpiry">Expiração de Senha</Label>
                        <Select 
                          value={passwordExpiryMonths.toString()} 
                          onValueChange={(value) => setPasswordExpiryMonths(Number(value))}
                        >
                          <SelectTrigger id="passwordExpiry">
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 meses</SelectItem>
                            <SelectItem value="6">6 meses</SelectItem>
                            <SelectItem value="12">12 meses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Grupos de Acesso</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {accessGroups.map((group) => (
                          <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={group.id}
                              checked={selectedGroups.includes(group.nome)}
                              onCheckedChange={() => toggleGroup(group.nome)}
                            />
                            <Label htmlFor={group.id} className="cursor-pointer">
                              {group.nome}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Permissões Customizadas</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomPermission}
                        >
                          Adicionar Permissão
                        </Button>
                      </div>
                      {customPermissions.map((perm, index) => (
                        <div key={index} className="flex gap-2">
                          <Select
                            value={perm.resource}
                            onValueChange={(value) => updateCustomPermission(index, 'resource', value)}
                          >
                            <SelectTrigger className="flex-1">
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
                          <Select
                            value={perm.action}
                            onValueChange={(value) => updateCustomPermission(index, 'action', value)}
                          >
                            <SelectTrigger className="flex-1">
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomPermission(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleAddUser} className="w-full">
                      Criar Usuário
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (highlightedUserId) {
                    setHighlightedUserId(null);
                  }
                }}
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className={`transition-colors ${
                        highlightedUserId === user.id ? 'bg-primary/10 border-primary/40' : ''
                      }`}
                    >
                      <TableCell className="font-medium">{user.full_name}</TableCell>
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
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditInfoUser(user);
                              setEditFullName(user.full_name);
                              setEditEmpresa(user.empresa || '');
                              setEditCargo(user.cargo || '');
                              setEditDepartamento(user.departamento || '');
                              setEditTelefone(user.telefone || '');
                              setEditUserOpen(true);
                            }}
                            title="Editar informações"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditPermissionsUser(user)}
                            title="Alterar permissões"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResetPasswordUserId(user.id);
                              setResetPasswordOpen(true);
                            }}
                            title="Redefinir senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
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

      {/* Access Link Dialog */}
      <Dialog open={!!accessLink} onOpenChange={(open) => !open && setAccessLink(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link de Primeiro Acesso Gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Usuário criado com sucesso! Copie o link abaixo e envie para:
              </p>
              <p className="font-medium">{newUserEmail}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Link de Acesso</Label>
              <div className="flex gap-2">
                <Input
                  value={accessLink || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (accessLink) {
                      navigator.clipboard.writeText(accessLink);
                      toast({
                        title: 'Link copiado!',
                        description: 'Link copiado para a área de transferência',
                      });
                    }
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-md space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Instruções para o novo usuário:
              </h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Acesse o link fornecido</li>
                <li>Clique em "Primeiro Acesso"</li>
                <li>Digite o e-mail: <strong>{newUserEmail}</strong></li>
                <li>Senha cadastrada e informada pelo adm Master</li>
                <li>Será solicitado a alteração da senha para este primeiro acesso</li>
              </ol>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O usuário deverá trocar a senha obrigatoriamente no primeiro acesso.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      {editPermissionsUser && (
        <EditPermissionsDialog
          user={editPermissionsUser}
          accessGroups={accessGroups}
          onClose={() => setEditPermissionsUser(null)}
          onSuccess={() => {
            loadData();
            setEditPermissionsUser(null);
          }}
        />
      )}

      {/* Edit User Info Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Informações do Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações cadastrais do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Nome Completo *</Label>
              <Input
                id="edit-fullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-empresa">Empresa</Label>
              <Select value={editEmpresa} onValueChange={setEditEmpresa}>
                <SelectTrigger id="edit-empresa">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {EMPRESAS.map((emp) => (
                    <SelectItem key={emp.value} value={emp.value}>
                      {emp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cargo">Cargo</Label>
              <Input
                id="edit-cargo"
                value={editCargo}
                onChange={(e) => setEditCargo(e.target.value)}
                placeholder="Cargo do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-departamento">Departamento</Label>
              <Input
                id="edit-departamento"
                value={editDepartamento}
                onChange={(e) => setEditDepartamento(e.target.value)}
                placeholder="Departamento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                value={editTelefone}
                onChange={(e) => setEditTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <Button onClick={handleEditUserInfo} className="w-full">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha do Usuário</DialogTitle>
            <DialogDescription>
              Digite a nova senha temporária para o usuário. Ele deverá alterá-la no próximo acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-user-password"
                  type={showResetPassword ? "text" : "password"}
                  value={newPasswordForUser}
                  onChange={(e) => setNewPasswordForUser(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>

            <div className="bg-muted p-3 rounded-md text-sm space-y-2">
              <p className="font-medium">Requisitos da senha:</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${newPasswordForUser.length >= 6 ? 'bg-green-500' : 'bg-muted-foreground/20'}`}>
                    {newPasswordForUser.length >= 6 && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-xs ${newPasswordForUser.length >= 6 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    Mínimo de 6 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[A-Z]/.test(newPasswordForUser) ? 'bg-green-500' : 'bg-muted-foreground/20'}`}>
                    {/[A-Z]/.test(newPasswordForUser) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-xs ${/[A-Z]/.test(newPasswordForUser) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    Letra maiúscula
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[a-z]/.test(newPasswordForUser) ? 'bg-green-500' : 'bg-muted-foreground/20'}`}>
                    {/[a-z]/.test(newPasswordForUser) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-xs ${/[a-z]/.test(newPasswordForUser) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    Letra minúscula
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/\d/.test(newPasswordForUser) ? 'bg-green-500' : 'bg-muted-foreground/20'}`}>
                    {/\d/.test(newPasswordForUser) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-xs ${/\d/.test(newPasswordForUser) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    Número
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[!@#$%^&*(),.?":{}|<>]/.test(newPasswordForUser) ? 'bg-green-500' : 'bg-muted-foreground/20'}`}>
                    {/[!@#$%^&*(),.?":{}|<>]/.test(newPasswordForUser) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(newPasswordForUser) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    Caractere especial
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordOpen(false);
                  setResetPasswordUserId(null);
                  setNewPasswordForUser('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleResetPassword}>
                Redefinir Senha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
