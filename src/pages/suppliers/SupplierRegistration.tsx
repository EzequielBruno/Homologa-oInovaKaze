import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

const phoneValidator = z
  .string()
  .min(8, 'Informe um telefone válido')
  .refine((value) => value.replace(/\D/g, '').length >= 8, 'Informe um telefone válido');

const optionalPhoneValidator = z
  .string()
  .optional()
  .refine(
    (value) => !value || value.trim() === '' || value.replace(/\D/g, '').length >= 8,
    'Informe um telefone válido'
  );

const cnpjValidator = z
  .string()
  .min(14, 'Informe um CNPJ válido')
  .refine((value) => value.replace(/\D/g, '').length === 14, 'CNPJ deve conter 14 dígitos');

const cepValidator = z
  .string()
  .min(8, 'Informe um CEP válido')
  .refine((value) => value.replace(/\D/g, '').length === 8, 'CEP deve conter 8 dígitos');

const siteValidator = z
  .string()
  .url('Informe uma URL válida')
  .or(z.literal(''))
  .optional();

const supplierSchema = z.object({
  razaoSocial: z.string().min(1, 'Informe a razão social'),
  nomeFantasia: z.string().min(1, 'Informe o nome fantasia'),
  cnpj: cnpjValidator,
  inscricaoEstadual: z.string().optional(),
  email: z.string().email('Informe um e-mail válido'),
  telefone: phoneValidator,
  celular: optionalPhoneValidator,
  site: siteValidator,
  cep: cepValidator,
  endereco: z.string().min(1, 'Informe o endereço'),
  numero: z.string().min(1, 'Informe o número'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Informe o bairro'),
  cidade: z.string().min(1, 'Informe a cidade'),
  estado: z.string().min(2, 'Informe o estado'),
  pais: z.string().min(1, 'Informe o país'),
  contatoNome: z.string().min(1, 'Informe o nome do contato'),
  contatoEmail: z.string().email('Informe um e-mail válido'),
  contatoTelefone: phoneValidator,
  servicosOferecidos: z.string().min(1, 'Informe os serviços oferecidos'),
  observacoes: z.string().optional()
});

const sanitizeNumber = (value: string) => value.replace(/\D/g, '');

type SupplierFormValues = z.infer<typeof supplierSchema>;
type SupplierInsert = Database['public']['Tables']['fornecedores']['Insert'];

const defaultValues: SupplierFormValues = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  inscricaoEstadual: '',
  email: '',
  telefone: '',
  celular: '',
  site: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  pais: 'Brasil',
  contatoNome: '',
  contatoEmail: '',
  contatoTelefone: '',
  servicosOferecidos: '',
  observacoes: ''
};

const SupplierRegistration = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues
  });

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);

    try {
      const payload: SupplierInsert = {
        razao_social: values.razaoSocial.trim(),
        nome_fantasia: values.nomeFantasia.trim(),
        cnpj: sanitizeNumber(values.cnpj),
        inscricao_estadual: values.inscricaoEstadual?.trim() || null,
        email: values.email.trim(),
        telefone: sanitizeNumber(values.telefone),
        celular: values.celular?.trim() ? sanitizeNumber(values.celular) : null,
        site: values.site?.trim() ? values.site.trim() : null,
        cep: sanitizeNumber(values.cep),
        endereco: values.endereco.trim(),
        numero: values.numero.trim(),
        complemento: values.complemento?.trim() || null,
        bairro: values.bairro.trim(),
        cidade: values.cidade.trim(),
        estado: values.estado.trim().toUpperCase(),
        pais: values.pais.trim(),
        contato_nome: values.contatoNome.trim(),
        contato_email: values.contatoEmail.trim(),
        contato_telefone: sanitizeNumber(values.contatoTelefone),
        categoria: 'Não informado',
        servicos_oferecidos: values.servicosOferecidos.trim(),
        observacoes: values.observacoes?.trim() || null,
        status: 'ativo',
        prazo_pagamento: 'Não informado',
        limite_credito: null,
        banco: 'Não informado',
        agencia: 'Não informado',
        conta: 'Não informado',
        pix: null
      };

      const { error } = await supabase.from('fornecedores').insert(payload);

      if (error) {
        throw error;
      }

      toast({
        title: 'Fornecedor cadastrado com sucesso',
        description: 'Os dados do fornecedor foram registrados na base do Supabase.'
      });

      form.reset(defaultValues);
    } catch (error) {
      console.error('Erro ao cadastrar fornecedor:', error);
      toast({
        title: 'Não foi possível cadastrar o fornecedor',
        description: 'Verifique os dados informados e tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </span>
          Cadastrar novo fornecedor
        </h1>
        <p className="text-muted-foreground">
          Registre parceiros estratégicos com informações completas para agilizar o processo de homologação e contratação.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Informações da empresa</CardTitle>
              <CardDescription>Dados legais e básicos do fornecedor.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão social</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Empresa XYZ Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: XYZ Soluções" {...field} />
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
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inscricaoEstadual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição estadual</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail fiscal</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contato@empresa.com" {...field} />
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
                    <FormLabel>Telefone comercial</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 0000-0000" {...field} />
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
                    <FormLabel>Telefone celular</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
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
                      <Input placeholder="https://empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização principal do fornecedor.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
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
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, avenida, etc" {...field} />
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
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complemento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
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
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Centro" {...field} />
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
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Araçuaí" {...field} />
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
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="MG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input placeholder="Brasil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Contato principal</CardTitle>
          <CardDescription>Responsável direto pelo relacionamento com o Grupo Zema.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
                name="contatoNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contatoEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail do contato</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="responsavel@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contatoTelefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do contato</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
          />
        </CardContent>
      </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => form.reset(defaultValues)}
            >
              Limpar formulário
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar fornecedor
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SupplierRegistration;
