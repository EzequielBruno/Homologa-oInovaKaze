import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useEmpresas } from '@/hooks/useEmpresas';

const paymentConditionSchema = z.object({
  tipoPagamento: z.enum(['hora_tecnica', 'pacote_horas', 'etapa', 'mensalidade_fixa']),
  empresa: z.string().min(1, 'Empresa é obrigatória'),
  demandId: z.string().optional(),
  
  // Hora Técnica
  valorHora: z.string().optional(),
  cargoPerfil: z.string().optional(),
  limiteMensalHoras: z.string().optional(),
  
  // Pacote de Horas
  quantidadeTotalHoras: z.string().optional(),
  valorTotalPacote: z.string().optional(),
  validadeMeses: z.string().optional(),
  
  // Etapa/Milestone
  descricaoEtapa: z.string().optional(),
  valorEtapa: z.string().optional(),
  dataPrevistaEntrega: z.string().optional(),
  condicaoPagamentoEtapa: z.string().optional(),
  
  // Mensalidade Fixa
  valorMensalFixo: z.string().optional(),
  horasInclusas: z.string().optional(),
  servicosAbrangidos: z.string().optional(),
  valorHoraExcedente: z.string().optional(),
  diaFaturamento: z.string().optional(),
  
  // Comuns
  periodicidadeFaturamento: z.string().optional(),
  prazoPagamentoDias: z.string().optional(),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

type PaymentConditionFormValues = z.infer<typeof paymentConditionSchema>;

interface PaymentConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedorId: string;
  conditionId?: string;
  onSuccess?: () => void;
}

export const PaymentConditionDialog = ({
  open,
  onOpenChange,
  fornecedorId,
  conditionId,
  onSuccess,
}: PaymentConditionDialogProps) => {
  const { toast } = useToast();
  const { data: empresas } = useEmpresas();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demands, setDemands] = useState<Array<{ id: string; codigo: string; descricao: string }>>([]);
  const [demandSearch, setDemandSearch] = useState('');
  const [openDemandCombo, setOpenDemandCombo] = useState(false);

  const form = useForm<PaymentConditionFormValues>({
    resolver: zodResolver(paymentConditionSchema),
    defaultValues: {
      tipoPagamento: 'hora_tecnica',
      empresa: 'ZC',
      demandId: 'none',
    },
  });

  const tipoPagamento = form.watch('tipoPagamento');
  const empresaSelecionada = form.watch('empresa');

  useEffect(() => {
    if (open) {
      if (conditionId) {
        loadCondition();
      } else {
        // Se não está editando, busca demandas da empresa padrão
        fetchDemands(empresaSelecionada);
      }
    }
  }, [open, conditionId]);

  // Atualiza demandas quando a empresa muda
  useEffect(() => {
    if (open && empresaSelecionada) {
      fetchDemands(empresaSelecionada);
      // Limpa a demanda selecionada quando muda de empresa
      form.setValue('demandId', 'none');
    }
  }, [empresaSelecionada, open]);

  const fetchDemands = async (empresa: string) => {
    if (!empresa) return;
    
    const { data } = await supabase
      .from('demands')
      .select('id, codigo, descricao')
      .eq('empresa', empresa as 'ZC' | 'Eletro' | 'ZF' | 'ZS')
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (data) {
      setDemands(data);
    }
  };

  const loadCondition = async () => {
    if (!conditionId) return;

    const { data, error } = await supabase
      .from('payment_conditions')
      .select('*')
      .eq('id', conditionId)
      .single();

    if (error) {
      console.error('Erro ao carregar condição:', error);
      return;
    }

    if (data) {
      form.reset({
        tipoPagamento: data.tipo_pagamento as any,
        empresa: (data as any).empresa || 'ZC',
        demandId: data.demand_id || 'none',
        valorHora: data.valor_hora?.toString() || '',
        cargoPerfil: data.cargo_perfil || '',
        limiteMensalHoras: data.limite_mensal_horas?.toString() || '',
        quantidadeTotalHoras: data.quantidade_total_horas?.toString() || '',
        valorTotalPacote: data.valor_total_pacote?.toString() || '',
        validadeMeses: data.validade_meses?.toString() || '',
        descricaoEtapa: data.descricao_etapa || '',
        valorEtapa: data.valor_etapa?.toString() || '',
        dataPrevistaEntrega: data.data_prevista_entrega || '',
        condicaoPagamentoEtapa: data.condicao_pagamento_etapa || '',
        valorMensalFixo: data.valor_mensal_fixo?.toString() || '',
        horasInclusas: data.horas_inclusas?.toString() || '',
        servicosAbrangidos: data.servicos_abrangidos || '',
        valorHoraExcedente: data.valor_hora_excedente?.toString() || '',
        diaFaturamento: data.dia_faturamento?.toString() || '',
        periodicidadeFaturamento: data.periodicidade_faturamento || '',
        prazoPagamentoDias: data.prazo_pagamento_dias?.toString() || '',
        formaPagamento: data.forma_pagamento || '',
        observacoes: data.observacoes || '',
      });
    }
  };

  const onSubmit = async (values: PaymentConditionFormValues) => {
    setIsSubmitting(true);

    try {
      const payload: any = {
        fornecedor_id: fornecedorId,
        tipo_pagamento: values.tipoPagamento,
        empresa: values.empresa,
        demand_id: values.demandId && values.demandId !== 'none' ? values.demandId : null,
        periodicidade_faturamento: values.periodicidadeFaturamento || null,
        prazo_pagamento_dias: values.prazoPagamentoDias ? parseInt(values.prazoPagamentoDias) : null,
        forma_pagamento: values.formaPagamento || null,
        observacoes: values.observacoes || null,
      };

      // Adiciona campos específicos baseado no tipo
      if (values.tipoPagamento === 'hora_tecnica') {
        payload.valor_hora = values.valorHora ? parseFloat(values.valorHora) : null;
        payload.cargo_perfil = values.cargoPerfil || null;
        payload.limite_mensal_horas = values.limiteMensalHoras ? parseInt(values.limiteMensalHoras) : null;
      } else if (values.tipoPagamento === 'pacote_horas') {
        payload.quantidade_total_horas = values.quantidadeTotalHoras ? parseInt(values.quantidadeTotalHoras) : null;
        payload.valor_total_pacote = values.valorTotalPacote ? parseFloat(values.valorTotalPacote) : null;
        payload.validade_meses = values.validadeMeses ? parseInt(values.validadeMeses) : null;
      } else if (values.tipoPagamento === 'etapa') {
        payload.descricao_etapa = values.descricaoEtapa || null;
        payload.valor_etapa = values.valorEtapa ? parseFloat(values.valorEtapa) : null;
        payload.data_prevista_entrega = values.dataPrevistaEntrega || null;
        payload.condicao_pagamento_etapa = values.condicaoPagamentoEtapa || null;
      } else if (values.tipoPagamento === 'mensalidade_fixa') {
        payload.valor_mensal_fixo = values.valorMensalFixo ? parseFloat(values.valorMensalFixo) : null;
        payload.horas_inclusas = values.horasInclusas ? parseInt(values.horasInclusas) : null;
        payload.servicos_abrangidos = values.servicosAbrangidos || null;
        payload.valor_hora_excedente = values.valorHoraExcedente ? parseFloat(values.valorHoraExcedente) : null;
        payload.dia_faturamento = values.diaFaturamento ? parseInt(values.diaFaturamento) : null;
      }

      let error;
      if (conditionId) {
        const result = await supabase
          .from('payment_conditions')
          .update(payload)
          .eq('id', conditionId);
        error = result.error;
      } else {
        const result = await supabase
          .from('payment_conditions')
          .insert(payload);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: conditionId ? 'Condição atualizada' : 'Condição cadastrada',
        description: 'A condição de pagamento foi salva com sucesso.',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar condição:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a condição de pagamento.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {conditionId ? 'Editar' : 'Adicionar'} Condição de Pagamento
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da modalidade de pagamento contratual
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipoPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Condição de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hora_tecnica">Por Hora Técnica</SelectItem>
                          <SelectItem value="pacote_horas">Por Pacote de Horas</SelectItem>
                          <SelectItem value="etapa">Por Etapa (Milestone)</SelectItem>
                          <SelectItem value="mensalidade_fixa">Mensalidade Fixa (Retainer)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="empresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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

                <FormField
                  control={form.control}
                  name="demandId"
                  render={({ field }) => (
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
              </div>

              {/* Campos específicos por tipo */}
              {tipoPagamento === 'hora_tecnica' && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-semibold">Detalhes - Hora Técnica</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="valorHora"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da hora (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput 
                              placeholder="150,00" 
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoPerfil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo/Perfil</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Dev Sênior" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="limiteMensalHoras"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limite mensal de horas</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="160" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="periodicidadeFaturamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Periodicidade de faturamento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Mensal, Quinzenal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {tipoPagamento === 'pacote_horas' && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-semibold">Detalhes - Pacote de Horas</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="quantidadeTotalHoras"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade total de horas</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valorTotalPacote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor total do pacote (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput 
                              placeholder="15.000,00" 
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validadeMeses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Validade (meses)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="6" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {tipoPagamento === 'etapa' && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-semibold">Detalhes - Etapa/Milestone</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="descricaoEtapa"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Descrição da etapa</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descreva a entrega desta etapa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valorEtapa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da etapa (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput 
                              placeholder="5.000,00" 
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dataPrevistaEntrega"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data prevista de entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="condicaoPagamentoEtapa"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Condição de pagamento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Após aceite da entrega" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {tipoPagamento === 'mensalidade_fixa' && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-semibold">Detalhes - Mensalidade Fixa</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="valorMensalFixo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor mensal fixo (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput 
                              placeholder="10.000,00" 
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="horasInclusas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horas inclusas no plano</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="160" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="servicosAbrangidos"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Serviços abrangidos</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descreva os serviços inclusos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="valorHoraExcedente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor hora excedente (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput 
                              placeholder="80,00" 
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="diaFaturamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia de faturamento</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="31" placeholder="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Campos comuns */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-semibold">Informações Complementares</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="prazoPagamentoDias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prazo de pagamento (dias)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="formaPagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de pagamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: PIX, Boleto, Transferência" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Observações gerais</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Informações adicionais" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {conditionId ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
