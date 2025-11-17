import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, ShieldCheck, Users, XCircle, FileText, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SETORES } from '@/types/demand';
import {
  FUNCTIONAL_REQUIREMENT_SIGNATURE_STATUS_CONFIG,
  FUNCTIONAL_REQUIREMENT_STATUS_CONFIG,
} from '@/types/functionalRequirement';
import type { FunctionalRequirement } from '@/types/functionalRequirement';
import {
  ActiveProfile,
  FunctionalRequirementRecord,
  approveFunctionalRequirement,
  createFunctionalRequirement,
  listActiveProfiles,
  listFunctionalRequirements,
  rejectFunctionalRequirement,
} from '@/services/functionalRequirements';
import { exportToWord, exportToPDF } from '@/services/requirementExport';
import { cn } from '@/lib/utils';

type RequirementFormState = {
  titulo: string;
  descricao: string;
  setor: FunctionalRequirement['setor'] | '';
  approverIds: string[];
};

const createEmptyFormState = (): RequirementFormState => ({
  titulo: '',
  descricao: '',
  setor: '',
  approverIds: [],
});

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const RequirementCard = ({
  requirement,
  userId,
  onApprove,
  onReject,
  disableActions,
}: {
  requirement: FunctionalRequirementRecord;
  userId?: string;
  onApprove: (requirement: FunctionalRequirementRecord) => void;
  onReject: (requirement: FunctionalRequirementRecord) => void;
  disableActions: boolean;
}) => {
  const { toast } = useToast();
  const statusConfig = FUNCTIONAL_REQUIREMENT_STATUS_CONFIG[requirement.status];
  const isCurrentApprover =
    requirement.current_approver_id === userId && requirement.status === 'pendente';
  const approverSequence = requirement.approver_ids || [];

  const handleExportWord = async () => {
    try {
      await exportToWord(requirement);
      toast({
        title: 'Exportado com sucesso',
        description: 'O requisito funcional foi exportado para Word.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o requisito para Word.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(requirement);
      toast({
        title: 'Exportado com sucesso',
        description: 'O requisito funcional foi exportado para PDF.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o requisito para PDF.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-foreground">
              {requirement.titulo}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {requirement.descricao}
            </CardDescription>
          </div>
          <Badge className={cn('border text-xs font-medium', statusConfig.badgeClass)}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Setor solicitante</p>
            <p className="text-muted-foreground">{requirement.setor}</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Situação atual</p>
            <p className="text-muted-foreground">{statusConfig.description}</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Criado por</p>
            <p className="text-muted-foreground">
              {requirement.creator?.full_name || 'Usuário removido'}
            </p>
            <p className="text-xs text-muted-foreground">
              {`Registrado em ${formatDateTime(requirement.created_at)}`}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Aprovador atual</p>
            <p className="text-muted-foreground">
              {requirement.currentApprover?.full_name || 'Fluxo concluído'}
            </p>
            <p className="text-xs text-muted-foreground">
              {`Atualizado em ${formatDateTime(requirement.updated_at)}`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Fluxo de assinaturas</p>
            <p className="text-xs text-muted-foreground">
              A ordem segue a sequência definida na criação do requisito funcional.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {approverSequence.map((approverId, index) => {
              const signature = requirement.signatures?.find(
                (item) => item.signer_id === approverId,
              );
              const signatureStatus = signature?.status ?? 'pendente';
              const signatureConfig =
                FUNCTIONAL_REQUIREMENT_SIGNATURE_STATUS_CONFIG[signatureStatus];

              return (
                <div
                  key={`${requirement.id}-${approverId}`}
                  className={cn(
                    'rounded-lg border border-border/70 p-3 shadow-sm transition-colors',
                    signatureStatus === 'assinado'
                      ? 'bg-emerald-50/60'
                      : signatureStatus === 'rejeitado'
                        ? 'bg-destructive/5'
                        : 'bg-muted/40',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {signature?.signer?.full_name || 'Colaborador removido'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {`Ordem ${index + 1}`}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border text-xs font-medium uppercase tracking-wide',
                        signatureConfig.badgeClass,
                      )}
                    >
                      {signatureConfig.label}
                    </Badge>
                  </div>
                  {signature?.signed_at && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {`Registrado em ${formatDateTime(signature.signed_at)}`}
                    </p>
                  )}
                  {signature?.comment && (
                    <p className="mt-2 rounded-md bg-background/70 p-2 text-xs text-muted-foreground">
                      {`Comentário: ${signature.comment}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
        {isCurrentApprover && (
          <>
            <Button
              onClick={() => onApprove(requirement)}
              disabled={disableActions}
              className="inline-flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" /> Assinar digitalmente
            </Button>
            <Button
              variant="outline"
              onClick={() => onReject(requirement)}
              disabled={disableActions}
              className="inline-flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" /> Registrar reprovação
            </Button>
          </>
        )}
        {requirement.status === 'assinado' && (
          <>
            <Button
              variant="outline"
              onClick={handleExportWord}
              className="inline-flex items-center gap-2"
            >
              <FileText className="h-4 w-4" /> Exportar Word
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

const emptyStateCard = (message: string) => (
  <Card>
    <CardContent className="py-12 text-center text-muted-foreground">
      {message}
    </CardContent>
  </Card>
);

const FunctionalRequirements = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [approverPopoverOpen, setApproverPopoverOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    requirement: FunctionalRequirementRecord | null;
    action: 'approve' | 'reject' | null;
  }>({ requirement: null, action: null });
  const [actionComment, setActionComment] = useState('');

  const [form, setForm] = useState<RequirementFormState>(() => createEmptyFormState());

  // Flatten SETORES object into a single array
  const setoresArray = useMemo(() => {
    return Object.values(SETORES).flat();
  }, []);

  const {
    data: requirements = [],
    isLoading: requirementsLoading,
    isFetching: requirementsFetching,
  } = useQuery({
    queryKey: ['functional-requirements', user?.id],
    queryFn: () => listFunctionalRequirements(user?.id),
    enabled: Boolean(user),
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery<ActiveProfile[]>({
    queryKey: ['functional-requirement-profiles'],
    queryFn: listActiveProfiles,
  });

  const createRequirementMutation = useMutation({
    mutationFn: createFunctionalRequirement,
    onSuccess: () => {
      toast({
        title: 'Requisito criado',
        description: 'O requisito funcional foi enviado para a fila de aprovação.',
      });
      queryClient.invalidateQueries({ queryKey: ['functional-requirements', user?.id] });
      setCreateDialogOpen(false);
      setForm(createEmptyFormState());
      setApproverPopoverOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar requisito',
        description: error?.message || 'Não foi possível registrar o requisito funcional.',
        variant: 'destructive',
      });
    },
  });

  const handleActionSuccess = (description: string) => {
    toast({
      title: 'Fluxo atualizado',
      description,
    });
    queryClient.invalidateQueries({ queryKey: ['functional-requirements', user?.id] });
    setActionDialog({ requirement: null, action: null });
    setActionComment('');
  };

  const approveMutation = useMutation({
    mutationFn: approveFunctionalRequirement,
    onSuccess: () => handleActionSuccess('Assinatura registrada com sucesso.'),
    onError: (error: any) => {
      toast({
        title: 'Erro ao assinar requisito',
        description: error?.message || 'Não foi possível registrar a assinatura digital.',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFunctionalRequirement,
    onSuccess: () => handleActionSuccess('Rejeição registrada e autor notificado.'),
    onError: (error: any) => {
      toast({
        title: 'Erro ao rejeitar requisito',
        description: error?.message || 'Não foi possível registrar a reprovação.',
        variant: 'destructive',
      });
    },
  });

  const isProcessingAction = approveMutation.isPending || rejectMutation.isPending;

  const selectedApprovers = useMemo(
    () =>
      form.approverIds
        .map((id) => profiles.find((profile) => profile.id === id))
        .filter((profile): profile is ActiveProfile => Boolean(profile)),
    [form.approverIds, profiles],
  );

  const myRequirements = useMemo(
    () => requirements.filter((item) => item.created_by === user?.id),
    [requirements, user?.id],
  );

  const approvalQueue = useMemo(
    () =>
      requirements.filter(
        (item) =>
          item.current_approver_id === user?.id && item.status === 'pendente',
      ),
    [requirements, user?.id],
  );

  const handledRequirements = useMemo(
    () =>
      requirements.filter(
        (item) =>
          item.created_by !== user?.id &&
          (item.approver_ids || []).includes(user?.id || '') &&
          item.current_approver_id !== user?.id,
      ),
    [requirements, user?.id],
  );

  const resetActionDialog = () => {
    setActionDialog({ requirement: null, action: null });
    setActionComment('');
  };

  const openActionDialog = (
    requirement: FunctionalRequirementRecord,
    action: 'approve' | 'reject',
  ) => {
    setActionDialog({ requirement, action });
    setActionComment('');
  };

  const handleCreateRequirement = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({
        title: 'Sessão expirada',
        description: 'Entre novamente para registrar um requisito funcional.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.titulo.trim() || !form.descricao.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe título e descrição detalhada do requisito funcional.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.setor) {
      toast({
        title: 'Setor não informado',
        description: 'Selecione o setor responsável pelo requisito funcional.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.approverIds.length) {
      toast({
        title: 'Defina os aprovadores',
        description: 'Selecione pelo menos um aprovador para iniciar o fluxo de assinaturas.',
        variant: 'destructive',
      });
      return;
    }

    createRequirementMutation.mutate({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      setor: form.setor as FunctionalRequirement['setor'],
      approverIds: form.approverIds,
      creatorId: user.id,
    });
  };

  const handleSubmitAction = () => {
    if (!user || !actionDialog.requirement || !actionDialog.action) {
      return;
    }

    // Gerar frase de assinatura automaticamente
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const autoSignaturePhrase = `${user.id}-${timestamp}-${randomStr}`;

    const payload = {
      requirementId: actionDialog.requirement.id,
      signerId: user.id,
      signaturePhrase: autoSignaturePhrase,
      comment: actionComment.trim() ? actionComment.trim() : undefined,
    };

    if (actionDialog.action === 'approve') {
      approveMutation.mutate(payload);
    } else {
      rejectMutation.mutate(payload);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center p-8 text-muted-foreground">
        Carregando informações do usuário...
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-semibold text-foreground">
            Faça login para acessar os requisitos funcionais.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requisitos Funcionais</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre, acompanhe e aprove digitalmente os requisitos funcionais da organização.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="inline-flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> Novo requisito funcional
        </Button>
      </div>

      <Tabs defaultValue="meus" className="space-y-6">
        <TabsList>
          <TabsTrigger value="meus">Meus requisitos</TabsTrigger>
          <TabsTrigger value="fila">Fila de aprovação</TabsTrigger>
          <TabsTrigger value="participacoes">Participações concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value="meus" className="space-y-4">
          {requirementsLoading || requirementsFetching
            ? emptyStateCard('Carregando requisitos funcionais...')
            : myRequirements.length
              ? (
                <div className="grid gap-4">
                  {myRequirements.map((requirement) => (
                    <RequirementCard
                      key={requirement.id}
                      requirement={requirement}
                      userId={user.id}
                      onApprove={(current) => openActionDialog(current, 'approve')}
                      onReject={(current) => openActionDialog(current, 'reject')}
                      disableActions={isProcessingAction}
                    />
                  ))}
                </div>
                )
              : emptyStateCard('Você ainda não cadastrou requisitos funcionais.')} 
        </TabsContent>

        <TabsContent value="fila" className="space-y-4">
          {requirementsLoading || requirementsFetching
            ? emptyStateCard('Carregando fila de aprovação...')
            : approvalQueue.length
              ? (
                <div className="grid gap-4">
                  {approvalQueue.map((requirement) => (
                    <RequirementCard
                      key={requirement.id}
                      requirement={requirement}
                      userId={user.id}
                      onApprove={(current) => openActionDialog(current, 'approve')}
                      onReject={(current) => openActionDialog(current, 'reject')}
                      disableActions={isProcessingAction}
                    />
                  ))}
                </div>
                )
              : emptyStateCard('Nenhum requisito funcional aguarda sua assinatura no momento.')} 
        </TabsContent>

        <TabsContent value="participacoes" className="space-y-4">
          {requirementsLoading || requirementsFetching
            ? emptyStateCard('Carregando histórico de participações...')
            : handledRequirements.length
              ? (
                <div className="grid gap-4">
                  {handledRequirements.map((requirement) => (
                    <RequirementCard
                      key={requirement.id}
                      requirement={requirement}
                      userId={user.id}
                      onApprove={() => undefined}
                      onReject={() => undefined}
                      disableActions
                    />
                  ))}
                </div>
                )
              : emptyStateCard('Você ainda não finalizou assinaturas de requisitos funcionais.')} 
        </TabsContent>
      </Tabs>

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setForm(createEmptyFormState());
            setApproverPopoverOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleCreateRequirement} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Novo requisito funcional</DialogTitle>
              <DialogDescription>
                Informe os detalhes do requisito e defina a ordem de aprovação com assinatura digital.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Descrição resumida do requisito"
                  value={form.titulo}
                  onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Detalhamento</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o objetivo, escopo e necessidades do requisito funcional."
                  value={form.descricao}
                  onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                  rows={5}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Setor responsável</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.setor}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      setor: event.target.value as FunctionalRequirement['setor'] | '',
                    }))
                  }
                  required
                >
                  <option value="" disabled>
                    Selecione o setor
                  </option>
                  {setoresArray.map((setor) => (
                    <option key={setor.value} value={setor.value}>
                      {setor.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label>Aprovadores</Label>
                <Popover open={approverPopoverOpen} onOpenChange={setApproverPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-between text-sm"
                    >
                      <span>
                        {form.approverIds.length
                          ? `${form.approverIds.length} aprovador(es) selecionado(s)`
                          : 'Selecionar aprovadores'}
                      </span>
                      <Users className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar colaborador" />
                      <CommandList>
                        <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                        <CommandGroup>
                          {profilesLoading ? (
                            <div className="p-4 text-sm text-muted-foreground">
                              Carregando colaboradores...
                            </div>
                          ) : (
                            profiles.map((profile) => {
                              const isSelected = form.approverIds.includes(profile.id);
                              return (
                                <CommandItem
                                  key={profile.id}
                                  onSelect={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      approverIds: isSelected
                                        ? prev.approverIds.filter((id) => id !== profile.id)
                                        : [...prev.approverIds, profile.id],
                                    }));
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Checkbox checked={isSelected} className="pointer-events-none" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">
                                      {profile.full_name || 'Sem nome informado'}
                                    </span>
                                    {(profile.departamento || profile.cargo) && (
                                      <span className="text-xs text-muted-foreground">
                                        {[profile.departamento, profile.cargo]
                                          .filter(Boolean)
                                          .join(' • ')}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              );
                            })
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedApprovers.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {selectedApprovers.map((profile) => (
                      <Badge key={profile.id} variant="secondary">
                        {profile.full_name || 'Sem nome'}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setForm(createEmptyFormState());
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createRequirementMutation.isPending}>
                {createRequirementMutation.isPending ? 'Enviando...' : 'Criar requisito'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(actionDialog.action)} onOpenChange={(open) => (open ? null : resetActionDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve'
                ? 'Assinatura digital do requisito'
                : 'Rejeição do requisito funcional'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.requirement?.titulo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                {actionDialog.action === 'approve'
                  ? 'Ao confirmar, um código de assinatura digital será gerado automaticamente com hash criptográfico vinculado ao seu perfil e timestamp.'
                  : 'Ao confirmar, sua reprovação será registrada permanentemente no histórico do requisito.'}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="actionComment">Comentário (opcional)</Label>
              <Textarea
                id="actionComment"
                placeholder="Compartilhe considerações relevantes para o solicitante."
                value={actionComment}
                onChange={(event) => setActionComment(event.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={resetActionDialog}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmitAction}
              disabled={isProcessingAction}
            >
              {actionDialog.action === 'approve' ? 'Confirmar assinatura' : 'Confirmar rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunctionalRequirements;
