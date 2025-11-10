import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

type Supplier = Database['public']['Tables']['fornecedores']['Row'];

const editSupplierSchema = z.object({
  razao_social: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
  nome_fantasia: z.string().min(3, 'Nome fantasia deve ter pelo menos 3 caracteres'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos'),
  inscricao_estadual: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  celular: z.string().optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  portal_suporte: z.string().url('URL inválida').optional().or(z.literal('')),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  endereco: z.string().min(5, 'Endereço inválido'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro inválido'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'UF deve ter 2 caracteres'),
  pais: z.string().min(2, 'País inválido'),
  contato_nome: z.string().min(3, 'Nome do contato inválido'),
  contato_email: z.string().email('Email do contato inválido'),
  contato_telefone: z.string().min(10, 'Telefone do contato inválido'),
  categoria: z.string().min(3, 'Categoria inválida'),
  servicos_oferecidos: z.string().min(10, 'Descreva os serviços oferecidos'),
  prazo_pagamento: z.string().min(3, 'Prazo de pagamento é obrigatório'),
  banco: z.string().min(3, 'Nome do banco é obrigatório'),
  agencia: z.string().min(1, 'Agência é obrigatória'),
  conta: z.string().min(1, 'Conta é obrigatória'),
  pix: z.string().optional(),
  observacoes: z.string().optional(),
  limite_credito: z.string().optional(),
  status: z.enum(['ativo', 'inativo']),
});

type FormValues = z.infer<typeof editSupplierSchema>;

interface EditSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
  onSuccess?: () => void;
}

export const EditSupplierDialog = ({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: EditSupplierDialogProps) => {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(editSupplierSchema),
    defaultValues: {
      razao_social: supplier.razao_social,
      nome_fantasia: supplier.nome_fantasia,
      cnpj: supplier.cnpj,
      inscricao_estadual: supplier.inscricao_estadual || '',
      email: supplier.email,
      telefone: supplier.telefone,
      celular: supplier.celular || '',
      site: supplier.site || '',
      portal_suporte: supplier.portal_suporte || '',
      cep: supplier.cep,
      endereco: supplier.endereco,
      numero: supplier.numero,
      complemento: supplier.complemento || '',
      bairro: supplier.bairro,
      cidade: supplier.cidade,
      estado: supplier.estado,
      pais: supplier.pais,
      contato_nome: supplier.contato_nome,
      contato_email: supplier.contato_email,
      contato_telefone: supplier.contato_telefone,
      categoria: supplier.categoria,
      servicos_oferecidos: supplier.servicos_oferecidos,
      prazo_pagamento: supplier.prazo_pagamento,
      banco: supplier.banco,
      agencia: supplier.agencia,
      conta: supplier.conta,
      pix: supplier.pix || '',
      observacoes: supplier.observacoes || '',
      limite_credito: supplier.limite_credito?.toString() || '',
      status: supplier.status,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        razao_social: supplier.razao_social,
        nome_fantasia: supplier.nome_fantasia,
        cnpj: supplier.cnpj,
        inscricao_estadual: supplier.inscricao_estadual || '',
        email: supplier.email,
        telefone: supplier.telefone,
        celular: supplier.celular || '',
        site: supplier.site || '',
        portal_suporte: supplier.portal_suporte || '',
        cep: supplier.cep,
        endereco: supplier.endereco,
        numero: supplier.numero,
        complemento: supplier.complemento || '',
        bairro: supplier.bairro,
        cidade: supplier.cidade,
        estado: supplier.estado,
        pais: supplier.pais,
        contato_nome: supplier.contato_nome,
        contato_email: supplier.contato_email,
        contato_telefone: supplier.contato_telefone,
        categoria: supplier.categoria,
        servicos_oferecidos: supplier.servicos_oferecidos,
        prazo_pagamento: supplier.prazo_pagamento,
        banco: supplier.banco,
        agencia: supplier.agencia,
        conta: supplier.conta,
        pix: supplier.pix || '',
        observacoes: supplier.observacoes || '',
        limite_credito: supplier.limite_credito?.toString() || '',
        status: supplier.status,
      });
    }
  }, [open, supplier, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({
          razao_social: values.razao_social,
          nome_fantasia: values.nome_fantasia,
          cnpj: values.cnpj,
          inscricao_estadual: values.inscricao_estadual || null,
          email: values.email,
          telefone: values.telefone,
          celular: values.celular || null,
          site: values.site || null,
          portal_suporte: values.portal_suporte || null,
          cep: values.cep,
          endereco: values.endereco,
          numero: values.numero,
          complemento: values.complemento || null,
          bairro: values.bairro,
          cidade: values.cidade,
          estado: values.estado,
          pais: values.pais,
          contato_nome: values.contato_nome,
          contato_email: values.contato_email,
          contato_telefone: values.contato_telefone,
          categoria: values.categoria,
          servicos_oferecidos: values.servicos_oferecidos,
          prazo_pagamento: values.prazo_pagamento,
          banco: values.banco,
          agencia: values.agencia,
          conta: values.conta,
          pix: values.pix || null,
          observacoes: values.observacoes || null,
          limite_credito: values.limite_credito ? parseFloat(values.limite_credito) : null,
          status: values.status,
        })
        .eq('id', supplier.id);

      if (error) throw error;

      toast({
        title: 'Fornecedor atualizado',
        description: 'As informações do fornecedor foram atualizadas com sucesso.',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o fornecedor. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Fornecedor</DialogTitle>
          <DialogDescription>
            Atualize as informações do fornecedor {supplier.nome_fantasia}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Identificação */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Identificação</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="razao_social"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão Social *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nome_fantasia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Fantasia *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00000000000000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inscricao_estadual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Estadual</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contatos */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Contatos</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="celular"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="site"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="portal_suporte"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Portal de Suporte</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL do portal de atendimento/chamados do fornecedor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Endereço</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00000000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Endereço *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF *</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={2} placeholder="SP" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pais"
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>País *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contato Principal */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Contato Principal</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="contato_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contato_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contato_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Serviços */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Serviços</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="limite_credito"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite de Crédito</FormLabel>
                        <FormControl>
                          <CurrencyInput 
                            placeholder="0,00" 
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
                    name="servicos_oferecidos"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Serviços Oferecidos *</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dados Bancários */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Dados Bancários</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="prazo_pagamento"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Prazo de Pagamento *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 30 dias" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIX</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
