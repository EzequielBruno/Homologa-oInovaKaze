import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building, Briefcase, Shield, KeyRound, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  empresa: string | null;
  cargo: string | null;
  departamento: string | null;
  telefone: string | null;
}

interface AccessGroup {
  id: string;
  nome: string;
  descricao: string | null;
}

interface CustomPermission {
  resource: string;
  action: string;
  granted: boolean;
}

const Perfil = () => {
  const { user } = useAuth();
  const userPermissions = useUserPermissions();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [permissions, setPermissions] = useState<CustomPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get email from auth user metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();

      setProfile({
        ...profileData,
        email: authUser?.email || '',
      });

      // Load access groups
      const { data: userGroups, error: groupsError } = await supabase
        .from('user_access_groups')
        .select('group_id, access_groups(id, nome, descricao)')
        .eq('user_id', user.id);

      if (!groupsError && userGroups) {
        const groupsList = userGroups
          .map(ug => ug.access_groups)
          .filter(Boolean) as AccessGroup[];
        setGroups(groupsList);
      }

      // Load custom permissions
      const { data: customPerms, error: permsError } = await supabase
        .from('user_custom_permissions')
        .select('resource, action, granted')
        .eq('user_id', user.id);

      if (!permsError && customPerms) {
        setPermissions(customPerms);
      }

      // Load user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!rolesError && roles) {
        setUserRoles(roles.map(r => r.role));
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pwd: string): boolean => {
    const minLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*]/.test(pwd);

    if (!minLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setPasswordError('A senha não atende todos os requisitos');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!validatePassword(newPassword)) {
      return;
    }

    try {
      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        return;
      }

      // Atualizar para nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Senha alterada com sucesso!');
      setChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error: any) {
      toast.error('Erro ao alterar senha', {
        description: error.message,
      });
    }
  };

  const getResourceLabel = (resource: string) => {
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      criar_demanda: 'Criar Demanda',
      minhas_solicitacoes: 'Minhas Solicitações',
      relatorios: 'Relatórios',
      permissoes: 'Permissões',
      aprovacoes: 'Aprovações',
    };
    return labels[resource] || resource;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      view: 'Visualizar',
      create: 'Criar',
      edit: 'Editar',
      delete: 'Deletar',
      approve: 'Aprovar',
      manage: 'Gerenciar',
    };
    return labels[action] || action;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      tech_lead: 'Líder Técnico',
      user: 'Usuário',
      moderator: 'Moderador',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar perfil do usuário
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Visualize suas informações e permissões no sistema
        </p>
      </div>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Seus dados cadastrados no sistema</CardDescription>
            </div>
            <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <KeyRound className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                  <DialogDescription>
                    Digite sua senha atual e a nova senha
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}

                  <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                    <p className="font-medium">Requisitos da senha:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Mínimo de 8 caracteres</li>
                      <li>Pelo menos uma letra maiúscula</li>
                      <li>Pelo menos uma letra minúscula</li>
                      <li>Pelo menos um número</li>
                      <li>Pelo menos um caractere especial (!@#$%^&*)</li>
                    </ul>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setChangePasswordOpen(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleChangePassword}>
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                Nome Completo
              </Label>
              <p className="text-lg font-medium">{profile.full_name}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <p className="text-lg font-medium">{profile.email}</p>
            </div>

            {profile.empresa && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Building className="w-4 h-4" />
                  Empresa
                </Label>
                <Badge variant="secondary" className="text-sm">
                  {profile.empresa}
                </Badge>
              </div>
            )}

            {profile.cargo && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  Cargo
                </Label>
                <p className="text-lg font-medium">{profile.cargo}</p>
              </div>
            )}

            {profile.departamento && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Building className="w-4 h-4" />
                  Departamento
                </Label>
                <p className="text-lg font-medium">{profile.departamento}</p>
              </div>
            )}

            {profile.telefone && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  Telefone
                </Label>
                <p className="text-lg font-medium">{profile.telefone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grupos de Acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Grupos de Acesso
          </CardTitle>
          <CardDescription>
            Grupos aos quais você pertence
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Você não está associado a nenhum grupo de acesso
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <Badge key={group.id} variant="secondary" className="px-3 py-1">
                  {group.nome}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funções no Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Funções no Sistema
          </CardTitle>
          <CardDescription>
            Suas funções e privilégios atribuídos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRoles.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Você não possui funções especiais atribuídas
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userRoles.map((role, index) => (
                <Badge key={index} variant="default" className="px-3 py-1">
                  {getRoleLabel(role)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissões Customizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissões Customizadas
          </CardTitle>
          <CardDescription>
            Permissões específicas atribuídas a você
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.filter(p => p.granted).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Você não possui permissões customizadas
            </p>
          ) : (
            <div className="space-y-2">
              {permissions
                .filter(p => p.granted)
                .map((perm, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{getResourceLabel(perm.resource)}</p>
                      <p className="text-sm text-muted-foreground">
                        Ação: {getActionLabel(perm.action)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                      Concedida
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acessos Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Acessos Disponíveis
          </CardTitle>
          <CardDescription>
            Recursos e funcionalidades que você pode acessar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status de Solicitante */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              {userPermissions.isSolicitante ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Solicitante de Demandas</p>
                <p className="text-sm text-muted-foreground">
                  {userPermissions.isSolicitante
                    ? `Você pode criar e gerenciar demandas para ${userPermissions.solicitanteEmpresa}`
                    : 'Você não possui permissão para criar demandas'}
                </p>
              </div>
            </div>

            {/* Status de Membro do Comitê */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              {userPermissions.isCommitteeMember ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Membro do Comitê</p>
                <p className="text-sm text-muted-foreground">
                  {userPermissions.isCommitteeMember
                    ? 'Você participa das decisões do comitê de aprovação'
                    : 'Você não faz parte do comitê de aprovação'}
                </p>
              </div>
            </div>

            {/* Capacidade de Aprovação */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              {userPermissions.canApprove ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Aprovação de Demandas</p>
                <p className="text-sm text-muted-foreground">
                  {userPermissions.canApprove
                    ? 'Você pode aprovar ou recusar solicitações de demandas'
                    : 'Você não possui permissão para aprovar demandas'}
                </p>
              </div>
            </div>

            {/* Acesso de Gerenciamento */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              {userPermissions.hasManageAccess ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Gerenciamento do Sistema</p>
                <p className="text-sm text-muted-foreground">
                  {userPermissions.hasManageAccess
                    ? 'Você tem acesso às funções administrativas e de gerenciamento'
                    : 'Você não possui acesso às funções administrativas'}
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Empresa Vinculada */}
            {userPermissions.userEmpresa && (
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Building className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Empresa Vinculada</p>
                  <p className="text-sm text-muted-foreground">
                    Você está vinculado à empresa: <span className="font-medium text-foreground">{userPermissions.userEmpresa}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Perfil;
