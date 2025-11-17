import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useDemandHistory } from '@/hooks/useDemandHistory';

interface RiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand: any;
  existingAssessment?: any;
  onComplete: () => void;
}

export function RiskAssessmentDialog({
  open,
  onOpenChange,
  demand,
  existingAssessment,
  onComplete,
}: RiskAssessmentDialogProps) {
  const { user } = useAuth();
  const { logAction } = useDemandHistory();
  
  const [classificacaoGerente, setClassificacaoGerente] = useState<'Melhoria' | 'Projeto'>('Projeto');
  const [probabilidade, setProbabilidade] = useState<'<30%' | '30-90%' | '>90%'>('<30%');
  const [impacto, setImpacto] = useState<'Baixo' | 'Médio' | 'Alto'>('Baixo');
  const [respostaRisco, setRespostaRisco] = useState<'Aceitar' | 'Mitigar' | 'Evitar' | 'Terceirizar'>('Aceitar');
  const [acoesMitigadoras, setAcoesMitigadoras] = useState('');
  const [indiceRisco, setIndiceRisco] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingAssessment) {
      setClassificacaoGerente(existingAssessment.classificacao_gerente || 'Projeto');
      setProbabilidade(existingAssessment.probabilidade);
      setImpacto(existingAssessment.impacto);
      setRespostaRisco(existingAssessment.resposta_risco || 'Aceitar');
      setAcoesMitigadoras(existingAssessment.acoes_mitigadoras || '');
    } else {
      setClassificacaoGerente(demand.classificacao || 'Projeto');
    }
  }, [existingAssessment, demand]);

  useEffect(() => {
    calculateRisk();
  }, [probabilidade, impacto, classificacaoGerente]);

  const calculateRisk = () => {
    const probValues = { '<30%': 0.15, '30-90%': 0.6, '>90%': 0.95 };
    const impactValues = { 'Baixo': 20, 'Médio': 50, 'Alto': 100 };
    const classMultiplier = classificacaoGerente === 'Projeto' ? 1.2 : 1.0;

    const prob = probValues[probabilidade];
    const imp = impactValues[impacto];
    const risk = prob * imp * classMultiplier;

    setIndiceRisco(risk);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const assessmentData = {
        demand_id: demand.id,
        manager_id: user.id,
        classificacao_gerente: classificacaoGerente,
        probabilidade,
        impacto,
        indice_risco: indiceRisco,
        resposta_risco: indiceRisco <= 90 ? respostaRisco : null,
        acoes_mitigadoras: indiceRisco <= 90 ? acoesMitigadoras : null,
        status: indiceRisco > 90 ? 'encaminhado_comite' : 'aprovado',
      };

      if (existingAssessment) {
        const { error } = await supabase
          .from('risk_assessments')
          .update(assessmentData)
          .eq('id', existingAssessment.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('risk_assessments')
          .insert(assessmentData);

        if (error) throw error;
      }

      // Determina encaminhamentos após a avaliação de risco
      const prioridadeAlta = demand.prioridade === 'Alta' || demand.prioridade === 'Crítica';
      const riscoAlto = indiceRisco > 90;
      const shouldNotifyCommittee = riscoAlto || prioridadeAlta;

      const { error: updateError } = await supabase
        .from('demands')
        .update({
          status: 'Backlog',
          avaliacao_risco_realizada: true,
        } as any)
        .eq('id', demand.id);

      if (updateError) throw updateError;

      if (shouldNotifyCommittee) {
        // Criar notificação para o comitê quando o risco ou prioridade exigir atenção
        const { data: committee } = await supabase
          .from('committee_members')
          .select('user_id')
          .eq('ativo', true);

        if (committee?.length) {
          const motivoComite = riscoAlto
            ? `alto risco (${indiceRisco.toFixed(0)})`
            : `prioridade ${demand.prioridade}`;

          const notifications = committee.map(member => ({
            user_id: member.user_id,
            tipo: 'risk_high',
            title: riscoAlto ? 'Alto Risco Identificado' : 'Demanda de Alta Prioridade',
            message: `A demanda ${demand.codigo} requer análise do comitê devido a ${motivoComite}.`,
            relacionado_id: demand.id,
          }));

          await supabase.from('notifications').insert(notifications);
        }

        toast.success(
          'Avaliação de risco concluída. A demanda permanece no backlog para planejamento e o comitê foi notificado.'
        );
      } else {
        toast.success('Avaliação de risco concluída. A demanda permanece no backlog para planejamento.');
      }

      // Log da ação
      await logAction({
        demandId: demand.id,
        action: 'mudar_status',
        descricao: `Avaliação de risco realizada - Índice: ${indiceRisco.toFixed(0)}`,
        dadosNovos: assessmentData,
      });

      onComplete();
    } catch (error) {
      console.error('Error saving risk assessment:', error);
      toast.error('Erro ao salvar avaliação de risco');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = () => {
    if (indiceRisco > 90) return 'text-red-500';
    if (indiceRisco >= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliação de Risco - {demand.codigo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Classificação Inicial (pelo solicitante)</Label>
            <p className="text-sm text-muted-foreground">{demand.classificacao || 'Não especificada'}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="classificacao-gerente">Classificação pelo Gerente *</Label>
            <Select value={classificacaoGerente} onValueChange={(value: 'Melhoria' | 'Projeto') => setClassificacaoGerente(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Projeto">Projeto</SelectItem>
                <SelectItem value="Melhoria">Melhoria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="probabilidade">Probabilidade *</Label>
            <Select value={probabilidade} onValueChange={(value: any) => setProbabilidade(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<30%">&lt;30% (Baixa)</SelectItem>
                <SelectItem value="30-90%">30-90% (Média)</SelectItem>
                <SelectItem value=">90%">&gt;90% (Alta)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impacto">Impacto *</Label>
            <Select value={impacto} onValueChange={(value: any) => setImpacto(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixo">Baixo</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <Label>Índice de Risco Calculado</Label>
            <p className={`text-3xl font-bold ${getRiskColor()}`}>
              {indiceRisco.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {indiceRisco > 90 && 'Alto risco - Será encaminhado para o comitê automaticamente'}
              {indiceRisco >= 30 && indiceRisco <= 90 && 'Risco moderado - Requer ação mitigadora'}
              {indiceRisco < 30 && 'Baixo risco - Pode prosseguir normalmente'}
            </p>
          </div>

          {indiceRisco <= 90 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="resposta-risco">Resposta ao Risco</Label>
                <Select value={respostaRisco} onValueChange={(value: any) => setRespostaRisco(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aceitar">Aceitar Risco</SelectItem>
                    <SelectItem value="Mitigar">Mitigar Risco</SelectItem>
                    <SelectItem value="Evitar">Evitar Risco</SelectItem>
                    <SelectItem value="Terceirizar">Terceirizar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="acoes-mitigadoras">Ações Mitigadoras</Label>
                <Textarea
                  id="acoes-mitigadoras"
                  value={acoesMitigadoras}
                  onChange={(e) => setAcoesMitigadoras(e.target.value)}
                  placeholder="Descreva as ações preventivas ou mitigadoras..."
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : existingAssessment ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
