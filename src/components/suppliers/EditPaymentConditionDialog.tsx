import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronsUpDown, Loader2, AlertTriangle, FileText } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmpresas } from '@/hooks/useEmpresas';
import { FileUploadPayment } from './FileUploadPayment';
import { PhaseManagement, Phase } from './PhaseManagement';
import { Checkbox } from '@/components/ui/checkbox';

// Modalidades que REQUEREM Data de Entrega e Data de Pagamento
const MODALIDADES_COM_DATAS_OBRIGATORIAS = [
  'pacote_horas',
  'etapa_milestone',
  'entrega_equipamentos',
  'instalacao_implantacao',
  'retencao_garantia',
  'cronograma_fisico',
  'hibrido',
  'chave_na_mao',
];

// Estrutura de Grupos e Modalidades
const GRUPOS_MODALIDADES = {
  'desenvolvimento_suporte': {
    nome: 'Serviços de Desenvolvimento e Suporte',
    modalidades: {
      'hora_tecnica': {
        nome: 'Por Hora Técnica',
        descricao: 'Cobrança conforme horas efetivamente trabalhadas. Ideal para demandas pontuais e com escopo variável.',
      },
      'pacote_horas': {
        nome: 'Por Pacote de Horas',
        descricao: 'Compra antecipada de um volume fixo de horas. Proporciona desconto e previsibilidade de custos.',
      },
      'etapa_milestone': {
        nome: 'Por Etapa (Milestone)',
        descricao: 'Pagamento condicionado à entrega e aceite de fases específicas do projeto.',
      },
      'mensalidade_fixa': {
        nome: 'Mensalidade Fixa (Retainer)',
        descricao: 'Valor fixo mensal para suporte contínuo e disponibilidade garantida da equipe.',
      },
      'alocacao_recursos': {
        nome: 'Por Alocação de Recursos',
        descricao: 'Pagamento por profissionais dedicados ao projeto (mensal ou por período definido).',
      },
    },
  },
  'infraestrutura_hardware': {
    nome: 'Infraestrutura e Hardware',
    modalidades: {
      'entrega_equipamentos': {
        nome: 'Por Entrega de Equipamentos',
        descricao: 'Pagamento após entrega física e aceite dos equipamentos adquiridos.',
      },
      'instalacao_implantacao': {
        nome: 'Por Instalação/Implantação',
        descricao: 'Pagamento conforme execução de instalação técnica e configuração de infraestrutura.',
      },
      'retencao_garantia': {
        nome: 'Com Retenção de Garantia',
        descricao: 'Percentual do valor retido até o término do prazo de garantia contratual.',
      },
      'cronograma_fisico': {
        nome: 'Por Cronograma Físico-Financeiro',
        descricao: 'Pagamento conforme avanço físico das etapas de implantação.',
      },
    },
  },
  'cloud_licenciamento': {
    nome: 'Cloud, Licenciamento e Capacidade',
    modalidades: {
      'uso_consumo': {
        nome: 'Por Uso (Cloud / Licenciamento)',
        descricao: 'Cobrança baseada no consumo real de recursos (CPU, GB, licenças, etc.).',
      },
      'capacidade_dedicada': {
        nome: 'Por Capacidade ou Servidor Dedicado',
        descricao: 'Valor fixo por recursos contratados e disponibilizados exclusivamente.',
      },
      'licenciamento_periodico': {
        nome: 'Por Licenciamento Periódico',
        descricao: 'Pagamento recorrente mensal ou anual por licenças de software.',
      },
      'minimo_garantido': {
        nome: 'Por Mínimo Garantido + Uso Variável',
        descricao: 'Valor fixo mínimo mensal mais adicional conforme uso excedente.',
      },
    },
  },
  'contratos_especiais': {
    nome: 'Contratos Especiais e Mistos',
    modalidades: {
      'hibrido': {
        nome: 'Contrato Híbrido (Software + Hardware)',
        descricao: 'Combinação de serviços de desenvolvimento e entrega física de equipamentos.',
      },
      'chave_na_mao': {
        nome: 'Projeto Chave na Mão (Turn-Key)',
        descricao: 'Pagamento pela entrega total do projeto após homologação final.',
      },
      'manutencao_evolutiva': {
        nome: 'Manutenção Evolutiva + Infraestrutura',
        descricao: 'Pagamento mensal cobrindo manutenção de software e suporte de infraestrutura.',
      },
    },
  },
};

const ALLOWED_STATUSES = ['Backlog', 'StandBy', 'Aguardando Insumos'];

// Schema para modo guiado (padrão) - com validação condicional
const editPaymentGuidedSchema = z.object({
  empresa: z.string().min(1, 'Empresa é obrigatória'),
  demandId: z.string().optional(),
  grupoCondicao: z.string().min(1, 'Selecione um grupo'),
  modalidade: z.string().min(1, 'Selecione uma modalidade'),
  numeroChamado: z.string().optional(),
  numeroOrcamento: z.string().optional(),
  linkChamado: z.string().optional().refine(
    (val) => !val || val === '' || /^https?:\/\/.+/.test(val),
    { message: 'Link deve ser uma URL válida (começar com http:// ou https://)' }
  ),
  valorCondicao: z.string().min(1, 'Valor é obrigatório'),
  horasTotaisEstimadas: z.string().optional(),
  dataConclusao: z.string().optional(),
  dataPagamentoPrevista: z.string().optional(),
  observacoes: z.string().optional(),
});

// Schema para modo manual
const editPaymentManualSchema = z.object({
  empresa: z.string().min(1, 'Empresa é obrigatória'),
  demandId: z.string().optional(),
  descricaoCondicao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  numeroChamado: z.string().optional(),
  numeroOrcamento: z.string().optional(),
  linkChamado: z.string().optional().refine(
    (val) => !val || val === '' || /^https?:\/\/.+/.test(val),
    { message: 'Link deve ser uma URL válida (começar com http:// ou https://)' }
  ),
  valorCondicao: z.string().min(1, 'Valor é obrigatório'),
  dataConclusao: z.string().optional(),
  dataPagamentoPrevista: z.string().optional(),
  observacoes: z.string().optional(),
});

type GuidedFormValues = z.infer<typeof editPaymentGuidedSchema>;
type ManualFormValues = z.infer<typeof editPaymentManualSchema>;

interface EditPaymentConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conditionId: string;
  onSuccess: () => void;
}

interface DemandStatus {
  status: string;
  codigo: string;
}

export const EditPaymentConditionDialog = ({
  open,
  onOpenChange,
  conditionId,
  onSuccess,
}: EditPaymentConditionDialogProps) => {
  const { toast } = useToast();
  const { data: empresas } = useEmpresas();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [demandStatus, setDemandStatus] = useState<DemandStatus | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [modoAtual, setModoAtual] = useState<'guiado' | 'manual'>('guiado');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [demands, setDemands] = useState<Array<{ id: string; codigo: string; descricao: string }>>([]);
  const [demandSearch, setDemandSearch] = useState('');
  const [openDemandCombo, setOpenDemandCombo] = useState(false);
  const [faseamentoAtivo, setFaseamentoAtivo] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [deletedPhaseIds, setDeletedPhaseIds] = useState<string[]>([]);

  const formGuiado = useForm<GuidedFormValues>({
    resolver: zodResolver(editPaymentGuidedSchema),
    defaultValues: {
      empresa: 'ZC',
      demandId: 'none',
      grupoCondicao: '',
      modalidade: '',
      numeroChamado: '',
      numeroOrcamento: '',
      linkChamado: '',
      valorCondicao: '',
      horasTotaisEstimadas: '',
      dataConclusao: '',
      dataPagamentoPrevista: '',
      observacoes: '',
    },
  });

  const formManual = useForm<ManualFormValues>({
    resolver: zodResolver(editPaymentManualSchema),
    defaultValues: {
      empresa: 'ZC',
      demandId: 'none',
      descricaoCondicao: '',
      numeroChamado: '',
      numeroOrcamento: '',
      linkChamado: '',
      valorCondicao: '',
      dataConclusao: '',
      dataPagamentoPrevista: '',
      observacoes: '',
    },
  });

  const empresaSelecionadaGuiado = formGuiado.watch('empresa');
  const empresaSelecionadaManual = formManual.watch('empresa');
  const grupoSelecionado = formGuiado.watch('grupoCondicao');
  const modalidadeSelecionada = formGuiado.watch('modalidade');

  useEffect(() => {
    if (open && conditionId) {
      fetchConditionData();
    }
  }, [open, conditionId]);

  useEffect(() => {
    if (open) {
      const empresa = modoAtual === 'guiado' ? empresaSelecionadaGuiado : empresaSelecionadaManual;
      if (empresa) {
        fetchDemands(empresa);
      }
    }
  }, [open, empresaSelecionadaGuiado, empresaSelecionadaManual, modoAtual]);

  // Reseta modalidade quando grupo muda
  useEffect(() => {
    if (grupoSelecionado) {
      formGuiado.setValue('modalidade', '');
    }
  }, [grupoSelecionado]);

  const fetchDemands = async (empresa: string) => {
    if (!empresa) return;
    
    const { data } = await supabase
      .from('demands')
      .select('id, codigo, descricao, status')
      .eq('empresa', empresa as 'ZC' | 'Eletro' | 'ZF' | 'ZS')
      .in('status', ['Aguardando_Validacao_TI', 'StandBy', 'Backlog'])
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (data) {
      setDemands(data);
    }
  };

  const fetchConditionData = async () => {
    setFetchingData(true);
    
    try {
      const { data: condition, error } = await supabase
        .from('payment_conditions')
        .select(`
          *,
          demands:demand_id (
            codigo,
            status
          )
        `)
        .eq('id', conditionId)
        .single();

      if (error) throw error;

      if (condition) {
        // Determinar o modo baseado no tipo_cadastro
        const modo = condition.tipo_cadastro === 'manual' ? 'manual' : 'guiado';
        setModoAtual(modo);
        setUploadedFiles(condition.documentos_anexados || []);

        // Preencher o formulário guiado
        if (modo === 'guiado') {
          formGuiado.reset({
            empresa: condition.empresa || 'ZC',
            demandId: condition.demand_id || 'none',
            grupoCondicao: condition.grupo_condicao || '',
            modalidade: condition.modalidade || '',
            numeroChamado: condition.numero_chamado || '',
            numeroOrcamento: condition.numero_orcamento || '',
            linkChamado: condition.link_chamado || '',
            valorCondicao: condition.valor_hora?.toString() || '',
            dataConclusao: condition.data_conclusao || '',
            dataPagamentoPrevista: condition.data_pagamento_prevista || '',
            observacoes: condition.observacoes || '',
          });
        } else {
          // Preencher o formulário manual
          formManual.reset({
            empresa: condition.empresa || 'ZC',
            demandId: condition.demand_id || 'none',
            descricaoCondicao: condition.descricao_modalidade || '',
            numeroChamado: condition.numero_chamado || '',
            numeroOrcamento: condition.numero_orcamento || '',
            linkChamado: condition.link_chamado || '',
            valorCondicao: condition.valor_hora?.toString() || '',
            dataConclusao: condition.data_conclusao || '',
            dataPagamentoPrevista: condition.data_pagamento_prevista || '',
            observacoes: condition.observacoes || '',
          });
        }

        // Verificar status da demanda
        if (condition.demands) {
          const demand = condition.demands as any;
          setDemandStatus({
            status: demand.status,
            codigo: demand.codigo,
          });
          setCanEdit(ALLOWED_STATUSES.includes(demand.status));
        } else {
          // Se não tem demanda vinculada, permite editar
          setCanEdit(true);
        }

        // Buscar e definir faseamento
        setFaseamentoAtivo(condition.faseamento_ativo || false);

        // Buscar fases se faseamento estiver ativo
        if (condition.faseamento_ativo) {
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
      setFetchingData(false);
    }
  };

  const onSubmitGuiado = async (values: GuidedFormValues) => {
    if (!canEdit) {
      toast({
        title: 'Edição não permitida',
        description: 'Esta condição só pode ser editada quando a demanda estiver em Backlog, StandBy ou Aguardando Insumos.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const grupo = GRUPOS_MODALIDADES[values.grupoCondicao as keyof typeof GRUPOS_MODALIDADES];
      let descricaoModalidade = '';
      
      if (grupo && values.modalidade) {
        const modalidades = grupo.modalidades as Record<string, { nome: string; descricao: string }>;
        const modalidade = modalidades[values.modalidade];
        if (modalidade) {
          descricaoModalidade = modalidade.descricao;
        }
      }

      const updateData: any = {
        tipo_cadastro: 'padrao',
        empresa: values.empresa,
        demand_id: values.demandId && values.demandId !== 'none' ? values.demandId : null,
        grupo_condicao: values.grupoCondicao,
        modalidade: values.modalidade,
        descricao_modalidade: descricaoModalidade,
        numero_chamado: values.numeroChamado || null,
        numero_orcamento: values.numeroOrcamento || null,
        link_chamado: values.linkChamado || null,
        documentos_anexados: uploadedFiles.length > 0 ? uploadedFiles : null,
        valor_hora: parseFloat(values.valorCondicao),
        data_conclusao: values.dataConclusao || null,
        data_pagamento_prevista: values.dataPagamentoPrevista || null,
        observacoes: values.observacoes || null,
        faseamento_ativo: faseamentoAtivo,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('payment_conditions')
        .update(updateData)
        .eq('id', conditionId);

      if (error) throw error;

      // Gerenciar fases se faseamento estiver ativo
      if (faseamentoAtivo) {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Deletar fases removidas
        if (deletedPhaseIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('payment_condition_phases')
            .delete()
            .in('id', deletedPhaseIds);
          
          if (deleteError) throw deleteError;
        }

        // Atualizar ou inserir fases
        for (const phase of phases) {
          if (phase.id) {
            // Atualizar fase existente
              const { error: updatePhaseError } = await supabase
                .from('payment_condition_phases')
                .update({
                  ordem: phase.ordem,
                  etapa_atividade: phase.etapa_atividade,
                  responsavel_recurso: phase.responsavel_recurso,
                  tipo_cobranca: phase.tipo_cobranca,
                  horas_estimadas: phase.horas_estimadas,
                  valor_por_hora: phase.valor_por_hora,
                  data_inicio: phase.data_inicio,
                  data_fim: phase.data_fim,
                  valor_etapa: phase.valor_etapa,
                  status: phase.status,
                  percentual_conclusao: phase.percentual_conclusao,
                  observacoes: phase.observacoes,
                  check_conclusao: phase.check_conclusao,
                })
                .eq('id', phase.id);

            if (updatePhaseError) throw updatePhaseError;
          } else {
            // Inserir nova fase
              const { error: insertPhaseError } = await supabase
                .from('payment_condition_phases')
                .insert({
                  payment_condition_id: conditionId,
                  ordem: phase.ordem,
                  etapa_atividade: phase.etapa_atividade,
                  responsavel_recurso: phase.responsavel_recurso,
                  tipo_cobranca: phase.tipo_cobranca,
                  horas_estimadas: phase.horas_estimadas,
                  valor_por_hora: phase.valor_por_hora,
                  data_inicio: phase.data_inicio,
                  data_fim: phase.data_fim,
                  valor_etapa: phase.valor_etapa,
                  status: phase.status,
                  percentual_conclusao: phase.percentual_conclusao,
                  observacoes: phase.observacoes,
                  check_conclusao: phase.check_conclusao,
                  created_by: user?.id || null,
                });

            if (insertPhaseError) throw insertPhaseError;
          }
        }
      } else {
        // Se faseamento foi desativado, deletar todas as fases
        const { error: deleteAllError } = await supabase
          .from('payment_condition_phases')
          .delete()
          .eq('payment_condition_id', conditionId);
        
        if (deleteAllError) throw deleteAllError;
      }

      toast({
        title: 'Condição atualizada',
        description: 'A condição de pagamento foi atualizada com sucesso.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar condição:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a condição de pagamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitManual = async (values: ManualFormValues) => {
    if (!canEdit) {
      toast({
        title: 'Edição não permitida',
        description: 'Esta condição só pode ser editada quando a demanda estiver em Backlog, StandBy ou Aguardando Insumos.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        tipo_cadastro: 'manual',
        empresa: values.empresa,
        demand_id: values.demandId && values.demandId !== 'none' ? values.demandId : null,
        descricao_modalidade: values.descricaoCondicao,
        numero_chamado: values.numeroChamado || null,
        numero_orcamento: values.numeroOrcamento || null,
        link_chamado: values.linkChamado || null,
        documentos_anexados: uploadedFiles.length > 0 ? uploadedFiles : null,
        valor_hora: parseFloat(values.valorCondicao),
        data_conclusao: values.dataConclusao || null,
        data_pagamento_prevista: values.dataPagamentoPrevista || null,
        observacoes: values.observacoes || null,
        faseamento_ativo: faseamentoAtivo,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('payment_conditions')
        .update(updateData)
        .eq('id', conditionId);

      if (error) throw error;

      // Gerenciar fases se faseamento estiver ativo (mesma lógica do guiado)
      if (faseamentoAtivo) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (deletedPhaseIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('payment_condition_phases')
            .delete()
            .in('id', deletedPhaseIds);
          
          if (deleteError) throw deleteError;
        }

        for (const phase of phases) {
          if (phase.id) {
            const { error: updatePhaseError } = await supabase
              .from('payment_condition_phases')
              .update({
                ordem: phase.ordem,
                etapa_atividade: phase.etapa_atividade,
                responsavel_recurso: phase.responsavel_recurso,
                tipo_cobranca: phase.tipo_cobranca,
                horas_estimadas: phase.horas_estimadas,
                valor_por_hora: phase.valor_por_hora,
                data_inicio: phase.data_inicio,
                data_fim: phase.data_fim,
                valor_etapa: phase.valor_etapa,
                status: phase.status,
                percentual_conclusao: phase.percentual_conclusao,
                observacoes: phase.observacoes,
                check_conclusao: phase.check_conclusao,
              })
              .eq('id', phase.id);

            if (updatePhaseError) throw updatePhaseError;
          } else {
            const { error: insertPhaseError } = await supabase
              .from('payment_condition_phases')
              .insert({
                payment_condition_id: conditionId,
                ordem: phase.ordem,
                etapa_atividade: phase.etapa_atividade,
                responsavel_recurso: phase.responsavel_recurso,
                tipo_cobranca: phase.tipo_cobranca,
                horas_estimadas: phase.horas_estimadas,
                valor_por_hora: phase.valor_por_hora,
                data_inicio: phase.data_inicio,
                data_fim: phase.data_fim,
                valor_etapa: phase.valor_etapa,
                status: phase.status,
                percentual_conclusao: phase.percentual_conclusao,
                observacoes: phase.observacoes,
                check_conclusao: phase.check_conclusao,
                created_by: user?.id || null,
              });

            if (insertPhaseError) throw insertPhaseError;
          }
        }
      } else {
        const { error: deleteAllError } = await supabase
          .from('payment_condition_phases')
          .delete()
          .eq('payment_condition_id', conditionId);
        
        if (deleteAllError) throw deleteAllError;
      }

      toast({
        title: 'Condição atualizada',
        description: 'A condição de pagamento manual foi atualizada com sucesso.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar condição:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a condição de pagamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDemandField = (form: any) => (
    <FormField
      control={form.control}
      name="demandId"
      render={({ field }: any) => (
        <FormItem className="flex flex-col">
          <FormLabel>Projeto/Demanda (Opcional)</FormLabel>
          <Popover open={openDemandCombo} onOpenChange={setOpenDemandCombo}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "justify-between font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={!canEdit}
                >
                  {field.value && field.value !== 'none'
                    ? (() => {
                        const demand = demands.find((d) => d.id === field.value);
                        return demand ? `${demand.codigo} - ${demand.descricao}` : "Selecione um projeto";
                      })()
                    : "Nenhum projeto vinculado"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput 
                  placeholder="Digite para buscar..." 
                  value={demandSearch}
                  onValueChange={setDemandSearch}
                />
                <CommandList>
                  <CommandEmpty>Nenhuma demanda encontrada.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="none"
                      onSelect={() => {
                        form.setValue("demandId", "none");
                        setOpenDemandCombo(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          field.value === "none" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Nenhum projeto
                    </CommandItem>
                    {demands
                      .filter((demand) => {
                        const searchLower = demandSearch.toLowerCase();
                        return (
                          demand.codigo.toLowerCase().includes(searchLower) ||
                          demand.descricao.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((demand) => (
                        <CommandItem
                          key={demand.id}
                          value={`${demand.codigo} ${demand.descricao}`}
                          onSelect={() => {
                            form.setValue("demandId", demand.id);
                            setOpenDemandCombo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === demand.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{demand.codigo}</span>
                            <span className="text-sm text-muted-foreground line-clamp-1">
                              {demand.descricao}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar Condição de Pagamento</DialogTitle>
          <DialogDescription>
            Edite as informações da condição de pagamento. Escolha entre modo guiado ou manual.
          </DialogDescription>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {demandStatus && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Demanda:</span>
                  <Badge variant="outline">{demandStatus.codigo}</Badge>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={canEdit ? 'default' : 'secondary'}>
                    {demandStatus.status}
                  </Badge>
                </div>

                {!canEdit && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Esta condição só pode ser editada quando a demanda estiver com status de <strong>Backlog</strong>, <strong>StandBy</strong> ou <strong>Aguardando Insumos</strong>.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Tabs value={modoAtual} onValueChange={(v) => setModoAtual(v as 'guiado' | 'manual')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="guiado" disabled={!canEdit}>Modo Guiado</TabsTrigger>
                <TabsTrigger value="manual" disabled={!canEdit}>Modo Manual</TabsTrigger>
              </TabsList>

              {/* MODO GUIADO */}
              <TabsContent value="guiado">
                <div className="max-h-[55vh] overflow-y-auto pr-4">
                  <Form {...formGuiado}>
                    <form onSubmit={formGuiado.handleSubmit(onSubmitGuiado)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={formGuiado.control}
                          name="empresa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empresa *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a empresa" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {empresas?.map((empresa) => (
                                    <SelectItem key={empresa.id} value={empresa.codigo}>
                                      {empresa.nome_exibicao}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {renderDemandField(formGuiado)}

                        <FormField
                          control={formGuiado.control}
                          name="grupoCondicao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grupo de Condição *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o grupo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(GRUPOS_MODALIDADES).map(([key, grupo]) => (
                                    <SelectItem key={key} value={key}>
                                      {grupo.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {grupoSelecionado && (
                          <FormField
                            control={formGuiado.control}
                            name="modalidade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Modalidade de Pagamento *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a modalidade" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.entries(
                                      GRUPOS_MODALIDADES[grupoSelecionado as keyof typeof GRUPOS_MODALIDADES].modalidades
                                    ).map(([key, modalidade]) => (
                                      <SelectItem key={key} value={key}>
                                        {modalidade.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {modalidadeSelecionada && grupoSelecionado && (() => {
                          const grupo = GRUPOS_MODALIDADES[grupoSelecionado as keyof typeof GRUPOS_MODALIDADES];
                          if (!grupo) return null;
                          const modalidades = grupo.modalidades as Record<string, { nome: string; descricao: string }>;
                          const modalidade = modalidades[modalidadeSelecionada];
                          if (!modalidade) return null;
                          
                          const isRequired = MODALIDADES_COM_DATAS_OBRIGATORIAS.includes(modalidadeSelecionada);
                          
                          return (
                            <div className="space-y-3">
                              <Alert>
                                <FileText className="h-4 w-4" />
                                <AlertDescription>
                                  {modalidade.descricao}
                                </AlertDescription>
                              </Alert>
                            </div>
                          );
                        })()}

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={formGuiado.control}
                            name="numeroChamado"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nº Chamado</FormLabel>
                                <FormControl>
                                  <Input placeholder="" {...field} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formGuiado.control}
                            name="numeroOrcamento"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nº Orçamento</FormLabel>
                                <FormControl>
                                  <Input placeholder="" {...field} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={formGuiado.control}
                          name="linkChamado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Link do Chamado (Opcional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="url"
                                  placeholder="https://..." 
                                  {...field}
                                  disabled={!canEdit}
                                />
                              </FormControl>
                              <FormDescription>
                                Cole o link direto para o chamado no sistema de gestão
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Anexar Orçamento/Documentos</label>
                          <FileUploadPayment
                            onFilesChange={setUploadedFiles}
                            existingFiles={uploadedFiles}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={formGuiado.control}
                            name="valorCondicao"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {modalidadeSelecionada === 'hora_tecnica' ? 'Valor R$ Hora *' : 'Valor (R$) *'}
                                </FormLabel>
                                <FormControl>
                                  <CurrencyInput 
                                    placeholder="0,00" 
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {modalidadeSelecionada === 'hora_tecnica' && !faseamentoAtivo && (
                            <>
                              <FormField
                                control={formGuiado.control}
                                name="horasTotaisEstimadas"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Estimativa de Horas Totais</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.5" placeholder="0" {...field} disabled={!canEdit} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="md:col-span-2">
                                <Label>Valor Total Estimado</Label>
                                <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted">
                                  <span className="font-semibold text-lg">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                      (parseFloat(formGuiado.watch('valorCondicao') || '0') * parseFloat(formGuiado.watch('horasTotaisEstimadas') || '0'))
                                    )}
                                  </span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({formGuiado.watch('horasTotaisEstimadas') || '0'}h × {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formGuiado.watch('valorCondicao') || '0'))})
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          <FormField
                            control={formGuiado.control}
                            name="dataConclusao"
                            render={({ field }) => {
                              const isRequired = MODALIDADES_COM_DATAS_OBRIGATORIAS.includes(modalidadeSelecionada);
                              return (
                                <FormItem>
                                  <FormLabel>
                                    Data de Conclusão/Entrega (Opcional)
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} disabled={!canEdit} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField
                            control={formGuiado.control}
                            name="dataPagamentoPrevista"
                            render={({ field }) => {
                              const isRequired = MODALIDADES_COM_DATAS_OBRIGATORIAS.includes(modalidadeSelecionada);
                              return (
                                <FormItem>
                                  <FormLabel>
                                    Data de Pagamento Prevista (Opcional)
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} disabled={!canEdit} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>

                        <FormField
                          control={formGuiado.control}
                          name="observacoes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Informações adicionais..." {...field} disabled={!canEdit} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Faseamento com Checklist */}
                        <div className="space-y-4 border-t pt-6 mt-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="faseamento-guiado-edit"
                              checked={faseamentoAtivo}
                              onCheckedChange={(checked) => setFaseamentoAtivo(checked as boolean)}
                              disabled={!canEdit}
                            />
                            <label
                              htmlFor="faseamento-guiado-edit"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Ativar Faseamento com Checklist de Acompanhamento
                            </label>
                          </div>
                          {faseamentoAtivo && (
                            <PhaseManagement
                              phases={phases}
                              onChange={setPhases}
                              disabled={!canEdit}
                              horasTotaisEstimadas={modalidadeSelecionada === 'hora_tecnica' ? parseFloat(formGuiado.watch('horasTotaisEstimadas') || '0') : undefined}
                              modalidade={modalidadeSelecionada}
                              valorPorHora={modalidadeSelecionada === 'hora_tecnica' ? parseFloat(formGuiado.watch('valorCondicao') || '0') : undefined}
                            />
                          )}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !canEdit}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Salvar Alterações
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
              </TabsContent>

              {/* MODO MANUAL */}
              <TabsContent value="manual">
                <div className="max-h-[55vh] overflow-y-auto pr-4">
                  <Alert className="mb-4">
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Campos obrigatórios:</strong> Valor, Data de Conclusão e Data de Pagamento devem ser preenchidos obrigatoriamente.
                    </AlertDescription>
                  </Alert>

                  <Form {...formManual}>
                    <form onSubmit={formManual.handleSubmit(onSubmitManual)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={formManual.control}
                          name="empresa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empresa *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a empresa" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {empresas?.map((empresa) => (
                                    <SelectItem key={empresa.id} value={empresa.codigo}>
                                      {empresa.nome_exibicao}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {renderDemandField(formManual)}

                        <FormField
                          control={formManual.control}
                          name="descricaoCondicao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição da Condição *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Descreva detalhadamente a condição de pagamento personalizada..." 
                                  className="min-h-[100px]"
                                  {...field}
                                  disabled={!canEdit}
                                />
                              </FormControl>
                              <FormDescription>
                                Mínimo de 10 caracteres
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={formManual.control}
                            name="numeroChamado"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nº Chamado</FormLabel>
                                <FormControl>
                                  <Input placeholder="" {...field} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formManual.control}
                            name="numeroOrcamento"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nº Orçamento</FormLabel>
                                <FormControl>
                                  <Input placeholder="" {...field} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={formManual.control}
                          name="linkChamado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Link do Chamado (Opcional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="url"
                                  placeholder="https://..." 
                                  {...field}
                                  disabled={!canEdit}
                                />
                              </FormControl>
                              <FormDescription>
                                Cole o link direto para o chamado no sistema de gestão
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Anexar Orçamento/Documentos</label>
                          <FileUploadPayment
                            onFilesChange={setUploadedFiles}
                            existingFiles={uploadedFiles}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={formManual.control}
                            name="valorCondicao"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor (R$) *</FormLabel>
                                <FormControl>
                                  <CurrencyInput 
                                    placeholder="0,00" 
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formManual.control}
                            name="dataConclusao"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Conclusão/Entrega</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={formManual.control}
                            name="dataPagamentoPrevista"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Pagamento Prevista</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} disabled={!canEdit} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={formManual.control}
                          name="observacoes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Informações adicionais..." {...field} disabled={!canEdit} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Faseamento com Checklist */}
                        <div className="space-y-4 border-t pt-6 mt-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="faseamento-manual-edit"
                              checked={faseamentoAtivo}
                              onCheckedChange={(checked) => setFaseamentoAtivo(checked as boolean)}
                              disabled={!canEdit}
                            />
                            <label
                              htmlFor="faseamento-manual-edit"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Ativar Faseamento com Checklist de Acompanhamento
                            </label>
                          </div>
                          {faseamentoAtivo && (
                            <PhaseManagement
                              phases={phases}
                              onChange={setPhases}
                              disabled={!canEdit}
                            />
                          )}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !canEdit}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Salvar Alterações
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};