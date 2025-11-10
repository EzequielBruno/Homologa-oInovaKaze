import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  LayoutGrid,
  Loader2,
  Filter,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { KanbanFilters, type KanbanFiltersState } from '@/components/kanban/KanbanFilters';
import { PhaseGroupCard, PHASE_GROUPS } from '@/components/kanban/KanbanPhaseGroups';
import { DemandDetailsDialog } from '@/components/demands/DemandDetailsDialog';
import { AddCommentDialog } from '@/components/demands/AddCommentDialog';
import DemandDialog from '@/components/demands/DemandDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RiskAssessmentDialog } from '@/components/risk/RiskAssessmentDialog';
import { useDemandHistory } from '@/hooks/useDemandHistory';
import { validateStatusTransition } from '@/utils/kanbanFlowRules';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ApprovalDialog } from '@/components/demands/ApprovalDialog';

type Demand = Tables<'demands'> & { has_faseamento?: boolean };
type DemandStatus = Tables<'demands'>['status'];

const APPROVAL_FLOW: Partial<Record<DemandStatus, DemandStatus>> = {
  StandBy: 'Backlog' as DemandStatus,
  Backlog: 'Aprovado' as DemandStatus,
  Aguardando_Gerente: 'Aguardando_Comite' as DemandStatus,
  Aguardando_Comite: 'Revisao' as DemandStatus,
  Revisao: 'Aprovado' as DemandStatus,
  Aprovado: 'Em_Progresso' as DemandStatus,
  Em_Progresso: 'Concluido' as DemandStatus,
};

const STATUS_COLUMNS = [
  { id: 'StandBy', title: 'StandBy' },
  { id: 'Backlog', title: 'Backlog' },
  { id: 'Aguardando_Gerente', title: 'Aguardando Gerente' },
  { id: 'Aprovado_GP', title: 'Aprovado GP' },
  { id: 'Aguardando_Validacao_TI', title: 'Faseamento TI' },
  { id: 'Aguardando_Comite', title: 'Aguardando Comitê' },
  { id: 'Revisao', title: 'Aprovação Diretoria' },
  { id: 'Aprovado', title: 'Aprovadas Diretoria' },
  { id: 'Em_Progresso', title: 'Em Progresso' },
  { id: 'Bloqueado', title: 'Bloqueado' },
  { id: 'Concluido', title: 'Concluídas' },
  { id: 'Recusado', title: 'Recusadas' },
  { id: 'Arquivado', title: 'Canceladas' },
];


const EMPRESA_MAP: Record<string, Demand['empresa']> = {
  'zs': 'ZS',
  'zc': 'ZC',
  'eletro': 'Eletro',
  'zf': 'ZF',
};

const KanbanView = () => {
  const { empresa } = useParams<{ empresa: string }>();
  const { logAction } = useDemandHistory();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [insumoDialogOpen, setInsumoDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [demandDialogOpen, setDemandDialogOpen] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [insumoDemand, setInsumoDemand] = useState<Demand | null>(null);
  const [rejectDemand, setRejectDemand] = useState<Demand | null>(null);
  const [cancelDemand, setCancelDemand] = useState<Demand | null>(null);
  const [commentDemand, setCommentDemand] = useState<Demand | null>(null);
  const [riskDemand, setRiskDemand] = useState<Demand | null>(null);
  const [demandToEdit, setDemandToEdit] = useState<Demand | null>(null);
  const [changeDemand, setChangeDemand] = useState<Demand | null>(null);
  const [changeDescricao, setChangeDescricao] = useState('');
  const [changeSaving, setChangeSaving] = useState(false);
  const [insumoDescricao, setInsumoDescricao] = useState('');
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [insumoSaving, setInsumoSaving] = useState(false);
  const [rejectSaving, setRejectSaving] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<Tables<'risk_assessments'> | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalDemand, setApprovalDemand] = useState<Demand | null>(null);
  const [approvalInitialAction, setApprovalInitialAction] = useState<'aprovar' | 'recusar' | 'solicitar_insumos' | null>(null);
  const [approvalLevel, setApprovalLevel] = useState<'gerente' | 'comite' | 'ti' | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const kanbanScrollRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  
  // Filtros
  const [filters, setFilters] = useState<KanbanFiltersState>({
    squad: 'all',
    sprint: 'all',
    prioridade: 'all',
    classificacao: 'all',
    status: 'all',
    dataInicio: '',
    dataFim: '',
    demanda: '',
    solicitante: 'all',
  });
  const [squads, setSquads] = useState<string[]>([]);
  const [sprints, setSprints] = useState<number[]>([]);
  const [classificacoes, setClassificacoes] = useState<string[]>([]);
  const [activeColumn, setActiveColumn] = useState<string>('');

  const demandOptions = useMemo(
    () =>
      demands.map((demand) => ({
        id: demand.id,
        codigo: demand.codigo,
        descricao: demand.descricao,
      })),
    [demands]
  );

  const statusOptions = useMemo(
    () =>
      STATUS_COLUMNS.map((column) => ({
        value: column.id,
        label: column.id === 'Arquivado' ? 'Arquivadas' : column.title,
      })),
    []
  );

  const solicitantes = useMemo(
    () =>
      Array.from(
        new Set(
          demands
            .map((demand) => demand.setor)
            .filter((setor): setor is NonNullable<typeof setor> => Boolean(setor))
        )
      ).sort(),
    [demands]
  );

  const scrollToColumn = useCallback((status: string) => {
    const target = columnRefs.current[status];
    if (target) {
      setActiveColumn(status);
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);

  useEffect(() => {
    loadDemands();
    loadFilterOptions();
  }, [empresa]);

  useEffect(() => {
    const kanbanScroll = kanbanScrollRef.current;
    const scrollbar = scrollbarRef.current;

    if (!kanbanScroll || !scrollbar) return;

    const syncScrollbar = () => {
      const scrollPercentage = kanbanScroll.scrollLeft / (kanbanScroll.scrollWidth - kanbanScroll.clientWidth);
      const scrollbarWidth = scrollbar.scrollWidth - scrollbar.clientWidth;
      scrollbar.scrollLeft = scrollPercentage * scrollbarWidth;
    };

    const syncKanban = () => {
      const scrollPercentage = scrollbar.scrollLeft / (scrollbar.scrollWidth - scrollbar.clientWidth);
      const kanbanWidth = kanbanScroll.scrollWidth - kanbanScroll.clientWidth;
      kanbanScroll.scrollLeft = scrollPercentage * kanbanWidth;
    };

    kanbanScroll.addEventListener('scroll', syncScrollbar);
    scrollbar.addEventListener('scroll', syncKanban);

    return () => {
      kanbanScroll.removeEventListener('scroll', syncScrollbar);
      scrollbar.removeEventListener('scroll', syncKanban);
    };
  }, [demands]);

  const loadFilterOptions = async () => {
    if (!empresa) return;

    const empresaValue = EMPRESA_MAP[empresa];
    if (!empresaValue) return;

    try {
      const { data, error } = await supabase
        .from('demands')
        .select('squad, sprint_atual, classificacao')
        .eq('empresa', empresaValue);

      if (error) throw error;

      const uniqueSquads = [...new Set(data?.map(d => d.squad).filter(Boolean) as string[])];
      const uniqueSprints = [...new Set(data?.map(d => d.sprint_atual).filter(Boolean) as number[])];
      const uniqueClassificacoes = [...new Set(data?.map(d => d.classificacao).filter(Boolean) as string[])];

      setSquads(uniqueSquads.sort());
      setSprints(uniqueSprints.sort((a, b) => b - a));
      setClassificacoes(uniqueClassificacoes.sort());
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadDemands = async () => {
    if (!empresa) return;

    const empresaValue = EMPRESA_MAP[empresa];
    if (!empresaValue) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('empresa', empresaValue)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar fases para verificar quais demandas têm faseamento
      const demandIds = data?.map(d => d.id) || [];
      const { data: phasesData } = await supabase
        .from('phases')
        .select('demanda_id')
        .in('demanda_id', demandIds);

      const demandsWithFaseamento = new Set(phasesData?.map(p => p.demanda_id) || []);

      // Adicionar propriedade has_faseamento às demandas
      const demandsWithFlag = data?.map(d => ({
        ...d,
        has_faseamento: demandsWithFaseamento.has(d.id),
      })) || [];

      setDemands(demandsWithFlag as Demand[]);
    } catch (error) {
      console.error('Error loading demands:', error);
      setDemands([]);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (
    userId: string | null | undefined,
    title: string,
    message: string,
    demandId: string
  ) => {
    if (!userId) return;

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      tipo: 'kanban_action',
      relacionado_id: demandId,
    });

    if (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleParecerTecnicoTI = async (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    if (demand.status === 'Aguardando_Validacao_TI') {
      toast({
        title: 'Parecer já solicitado',
        description: 'Esta demanda já está aguardando parecer técnico TI.',
      });
      return;
    }

    const previousDemands = [...demands];

    setDemands((prev) =>
      prev.map((item) =>
        item.id === demandId ? { ...item, status: 'Aguardando_Validacao_TI' as any } : item
      )
    );

    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: 'Aguardando_Validacao_TI' as any })
        .eq('id', demandId);

      if (error) throw error;

      await logAction({
        demandId,
        action: 'enviar_notificacao',
        descricao: 'Solicitação de parecer técnico TI enviada via Kanban',
        dadosAnteriores: { status: demand.status },
        dadosNovos: { status: 'Aguardando_Validacao_TI' },
      });

      toast({
        title: 'Parecer técnico solicitado',
        description: 'A demanda foi enviada para análise técnica de faseamento pela TI.',
      });

      await loadDemands();
    } catch (error) {
      console.error('Error requesting technical review:', error);
      toast({
        title: 'Erro ao solicitar parecer técnico',
        description: 'Não foi possível solicitar o parecer técnico. Tente novamente.',
        variant: 'destructive',
      });
      setDemands(previousDemands);
    }
  };

  const handleReverterFaseamento = async (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    // Verifica se já existem fases cadastradas
    const { count } = await supabase
      .from('phases')
      .select('*', { count: 'exact', head: true })
      .eq('demanda_id', demandId);

    if ((count ?? 0) > 0) {
      toast({
        title: 'Não é possível reverter',
        description: 'A TI já iniciou a avaliação com faseamento. Não é mais possível reverter.',
        variant: 'destructive',
      });
      return;
    }

    const previousDemands = [...demands];

    setDemands((prev) =>
      prev.map((item) =>
        item.id === demandId ? { ...item, status: 'Backlog' as any } : item
      )
    );

    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: 'Backlog' as any })
        .eq('id', demandId);

      if (error) throw error;

      await logAction({
        demandId,
        action: 'mudar_status',
        descricao: 'Gerente de Projetos reverteu envio para Faseamento TI',
        dadosAnteriores: { status: demand.status },
        dadosNovos: { status: 'Backlog' },
      });

      toast({
        title: 'Faseamento revertido',
        description: 'A demanda voltou para o Backlog.',
      });

      await loadDemands();
    } catch (error) {
      console.error('Error reverting to manager:', error);
      toast({
        title: 'Erro ao reverter',
        description: 'Não foi possível reverter. Tente novamente.',
        variant: 'destructive',
      });
      setDemands(previousDemands);
    }
  };

  const handleOpenRiskAssessment = async (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    setRiskDemand(demand);
    setRiskDialogOpen(true);
    setRiskAssessment(null);

    try {
      const { data, error } = await supabase
        .from('risk_assessments')
        .select('*')
        .eq('demand_id', demandId)
        .maybeSingle();

      if (error) throw error;
      setRiskAssessment(data);
    } catch (error) {
      console.error('Error loading risk assessment:', error);
      toast({
        title: 'Erro ao carregar avaliação de risco',
        description: 'Não foi possível carregar os dados de risco.',
        variant: 'destructive',
      });
    }
  };

  const handleRiskDialogOpenChange = (open: boolean) => {
    setRiskDialogOpen(open);
    if (!open) {
      setRiskDemand(null);
      setRiskAssessment(null);
    }
  };

  const handleRiskComplete = async () => {
    handleRiskDialogOpenChange(false);
    await loadDemands();
  };

  const handleOpenInsumoDialog = (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    setInsumoDemand(demand);
    setInsumoDescricao('');
    setInsumoDialogOpen(true);
  };

  const handleInsumoDialogOpenChange = (open: boolean) => {
    setInsumoDialogOpen(open);
    if (!open) {
      setInsumoDemand(null);
      setInsumoDescricao('');
    }
  };

  const handleSubmitInsumo = async () => {
    if (!insumoDemand) return;

    if (!insumoDescricao.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe a descrição do insumo necessário.',
        variant: 'destructive',
      });
      return;
    }

    setInsumoSaving(true);
    const previousDemands = [...demands];
    const timestamp = new Date().toLocaleString('pt-BR');
    const existingObservacoes = insumoDemand.observacoes
      ? `${insumoDemand.observacoes}`
      : '';
    const novaObservacao = `${existingObservacoes ? `${existingObservacoes}\n\n` : ''}[${timestamp}] INSUMO SOLICITADO:\nDescrição: ${
      insumoDescricao.trim()
    }`;
    const shouldMoveToStandBy = insumoDemand.status !== 'StandBy';

    setDemands((prev) =>
      prev.map((item) =>
        item.id === insumoDemand.id
          ? {
              ...item,
              observacoes: novaObservacao,
              status: shouldMoveToStandBy ? 'StandBy' : item.status,
            }
          : item
      )
    );

    try {
      const updatePayload: TablesUpdate<'demands'> = {
        observacoes: novaObservacao,
      };

      if (shouldMoveToStandBy) {
        updatePayload.status = 'StandBy';
      }

      const { error } = await supabase
        .from('demands')
        .update(updatePayload)
        .eq('id', insumoDemand.id);

      if (error) throw error;

      await logAction({
        demandId: insumoDemand.id,
        action: 'solicitar_insumo',
        descricao: `Insumo solicitado: ${insumoDescricao.trim()}`,
        dadosAnteriores: {
          status: insumoDemand.status,
          observacoes: insumoDemand.observacoes,
          data_limite_regulatorio: insumoDemand.data_limite_regulatorio,
        },
        dadosNovos: {
          status: shouldMoveToStandBy ? 'StandBy' : insumoDemand.status,
          observacoes: novaObservacao,
          data_limite_regulatorio: insumoDemand.data_limite_regulatorio,
        },
      });

      await createNotification(
        insumoDemand.solicitante_id,
        'Solicitação de insumo',
        `A demanda ${insumoDemand.codigo} necessita do insumo: ${insumoDescricao.trim()}.`,
        insumoDemand.id
      );

      toast({
        title: 'Solicitação registrada',
        description: 'A demanda foi marcada como aguardando insumo.',
      });

      await loadDemands();
      handleInsumoDialogOpenChange(false);
    } catch (error) {
      console.error('Error requesting insumo:', error);
      toast({
        title: 'Erro ao solicitar insumo',
        description: 'Não foi possível registrar a solicitação de insumo.',
        variant: 'destructive',
      });
      setDemands(previousDemands);
    } finally {
      setInsumoSaving(false);
    }
  };

  const handleOpenReprovarDialog = (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    setRejectDemand(demand);
    setMotivoRecusa('');
    setRejectDialogOpen(true);
  };

  const handleReprovarDialogOpenChange = (open: boolean) => {
    setRejectDialogOpen(open);
    if (!open) {
      setRejectDemand(null);
      setMotivoRecusa('');
    }
  };

  const handleConfirmReprovar = async () => {
    if (!rejectDemand) return;

    if (!motivoRecusa.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da reprovação.',
        variant: 'destructive',
      });
      return;
    }

    setRejectSaving(true);
    const previousDemands = [...demands];

    setDemands((prev) =>
      prev.map((item) =>
        item.id === rejectDemand.id ? { ...item, status: 'Recusado' } : item
      )
    );

    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: 'Recusado' })
        .eq('id', rejectDemand.id);

      if (error) throw error;

      await logAction({
        demandId: rejectDemand.id,
        action: 'reprovar',
        descricao: `Demanda reprovada: ${motivoRecusa.trim()}`,
        dadosAnteriores: { status: rejectDemand.status },
        dadosNovos: { status: 'Recusado', motivo: motivoRecusa.trim() },
      });

      await createNotification(
        rejectDemand.solicitante_id,
        'Demanda reprovada',
        `Sua demanda ${rejectDemand.codigo} foi reprovada. Motivo: ${motivoRecusa.trim()}.`,
        rejectDemand.id
      );

      toast({
        title: 'Demanda reprovada',
        description: 'A demanda foi marcada como recusada.',
      });

      await loadDemands();
      handleReprovarDialogOpenChange(false);
    } catch (error) {
      console.error('Error rejecting demand:', error);
      toast({
        title: 'Erro ao reprovar demanda',
        description: 'Não foi possível reprovar a demanda.',
        variant: 'destructive',
      });
      setDemands(previousDemands);
    } finally {
      setRejectSaving(false);
    }
  };

  const handleOpenCancelarDialog = (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    setCancelDemand(demand);
    setMotivoCancelamento('');
    setCancelDialogOpen(true);
  };

  const handleCancelarDialogOpenChange = (open: boolean) => {
    setCancelDialogOpen(open);
    if (!open) {
      setCancelDemand(null);
      setMotivoCancelamento('');
    }
  };

  const handleConfirmCancelar = async () => {
    if (!cancelDemand) return;

    if (!motivoCancelamento.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo do cancelamento.',
        variant: 'destructive',
      });
      return;
    }

    setCancelSaving(true);
    const previousDemands = [...demands];
    const timestamp = new Date().toLocaleString('pt-BR');
    const existingObservacoes = cancelDemand.observacoes
      ? `${cancelDemand.observacoes}`
      : '';
    const novaObservacao = `${existingObservacoes ? `${existingObservacoes}\n\n` : ''}[${timestamp}] CANCELAMENTO:\n${motivoCancelamento.trim()}`;

    setDemands((prev) =>
      prev.map((item) =>
        item.id === cancelDemand.id
          ? { ...item, status: 'Arquivado', observacoes: novaObservacao }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from('demands')
        .update({
          status: 'Arquivado',
          observacoes: novaObservacao,
        })
        .eq('id', cancelDemand.id);

      if (error) throw error;

      await logAction({
        demandId: cancelDemand.id,
        action: 'cancelar',
        descricao: `Demanda cancelada: ${motivoCancelamento.trim()}`,
        dadosAnteriores: {
          status: cancelDemand.status,
          observacoes: cancelDemand.observacoes,
        },
        dadosNovos: {
          status: 'Arquivado',
          observacoes: novaObservacao,
        },
      });

      await createNotification(
        cancelDemand.solicitante_id,
        'Demanda cancelada',
        `A demanda ${cancelDemand.codigo} foi cancelada. Motivo: ${motivoCancelamento.trim()}.`,
        cancelDemand.id
      );

      toast({
        title: 'Demanda cancelada',
        description: 'A demanda foi arquivada.',
      });

      await loadDemands();
      handleCancelarDialogOpenChange(false);
    } catch (error) {
      console.error('Error cancelling demand:', error);
      toast({
        title: 'Erro ao cancelar demanda',
        description: 'Não foi possível cancelar a demanda.',
        variant: 'destructive',
      });
      setDemands(previousDemands);
    } finally {
      setCancelSaving(false);
    }
  };

  const handleOpenCommentDialog = (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    setCommentDemand(demand);
    setCommentDialogOpen(true);
  };

  const handleCommentDialogOpenChange = (open: boolean) => {
    setCommentDialogOpen(open);
    if (!open) {
      setCommentDemand(null);
    }
  };

  const handleCommentAdded = async () => {
    await loadDemands();
  };

  const handleStatusChange = async (demandId: string, newStatus: string) => {
    const isValidColumn = STATUS_COLUMNS.some((col) => col.id === newStatus);
    if (!isValidColumn) return;

    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    // Valida a transição de status
    const validation = validateStatusTransition(demand, newStatus);
    
    if (!validation.allowed) {
      toast({
        title: 'Transição não permitida',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    // Se requer confirmação, mostra o alerta
    if (validation.requiresConfirmation) {
      const confirmed = window.confirm(validation.confirmationMessage || 'Deseja realizar esta ação?');
      if (!confirmed) return;
    }

    // Validação adicional para StandBy (regulatória)
    if (newStatus === 'StandBy') {
      const isRegulatorio = Boolean(demand.regulatorio);
      const hasDataRegulatoria =
        typeof demand.data_limite_regulatorio === 'string' &&
        demand.data_limite_regulatorio.trim() !== '';

      if (!isRegulatorio || !hasDataRegulatoria) {
        setDemandToEdit(demand);
        setDemandDialogOpen(true);
        toast({
          title: 'Informação obrigatória',
          description:
            'Para mover a demanda para StandBy, marque-a como regulatória e informe a data limite regulatória.',
          variant: 'destructive',
        });
        return;
      }
    }

    const previousDemands = [...demands];
    const previousStatus = demand.status;

    setDemands((prev) =>
      prev.map((item) =>
        item.id === demandId
          ? { ...item, status: newStatus as Demand['status'] }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: newStatus as Demand['status'] })
        .eq('id', demandId);

      if (error) throw error;

      await logAction({
        demandId,
        action: 'mudar_status',
        descricao: `Status alterado de ${previousStatus} para ${newStatus}`,
        dadosAnteriores: { status: previousStatus },
        dadosNovos: { status: newStatus },
      });

      // Transição automática: Aprovado GP → Em Progresso (criticidade baixa/média)
      if (newStatus === 'Aprovado_GP') {
        const criticidade = demand.prioridade;
        const isBaixaOuMedia = criticidade === 'Baixa' || criticidade === 'Média';

        if (isBaixaOuMedia) {
          // Move automaticamente para Em Progresso
          const { error: autoMoveError } = await supabase
            .from('demands')
            .update({ status: 'Em_Progresso' })
            .eq('id', demandId);

          if (!autoMoveError) {
            await logAction({
              demandId,
              action: 'mudar_status',
              descricao: 'Movida automaticamente para Em Progresso (criticidade baixa/média)',
              dadosAnteriores: { status: 'Aprovado_GP' },
              dadosNovos: { status: 'Em_Progresso' },
            });

            toast({
              title: 'Demanda aprovada e iniciada',
              description: 'Demanda de criticidade baixa/média movida automaticamente para Em Progresso.',
            });
            
            // Recarrega as demandas para refletir a mudança
            await loadDemands();
            return;
          }
        }
      }

      toast({
        title: 'Sucesso',
        description: validation.message || 'Status da demanda atualizado',
      });
      
      // Recarrega as demandas para garantir sincronização
      await loadDemands();
    } catch (error) {
      console.error('Error updating demand status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive',
      });
      setDemands(previousDemands);
    }
  };

  const handleApproveDemand = async (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    if (demand.status === 'Aguardando_Comite') {
      setApprovalDemand(demand);
      setApprovalInitialAction('aprovar');
      setApprovalLevel('comite');
      setApprovalDialogOpen(true);
      return;
    }

    const nextStatus = APPROVAL_FLOW[demand.status as DemandStatus];

    if (!nextStatus) {
      toast({
        title: 'Ação não disponível',
        description: 'Este status não permite avanço automático.',
        variant: 'destructive',
      });
      return;
    }

    const validation = validateStatusTransition(demand, nextStatus);

    if (!validation.allowed) {
      toast({
        title: 'Aprovação não permitida',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    if (validation.requiresConfirmation) {
      const confirmed = window.confirm(validation.confirmationMessage || 'Confirma a aprovação desta demanda?');
      if (!confirmed) return;
    }

    const previousDemands = [...demands];
    const previousStatus = demand.status;
    const statusLabel = STATUS_COLUMNS.find((column) => column.id === nextStatus)?.title || nextStatus;

    setDemands((prev) =>
      prev.map((item) =>
        item.id === demandId
          ? { ...item, status: nextStatus as Demand['status'] }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: nextStatus as TablesUpdate<'demands'>['status'] })
        .eq('id', demandId);

      if (error) throw error;

      await logAction({
        demandId,
        action: 'aprovar',
        descricao: `Demanda aprovada: ${previousStatus} → ${nextStatus}`,
        dadosAnteriores: { status: previousStatus },
        dadosNovos: { status: nextStatus },
      });

      await createNotification(
        demand.solicitante_id,
        'Demanda aprovada',
        `Sua demanda ${demand.codigo} avançou para ${statusLabel}.`,
        demand.id
      );

      toast({
        title: 'Demanda aprovada',
        description: validation.message || `A demanda avançou para ${statusLabel}.`,
      });

      await loadDemands();
    } catch (error) {
      console.error('Error approving demand:', error);
      setDemands(previousDemands);
      toast({
        title: 'Erro ao aprovar demanda',
        description: 'Não foi possível avançar a demanda.',
        variant: 'destructive',
      });
    }
  };

  const handleIniciarAprovacao = (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;

    // Abre o dialog de aprovação com nível gerente
    setApprovalDemand(demand);
    setApprovalInitialAction('aprovar');
    setApprovalLevel('gerente');
    setApprovalDialogOpen(true);
  };

  const applyFilters = (demandsList: Demand[]) => {
    let filtered = [...demandsList];

    // Filtro por demanda específica
    if (filters.demanda) {
      filtered = filtered.filter((d) => d.id === filters.demanda);
    }

    // Filtro de Squad
    if (filters.squad && filters.squad !== 'all') {
      filtered = filtered.filter(d => d.squad === filters.squad);
    }

    // Filtro de Sprint
    if (filters.sprint && filters.sprint !== 'all') {
      filtered = filtered.filter(d => d.sprint_atual?.toString() === filters.sprint);
    }

    // Filtro de Prioridade
    if (filters.prioridade && filters.prioridade !== 'all') {
      filtered = filtered.filter(d => d.prioridade === filters.prioridade);
    }

    // Filtro de Classificação
    if (filters.classificacao && filters.classificacao !== 'all') {
      filtered = filtered.filter(d => d.classificacao === filters.classificacao);
    }

    // Filtro de Status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(d => d.status === filters.status);
    }

    // Filtro de Solicitante (Setor)
    if (filters.solicitante && filters.solicitante !== 'all') {
      filtered = filtered.filter(d => d.setor === filters.solicitante);
    }

    // Filtro de Período
    if (filters.dataInicio) {
      filtered = filtered.filter(d => {
        if (!d.created_at) return false;
        const demandDate = new Date(d.created_at);
        const filterDate = new Date(filters.dataInicio);
        return demandDate >= filterDate;
      });
    }

    if (filters.dataFim) {
      filtered = filtered.filter(d => {
        if (!d.created_at) return false;
        const demandDate = new Date(d.created_at);
        const filterDate = new Date(filters.dataFim);
        return demandDate <= filterDate;
      });
    }

    return filtered;
  };

  const getPriorityOrder = (prioridade: string): number => {
    const order: Record<string, number> = {
      'Crítica': 1,
      'Alta': 2,
      'Média': 3,
      'Baixa': 4,
    };
    return order[prioridade] || 5;
  };

  const getDemandsForColumn = (status: string) => {
    // Demandas com Aguardando_Validacao_TI aparecem na coluna Backlog
    const statusFiltered = demands.filter((d) => {
      if (status === 'Backlog') {
        return d.status === 'Backlog' || d.status === 'Aguardando_Validacao_TI';
      }
      return d.status === status;
    });
    const filtered = applyFilters(statusFiltered);
    
    // Ordena por data de criação decrescente (mais recente primeiro)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  };

  const getDemandsForGroup = (groupId: string) => {
    const group = PHASE_GROUPS.find(g => g.id === groupId);
    if (!group) return [];

    const allGroupDemands = group.columns.flatMap(columnId => getDemandsForColumn(columnId));
    
    // Ordena por data de criação decrescente
    return allGroupDemands.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  };


  const getEmpresaLabel = () => {
    if (!empresa) return '';
    const labels: Record<string, string> = {
      'zs': 'Zema Seguros',
      'zc': 'Zema Consórcio',
      'eletro': 'Eletrozema',
      'zf': 'Zema Financeira',
    };
    return labels[empresa] || empresa;
  };

  const handleViewDemand = (demandId: string) => {
    setSelectedDemandId(demandId);
    setDetailsOpen(true);
  };

  const handleDetailsOpenChange = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      setSelectedDemandId(null);
    }
  };

  const handleDemandDialogOpenChange = (open: boolean) => {
    setDemandDialogOpen(open);
    if (!open) {
      setDemandToEdit(null);
    }
  };

  const handleEdit = (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;
    setDemandToEdit(demand);
    setDemandDialogOpen(true);
  };

  const handleSolicitarChange = (demandId: string) => {
    const demand = demands.find((d) => d.id === demandId);
    if (!demand) return;
    setChangeDemand(demand);
    setChangeDescricao('');
    setChangeDialogOpen(true);
  };

  const handleChangeDialogOpenChange = (open: boolean) => {
    setChangeDialogOpen(open);
    if (!open) {
      setChangeDemand(null);
      setChangeDescricao('');
    }
  };

  const handleConfirmChange = async () => {
    if (!changeDemand || !changeDescricao.trim()) {
      toast({
        title: 'Erro',
        description: 'Descreva a solicitação de change',
        variant: 'destructive',
      });
      return;
    }

    setChangeSaving(true);
    try {
      await logAction({
        demandId: changeDemand.id,
        action: 'solicitar_change',
        descricao: `Solicitação de change: ${changeDescricao}`,
        dadosNovos: { solicitacao_change: changeDescricao },
      });

      toast({
        title: 'Change solicitada',
        description: 'A solicitação foi registrada no histórico da demanda.',
      });

      handleChangeDialogOpenChange(false);
      await loadDemands();
    } catch (error) {
      console.error('Error requesting change:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setChangeSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando demandas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full relative pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-primary" />
            Kanban - {getEmpresaLabel()}
          </h1>
          <p className="text-muted-foreground">
            Visualização em quadro de todas as demandas
          </p>
        </div>
      </div>

      {/* Filtros visuais com chips */}
      <KanbanFilters
        filters={filters}
        onFiltersChange={setFilters}
        squads={squads}
        sprints={sprints}
        classificacoes={classificacoes}
        statuses={statusOptions}
        demandas={demandOptions}
        solicitantes={solicitantes}
      />

      {demands.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Nenhuma demanda encontrada para esta empresa
          </p>
        </div>
      )}

      {demands.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {PHASE_GROUPS.map(group => {
            const groupDemands = getDemandsForGroup(group.id);
            
            return (
              <Card key={group.id} className={`${group.color} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{group.icon}</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{group.title}</h2>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{groupDemands.length} demandas</p>
                  </div>
                </div>
                
                <ScrollArea className="max-h-[65vh] sm:h-[600px]">
                  <div className="space-y-3 pr-4">
                    {groupDemands.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma demanda neste bloco
                      </p>
                    ) : (
                      groupDemands.map((demand) => (
                        <KanbanCard
                          key={demand.id}
                          id={demand.id}
                          codigo={demand.codigo}
                          descricao={demand.descricao ?? ''}
                          prioridade={demand.prioridade ?? 'Sem Prioridade'}
                          empresa={demand.empresa}
                          status={demand.status}
                          horas_estimadas={demand.horas_estimadas}
                          created_at={demand.created_at ?? new Date().toISOString()}
                          documentos_anexados={demand.documentos_anexados}
                          hasTIApproval={false}
                          hasFaseamento={Boolean(demand.has_faseamento)}
                          regulatorio={demand.regulatorio}
                          squad={demand.squad}
                          statusOptions={STATUS_COLUMNS}
                          onStatusChange={handleStatusChange}
                          onViewDemand={handleViewDemand}
                          onParecerTecnicoTI={handleParecerTecnicoTI}
                          onAvaliarRisco={handleOpenRiskAssessment}
                          onSolicitarInsumo={handleOpenInsumoDialog}
                          onAprovar={handleApproveDemand}
                          onReprovar={handleOpenReprovarDialog}
                          onCancelar={handleOpenCancelarDialog}
                          onEdit={handleEdit}
                          onSolicitarChange={handleSolicitarChange}
                          onAddComment={handleOpenCommentDialog}
                          onReverterFaseamento={handleReverterFaseamento}
                          onIniciarAprovacao={handleIniciarAprovacao}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </Card>
            );
          })}
        </div>
      )}

      <DemandDetailsDialog
        demandId={selectedDemandId}
        open={detailsOpen}
        onOpenChange={handleDetailsOpenChange}
      />

      {approvalDemand && approvalLevel && (
        <ApprovalDialog
          demand={approvalDemand}
          open={approvalDialogOpen}
          onOpenChange={(open) => {
            setApprovalDialogOpen(open);
            if (!open) {
              setApprovalDemand(null);
              setApprovalInitialAction(null);
              setApprovalLevel(null);
            }
          }}
          onSuccess={loadDemands}
          level={approvalLevel}
          initialAction={approvalInitialAction}
        />
      )}

      <DemandDialog
        open={demandDialogOpen}
        onOpenChange={handleDemandDialogOpenChange}
        demand={demandToEdit ?? undefined}
        onSuccess={loadDemands}
      />

      {riskDemand && (
        <RiskAssessmentDialog
          open={riskDialogOpen}
          onOpenChange={handleRiskDialogOpenChange}
          demand={riskDemand}
          existingAssessment={riskAssessment || undefined}
          onComplete={handleRiskComplete}
        />
      )}

      {insumoDemand && (
        <Dialog open={insumoDialogOpen} onOpenChange={handleInsumoDialogOpenChange}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Solicitar Insumo</DialogTitle>
              <DialogDescription>
                Informe os detalhes necessários para a demanda {insumoDemand.codigo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="insumo-descricao">O que precisa ser providenciado?</Label>
                <Textarea
                  id="insumo-descricao"
                  placeholder="Documentos, liberações ou informações necessárias"
                  value={insumoDescricao}
                  onChange={(event) => setInsumoDescricao(event.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleInsumoDialogOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitInsumo} disabled={insumoSaving}>
                {insumoSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {rejectDemand && (
        <Dialog open={rejectDialogOpen} onOpenChange={handleReprovarDialogOpenChange}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Reprovar Demanda</DialogTitle>
              <DialogDescription>
                Informe o motivo da reprovação da demanda {rejectDemand.codigo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="motivo-reprovar">Motivo da reprovação</Label>
                <Textarea
                  id="motivo-reprovar"
                  placeholder="Descreva o motivo da reprovação"
                  value={motivoRecusa}
                  onChange={(event) => setMotivoRecusa(event.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleReprovarDialogOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmReprovar}
                disabled={rejectSaving}
              >
                {rejectSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar reprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {cancelDemand && (
        <Dialog open={cancelDialogOpen} onOpenChange={handleCancelarDialogOpenChange}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Cancelar Demanda</DialogTitle>
              <DialogDescription>
                Confirme o cancelamento da demanda {cancelDemand.codigo} e registre o motivo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="motivo-cancelar">Motivo do cancelamento</Label>
                <Textarea
                  id="motivo-cancelar"
                  placeholder="Descreva o motivo do cancelamento"
                  value={motivoCancelamento}
                  onChange={(event) => setMotivoCancelamento(event.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleCancelarDialogOpenChange(false)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancelar}
                disabled={cancelSaving}
              >
                {cancelSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {commentDemand && (
        <AddCommentDialog
          demandId={commentDemand.id}
          open={commentDialogOpen}
          onOpenChange={handleCommentDialogOpenChange}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {changeDemand && (
        <Dialog open={changeDialogOpen} onOpenChange={handleChangeDialogOpenChange}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Solicitar Change</DialogTitle>
              <DialogDescription>
                Descreva a solicitação de change para a demanda {changeDemand.codigo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="change-descricao">Descrição da change</Label>
                <Textarea
                  id="change-descricao"
                  placeholder="Descreva as alterações necessárias"
                  value={changeDescricao}
                  onChange={(event) => setChangeDescricao(event.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleChangeDialogOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmChange} disabled={changeSaving}>
                {changeSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default KanbanView;
//as