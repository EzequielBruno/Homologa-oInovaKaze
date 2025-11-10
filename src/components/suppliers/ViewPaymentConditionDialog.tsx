import { useEffect, useState } from 'react';
import { Loader2, FileText, Calendar, DollarSign, Building2, Package } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface ViewPaymentConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conditionId: string;
}

interface PaymentCondition {
  id: string;
  tipo_pagamento: string | null;
  grupo_condicao: string | null;
  modalidade: string | null;
  descricao_modalidade: string | null;
  tipo_cadastro: string | null;
  numero_chamado: string | null;
  numero_orcamento: string | null;
  link_chamado: string | null;
  documentos_anexados: string[] | null;
  empresa: string;
  demand_id: string | null;
  valor_hora: number | null;
  data_conclusao: string | null;
  data_pagamento_prevista: string | null;
  observacoes: string | null;
  status: string;
  faseamento_ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  demands?: {
    codigo: string;
    descricao: string;
  } | null;
  creator?: {
    full_name: string;
  } | null;
  updater?: {
    full_name: string;
  } | null;
}

interface Phase {
  id: string;
  ordem: number;
  etapa_atividade: string;
  responsavel_recurso: string;
  tipo_cobranca: 'por_hora' | 'valor_etapa';
  horas_estimadas: number | null;
  valor_por_hora: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  valor_etapa: number;
  status: 'Planejada' | 'Em Andamento' | 'Concluída' | 'Validada';
  percentual_conclusao: number;
  observacoes: string | null;
  check_conclusao: boolean;
}

const STATUS_ICONS = {
  'Planejada': '⚪',
  'Em Andamento': '🟡',
  'Concluída': '🟢',
  'Validada': '🔵',
};

const GRUPO_LABELS: Record<string, string> = {
  'desenvolvimento_suporte': 'Serviços de Desenvolvimento e Suporte',
  'infraestrutura_hardware': 'Infraestrutura e Hardware',
  'cloud_licenciamento': 'Cloud, Licenciamento e Capacidade',
  'contratos_especiais': 'Contratos Especiais e Mistos',
};

const MODALIDADE_LABELS: Record<string, string> = {
  'hora_tecnica': 'Por Hora Técnica',
  'pacote_horas': 'Por Pacote de Horas',
  'etapa_milestone': 'Por Etapa (Milestone)',
  'mensalidade_fixa': 'Mensalidade Fixa (Retainer)',
  'alocacao_recursos': 'Por Alocação de Recursos',
  'entrega_equipamentos': 'Por Entrega de Equipamentos',
  'instalacao_implantacao': 'Por Instalação/Implantação',
  'retencao_garantia': 'Com Retenção de Garantia',
  'cronograma_fisico': 'Por Cronograma Físico-Financeiro',
  'uso_consumo': 'Por Uso (Cloud / Licenciamento)',
  'capacidade_dedicada': 'Por Capacidade ou Servidor Dedicado',
  'licenciamento_periodico': 'Por Licenciamento Periódico',
  'minimo_garantido': 'Por Mínimo Garantido + Uso Variável',
  'hibrido': 'Contrato Híbrido (Software + Hardware)',
  'chave_na_mao': 'Projeto Chave na Mão (Turn-Key)',
  'manutencao_evolutiva': 'Manutenção Evolutiva + Infraestrutura',
};

const EMPRESA_LABELS: Record<string, string> = {
  'ZC': 'Zema Consórcio',
  'Eletro': 'Eletrozema',
  'ZF': 'Zema Financeira',
  'ZS': 'Zema Seguros',
};

export const ViewPaymentConditionDialog = ({
  open,
  onOpenChange,
  conditionId,
}: ViewPaymentConditionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [condition, setCondition] = useState<PaymentCondition | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);

  useEffect(() => {
    if (open && conditionId) {
      fetchConditionData();
    }
  }, [open, conditionId]);

  const fetchConditionData = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('payment_conditions')
        .select(`
          *,
          demands:demand_id (
            codigo,
            descricao
          )
        `)
        .eq('id', conditionId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        console.log('Payment condition data:', {
          created_by: data.created_by,
          updated_by: data.updated_by
        });

        // Buscar informações dos usuários
        const userIds = [data.created_by, data.updated_by].filter(Boolean);
        
        if (userIds.length > 0) {
          console.log('Fetching profiles for user IDs:', userIds);
          
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          console.log('Profiles fetched:', profiles, 'Error:', profileError);

          if (profiles && profiles.length > 0) {
            const profilesMap = new Map(profiles.map(p => [p.id, p]));
            
            setCondition({
              ...data,
              creator: data.created_by ? profilesMap.get(data.created_by) || null : null,
              updater: data.updated_by ? profilesMap.get(data.updated_by) || null : null,
            } as any);
          } else {
            setCondition(data as any);
          }
        } else {
          console.log('No user IDs found in payment condition');
          setCondition(data as any);
        }

        // Buscar fases se faseamento estiver ativo
        if (data.faseamento_ativo) {
          const { data: phasesData, error: phasesError } = await supabase
            .from('payment_condition_phases')
            .select('*')
            .eq('payment_condition_id', conditionId)
            .order('ordem', { ascending: true });

          if (!phasesError && phasesData) {
            setPhases(phasesData as Phase[]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados da condição.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const formatValue = (value: number | null) => {
    if (!value) return '-';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | React.ReactNode }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes da Condição de Pagamento</DialogTitle>
          <DialogDescription>
            Visualize todas as informações da condição de pagamento.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : condition ? (
          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Status e Tipo */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={
                    condition.status === 'ativo'
                      ? 'default'
                      : condition.status === 'concluido'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {condition.status === 'ativo'
                    ? 'Ativo'
                    : condition.status === 'concluido'
                    ? 'Concluído'
                    : 'Inativo'}
                </Badge>
                {condition.tipo_cadastro && (
                  <Badge variant="outline">
                    {condition.tipo_cadastro === 'manual' ? 'Cadastro Manual' : 'Cadastro Guiado'}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Modalidade/Grupo */}
              <div className="space-y-4">
                <h3 className="font-semibold">Modalidade</h3>
                {condition.grupo_condicao && (
                  <InfoRow
                    icon={Package}
                    label="Grupo"
                    value={GRUPO_LABELS[condition.grupo_condicao] || condition.grupo_condicao}
                  />
                )}
                {condition.modalidade && (
                  <InfoRow
                    icon={FileText}
                    label="Tipo"
                    value={MODALIDADE_LABELS[condition.modalidade] || condition.modalidade}
                  />
                )}
                {condition.descricao_modalidade && (
                  <InfoRow
                    icon={FileText}
                    label="Descrição"
                    value={condition.descricao_modalidade}
                  />
                )}
              </div>

              <Separator />

              {/* Empresa e Projeto */}
              <div className="space-y-4">
                <h3 className="font-semibold">Empresa e Projeto</h3>
                <InfoRow
                  icon={Building2}
                  label="Empresa"
                  value={EMPRESA_LABELS[condition.empresa] || condition.empresa}
                />
                {condition.demands && (
                  <InfoRow
                    icon={FileText}
                    label="Projeto Vinculado"
                    value={
                      <div className="space-y-1">
                        <p className="font-medium">{condition.demands.codigo}</p>
                        <p className="text-xs text-muted-foreground">{condition.demands.descricao}</p>
                      </div>
                    }
                  />
                )}
              </div>

              <Separator />

              {/* Informações Financeiras */}
              <div className="space-y-4">
                <h3 className="font-semibold">Informações Financeiras</h3>
                <InfoRow
                  icon={DollarSign}
                  label="Valor"
                  value={<span className="font-mono text-base">{formatValue(condition.valor_hora)}</span>}
                />
                {condition.data_conclusao && (
                  <InfoRow
                    icon={Calendar}
                    label="Data de Conclusão/Entrega"
                    value={formatDate(condition.data_conclusao)}
                  />
                )}
                {condition.data_pagamento_prevista && (
                  <InfoRow
                    icon={Calendar}
                    label="Data de Pagamento Prevista"
                    value={formatDate(condition.data_pagamento_prevista)}
                  />
                )}
              </div>

              <Separator />

              {/* Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="font-semibold">Informações Adicionais</h3>
                {condition.numero_chamado && (
                  <InfoRow
                    icon={FileText}
                    label="Número do Chamado"
                    value={condition.numero_chamado}
                  />
                )}
                {condition.numero_orcamento && (
                  <InfoRow
                    icon={FileText}
                    label="Número do Orçamento"
                    value={condition.numero_orcamento}
                  />
                )}
                {condition.link_chamado && (
                  <InfoRow
                    icon={FileText}
                    label="Link do Chamado"
                    value={
                      <a
                        href={condition.link_chamado}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {condition.link_chamado}
                      </a>
                    }
                  />
                )}
                {condition.documentos_anexados && condition.documentos_anexados.length > 0 && (
                  <InfoRow
                    icon={FileText}
                    label="Documentos Anexados"
                    value={
                      <div className="space-y-1">
                        {condition.documentos_anexados.map((doc, index) => (
                          <a
                            key={index}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-primary hover:underline text-xs break-all"
                          >
                            Documento {index + 1}
                          </a>
                        ))}
                      </div>
                    }
                  />
                )}
                {condition.observacoes && (
                  <InfoRow
                    icon={FileText}
                    label="Observações"
                    value={<p className="whitespace-pre-wrap">{condition.observacoes}</p>}
                  />
                )}
              </div>

              {/* Faseamento com Checklist */}
              {condition.faseamento_ativo && phases.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Faseamento com Checklist de Acompanhamento
                    </h3>

                    {/* Resumo */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Resumo do Faseamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Valor Total</p>
                            <p className="font-semibold text-lg">
                              {formatValue(phases.reduce((sum, p) => sum + (p.valor_etapa || 0), 0))}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Horas Totais</p>
                            <p className="font-semibold text-lg">
                              {phases.reduce((sum, p) => sum + (p.horas_estimadas || 0), 0)}h
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Etapas Concluídas</p>
                            <p className="font-semibold text-lg">
                              {phases.filter(p => p.check_conclusao).length}/{phases.length}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Progresso Geral</p>
                            <p className="font-semibold text-lg">
                              {((phases.filter(p => p.check_conclusao).length / phases.length) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Progresso Visual</p>
                          <Progress 
                            value={(phases.filter(p => p.check_conclusao).length / phases.length) * 100} 
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Lista de Etapas */}
                    <div className="space-y-3">
                      {phases.map((phase, index) => (
                        <Card key={phase.id} className="border-l-4" style={{ 
                          borderLeftColor: 
                            phase.status === 'Validada' ? 'rgb(59 130 246)' : // blue
                            phase.status === 'Concluída' ? 'rgb(34 197 94)' : // green
                            phase.status === 'Em Andamento' ? 'rgb(234 179 8)' : // yellow
                            'rgb(107 114 128)' // gray
                        }}>
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">Etapa {phase.ordem}</Badge>
                                  <span className="text-2xl">{STATUS_ICONS[phase.status]}</span>
                                  <Badge variant="secondary">{phase.status}</Badge>
                                  {phase.check_conclusao && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                              </div>

                              {/* Conteúdo */}
                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Etapa/Atividade</p>
                                  <p className="font-semibold">{phase.etapa_atividade}</p>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Tipo de Cobrança</p>
                                  <Badge variant="outline">
                                    {phase.tipo_cobranca === 'por_hora' ? 'Por Hora' : 'Por Valor da Etapa'}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {phase.tipo_cobranca === 'por_hora' ? (
                                    <>
                                      {phase.horas_estimadas && (
                                        <div>
                                          <p className="text-muted-foreground">Horas Estimadas</p>
                                          <p className="font-medium">{phase.horas_estimadas}h</p>
                                        </div>
                                      )}
                                      {phase.valor_por_hora && (
                                        <div>
                                          <p className="text-muted-foreground">Valor por Hora</p>
                                          <p className="font-medium">{formatValue(phase.valor_por_hora)}</p>
                                        </div>
                                      )}
                                      <div className="col-span-2">
                                        <p className="text-muted-foreground">Valor Total (Calculado)</p>
                                        <p className="font-semibold text-lg">{formatValue(phase.valor_etapa)}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {phase.horas_estimadas}h × {formatValue(phase.valor_por_hora || 0)}
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="col-span-2">
                                      <p className="text-muted-foreground">Valor da Etapa</p>
                                      <p className="font-semibold text-lg">{formatValue(phase.valor_etapa)}</p>
                                    </div>
                                  )}
                                  {phase.data_inicio && (
                                    <div>
                                      <p className="text-muted-foreground">Data Início</p>
                                      <p>{formatDate(phase.data_inicio)}</p>
                                    </div>
                                  )}
                                  {phase.data_fim && (
                                    <div>
                                      <p className="text-muted-foreground">Data Fim</p>
                                      <p>{formatDate(phase.data_fim)}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-muted-foreground">% Conclusão</p>
                                    <p>{phase.percentual_conclusao}%</p>
                                  </div>
                                </div>

                                {phase.observacoes && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Observações/Entregáveis</p>
                                    <p className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                                      {phase.observacoes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Datas de Registro */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Cadastrado em: {formatDate(condition.created_at)}
                  {condition.creator?.full_name && (
                    <span className="ml-1">
                      por <span className="font-medium text-foreground">{condition.creator.full_name}</span>
                    </span>
                  )}
                </p>
                <p>
                  Atualizado em: {formatDate(condition.updated_at)}
                  {condition.updater?.full_name && (
                    <span className="ml-1">
                      por <span className="font-medium text-foreground">{condition.updater.full_name}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
