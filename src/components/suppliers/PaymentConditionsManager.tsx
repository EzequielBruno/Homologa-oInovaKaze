import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmpresas } from '@/hooks/useEmpresas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Loader2, MoreVertical, Plus, Trash, FileText, Eye } from 'lucide-react';
import { NewPaymentConditionDialog } from './NewPaymentConditionDialog';
import { EditPaymentConditionDialog } from './EditPaymentConditionDialog';
import { ViewPaymentConditionDialog } from './ViewPaymentConditionDialog';

interface PaymentCondition {
  id: string;
  tipo_pagamento: string | null;
  grupo_condicao: string | null;
  modalidade: string | null;
  descricao_modalidade: string | null;
  tipo_cadastro: string | null;
  numero_chamado: string | null;
  numero_orcamento: string | null;
  documentos_anexados: string[] | null;
  empresa: string;
  demand_id: string | null;
  valor_hora: number | null;
  valor_total_pacote: number | null;
  valor_etapa: number | null;
  valor_mensal_fixo: number | null;
  data_conclusao: string | null;
  data_pagamento_prevista: string | null;
  status: string;
  created_at: string;
  demands?: {
    codigo: string;
  } | null;
}

interface PaymentConditionsManagerProps {
  fornecedorId: string;
}

const TIPO_LABELS: Record<string, string> = {
  hora_tecnica: 'Hora Técnica',
  pacote_horas: 'Pacote de Horas',
  etapa: 'Etapa/Milestone',
  mensalidade_fixa: 'Mensalidade Fixa',
};

// Mapeamento dos grupos de condições
const GRUPO_LABELS: Record<string, string> = {
  'desenvolvimento_suporte': 'Serviços de Desenvolvimento e Suporte',
  'infraestrutura_hardware': 'Infraestrutura e Hardware',
  'cloud_licenciamento': 'Cloud, Licenciamento e Capacidade',
  'contratos_especiais': 'Contratos Especiais e Mistos',
};

export const PaymentConditionsManager = ({ fornecedorId }: PaymentConditionsManagerProps) => {
  const { toast } = useToast();
  const { data: empresas } = useEmpresas();
  const [conditions, setConditions] = useState<PaymentCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);
  const [viewingConditionId, setViewingConditionId] = useState<string | null>(null);
  const [deletingConditionId, setDeletingConditionId] = useState<string | null>(null);

  const getEmpresaLabel = (codigo: string) => {
    return empresas?.find(e => e.codigo === codigo)?.nome_exibicao || codigo;
  };

  useEffect(() => {
    fetchConditions();
  }, [fornecedorId]);

  const fetchConditions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_conditions')
      .select(`
        *,
        demands:demand_id (
          codigo
        )
      `)
      .eq('fornecedor_id', fornecedorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar condições:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as condições de pagamento.',
        variant: 'destructive',
      });
    } else {
      setConditions(data as any || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deletingConditionId) return;

    const { error } = await supabase
      .from('payment_conditions')
      .delete()
      .eq('id', deletingConditionId);

    if (error) {
      console.error('Erro ao excluir condição:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a condição de pagamento.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Condição excluída',
        description: 'A condição de pagamento foi removida com sucesso.',
      });
      fetchConditions();
    }
    setDeletingConditionId(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
  };

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingConditionId(null);
    }
  };

  const handleEditClick = (conditionId: string) => {
    setEditingConditionId(conditionId);
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (conditionId: string) => {
    setViewingConditionId(conditionId);
    setIsViewDialogOpen(true);
  };

  const handleViewDialogClose = (open: boolean) => {
    setIsViewDialogOpen(open);
    if (!open) {
      setViewingConditionId(null);
    }
  };

  const getTipo = (condition: PaymentCondition) => {
    // Novo sistema: modo guiado com grupos
    if (condition.modalidade && condition.grupo_condicao) {
      return GRUPO_LABELS[condition.grupo_condicao] || condition.grupo_condicao;
    }
    
    // Modo manual
    if (condition.tipo_cadastro === 'manual') {
      return 'Condição Adaptada';
    }
    
    // Sistema antigo (por compatibilidade)
    if (condition.tipo_pagamento) {
      return TIPO_LABELS[condition.tipo_pagamento] || condition.tipo_pagamento;
    }
    
    return '-';
  };

  const getValor = (condition: PaymentCondition): string => {
    // Modo manual ou novo sistema (com valor_hora como campo principal)
    if (condition.tipo_cadastro === 'manual' || condition.grupo_condicao) {
      if (condition.valor_hora) {
        return `R$ ${condition.valor_hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
    }
    
    // Sistema antigo (por compatibilidade)
    if (condition.tipo_pagamento) {
      if (condition.tipo_pagamento === 'hora_tecnica' && condition.valor_hora) {
        return `R$ ${condition.valor_hora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h`;
      }
      if (condition.tipo_pagamento === 'pacote_horas' && condition.valor_total_pacote) {
        return `R$ ${condition.valor_total_pacote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      if (condition.tipo_pagamento === 'etapa' && condition.valor_etapa) {
        return `R$ ${condition.valor_etapa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      if (condition.tipo_pagamento === 'mensalidade_fixa' && condition.valor_mensal_fixo) {
        return `R$ ${condition.valor_mensal_fixo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`;
      }
    }
    
    return '-';
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold sm:text-xl">Condições de Pagamento por Demanda</h2>
            <p className="text-sm text-muted-foreground">Gerencie as modalidades vinculadas a demandas</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            className="w-full shrink-0 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Condição
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : conditions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center sm:p-8">
              <p className="text-sm text-muted-foreground">
                Nenhuma condição de pagamento cadastrada ainda.
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                className="mt-4"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeira condição
              </Button>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="hidden w-full max-w-full overflow-x-auto rounded-lg border md:block">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Modalidade</TableHead>
                    <TableHead className="whitespace-nowrap">Empresa</TableHead>
                    <TableHead className="whitespace-nowrap">Projeto</TableHead>
                    <TableHead className="whitespace-nowrap">Valor</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Data</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conditions.map((condition) => (
                    <TableRow key={condition.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium break-words">{getTipo(condition)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="max-w-[200px] break-words">
                          {getEmpresaLabel(condition.empresa)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {condition.demands?.codigo || (
                          <span className="text-muted-foreground">Não vinculado</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{getValor(condition)}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(condition.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleViewClick(condition.id);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleEditClick(condition.id);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                setDeletingConditionId(condition.id);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-4 md:hidden">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className="rounded-lg border bg-card/40 p-4 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="block text-sm font-semibold text-muted-foreground">Modalidade</span>
                      <span className="font-medium leading-tight break-words">
                        {getTipo(condition)}
                      </span>
                    </div>
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
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-muted-foreground">Empresa</span>
                      <Badge variant="outline" className="w-fit max-w-full whitespace-normal break-words">
                        {getEmpresaLabel(condition.empresa)}
                      </Badge>
                    </div>
                    <div className="space-y-1 break-words">
                      <span className="block text-xs font-semibold text-muted-foreground">Projeto</span>
                      <span className="break-words">
                        {condition.demands?.codigo || (
                          <span className="text-muted-foreground">Não vinculado</span>
                        )}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-muted-foreground">Valor</span>
                      <span className="font-mono">{getValor(condition)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-muted-foreground">Data</span>
                      <span className="text-muted-foreground">{formatDate(condition.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            handleViewClick(condition.id);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            handleEditClick(condition.id);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            setDeletingConditionId(condition.id);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
            ))}
          </div>
        </div>
        )}
        </div>

        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-end border-t mt-4">
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            Atualize, adicione ou remova as condições de pagamento conforme necessário.
          </p>
        </div>
      </div>

      <NewPaymentConditionDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        fornecedorId={fornecedorId}
        onSuccess={fetchConditions}
      />

      {editingConditionId && (
        <EditPaymentConditionDialog
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          conditionId={editingConditionId}
          onSuccess={fetchConditions}
        />
      )}

      {viewingConditionId && (
        <ViewPaymentConditionDialog
          open={isViewDialogOpen}
          onOpenChange={handleViewDialogClose}
          conditionId={viewingConditionId}
        />
      )}

      <AlertDialog open={!!deletingConditionId} onOpenChange={(open) => !open && setDeletingConditionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta condição de pagamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
