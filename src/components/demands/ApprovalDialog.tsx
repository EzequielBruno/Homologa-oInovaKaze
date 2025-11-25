import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDemandHistory } from '@/hooks/useDemandHistory';

interface ApprovalDialogProps {
  demand: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  level: 'gerente' | 'comite' | 'ti';
  initialAction?: 'aprovar' | 'recusar' | 'solicitar_insumos' | null;
}

export const ApprovalDialog = ({
  demand,
  open,
  onOpenChange,
  onSuccess,
  level,
  initialAction = null,
}: ApprovalDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useDemandHistory();
  const [action, setAction] = useState<'aprovar' | 'recusar' | 'solicitar_insumos' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  // Sincroniza o estado da ação com o initialAction quando o diálogo abre
  useEffect(() => {
    if (open && initialAction) {
      setAction(initialAction);
    } else if (!open) {
      // Reset quando fechar
      setAction(null);
      setMotivo('');
    }
  }, [open, initialAction]);

  const getLevelLabel = () => {
    switch (level) {
      case 'gerente':
        return 'Gerente de Projeto';
      case 'comite':
        return 'Comitê';
      case 'ti':
        return 'TI';
    }
  };

  const levelLabel = getLevelLabel();
  const isApproveAction = action === 'aprovar';

  const createNotification = async (userId: string, title: string, message: string) => {
    await supabase.from('notifications').insert({
      user_id: userId,
      tipo: 'aprovacao',
      title,
      message,
      relacionado_id: demand.id,
    });
  };

  const notifyCommittee = async () => {
    const { data: members } = await supabase
      .from('committee_members')
      .select('user_id, nome')
      .eq('ativo', true);

    if (members) {
      for (const member of members) {
        await createNotification(
          member.user_id,
          'Nova demanda aguardando aprovação do Comitê',
          `A demanda ${demand.codigo} precisa de sua aprovação`
        );
      }
    }
  };

  const notifyScrumMasters = async () => {
    const { data: scrums } = await supabase
      .from('scrum_masters')
      .select('user_id, nome')
      .eq('empresa', demand.empresa)
      .eq('ativo', true);

    if (scrums) {
      for (const scrum of scrums) {
        await createNotification(
          scrum.user_id,
          'Nova demanda aguardando validação TI',
          `A demanda ${demand.codigo} precisa de validação técnica`
        );
      }
    }
  };

  const handleConfirm = async () => {
    if (!user || !action) return;

    setLoading(true);
    try {
      if (action === 'solicitar_insumos') {
        // Solicitar insumos: registra como ação para não aparecer mais na lista
        await supabase.from('demand_approvals').insert({
          demand_id: demand.id,
          approver_id: user.id,
          approval_level: level,
          status: 'pendente',
          motivo_recusa: `Solicitação de insumos: ${motivo}`,
        });

        // Notifica solicitante
        await createNotification(
          demand.solicitante_id,
          'Solicitação de mais informações',
          `Sua demanda ${demand.codigo} precisa de mais detalhes: ${motivo}`
        );

        // Log histórico
        await logAction({
          demandId: demand.id,
          action: 'solicitar_insumo',
          descricao: `Solicitação de insumos por ${getLevelLabel()}: ${motivo}`,
          dadosNovos: { mensagem: motivo },
        });

      toast({
        title: 'Solicitação enviada',
        description: 'O solicitante foi notificado sobre a necessidade de mais informações',
      });

      // Aguarda um momento para garantir que o banco atualizou
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setAction(null);
        setMotivo('');
      }, 500);
      return;
      }
      
      if (action === 'recusar') {
        // Recusar: volta para Backlog
        await supabase
          .from('demands')
          .update({ status: 'Backlog' })
          .eq('id', demand.id);

        // Registra recusa
        await supabase.from('demand_approvals').insert({
          demand_id: demand.id,
          approver_id: user.id,
          approval_level: level,
          status: 'recusado',
          motivo_recusa: motivo,
        });

        // Notifica solicitante
        await createNotification(
          demand.solicitante_id,
          `Demanda recusada - ${getLevelLabel()}`,
          `Sua demanda ${demand.codigo} foi recusada. Motivo: ${motivo}`
        );

        // Log histórico
        await logAction({
          demandId: demand.id,
          action: `recusar_${level}` as any,
          descricao: `Demanda recusada por ${getLevelLabel()}: ${motivo}`,
          dadosAnteriores: { status: demand.status },
          dadosNovos: { status: 'Backlog', motivo_recusa: motivo },
        });

        toast({
          title: 'Demanda recusada',
          description: 'A demanda foi enviada de volta ao solicitante para ajustes',
        });

        // Aguarda um momento para garantir que o banco atualizou
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setAction(null);
          setMotivo('');
        }, 500);
        return;
      }

      // Aprovar: verifica se já existe aprovação registrada
      const { data: existingApproval, error: existingApprovalError } = await supabase
        .from('demand_approvals')
        .select('id')
        .eq('demand_id', demand.id)
        .eq('approver_id', user.id)
        .eq('approval_level', level)
        .maybeSingle();

      if (existingApprovalError && existingApprovalError.code !== 'PGRST116') {
        throw existingApprovalError;
      }

      if (existingApproval) {
        toast({
          title: 'Atenção',
          description: 'Sua aprovação para esta demanda já havia sido registrada.',
        });

        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setAction(null);
          setMotivo('');
        }, 500);

        return;
      }

      // Aprovar: registra aprovação
      await supabase.from('demand_approvals').insert({
        demand_id: demand.id,
        approver_id: user.id,
        approval_level: level,
        status: 'aprovado',
      });

      let newStatus = demand.status;
      let notifyNext = false;

      if (level === 'gerente') {
        const prioridade = demand?.prioridade as string | undefined;
        const isAwaitingGPLevel =
          demand?.status === 'Aguardando_Gerente' || demand?.status === 'Aguardando_GP';
        const isMediumOrLow = prioridade === 'Média' || prioridade === 'Baixa';

        if (isAwaitingGPLevel && isMediumOrLow) {
          // Demandas média/baixa aprovadas pelo gerente seguem direto para Aprovadas Diretoria
          newStatus = 'Aprovado';
        } else {
          // Gerente aprovou, vai para comitê direto
          newStatus = 'Aguardando_Comite';
          notifyNext = true;
          await notifyCommittee();
        }
      } else if (level === 'comite') {
        // Verifica se todos do comitê aprovaram
        const { data: members } = await supabase
          .from('committee_members')
          .select('user_id')
          .eq('ativo', true);

        const { data: approvals } = await supabase
          .from('demand_approvals')
          .select('approver_id')
          .eq('demand_id', demand.id)
          .eq('approval_level', 'comite')
          .eq('status', 'aprovado');

        const allApproved =
          members &&
          approvals &&
          members.length === approvals.length;

        if (allApproved) {
          // Todos aprovaram, vai para TI
          newStatus = 'Aguardando_Validacao_TI';
          notifyNext = true;
          await notifyScrumMasters();
        }
      } else if (level === 'ti') {
        // Verifica se todos os scrums da empresa aprovaram
        const { data: scrums } = await supabase
          .from('scrum_masters')
          .select('user_id')
          .eq('empresa', demand.empresa)
          .eq('ativo', true);

        const { data: approvals } = await supabase
          .from('demand_approvals')
          .select('approver_id')
          .eq('demand_id', demand.id)
          .eq('approval_level', 'ti')
          .eq('status', 'aprovado');

        const allApproved =
          scrums &&
          approvals &&
          scrums.length === approvals.length;

        if (allApproved) {
          // Todos aprovaram, vai para Em_Progresso
          newStatus = 'Em_Progresso';
        }
      }

      // Atualiza status se necessário
      if (newStatus !== demand.status) {
        await supabase
          .from('demands')
          .update({ status: newStatus })
          .eq('id', demand.id);
      }

      // Log histórico
      await logAction({
        demandId: demand.id,
        action: `aprovar_${level}` as any,
        descricao: `Aprovação de ${getLevelLabel()} registrada`,
        dadosAnteriores: { status: demand.status },
        dadosNovos: { status: newStatus },
      });

      toast({
        title: 'Aprovação registrada',
        description: notifyNext
          ? 'Próximo nível foi notificado'
          : 'Aguardando demais aprovadores do nível',
      });

      // Aguarda um momento para garantir que o banco atualizou
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setAction(null);
        setMotivo('');
      }, 500);
    } catch (error: any) {
      console.error('Erro ao processar aprovação:', error);

      const message = error?.message as string | undefined;
      const isDuplicateError =
        error?.code === '23505' || (message && message.toLowerCase().includes('duplicate key value'));

      if (isDuplicateError) {
        toast({
          title: 'Atenção',
          description: 'Sua aprovação para esta demanda já havia sido registrada.',
        });
      } else {
        toast({
          title: 'Erro',
          description: message || 'Não foi possível processar a aprovação.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApproveAction
              ? `Confirmar aprovação - ${levelLabel}`
              : `Aprovar/Recusar - ${levelLabel}`}
          </DialogTitle>
          <DialogDescription>
            Demanda: {demand?.codigo} - {demand?.empresa}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isApproveAction ? (
            <p className="text-center text-lg font-semibold text-foreground">Tem certeza?</p>
          ) : action ? (
            <div>
              <label className="text-sm font-medium">
                {action === 'recusar' && 'Motivo da recusa (obrigatório):'}
                {action === 'solicitar_insumos' && 'Detalhes necessários (obrigatório):'}
              </label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={
                  action === 'recusar'
                    ? 'Ex: Falta de viabilidade financeira, necessita revisão...'
                    : 'Ex: Precisamos de mais detalhes sobre os requisitos funcionais, estimativas de ROI...'
                }
                rows={4}
                className="mt-2"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione uma ação para continuar.</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setAction(null);
              setMotivo('');
            }}
            disabled={loading}
          >
            {isApproveAction ? 'Não' : 'Cancelar'}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              loading ||
              ((action === 'recusar' || action === 'solicitar_insumos') && !motivo.trim())
            }
            variant={
              action === 'recusar'
                ? 'destructive'
                : action === 'aprovar'
                ? 'accent'
                : 'default'
            }
          >
            {loading ? 'Processando...' : isApproveAction ? 'Sim' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
