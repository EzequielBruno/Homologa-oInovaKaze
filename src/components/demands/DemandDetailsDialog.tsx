import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2,
  Download,
  Printer,
  Plus,
  Undo2,
  History,
  UserPlus,
  Send,
} from 'lucide-react';
import { useCustomFormResponses } from '@/hooks/useCustomFormResponses';
import { toast } from 'sonner';
import { DemandPrintView } from './DemandPrintView';
import { AddCommentDialog } from './AddCommentDialog';
import DemandVersionHistory from './DemandVersionHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDemandHistory } from '@/hooks/useDemandHistory';
import { Input } from '@/components/ui/input';

interface DemandDetailsDialogProps {
  demandId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const normalizeText = (value?: string | null) => {
  if (!value) return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const determineCommitteeStatus = (entry: any) => {
  const action = normalizeText(entry?.action);

  if (action === 'aprovar_comite') {
    return 'aprovado';
  }

  if (action === 'recusar_comite') {
    return 'recusado';
  }

  const possibleStatusValues = [
    entry?.dados_novos?.status,
    entry?.dados_novos?.status_comite,
    entry?.dados_novos?.status_atual,
    entry?.dados_novos?.statusAtual,
    entry?.dados_anteriores?.status,
    entry?.dados_anteriores?.status_comite,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => normalizeText(value));

  const combinedText = [normalizeText(entry?.descricao), ...possibleStatusValues]
    .filter(Boolean)
    .join(' ');

  if (combinedText.includes('reprov') || combinedText.includes('recus')) {
    return 'recusado';
  }

  if (combinedText.includes('aprov')) {
    return 'aprovado';
  }

  if (combinedText.includes('pend') || combinedText.includes('aguard')) {
    return 'pendente';
  }

  return 'pendente';
};

export const DemandDetailsDialog = ({ demandId, open, onOpenChange }: DemandDetailsDialogProps) => {
  const [demand, setDemand] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCommentOpen, setAddCommentOpen] = useState(false);
  const [hasTechnicalEvaluation, setHasTechnicalEvaluation] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [requestingAssignmentId, setRequestingAssignmentId] = useState<string | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateSaving, setUpdateSaving] = useState(false);
  const [supplierInfo, setSupplierInfo] = useState<any | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const { responses, questions, loading: formLoading } = useCustomFormResponses(demandId || undefined);
  const { logAction } = useDemandHistory();

  const handlePrint = () => {
    // Navegar para a página de impressão em uma nova aba
    window.open(`/imprimir-demanda/${demandId}`, '_blank');
  };

  useEffect(() => {
    if (demandId && open) {
      loadDemandDetails();
    }
  }, [demandId, open]);

  useEffect(() => {
    if (assignDialogOpen) {
      loadAvailableUsers();
    } else {
      setSelectedAssignee('');
    }
  }, [assignDialogOpen]);

  const loadDemandDetails = async () => {
    if (!demandId) return;

    setLoading(true);
    try {
      // Carregar demanda
      const { data: demandData, error: demandError } = await supabase
        .from('demands')
        .select('*, profiles:solicitante_id(full_name)')
        .eq('id', demandId)
        .maybeSingle();

      if (demandError) {
        console.error('Error loading demand:', demandError);
        throw demandError;
      }

      // Carregar histórico
      const { data: historyData, error: historyError } = await supabase
        .from('demand_history')
        .select('*')
        .eq('demand_id', demandId)
        .order('created_at', { ascending: false });

      if (historyError) {
        throw historyError;
      }

      let historyWithProfiles = historyData || [];

      const historyUserIds = Array.from(
        new Set(
          (historyWithProfiles || [])
            .map((entry) => entry.user_id)
            .filter((userId): userId is string => Boolean(userId))
        )
      );

      if (historyUserIds.length > 0) {
        const { data: historyProfilesData, error: historyProfilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', historyUserIds);

        if (historyProfilesError) {
          throw historyProfilesError;
        }

        const profilesMap = new Map<string, { id: string; full_name: string | null }>();
        historyProfilesData?.forEach((profile) => {
          profilesMap.set(profile.id, profile);
        });

        historyWithProfiles = historyWithProfiles.map((entry) => ({
          ...entry,
          profiles: entry.user_id
            ? { full_name: profilesMap.get(entry.user_id)?.full_name || null }
            : undefined,
        }));
      }

      // Carregar aprovações
      const { data: approvalsData } = await supabase
        .from('demand_approvals')
        .select('*, profiles:approver_id(full_name)')
        .eq('demand_id', demandId)
        .order('created_at', { ascending: false });

      // Carregar atribuições
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('demand_assignments')
        .select('*')
        .eq('demand_id', demandId)
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }

      let assignmentsWithProfiles = assignmentsData || [];

      const assignmentUserIds = Array.from(
        new Set(
          (assignmentsWithProfiles || [])
            .flatMap((assignment) => [assignment.assigned_to, assignment.assigned_by])
            .filter((userId): userId is string => Boolean(userId))
        )
      );

      if (assignmentUserIds.length > 0) {
        const { data: assignmentProfilesData, error: assignmentProfilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', assignmentUserIds);

        if (assignmentProfilesError) {
          throw assignmentProfilesError;
        }

        const profileMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>();
        assignmentProfilesData?.forEach((profile) => {
          profileMap.set(profile.id, profile);
        });

        assignmentsWithProfiles = assignmentsWithProfiles.map((assignment: any) => {
          const baseAssignedToProfile = assignment.assigned_to_profile || {};
          const assignedToProfile = assignment.assigned_to
            ? {
                ...baseAssignedToProfile,
                ...(profileMap.get(assignment.assigned_to) ?? {}),
              }
            : assignment.assigned_to_profile ?? null;

          const baseAssignedByProfile = assignment.assigned_by_profile || {};
          const assignedByProfile = assignment.assigned_by
            ? {
                ...baseAssignedByProfile,
                ...(profileMap.get(assignment.assigned_by) ?? {}),
              }
            : assignment.assigned_by_profile ?? null;

          return {
            ...assignment,
            assigned_to_profile: assignedToProfile,
            assigned_by_profile: assignedByProfile,
          };
        });
      }

      // Carregar comentários
      const { data: commentsData } = await supabase
        .from('demand_comments')
        .select('*, profiles:manager_id(full_name)')
        .eq('demand_id', demandId)
        .order('created_at', { ascending: false });

      const { data: committeeMembersData } = await supabase
        .from('committee_members')
        .select('user_id, nome, ativo')
        .eq('ativo', true);

      const approvalLevelOrder: Record<string, number> = {
        gerente: 0,
        comite: 1,
        ti: 2,
      };

      const approvalActionsMap: Record<string, { level: 'gerente' | 'comite' | 'ti'; status: 'aprovado' | 'recusado' }> = {
        aprovar_gerente: { level: 'gerente', status: 'aprovado' },
        recusar_gerente: { level: 'gerente', status: 'recusado' },
        aprovar_comite: { level: 'comite', status: 'aprovado' },
        recusar_comite: { level: 'comite', status: 'recusado' },
        aprovar_ti: { level: 'ti', status: 'aprovado' },
        recusar_ti: { level: 'ti', status: 'recusado' },
      };

      const getTimestamp = (record: any) => {
        const date = record?.updated_at || record?.created_at;
        return date ? new Date(date).getTime() : 0;
      };

      const approvalsByKey = new Map<string, any>();

      const getStatusPriority = (status?: string | null) => {
        switch (status) {
          case 'aprovado':
          case 'recusado':
            return 2;
          case 'pendente':
            return 1;
          default:
            return 0;
        }
      };

      const mergeApprovalRecord = (key: string, approval: any) => {
        const existing = approvalsByKey.get(key);

        if (!existing) {
          approvalsByKey.set(key, { ...approval });
          return;
        }

        const existingPriority = getStatusPriority(existing.status);
        const candidatePriority = getStatusPriority(approval.status);

        if (candidatePriority > existingPriority) {
          approvalsByKey.set(key, { ...approval });
          return;
        }

        if (candidatePriority < existingPriority) {
          return;
        }

        if (getTimestamp(approval) >= getTimestamp(existing)) {
          approvalsByKey.set(key, { ...approval });
        }
      };

      (historyWithProfiles || []).forEach((entry: any) => {
        const actionConfig = approvalActionsMap[entry.action as keyof typeof approvalActionsMap];
        if (!actionConfig) return;

        const key = `${actionConfig.level}-${entry.user_id || 'global'}`;
        const historyApproval = {
          id: `history-${entry.id}`,
          approval_level: actionConfig.level,
          approver_id: entry.user_id,
          status: actionConfig.status,
          created_at: entry.created_at,
          updated_at: entry.created_at,
          profiles: entry.profiles ? { full_name: entry.profiles.full_name } : undefined,
          motivo_recusa: entry.dados_novos as any ? (entry.dados_novos as any)?.motivo_recusa || null : null,
          descricao: entry.descricao || null,
          action: entry.action,
        };

        mergeApprovalRecord(key, historyApproval);
      });

      (approvalsData || []).forEach((approval) => {
        const key = `${approval.approval_level}-${approval.approver_id || 'global'}`;
        mergeApprovalRecord(key, approval);
      });

      const combinedApprovals = Array.from(approvalsByKey.values());

      committeeMembersData?.forEach((member) => {
        const key = `comite-${member.user_id}`;
        if (!approvalsByKey.has(key)) {
          const pendingApproval = {
            id: `pending-${member.user_id}`,
            approval_level: 'comite',
            approver_id: member.user_id,
            status: 'pendente',
            created_at: null,
            updated_at: null,
            profiles: {
              full_name: member.nome,
            },
          };
          approvalsByKey.set(key, pendingApproval);
          combinedApprovals.push(pendingApproval);
        } else {
          const approval = approvalsByKey.get(key);
          if (!approval?.profiles?.full_name) {
            approval.profiles = { full_name: member.nome };
          }
        }
      });

      combinedApprovals.sort((a, b) => {
        const levelDiff =
          (approvalLevelOrder[a.approval_level as string] ?? 99) -
          (approvalLevelOrder[b.approval_level as string] ?? 99);

        if (levelDiff !== 0) {
          return levelDiff;
        }

        const dateA = getTimestamp(a);
        const dateB = getTimestamp(b);

        if (dateA && dateB) {
          return dateB - dateA;
        }

        if (dateA) return -1;
        if (dateB) return 1;

        const nameA = (a?.profiles?.full_name || '').toLowerCase();
        const nameB = (b?.profiles?.full_name || '').toLowerCase();

        return nameA.localeCompare(nameB);
      });

      setDemand(demandData);
      setSupplierInfo(null);

      if (demandData?.orcamento_fornecedor_id) {
        try {
          const { data: supplierData, error: supplierError } = await supabase
            .from('fornecedores')
            .select('id, nome_fantasia, razao_social, cnpj')
            .eq('id', demandData.orcamento_fornecedor_id)
            .maybeSingle();

          if (supplierError) {
            throw supplierError;
          }

          if (supplierData) {
            setSupplierInfo(supplierData);
          }
        } catch (error) {
          console.error('Erro ao carregar fornecedor da demanda:', error);
        }
      }
      setHistory(historyWithProfiles || []);
      setApprovals(combinedApprovals);
      setAssignments(assignmentsWithProfiles || []);
      setComments(commentsData || []);
      // Verifica se já existe avaliação técnica da TI
      if (demandData) {
        const { count } = await supabase
          .from('phases')
          .select('*', { count: 'exact', head: true })
          .eq('demanda_id', demandId);
        
        setHasTechnicalEvaluation((count ?? 0) > 0);
      }
    } catch (error) {
      console.error('Error loading demand details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .order('full_name', { ascending: true });

      if (error) throw error;

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error loading available users:', error);
      toast.error('Erro ao carregar responsáveis disponíveis.');
    }
  };

  const currentSprintNumber = useMemo(() => {
    if (typeof demand?.sprint_atual === 'number' && Number.isFinite(demand.sprint_atual)) {
      return demand.sprint_atual;
    }

    return null;
  }, [demand?.sprint_atual]);

  const getAssigneeName = (assigneeId: string) => {
    return (
      availableUsers.find((user) => user.id === assigneeId)?.full_name ||
      assignments.find((assignment) => assignment.assigned_to === assigneeId)?.assigned_to_profile?.full_name ||
      'Responsável'
    );
  };

  const handleAssignResponsible = async () => {
    if (!demandId) return;

    if (!selectedAssignee) {
      toast.error('Selecione um responsável.');
      return;
    }

    if (!currentSprintNumber || currentSprintNumber <= 0) {
      toast.error('A demanda não possui sprint definida.');
      return;
    }

    setAssignSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Usuário não autenticado.');
        setAssignSaving(false);
        return;
      }

      const { data: phasesData } = await supabase
        .from('phases')
        .select('id')
        .eq('demanda_id', demandId);

      const hasFaseamento = Boolean(phasesData && phasesData.length > 0);

      const prazoFaseamento = !hasFaseamento
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: assignError } = await supabase.from('demand_assignments').insert([{ 
        demand_id: demandId,
        assigned_to: selectedAssignee,
        assigned_by: userData.user.id,
        faseamento_completo: hasFaseamento,
        notificacao_pendente: !hasFaseamento,
        sprint_number: currentSprintNumber,
        prazo_faseamento: prazoFaseamento,
      }] as any);

      if (assignError) throw assignError;

      const { error: updateDemandError } = await supabase
        .from('demands')
        .update({ responsavel_tecnico_id: selectedAssignee })
        .eq('id', demandId);

      if (updateDemandError) throw updateDemandError;

      await supabase.from('notifications').insert({
        user_id: selectedAssignee,
        tipo: 'atribuicao_demanda',
        title: 'Nova responsabilidade atribuída',
        message: `Você foi designado para a demanda ${demand?.codigo || ''} na sprint ${currentSprintNumber}${
          hasFaseamento ? '' : '. Faseamento pendente - prazo de 1 dia.'
        }`,
        relacionado_id: demandId,
      });

      await logAction({
        demandId,
        action: 'atribuir_responsavel',
        descricao: `Responsável ${getAssigneeName(selectedAssignee)} atribuído à demanda.`,
        dadosNovos: {
          assigned_to: selectedAssignee,
          faseamento_completo: hasFaseamento,
          sprint_number: currentSprintNumber,
          prazo_faseamento: prazoFaseamento,
        },
      });

      toast.success('Responsável atribuído com sucesso.');
      setAssignDialogOpen(false);
      await loadDemandDetails();
    } catch (error) {
      console.error('Error assigning responsible:', error);
      toast.error('Erro ao atribuir responsável.');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleOpenUpdateDialog = (assignmentId: string) => {
    setRequestingAssignmentId(assignmentId);
    setUpdateMessage('');
    setUpdateDialogOpen(true);
  };

  const handleRequestUpdate = async () => {
    if (!demandId || !requestingAssignmentId) return;

    if (!updateMessage.trim()) {
      toast.error('Por favor, informe uma mensagem para a solicitação.');
      return;
    }

    const assignment = assignments.find((item) => item.id === requestingAssignmentId);
    if (!assignment || !assignment.assigned_to) {
      toast.error('Não foi possível identificar o responsável.');
      return;
    }

    setUpdateSaving(true);

    try {
      const message = updateMessage.trim();

      await supabase.from('notifications').insert({
        user_id: assignment.assigned_to,
        tipo: 'solicitacao_atualizacao_demanda',
        title: 'Atualização de demanda solicitada',
        message,
        relacionado_id: demandId,
      });

      await supabase
        .from('demand_assignments')
        .update({ notificacao_pendente: true })
        .eq('id', assignment.id);

      await logAction({
        demandId,
        action: 'solicitar_atualizacao',
        descricao: `Atualização solicitada para ${assignment.assigned_to_profile?.full_name || 'responsável'}.`,
        dadosNovos: {
          message,
          assignment_id: assignment.id,
        },
      });

      toast.success('Solicitação enviada com sucesso.');
      setUpdateDialogOpen(false);
      setRequestingAssignmentId(null);
      await loadDemandDetails();
    } catch (error) {
      console.error('Error requesting update:', error);
      toast.error('Erro ao solicitar atualização.');
    } finally {
      setUpdateSaving(false);
    }
  };

  const handleCommentAdded = async () => {
    if (!demandId) return;
    
    // Recarregar comentários
    const { data: commentsData } = await supabase
      .from('demand_comments')
      .select('*, profiles:manager_id(full_name)')
      .eq('demand_id', demandId)
      .order('created_at', { ascending: false });
    
    setComments(commentsData || []);
  };

  const handleRevertToManager = async () => {
    if (!demandId || !demand) return;

    if (hasTechnicalEvaluation) {
      toast.error('Não é possível reverter. A TI já iniciou a avaliação com faseamento.');
      return;
    }

    try {
      // Atualiza o status da demanda de volta para Backlog
      const { error: updateError } = await supabase
        .from('demands')
        .update({ status: 'Backlog' })
        .eq('id', demandId);

      if (updateError) throw updateError;

      // Registra a ação no histórico
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('demand_history').insert([{
          demand_id: demandId,
          user_id: userData.user.id,
          action: 'mudar_status',
          descricao: 'Gerente de Projetos reverteu envio para Faseamento TI',
          dados_anteriores: { status: demand.status },
          dados_novos: { status: 'Backlog' },
        }]);
      }

      toast.success('Envio revertido. Demanda voltou para o Backlog.');
      loadDemandDetails();
    } catch (error) {
      console.error('Error reverting to manager:', error);
      toast.error('Erro ao reverter. Tente novamente.');
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      criar: 'Criada',
      editar: 'Editada',
      reativar: 'Reativada',
      excluir: 'Excluída',
      cancelar: 'Cancelada',
      arquivar: 'Arquivada',
      aprovar: 'Aprovada',
      reprovar: 'Reprovada',
      mudar_status: 'Status Alterado',
      adicionar_fase: 'Fase Adicionada',
      atualizar_fase: 'Fase Atualizada',
      solicitar_insumo: 'Insumo Solicitado',
      enviar_notificacao: 'Notificação Enviada',
      solicitar_atualizacao: 'Atualização Solicitada',
      atribuir_responsavel: 'Responsável Atribuído',
      solicitar_change: 'Change Solicitada',
      aprovar_gerente: 'Aprovação do Gerente',
      recusar_gerente: 'Reprovação do Gerente',
      aprovar_comite: 'Aprovação do Comitê',
      recusar_comite: 'Reprovação do Comitê',
      aprovar_ti: 'Aprovação da TI',
      recusar_ti: 'Reprovação da TI',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      criar: 'bg-green-500/20 text-green-700 dark:text-green-400',
      editar: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      reativar: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400',
      excluir: 'bg-red-500/20 text-red-700 dark:text-red-400',
      cancelar: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
      arquivar: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
      aprovar: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
      reprovar: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
      mudar_status: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
      adicionar_fase: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
      atualizar_fase: 'bg-violet-500/20 text-violet-700 dark:text-violet-400',
      solicitar_insumo: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
      enviar_notificacao: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
      solicitar_atualizacao: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
      atribuir_responsavel: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      solicitar_change: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
    };
    return colors[action] || 'bg-muted text-muted-foreground';
  };

  const extractStoragePath = (fileUrl: string) => {
    if (!fileUrl) {
      return null;
    }

    if (fileUrl.startsWith('http')) {
      try {
        const url = new URL(fileUrl);
        const parts = url.pathname.split('/demand-documents/');
        if (parts.length < 2) {
          return null;
        }

        return decodeURIComponent(parts[1]);
      } catch (error) {
        console.error('Erro ao analisar URL do arquivo:', error);
        return null;
      }
    }

    if (fileUrl.includes('/demand-documents/')) {
      const parts = fileUrl.split('/demand-documents/');
      if (parts.length < 2) {
        return null;
      }

      return parts[1];
    }

    return fileUrl;
  };

  const handleDownloadFile = async (fileUrl: string) => {
    try {
      // Extrair o caminho completo do arquivo a partir da URL
      const filePath = extractStoragePath(fileUrl)?.split('?')[0];
      if (!filePath) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      const fileName = filePath.split('/').pop() || 'arquivo';

      const { data, error } = await supabase.storage
        .from('demand-documents')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Arquivo baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const currentAssignments = useMemo(() => {
    const latestAssignments = new Map<string, any>();

    assignments.forEach((assignment) => {
      if (!assignment.assigned_to) return;

      const existing = latestAssignments.get(assignment.assigned_to);
      const assignmentDate = assignment.updated_at || assignment.created_at;
      const existingDate = existing?.updated_at || existing?.created_at;

      if (!existing) {
        latestAssignments.set(assignment.assigned_to, assignment);
        return;
      }

      if (assignmentDate && existingDate) {
        if (new Date(assignmentDate).getTime() > new Date(existingDate).getTime()) {
          latestAssignments.set(assignment.assigned_to, assignment);
        }
        return;
      }

      if (assignmentDate && !existingDate) {
        latestAssignments.set(assignment.assigned_to, assignment);
      }
    });

    return Array.from(latestAssignments.values());
  }, [assignments]);

  const parsedUserStory = useMemo(() => {
    if (!demand?.requisitos_funcionais) return null;

    const normalizedLines = demand.requisitos_funcionais
      .split('\n')
      .map((line: string) => line.trim());

    const parseLine = (prefix: string) => {
      const entry = normalizedLines.find((line) =>
        line.toLowerCase().startsWith(prefix.toLowerCase())
      );

      if (!entry) return '';

      return entry.split(':').slice(1).join(':').trim();
    };

    return {
      solicitante: parseLine('- solicitante/cargo'),
      acao: parseLine('- ação ou funcionalidade desejada'),
      outros: parseLine('- outros usuários ou áreas'),
      beneficio: parseLine('- benefício ou objetivo esperado'),
    };
  }, [demand?.requisitos_funcionais]);

  const checklistItems = useMemo(() => {
    if (!demand?.checklist_entrega) return [] as string[];

    if (Array.isArray(demand.checklist_entrega)) {
      return demand.checklist_entrega.filter((item) => typeof item === 'string' && item.trim());
    }

    return String(demand.checklist_entrega)
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [demand?.checklist_entrega]);

  const attachmentLinks = useMemo(() => {
    if (!demand?.documentos_anexados) return [] as string[];

    if (Array.isArray(demand.documentos_anexados)) {
      return demand.documentos_anexados.filter((item) => typeof item === 'string' && item.trim());
    }

    try {
      const parsed = JSON.parse(demand.documentos_anexados);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === 'string' && item.trim());
      }
    } catch (error) {
      // Valor não é um JSON válido, segue fluxo padrão
    }

    return String(demand.documentos_anexados)
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [demand?.documentos_anexados]);

  const formatAttachmentName = (url: string, index: number) => {
    try {
      const pathname = new URL(url).pathname;
      const decoded = decodeURIComponent(pathname);
      const filename = decoded.split('/').pop();
      if (filename) {
        return filename;
      }
    } catch (error) {
      // Mantém fallback padrão
    }

    return `Documento ${index + 1}`;
  };

  const hasUserStoryInfo = useMemo(() => {
    if (!parsedUserStory) return false;

    return Object.values(parsedUserStory).some((value) => Boolean(value && value.trim()));
  }, [parsedUserStory]);

  const approvalActionLabels: Record<string, string> = {
    aprovar_gerente: 'Aprovação - Gerente',
    recusar_gerente: 'Recusa - Gerente',
    pendente_gerente: 'Pendente de Aprovação - Gerente',
    aprovar_comite: 'Aprovação - Comitê',
    recusar_comite: 'Recusa - Comitê',
    pendente_comite: 'Pendente de Aprovação - Comitê',
    aprovar_ti: 'Aprovação - TI',
    recusar_ti: 'Recusa - TI',
    pendente_ti: 'Pendente de Aprovação - TI',
  };

  const getStatusLabel = (status?: string | null) => {
    if (!status) return 'Pendente';

    switch (status) {
      case 'aprovado':
        return 'Aprovado';
      case 'recusado':
        return 'Recusado';
      case 'pendente':
      default:
        return 'Pendente';
    }
  };

  const getStatusVariant = (status?: string | null) => {
    if (status === 'aprovado') return 'default';
    if (status === 'recusado') return 'destructive';
    return 'secondary';
  };

  const committeeApprovals = useMemo(() => {
    return (history || [])
      .filter((entry) => {
        const normalizedAction = normalizeText(entry?.action);
        const normalizedDescription = normalizeText(entry?.descricao);

        return (
          normalizedAction === 'aprovar_comite' ||
          normalizedDescription.includes('aprovacao de comite')
        );
      })
      .map((entry) => ({
        ...entry,
        committeeStatus: determineCommitteeStatus(entry),
      }));
  }, [history]);

  const getCommitteeActionTitle = (entry: any) => {
    if (entry?.action && approvalActionLabels[entry.action]) {
      return approvalActionLabels[entry.action];
    }

    return getActionLabel(entry?.action) || 'Ação do Comitê';
  };

  if (loading || formLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!demand) return null;

  const showMelhoriaDetails =
    demand.classificacao === 'Melhoria' &&
    [
      demand.melhoria_problema_atual,
      demand.melhoria_beneficio_esperado,
      demand.melhoria_alternativas,
    ].some((value) => Boolean(value && String(value).trim()));

  const hasChecklistItems = checklistItems.length > 0;
  const hasAttachments = attachmentLinks.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto print:max-w-full print:max-h-full print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-2xl">
            {demand.codigo} - {demand.descricao}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full print:hidden">
          <TabsList className="grid w-full grid-cols-5 print:hidden">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="comments">Comentários</TabsTrigger>
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="assignments">Atribuições</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Informações Gerais</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Código:</span>
                    <p className="text-base mt-1">{demand.codigo}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Status:</span>
                    <p className="text-base mt-1"><Badge>{demand.status}</Badge></p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Empresa:</span>
                    <p className="text-base mt-1">{demand.empresa}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Setor:</span>
                    <p className="text-base mt-1">{demand.setor || demand.departamento}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Squad:</span>
                    <p className="text-base mt-1"><Badge variant="outline">{demand.squad}</Badge></p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Prioridade:</span>
                    <p className="text-base mt-1"><Badge variant="outline">{demand.prioridade}</Badge></p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Regulatório?</span>
                    <p className="text-base mt-1">{demand.regulatorio ? 'Sim' : 'Não'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Solicitante:</span>
                    <p className="text-base mt-1">{demand.profiles?.full_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Classificação:</span>
                    <p className="text-base mt-1">{demand.classificacao || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Tipo de Projeto:</span>
                    <p className="text-base mt-1">{demand.tipo_projeto || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Horas Estimadas:</span>
                    <p className="text-base mt-1">{demand.horas_estimadas || '-'}h</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Custo Estimado:</span>
                    <p className="text-base mt-1">R$ {demand.custo_estimado?.toLocaleString('pt-BR') || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-semibold text-muted-foreground">Fornecedor do Orçamento:</span>
                    <p className="text-base mt-1">
                      {supplierInfo ? (
                        <span className="flex flex-col text-sm sm:text-base">
                          <span className="font-medium">{supplierInfo.nome_fantasia || supplierInfo.razao_social}</span>
                          <span className="text-muted-foreground text-xs sm:text-sm">
                            {supplierInfo.razao_social}
                          </span>
                          <span className="text-muted-foreground text-xs sm:text-sm">CNPJ: {supplierInfo.cnpj}</span>
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Sprint Atual:</span>
                    <p className="text-base mt-1">{demand.sprint_atual || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Data Início:</span>
                    <p className="text-base mt-1">{demand.data_inicio ? format(new Date(demand.data_inicio), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Data Conclusão:</span>
                    <p className="text-base mt-1">{demand.data_conclusao ? format(new Date(demand.data_conclusao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">ROI Estimado:</span>
                    <p className="text-base mt-1">{demand.roi_estimado ? `${demand.roi_estimado}%` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">ROI Realizado:</span>
                    <p className="text-base mt-1">{demand.roi_realizado ? `${demand.roi_realizado}%` : '-'}</p>
                  </div>
                  {demand.regulatorio && (
                    <div className="col-span-2">
                      <span className="text-sm font-semibold text-muted-foreground">Data Limite Regulatório:</span>
                      <p className="text-base mt-1 text-destructive font-semibold">
                        {demand.data_limite_regulatorio ? format(new Date(demand.data_limite_regulatorio), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-sm font-semibold text-muted-foreground">Descrição:</span>
                  <p className="text-base mt-1 whitespace-pre-wrap">{demand.descricao}</p>
                </div>
                {hasUserStoryInfo && parsedUserStory && (
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">História do Usuário:</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {parsedUserStory.solicitante && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Solicitante/Cargo</p>
                          <p className="text-base mt-1 whitespace-pre-wrap">{parsedUserStory.solicitante}</p>
                        </div>
                      )}
                      {parsedUserStory.acao && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Ação ou funcionalidade desejada</p>
                          <p className="text-base mt-1 whitespace-pre-wrap">{parsedUserStory.acao}</p>
                        </div>
                      )}
                      {parsedUserStory.outros && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Outros usuários ou áreas</p>
                          <p className="text-base mt-1 whitespace-pre-wrap">{parsedUserStory.outros}</p>
                        </div>
                      )}
                      {parsedUserStory.beneficio && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Benefício ou objetivo esperado</p>
                          <p className="text-base mt-1 whitespace-pre-wrap">{parsedUserStory.beneficio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {demand.observacoes && (
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Observações:</span>
                    <p className="text-base mt-1 whitespace-pre-wrap">{demand.observacoes}</p>
                  </div>
                )}
                {showMelhoriaDetails && (
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">Detalhes da Melhoria:</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {demand.melhoria_problema_atual && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Problema atual</p>
                          <p className="text-base mt-1 whitespace-pre-wrap">{demand.melhoria_problema_atual}</p>
                        </div>
                      )}
                      {demand.melhoria_beneficio_esperado && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Benefício esperado</p>
                          <p className="text-base mt-1 whitespace-pre-wrap">{demand.melhoria_beneficio_esperado}</p>
                        </div>
                      )}
                      {demand.melhoria_alternativas && (
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Alternativas consideradas</p>
                          <p className="text-base mt-1 whitespace-pre-wrap">{demand.melhoria_alternativas}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {demand.justificativa_comite && (
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Justificativa do Comitê:</span>
                    <p className="text-base mt-1 whitespace-pre-wrap">{demand.justificativa_comite}</p>
                  </div>
                )}
                {demand.resultados_alcancados && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Resultados Alcançados:</span>
                    <p className="text-base mt-1 whitespace-pre-wrap">{demand.resultados_alcancados}</p>
                  </div>
                )}
                {hasChecklistItems && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Checklist de Entrega:</span>
                    <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
                      {checklistItems.map((item, index) => (
                        <li key={`${item}-${index}`} className="whitespace-pre-wrap">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasAttachments && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Documentos Anexados:</span>
                    <div className="space-y-2">
                      {attachmentLinks.map((link, index) => (
                        <Button
                          key={`${link}-${index}`}
                          variant="secondary"
                          size="sm"
                          className="w-full justify-start gap-2 sm:w-auto"
                          onClick={() => handleDownloadFile(link)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="truncate max-w-[220px] sm:max-w-xs">
                            {formatAttachmentName(link, index)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {questions.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <span className="text-sm font-medium text-muted-foreground">Formulário Personalizado da Squad:</span>
                    <div className="mt-2 space-y-3">
                      {questions.map((question, index) => (
                        <div key={question.id} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">{question.texto}</p>
                              <p className="text-base text-foreground bg-background p-2 rounded border">
                                {responses[question.id] || '❌ Não respondido'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerente de Projetos</CardTitle>
                  <div className="flex gap-2">
                    {demand?.status === 'Aguardando_Validacao_TI' && (
                      <Button
                        size="sm"
                        onClick={handleRevertToManager}
                        variant="outline"
                        className="gap-2"
                        disabled={hasTechnicalEvaluation}
                        title={hasTechnicalEvaluation ? 'TI já iniciou a avaliação' : 'Reverter envio para Faseamento TI'}
                      >
                        <Undo2 className="h-4 w-4" />
                        Reverter Faseamento TI
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setAddCommentOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Comentário
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold">{comment.profiles?.full_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <p className="text-base whitespace-pre-wrap mt-2">{comment.comentario}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum comentário encontrado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle>Aprovações</CardTitle>
              </CardHeader>
              <CardContent>
                {committeeApprovals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ação</TableHead>
                        <TableHead>Aprovador</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {committeeApprovals.map((approval) => (
                        <TableRow key={approval.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                {getCommitteeActionTitle(approval)}
                              </p>
                              {approval.descricao && (
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {approval.descricao}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{approval.profiles?.full_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(approval.committeeStatus)}>
                              {getStatusLabel(approval.committeeStatus)}
                            </Badge>
                            {typeof approval.dados_novos === 'object' &&
                              approval.dados_novos?.motivo_recusa && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Motivo: {approval.dados_novos.motivo_recusa}
                                </p>
                              )}
                          </TableCell>
                          <TableCell>
                            {approval.created_at
                              ? format(new Date(approval.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">Nenhuma aprovação encontrada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Histórico de Ações</CardTitle>
                {demand.versao && demand.versao > 1 && (
                  <Button
                    onClick={() => setVersionHistoryOpen(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <History className="h-4 w-4" />
                    Ver Histórico de Versões
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        {history.length} {history.length === 1 ? 'ação registrada' : 'ações registradas'} nesta demanda
                      </p>
                    </div>
                    <ScrollArea className="max-h-[420px] pr-4">
                      <div className="space-y-4">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                          >
                            <div className="mt-1">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <History className="w-4 h-4 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={getActionColor(item.action)} variant="outline">
                                      {getActionLabel(item.action)}
                                    </Badge>
                                    <Badge variant="secondary">{demand.codigo}</Badge>
                                    <span className="text-xs text-muted-foreground">{demand.empresa}</span>
                                    {demand.squad && (
                                      <span className="text-xs text-muted-foreground">• {demand.squad}</span>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium">
                                    {item.profiles?.full_name || 'Usuário desconhecido'}
                                  </p>
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                  {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                  <br />
                                  {format(new Date(item.created_at), 'HH:mm', { locale: ptBR })}
                                </div>
                              </div>
                              {item.descricao && (
                                <p className="text-sm text-foreground whitespace-pre-wrap">{item.descricao}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <p className="text-muted-foreground">Nenhum histórico encontrado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Atribuições</CardTitle>
                <Button
                  onClick={() => setAssignDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Atribuir responsável
                </Button>
              </CardHeader>
              <CardContent>
                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm font-semibold text-muted-foreground uppercase">Responsáveis atuais</p>
                      {currentAssignments.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {currentAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  {assignment.assigned_to_profile?.avatar_url ? (
                                    <AvatarImage
                                      src={assignment.assigned_to_profile?.avatar_url || undefined}
                                      alt={assignment.assigned_to_profile?.full_name || 'Responsável'}
                                    />
                                  ) : (
                                    <AvatarFallback>
                                      {assignment.assigned_to_profile?.full_name
                                        ?.split(' ')
                                        .map((part: string) => part.charAt(0))
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase() || 'RS'}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">
                                    {assignment.assigned_to_profile?.full_name || 'Responsável não identificado'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {assignment.sprint_number && (
                                      <Badge variant="secondary" className="text-xs">
                                        Sprint {assignment.sprint_number}
                                      </Badge>
                                    )}
                                    {!assignment.faseamento_completo && assignment.prazo_faseamento && (
                                      <span>
                                        Prazo: {format(new Date(assignment.prazo_faseamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                      </span>
                                    )}
                                    <span>
                                      Atribuído em {format(new Date(assignment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 sm:items-end">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="gap-2"
                                  onClick={() => handleOpenUpdateDialog(assignment.id)}
                                >
                                  <Send className="h-4 w-4" />
                                  Solicitar atualização
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nenhum responsável encontrado para esta demanda.
                        </p>
                      )}
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Atribuído para</TableHead>
                          <TableHead>Atribuído por</TableHead>
                          <TableHead>Sprint</TableHead>
                          <TableHead>Status do Faseamento</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>{assignment.assigned_to_profile?.full_name}</TableCell>
                            <TableCell>{assignment.assigned_by_profile?.full_name}</TableCell>
                            <TableCell>{assignment.sprint_number}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant={assignment.faseamento_completo ? 'default' : 'secondary'}>
                                  {assignment.faseamento_completo ? 'Concluído' : 'Pendente'}
                                </Badge>
                                {assignment.prazo_faseamento && !assignment.faseamento_completo && (
                                  <p className="text-xs text-muted-foreground">
                                    Prazo: {format(new Date(assignment.prazo_faseamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{format(new Date(assignment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma atribuição encontrada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Arquivos para Download - Visível apenas na tela */}
        {hasAttachments && (
          <Card className="mt-4 print:hidden">
            <CardHeader>
              <CardTitle>Arquivos Anexados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attachmentLinks.map((doc: string, index: number) => (
                  <button
                    key={`${doc}-${index}`}
                    onClick={() => handleDownloadFile(doc)}
                    className="flex items-center gap-2 w-full p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-left"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm truncate">{formatAttachmentName(doc, index)}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Versão para impressão */}
        <DemandPrintView
          demand={demand}
          approvals={approvals}
          history={history}
          assignments={assignments}
          questions={questions}
          responses={responses}
        />

        <Dialog
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) {
              setSelectedAssignee('');
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Atribuir responsável</DialogTitle>
              <DialogDescription>
                Defina um novo responsável para acompanhar a demanda. A sprint atual da demanda será utilizada
                automaticamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignee">Responsável *</Label>
                <Select value={selectedAssignee ?? undefined} onValueChange={setSelectedAssignee}>
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <SelectItem value="no-users" disabled>
                        Nenhum usuário disponível
                      </SelectItem>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprint_number">Sprint da demanda</Label>
                <Input
                  id="sprint_number"
                  value={
                    typeof currentSprintNumber === 'number'
                      ? `Sprint ${currentSprintNumber}`
                      : 'Sprint não definida'
                  }
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Atribuições utilizam automaticamente a sprint registrada no cartão.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAssignResponsible}
                disabled={
                  assignSaving ||
                  !selectedAssignee ||
                  !(typeof currentSprintNumber === 'number' && currentSprintNumber > 0)
                }
              >
                {assignSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Atribuir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={updateDialogOpen}
          onOpenChange={(open) => {
            setUpdateDialogOpen(open);
            if (!open) {
              setRequestingAssignmentId(null);
              setUpdateMessage('');
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar atualização</DialogTitle>
              <DialogDescription>
                Envie uma notificação personalizada para o responsável escolhido.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="update-message">Mensagem *</Label>
              <Textarea
                id="update-message"
                value={updateMessage}
                onChange={(event) => setUpdateMessage(event.target.value)}
                placeholder={`Descreva o que precisa ser atualizado na demanda ${demand?.codigo || ''}`}
                rows={4}
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRequestUpdate} disabled={updateSaving || !updateMessage.trim()}>
                {updateSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de adicionar comentário */}
        {demandId && (
          <AddCommentDialog
            demandId={demandId}
            open={addCommentOpen}
            onOpenChange={setAddCommentOpen}
            onCommentAdded={handleCommentAdded}
          />
        )}

        {/* Dialog de histórico de versões */}
        {demandId && (
          <DemandVersionHistory
            open={versionHistoryOpen}
            onOpenChange={setVersionHistoryOpen}
            demandId={demandId}
            currentVersion={demand?.versao || 1}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};