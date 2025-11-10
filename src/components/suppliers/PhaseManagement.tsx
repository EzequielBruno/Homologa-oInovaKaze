import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface Phase {
  id?: string;
  ordem: number;
  etapa_atividade: string;
  responsavel_recurso: string;
  tipo_cobranca: 'por_hora' | 'valor_etapa';
  horas_estimadas: number | null;
  valor_por_hora: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  valor_etapa: number;
  status: 'Planejada' | 'Em Andamento' | 'Concluída' | 'Em avaliação';
  percentual_conclusao: number;
  observacoes: string | null;
  check_conclusao: boolean;
}

interface PhaseManagementProps {
  phases: Phase[];
  onChange: (phases: Phase[]) => void;
  disabled?: boolean;
  horasTotaisEstimadas?: number;
  modalidade?: string;
  valorPorHora?: number;
}

const STATUS_OPTIONS = [
  { value: 'Em avaliação', label: 'Em avaliação', color: 'bg-blue-500' },
  { value: 'Planejada', label: 'Planejada', color: 'bg-gray-500' },
  { value: 'Em Andamento', label: 'Em Andamento', color: 'bg-yellow-500' },
  { value: 'Concluída', label: 'Concluída', color: 'bg-green-500' },
];

const STATUS_ICONS = {
  'Planejada': '⚪',
  'Em Andamento': '🟡',
  'Concluída': '🟢',
  'Em avaliação': '🔵',
};

export function PhaseManagement({ phases, onChange, disabled = false, horasTotaisEstimadas, modalidade, valorPorHora }: PhaseManagementProps) {
  const [localPhases, setLocalPhases] = useState<Phase[]>(phases);

  useEffect(() => {
    setLocalPhases(phases);
  }, [phases]);

  const handleAddPhase = () => {
    const newPhase: Phase = {
      ordem: localPhases.length + 1,
      etapa_atividade: "",
      responsavel_recurso: "-",
      tipo_cobranca: 'valor_etapa',
      horas_estimadas: horasTotaisEstimadas ? 0 : null,
      valor_por_hora: null,
      data_inicio: null,
      data_fim: null,
      valor_etapa: 0,
      status: 'Planejada',
      percentual_conclusao: 0,
      observacoes: null,
      check_conclusao: false,
    };
    const updated = [...localPhases, newPhase];
    setLocalPhases(updated);
    onChange(updated);
  };

  const handleRemovePhase = (index: number) => {
    const updated = localPhases.filter((_, i) => i !== index)
      .map((phase, i) => ({ ...phase, ordem: i + 1 }));
    setLocalPhases(updated);
    onChange(updated);
  };

  const handleUpdatePhase = (index: number, field: keyof Phase, value: any) => {
    const updated = [...localPhases];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-update check_conclusao when status changes to Concluída
    if (field === 'status' && value === 'Concluída') {
      updated[index].check_conclusao = true;
      updated[index].percentual_conclusao = 100;
    }
    
    // Auto-calculate valor_etapa for hora_tecnica modalidade
    if (modalidade === 'hora_tecnica' && field === 'horas_estimadas' && valorPorHora) {
      updated[index].valor_etapa = (value || 0) * valorPorHora;
    }
    
    setLocalPhases(updated);
    onChange(updated);
  };

  const calculateTotals = () => {
    const totalValor = localPhases.reduce((sum, p) => sum + (p.valor_etapa || 0), 0);
    const totalHoras = localPhases.reduce((sum, p) => sum + (p.horas_estimadas || 0), 0);
    const totalConcluidas = localPhases.filter(p => p.check_conclusao).length;
    const percentualGeral = localPhases.length > 0 ? (totalConcluidas / localPhases.length) * 100 : 0;
    
    // Validação de horas totais
    let diferencaHoras = 0;
    if (horasTotaisEstimadas !== undefined && horasTotaisEstimadas > 0) {
      diferencaHoras = horasTotaisEstimadas - totalHoras;
    }
    
    return { totalValor, totalHoras, totalConcluidas, percentualGeral, diferencaHoras };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Faseamento com Checklist de Acompanhamento</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as etapas da condição de pagamento
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddPhase}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Etapa
        </Button>
      </div>

      {/* Resumo e Progresso */}
      {localPhases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo do Faseamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {horasTotaisEstimadas !== undefined && horasTotaisEstimadas > 0 && totals.diferencaHoras !== 0 && (
              <Alert variant={totals.diferencaHoras > 0 ? "default" : "destructive"} className="mb-4">
                <AlertDescription>
                  {totals.diferencaHoras > 0 ? (
                    <>
                      <strong>⚠️ Falta alocar {totals.diferencaHoras.toFixed(1)} horas</strong> para atingir o total estimado de {horasTotaisEstimadas}h
                    </>
                  ) : (
                    <>
                      <strong>⚠️ Há {Math.abs(totals.diferencaHoras).toFixed(1)} horas excedentes</strong> em relação ao total estimado de {horasTotaisEstimadas}h
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Valor Total</p>
                <p className="font-semibold text-lg">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.totalValor)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Horas Totais</p>
                <p className="font-semibold text-lg">
                  {totals.totalHoras}h
                  {horasTotaisEstimadas !== undefined && horasTotaisEstimadas > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">/ {horasTotaisEstimadas}h</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Etapas Concluídas</p>
                <p className="font-semibold text-lg">{totals.totalConcluidas}/{localPhases.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Progresso Geral</p>
                <p className="font-semibold text-lg">{totals.percentualGeral.toFixed(0)}%</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Progresso Visual</Label>
              <Progress value={totals.percentualGeral} className="mt-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Fases */}
      <div className="space-y-4">
        {localPhases.map((phase, index) => (
          <Card key={index} className="border-l-4" style={{ borderLeftColor: STATUS_OPTIONS.find(s => s.value === phase.status)?.color }}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Header da Fase */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <Badge variant="outline">Etapa {phase.ordem}</Badge>
                    <span className="text-2xl">{STATUS_ICONS[phase.status]}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePhase(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Campos da Fase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Etapa/Atividade */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`etapa-${index}`}>
                      Etapa / Atividade <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`etapa-${index}`}
                      value={phase.etapa_atividade}
                      onChange={(e) => handleUpdatePhase(index, 'etapa_atividade', e.target.value)}
                      placeholder="Descreva a etapa ou atividade"
                      disabled={disabled}
                      required
                    />
                  </div>

                  {/* Horas Estimadas (sempre visível) */}
                  <div>
                    <Label htmlFor={`horas-${index}`}>
                      Horas Estimadas {horasTotaisEstimadas !== undefined && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id={`horas-${index}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={phase.horas_estimadas || ''}
                      onChange={(e) => handleUpdatePhase(index, 'horas_estimadas', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0"
                      disabled={disabled}
                    />
                  </div>

                  {/* Valor da Etapa / Valor Total */}
                  <div>
                    <Label htmlFor={`valor-${index}`}>
                      {modalidade === 'hora_tecnica' ? 'Valor Total' : 'Valor da Etapa'} <span className="text-destructive">*</span>
                    </Label>
                    {modalidade === 'hora_tecnica' ? (
                      <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted">
                        <span className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(phase.valor_etapa || 0)}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({phase.horas_estimadas || 0}h × {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPorHora || 0)})
                        </span>
                      </div>
                    ) : (
                      <CurrencyInput
                        id={`valor-${index}`}
                        placeholder="0,00"
                        value={phase.valor_etapa || ''}
                        onChange={(val) => handleUpdatePhase(index, 'valor_etapa', parseFloat(val) || 0)}
                        disabled={disabled}
                        required
                      />
                    )}
                  </div>

                  {/* Data Início */}
                  <div>
                    <Label htmlFor={`data-inicio-${index}`}>Data Início</Label>
                    <Input
                      id={`data-inicio-${index}`}
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={phase.data_inicio || ''}
                      onChange={(e) => handleUpdatePhase(index, 'data_inicio', e.target.value || null)}
                      disabled={disabled}
                    />
                  </div>

                  {/* Data Fim */}
                  <div>
                    <Label htmlFor={`data-fim-${index}`}>Data Fim</Label>
                    <Input
                      id={`data-fim-${index}`}
                      type="date"
                      value={phase.data_fim || ''}
                      onChange={(e) => handleUpdatePhase(index, 'data_fim', e.target.value || null)}
                      disabled={disabled}
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`status-${index}`}>
                      Status <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={phase.status}
                      onValueChange={(value) => handleUpdatePhase(index, 'status', value)}
                      disabled={disabled}
                    >
                      <SelectTrigger id={`status-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {STATUS_ICONS[option.value as keyof typeof STATUS_ICONS]} {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Observações */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`obs-${index}`}>Observações / Entregáveis</Label>
                    <Textarea
                      id={`obs-${index}`}
                      value={phase.observacoes || ''}
                      onChange={(e) => handleUpdatePhase(index, 'observacoes', e.target.value || null)}
                      placeholder="Descreva os entregáveis ou adicione links de comprovação"
                      disabled={disabled}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {localPhases.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Nenhuma etapa adicionada ainda.</p>
            <p className="text-sm">Clique em "Adicionar Etapa" para começar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
