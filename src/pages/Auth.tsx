import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const newPasswordSchema = z.string()
  .min(6, 'Mínimo de 6 caracteres')
  .regex(/[A-Z]/, 'Pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Pelo menos uma letra minúscula')
  .regex(/\d/, 'Pelo menos um número')
  .regex(/[!@#$%^&*]/, 'Pelo menos um caractere especial (!@#$%^&*)');

type LoginFormData = z.infer<typeof loginSchema>;

const Auth = () => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const { signIn } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      loginForm.setValue('email', emailFromUrl);
    }

    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      return;
    }

    const hashParams = new URLSearchParams(hash);
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (type !== 'recovery' || !accessToken || !refreshToken) {
      return;
    }

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        toast.error('Erro ao validar primeiro acesso', {
          description: error?.message ?? 'Não foi possível validar o link enviado.',
        });
        return;
      }

      setIsFirstAccess(true);
      setIsRecoveryFlow(true);

      if (data.session.user.email) {
        loginForm.setValue('email', data.session.user.email);
      }

      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    };

    restoreSession();
  }, [loginForm]);

  const onLogin = async (data: LoginFormData) => {
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      if (error.message === 'password_change_required') {
        toast.error('Primeiro acesso detectado', {
          description: 'Você precisa definir uma nova senha para acessar o sistema',
        });
        setIsFirstAccess(true);
        loginForm.setValue('email', data.email);
      } else if (error.message === 'Invalid login credentials') {
        toast.error('Credenciais inválidas', {
          description: 'Email ou senha incorretos',
        });
      } else {
        toast.error('Erro ao fazer login', {
          description: error.message,
        });
      }
    } else {
      toast.success('Login realizado com sucesso!');
    }
  };

  const onFirstAccess = async (email: string, currentPassword: string, newPasswordValue: string) => {
    if (!email || !newPasswordValue || (!isRecoveryFlow && !currentPassword)) {
      toast.error('Preencha todos os campos');
      return;
    }

    const validation = newPasswordSchema.safeParse(newPasswordValue);
    if (!validation.success) {
      setNewPasswordError(validation.error.errors[0].message);
      toast.error('Senha não atende aos requisitos', {
        description: validation.error.errors[0].message,
      });
      return;
    }
    setNewPasswordError('');

    let userId: string | null = null;
    let passwordExpiryMonths: number | null = null;

    if (isRecoveryFlow) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error('Erro ao validar link de acesso', {
          description: userError?.message ?? 'Sessão inválida ou expirada.',
        });
        return;
      }
      userId = userData.user.id;
      if (userData.user.email) {
        loginForm.setValue('email', userData.user.email);
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError || !data.user) {
        toast.error('Credenciais inválidas', {
          description: 'Email ou senha incorretos',
        });
        return;
      }

      userId = data.user.id;
    }

    if (!userId) {
      toast.error('Não foi possível identificar o usuário');
      return;
    }

    const { data: profileData, error: profileFetchError } = await supabase
      .from('profiles')
      .select('force_password_change, password_expiry_months')
      .eq('id', userId)
      .single();

    if (profileFetchError) {
      toast.error('Erro ao carregar informações do usuário', {
        description: profileFetchError.message,
      });
      if (!isRecoveryFlow) {
        await supabase.auth.signOut();
      }
      return;
    }

    passwordExpiryMonths = profileData?.password_expiry_months ?? 6;

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPasswordValue,
    });

    if (updateError) {
      toast.error('Erro ao atualizar senha', {
        description: updateError.message,
      });
      if (!isRecoveryFlow) {
        await supabase.auth.signOut();
      }
      return;
    }

    const passwordExpiresAt = new Date();
    passwordExpiresAt.setMonth(passwordExpiresAt.getMonth() + (passwordExpiryMonths || 6));

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        force_password_change: false,
        password_expires_at: passwordExpiresAt.toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      toast.error('Erro ao atualizar perfil', {
        description: profileError.message,
      });
      await supabase.auth.signOut();
      return;
    }

    toast.success('Senha alterada com sucesso!', {
      description: 'Você será redirecionado para o sistema',
    });

    setNewPassword('');
    loginForm.setValue('password', '');

    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  const onRequestPasswordReset = async (email: string) => {
    if (!email) {
      toast.error('Digite seu e-mail');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email },
      });

      if (error) {
        toast.error('Erro ao enviar solicitação', {
          description: error.message,
        });
        return;
      }

      toast.success('Solicitação enviada!', {
        description: 'O administrador foi notificado e redefinirá sua senha em breve.',
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error('Erro ao enviar solicitação', {
        description: error.message,
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-gradient-card border-border">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-foreground">GZ</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isFirstAccess ? 'Primeiro Acesso' : isForgotPassword ? 'Esqueci minha Senha' : 'Bem-vindo de volta'}
          </CardTitle>
          <p className="text-muted-foreground">
            {isFirstAccess 
              ? 'Digite seu e-mail, senha inicial e defina sua nova senha' 
              : isForgotPassword 
              ? 'Solicite uma nova senha ao administrador' 
              : 'Entre com suas credenciais para acessar o sistema'}
          </p>
        </CardHeader>

        <CardContent>
          {isFirstAccess ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first-email">Email</Label>
                <Input
                  id="first-email"
                  type="email"
                  {...loginForm.register('email')}
                  className="bg-input border-border"
                  placeholder="seu@email.com"
                />
              </div>

              {!isRecoveryFlow && (
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Inicial (fornecida pelo Admin)</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...loginForm.register('password')}
                      className="bg-input border-border pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    className="bg-input border-border pr-10"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setNewPasswordError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPasswordError && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {newPasswordError}
                  </p>
                )}
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  <p className="font-medium">Requisitos da senha:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Mínimo de 6 caracteres</li>
                    <li>Pelo menos uma letra maiúscula</li>
                    <li>Pelo menos uma letra minúscula</li>
                    <li>Pelo menos um número</li>
                    <li>Pelo menos um caractere especial (!@#$%^&*)</li>
                  </ul>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  onFirstAccess(
                    loginForm.getValues('email'),
                    loginForm.getValues('password'),
                    newPassword
                  );
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-yellow"
              >
                Definir Nova Senha
              </Button>

              <button
                type="button"
                onClick={() => {
                  setIsFirstAccess(false);
                  setIsRecoveryFlow(false);
                }}
                className="w-full text-sm text-muted-foreground hover:text-primary text-center"
              >
                Voltar para o login
              </button>
            </div>
          ) : isForgotPassword ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  {...loginForm.register('email')}
                  className="bg-input border-border"
                  placeholder="seu@email.com"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={() => onRequestPasswordReset(loginForm.getValues('email'))}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-yellow"
              >
                Solicitar Nova Senha
              </Button>

              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-sm text-muted-foreground hover:text-primary text-center"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register('email')}
                  className="bg-input border-border"
                  placeholder="seu@email.com"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register('password')}
                  className="bg-input border-border"
                  placeholder="••••••••"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-yellow"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? (
                  'Entrando...'
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFirstAccess(true);
                    setIsRecoveryFlow(false);
                  }}
                  className="flex-1 text-sm text-muted-foreground hover:text-primary text-center"
                >
                  Primeiro Acesso
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="flex-1 text-sm text-muted-foreground hover:text-primary text-center"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
