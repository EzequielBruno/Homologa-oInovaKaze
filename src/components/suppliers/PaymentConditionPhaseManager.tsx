import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Phase {
  id?: string;
  ordem: number;
  etapa_atividade: string;
  responsavel_recurso: string;
  horas_estimadas?: number;
  data_inicio?: string;
  data_fim?: string;
  valor_etapa: number;
  status: 'Planejada' | 'Em Andamento' | 'Concluída' | 'Validada';
  percentual_conclusao: number;
  observacoes?: string;
  check_conclusao: boolean;
}

interface PaymentConditionPhaseManagerProps {
  paymentConditionId?: string;
  onTotalsChange: (totalValue: number, totalHours: number) => void;
  readOnly?: boolean;
}

export const PaymentConditionPhaseManager = ({
  paymentConditionId,
  onTotalsChange,
  readOnly = false
}: PaymentConditionPhaseManagerProps) => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paymentConditionId) {
      fetchPhases();
    }
  }, [paymentConditionId]);

  useEffect(() => {
    calculateTotals();
  }, [phases]);

  const fetchPhases = async () => {
    if (!paymentConditionId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_condition_phases')
        .select('*')
        .eq('payment_condition_id', paymentConditionId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setPhases((data || []) as Phase[]);
    } catch (error: any) {
      toast.error('Erro ao carregar fases: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalValue = phases.reduce((sum, phase) => sum + (phase.valor_etapa || 0), 0);
    const totalHours = phases.reduce((sum, phase) => sum + (phase.horas_estimadas || 0), 0);
    onTotalsChange(totalValue, totalHours);
  };

  const addPhase = () => {
    const newPhase: Phase = {
      ordem: phases.length + 1,
      etapa_atividade: '',
      responsavel_recurso: '',
      valor_etapa: 0,
      status: 'Planejada',
      percentual_conclusao: 0,
      check_conclusao: false
    };
    setPhases([...phases, newPhase]);
  };

  const updatePhase = (index: number, field: keyof Phase, value: any) => {
    const updatedPhases = [...phases];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };

    // Auto-atualizar percentual quando marcar como concluída
    if (field === 'check_conclusao' && value === true) {
      updatedPhases[index].percentual_conclusao = 100;
      updatedPhases[index].status = 'Concluída';
    }

    setPhases(updatedPhases);
  };

  const removePhase = (index: number) => {
    const updatedPhases = phases.filter((_, i) => i !== index);
    // Reordenar
    updatedPhases.forEach((phase, i) => {
      phase.ordem = i + 1;
    });
    setPhases(updatedPhases);
  };

  const savePhases = async () => {
    if (!paymentConditionId) {
      toast.error('ID da condição de pagamento não encontrado');
      return;
    }

    setLoading(true);
    try {
      // Obter usuário atual
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      // Deletar fases existentes
      await supabase
        .from('payment_condition_phases')
        .delete()
        .eq('payment_condition_id', paymentConditionId);

      // Inserir novas fases
      const phasesToInsert = phases.map(phase => ({
        ...phase,
        payment_condition_id: paymentConditionId,
        created_by: currentUserId
      }));

      const { error } = await supabase
        .from('payment_condition_phases')
        .insert(phasesToInsert);

      if (error) throw error;

      toast.success('Fases salvas com sucesso!');
      await fetchPhases();
    } catch (error: any) {
      toast.error('Erro ao salvar fases: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planejada':
        return 'text-muted-foreground';
      case 'Em Andamento':
        return 'text-yellow-600';
      case 'Concluída':
        return 'text-green-600';
      case 'Validada':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Em Andamento':
        return '🟡';
      case 'Concluída':
        return '🟢';
      case 'Validada':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const totalValue = phases.reduce((sum, phase) => sum + (phase.valor_etapa || 0), 0);
  const totalHours = phases.reduce((sum, phase) => sum + (phase.horas_estimadas || 0), 0);
  const completedPhases = phases.filter(p => p.status === 'Validada' || p.status === 'Concluída').length;
  const progressPercentage = phases.length > 0 ? (completedPhases / phases.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Faseamento com Checklist de Acompanhamento</span>
          {!readOnly && (
            <Button onClick={addPhase} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Etapa
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma etapa cadastrada. Clique em "Adicionar Etapa" para começar.
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Etapa {phase.ordem}</span>
                      <span className={getStatusColor(phase.status)}>
                        {getStatusIcon(phase.status)} {phase.status}
                      </span>
                    </div>
                    {!readOnly && (
                      <Button
                        onClick={() => removePhase(index)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Etapa / Atividade *</Label>
                      <Input
                        value={phase.etapa_atividade}
                        onChange={(e) => updatePhase(index, 'etapa_atividade', e.target.value)}
                        placeholder="Ex: Levantamento de Requisitos"
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Responsável / Recurso *</Label>
                      <Input
                        value={phase.responsavel_recurso}
                        onChange={(e) => updatePhase(index, 'responsavel_recurso', e.target.value)}
                        placeholder="Ex: João Silva"
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horas Estimadas</Label>
                      <Input
                        type="number"
                        value={phase.horas_estimadas || ''}
                        onChange={(e) => updatePhase(index, 'horas_estimadas', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor da Etapa *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={phase.valor_etapa}
                        onChange={(e) => updatePhase(index, 'valor_etapa', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input
                        type="date"
                        value={phase.data_inicio || ''}
                        onChange={(e) => updatePhase(index, 'data_inicio', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input
                        type="date"
                        value={phase.data_fim || ''}
                        onChange={(e) => updatePhase(index, 'data_fim', e.target.value)}
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={phase.status}
                        onValueChange={(value) => updatePhase(index, 'status', value)}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planejada">⚪ Planejada</SelectItem>
                          <SelectItem value="Em Andamento">🟡 Em Andamento</SelectItem>
                          <SelectItem value="Concluída">🟢 Concluída</SelectItem>
                          <SelectItem value="Validada">🔵 Validada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>% Conclusão</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={phase.percentual_conclusao}
                        onChange={(e) => updatePhase(index, 'percentual_conclusao', parseInt(e.target.value) || 0)}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações / Entregáveis</Label>
                    <Textarea
                      value={phase.observacoes || ''}
                      onChange={(e) => updatePhase(index, 'observacoes', e.target.value)}
                      placeholder="Descrição, links de comprovação, etc."
                      disabled={readOnly}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`check-${index}`}
                      checked={phase.check_conclusao}
                      onCheckedChange={(checked) => updatePhase(index, 'check_conclusao', checked)}
                      disabled={readOnly}
                    />
                    <Label htmlFor={`check-${index}`} className="cursor-pointer">
                      Marcar etapa como concluída
                    </Label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col space-y-4">
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso Total</span>
            <span>{completedPhases} / {phases.length} etapas concluídas</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        <div className="w-full p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total da Condição:</span>
            <span className="text-lg font-bold">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {totalHours > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Horas Estimadas:</span>
              <span className="font-medium">{totalHours}h</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Percentual Concluído:</span>
            <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
          </div>
        </div>
        {!readOnly && paymentConditionId && (
          <Button onClick={savePhases} disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar Fases'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
