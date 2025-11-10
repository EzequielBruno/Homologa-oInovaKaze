import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Copy, Trash2, Edit, AlertCircle, KeyRound, Settings } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  full_name: string;
  email?: string;
  empresa?: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
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

interface Permission {
  resource: string;
  action: string;
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

export const UserRegistration = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [accessGroups, setAccessGroups] = useState<AccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [copyPermissionsOpen, setCopyPermissionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Edit user info states
  const [editInfoUser, setEditInfoUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmpresa, setEditEmpresa] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editDepartamento, setEditDepartamento] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [customPermissions, setCustomPermissions] = useState<Array<{resource: string; action: string}>>([]);
  const [passwordExpiryMonths, setPasswordExpiryMonths] = useState(6);
  const [passwordError, setPasswordError] = useState('');
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  
  // Copy permissions states
  const [sourceUserId, setSourceUserId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  
  // Reset password states
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Edit permissions states
  const [editPermissionsUser, setEditPermissionsUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users with their profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, empresa, telefone, cargo, departamento')
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

          // Email will be stored in user metadata or we can query it separately if needed
          // For now, we'll leave it undefined as we don't have admin access

          return {
            id: profile.id,
            full_name: profile.full_name || 'Sem nome',
            email: undefined, // Email not available without admin access
            empresa: profile.empresa || undefined,
            telefone: profile.telefone || undefined,
            cargo: profile.cargo || undefined,
            departamento: profile.departamento || undefined,
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

    // Validar que tem grupo OU permissões customizadas
    const hasGroup = selectedGroup || selectedGroups.length > 0;
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
      // Create user in auth using signUp
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

      // Update profile with empresa and password settings
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

      // Add user to selected groups
      if (selectedGroups.length > 0) {
        const groupIds = accessGroups
          .filter(g => selectedGroups.includes(g.nome))
          .map(g => g.id);

        await supabase
          .from('user_access_groups')
          .insert(groupIds.map(groupId => ({ user_id: authData.user.id, group_id: groupId })));
      }

      // Add custom permissions
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

      // Generate password reset link for first access
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        }
      );

      if (resetError) {
        console.error('Erro ao gerar link de acesso:', resetError);
      }

      // Show access link dialog
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

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cadastro de Usuários</CardTitle>
              <CardDescription>
                Gerencie usuários e suas permissões no sistema
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
                              {user.full_name} {user.email && `(${user.email})`}
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
                              {user.full_name} {user.email && `(${user.email})`}
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
                            Pelo menos 1 letra maiúscula
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-muted'}`}>
                            {/[a-z]/.test(password) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-xs ${/[a-z]/.test(password) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            Pelo menos 1 letra minúscula
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/\d/.test(password) ? 'bg-green-500' : 'bg-muted'}`}>
                            {/\d/.test(password) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-xs ${/\d/.test(password) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            Pelo menos 1 número
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-500' : 'bg-muted'}`}>
                            {/[!@#$%^&*(),.?":{}|<>]/.test(password) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={`text-xs ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                            Pelo menos 1 caractere especial (!@#$%^&*...)
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
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário cadastrado
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        {user.email && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                        {user.empresa && (
                          <Badge variant="outline" className="mt-1">
                            {user.empresa}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {user.groups.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {user.groups.map((group, idx) => (
                          <Badge key={idx} variant="secondary">
                            {group}
                          </Badge>
                        ))}
                      </div>
                    )}
                     {user.custom_permissions.filter(p => p.granted).length > 0 && (
                       <p className="text-xs text-muted-foreground mt-1">
                         {user.custom_permissions.filter(p => p.granted).length} permissões customizadas
                       </p>
                      )}
                   </div>
                   <div className="flex gap-2">
                     <Button
                       variant="outline"
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
                     >
                       <Edit className="w-4 h-4 mr-2" />
                       Editar
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setEditPermissionsUser(user)}
                     >
                       <Settings className="w-4 h-4 mr-2" />
                       Alterar Permissões
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setResetPasswordUserId(user.id);
                         setResetPasswordOpen(true);
                       }}
                     >
                       <KeyRound className="w-4 h-4 mr-2" />
                       Redefinir Senha
                     </Button>
                   </div>
                 </div>
              ))}
            </div>
          )}
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
                    Pelo menos uma letra maiúscula
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[a-z]/.test(newPasswordForUser) ? 'bg-green-500' : 'bg-muted-foreground/20'}`}>
                    {/[a-z]/.test(newPasswordForUser) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-xs ${/[a-z]/.test(newPasswordForUser) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    Pelo menos uma letra minúscula
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/\d/.test(newPasswordForUser) ? 'bg-green-500' : 'bg-muted-foreground/20'}`}>
                    {/\d/.test(newPasswordForUser) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-xs ${/\d/.test(newPasswordForUser) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    Pelo menos um número
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[!@#$%^&*]/.test(newPasswordForUser) ? 'bg-green-500' : 'bg-muted-foreground/20'}`}>
                    {/[!@#$%^&*]/.test(newPasswordForUser) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-xs ${/[!@#$%^&*]/.test(newPasswordForUser) ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    Pelo menos um caractere especial (!@#$%^&*)
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
    </div>
  );
};
