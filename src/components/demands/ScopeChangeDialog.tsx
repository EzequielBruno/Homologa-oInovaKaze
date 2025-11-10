import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DemandDialog from './DemandDialog';
import { Loader2, Search, CalendarIcon } from 'lucide-react';
import { EMPRESAS } from '@/types/demand';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { generateVersionedCode } from '@/utils/demandCodeGenerator';
import { notifySquadAboutScopeChange } from '@/utils/scopeChangeNotifications';

interface ScopeChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface DemandOption {
  id: string;
  codigo: string;
  descricao: string;
  status: string;
  empresa: string;
  created_at: string;
}

const ScopeChangeDialog = ({ open, onOpenChange, onSuccess }: ScopeChangeDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [demands, setDemands] = useState<DemandOption[]>([]);
  const [selectedDemandId, setSelectedDemandId] = useState('');
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [filterPeriodo, setFilterPeriodo] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  // Carregar todas as demandas
  useEffect(() => {
    const loadDemands = async () => {
      if (!open) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('demands')
          .select('id, codigo, descricao, status, empresa, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setDemands(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar demandas:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as demandas.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDemands();
  }, [open]);

  // Filtrar demandas em tempo real
  const filteredDemands = useMemo(() => {
    return demands.filter((demand) => {
      // Filtro por busca (código ou descrição)
      const matchesSearch =
        !searchTerm ||
        demand.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demand.descricao.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por empresa
      const matchesEmpresa = !filterEmpresa || filterEmpresa === 'all' || demand.empresa === filterEmpresa;

      // Filtro por período
      let matchesPeriodo = true;
      if (filterPeriodo && filterPeriodo !== 'all') {
        const createdAt = new Date(demand.created_at);
        const now = new Date();
        
        switch (filterPeriodo) {
          case '7days':
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            matchesPeriodo = createdAt >= sevenDaysAgo;
            break;
          case '30days':
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            matchesPeriodo = createdAt >= thirtyDaysAgo;
            break;
          case '90days':
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(now.getDate() - 90);
            matchesPeriodo = createdAt >= ninetyDaysAgo;
            break;
          case 'thisYear':
            matchesPeriodo = createdAt.getFullYear() === now.getFullYear();
            break;
          case 'custom':
            // Filtro customizado por intervalo de datas
            if (customDateFrom && customDateTo) {
              const from = new Date(customDateFrom);
              from.setHours(0, 0, 0, 0);
              const to = new Date(customDateTo);
              to.setHours(23, 59, 59, 999);
              matchesPeriodo = createdAt >= from && createdAt <= to;
            } else if (customDateFrom) {
              const from = new Date(customDateFrom);
              from.setHours(0, 0, 0, 0);
              matchesPeriodo = createdAt >= from;
            } else if (customDateTo) {
              const to = new Date(customDateTo);
              to.setHours(23, 59, 59, 999);
              matchesPeriodo = createdAt <= to;
            }
            break;
        }
      }

      return matchesSearch && matchesEmpresa && matchesPeriodo;
    });
  }, [demands, searchTerm, filterEmpresa, filterPeriodo, customDateFrom, customDateTo]);

  // Resetar filtros ao fechar
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setFilterEmpresa('all');
      setFilterPeriodo('all');
      setCustomDateFrom(undefined);
      setCustomDateTo(undefined);
    }
  }, [open]);

  const handleDemandSelect = async () => {
    if (!selectedDemandId) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma demanda para alterar o escopo.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar demanda completa com todos os dados
      const { data: demandData, error: demandError } = await supabase
        .from('demands')
        .select('*')
        .eq('id', selectedDemandId)
        .single();

      if (demandError) throw demandError;

      setSelectedDemand(demandData);

      // Se a demanda não estiver concluída, mostrar aviso
      if (demandData.status !== 'Concluido') {
        setShowWarningDialog(true);
      } else {
        // Se estiver concluída, abrir direto para edição
        setShowEditDialog(true);
      }
    } catch (error: any) {
      console.error('Erro ao carregar demanda:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da demanda.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWarningConfirm = () => {
    setShowWarningDialog(false);
    setShowEditDialog(true);
  };

  const handleEditSuccess = async () => {
    if (!selectedDemand) return;

    try {
      // Incrementar versão
      const novaVersao = (selectedDemand.versao || 1) + 1;
      const codigoBase = selectedDemand.codigo_base || selectedDemand.codigo;
      const novoCodigo = generateVersionedCode(codigoBase, novaVersao);

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Guardar snapshot completo antes da mudança
      const { error: historyError } = await supabase
        .from('demand_history')
        .insert({
          demand_id: selectedDemand.id,
          user_id: user.id,
          action: 'mudanca_escopo',
          descricao: `Mudança de escopo - Versão ${novaVersao}`,
          dados_anteriores: selectedDemand,
          snapshot_completo: selectedDemand,
        });

      if (historyError) {
        console.error('Erro ao salvar histórico:', historyError);
      }

      // Atualizar versão e código da demanda
      const { error: updateError } = await supabase
        .from('demands')
        .update({
          versao: novaVersao,
          codigo_base: codigoBase,
          codigo: novoCodigo,
          status: 'Backlog', // Retorna para backlog
        })
        .eq('id', selectedDemand.id);

      if (updateError) {
        throw updateError;
      }

      // Enviar notificações para membros da squad
      if (selectedDemand.empresa && selectedDemand.squad) {
        await notifySquadAboutScopeChange({
          demandId: selectedDemand.id,
          demandCode: novoCodigo,
          demandTitle: selectedDemand.descricao || 'Sem título',
          empresa: selectedDemand.empresa,
          squad: selectedDemand.squad,
          oldVersion: selectedDemand.versao || 1,
          newVersion: novaVersao,
          changedBy: user.id,
        });
      }

      setShowEditDialog(false);
      onOpenChange(false);
      setSelectedDemandId('');
      setSelectedDemand(null);
      
      toast({
        title: 'Sucesso',
        description: `Mudança de escopo registrada! Nova versão: ${novoCodigo}. Notificações enviadas para a squad.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao processar mudança de escopo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a mudança de escopo.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedDemandId('');
    setSelectedDemand(null);
    setShowWarningDialog(false);
    setShowEditDialog(false);
  };

  return (
    <>
      <Dialog open={open && !showEditDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              Solicitar Mudança de Escopo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Filtros */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Buscar por Código ou Título
                </Label>
                <Input
                  id="search"
                  placeholder="Digite o código ou título da demanda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-empresa">Filtrar por Empresa</Label>
                  <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
                    <SelectTrigger id="filter-empresa" className="bg-background">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Todas</SelectItem>
                      {EMPRESAS.map((emp) => (
                        <SelectItem key={emp.value} value={emp.value}>
                          {emp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-periodo">Filtrar por Período</Label>
                  <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                    <SelectTrigger id="filter-periodo" className="bg-background">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="90days">Últimos 90 dias</SelectItem>
                      <SelectItem value="thisYear">Este ano</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Datepickers customizados */}
              {filterPeriodo === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background",
                            !customDateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDateFrom ? format(customDateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecione..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={customDateFrom}
                          onSelect={(date) => {
                            setCustomDateFrom(date);
                            setDateFromOpen(false);
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background",
                            !customDateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDateTo ? format(customDateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecione..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={customDateTo}
                          onSelect={(date) => {
                            setCustomDateTo(date);
                            setDateToOpen(false);
                          }}
                          initialFocus
                          disabled={(date) => customDateFrom ? date < customDateFrom : false}
                          className={cn("p-3 pointer-events-auto")}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {(searchTerm || (filterEmpresa && filterEmpresa !== 'all') || (filterPeriodo && filterPeriodo !== 'all')) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterEmpresa('all');
                    setFilterPeriodo('all');
                    setCustomDateFrom(undefined);
                    setCustomDateTo(undefined);
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Lista de Demandas */}
            <div className="space-y-2">
              <Label>
                Selecione a Demanda
                {filteredDemands.length > 0 && (
                  <span className="text-muted-foreground text-sm ml-2">
                    ({filteredDemands.length} {filteredDemands.length === 1 ? 'demanda encontrada' : 'demandas encontradas'})
                  </span>
                )}
              </Label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredDemands.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma demanda encontrada com os filtros aplicados.</p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2 bg-background">
                  {filteredDemands.map((demand) => (
                    <button
                      key={demand.id}
                      onClick={() => setSelectedDemandId(demand.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedDemandId === demand.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <span className="font-medium text-foreground">{demand.codigo}</span>
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {demand.descricao}
                          </span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                              {EMPRESAS.find(e => e.value === demand.empresa)?.label || demand.empresa}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {demand.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(demand.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleDemandSelect} disabled={!selectedDemandId || loading}>
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Aviso */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção - Mudança de Escopo</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Ao solicitar uma mudança de escopo, esta demanda passará por uma nova
                avaliação e <strong>retornará para o Backlog</strong>.
              </p>
              <p>
                Todas as alterações serão registradas no histórico da demanda.
              </p>
              <p className="font-medium">Deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowWarningDialog(false);
                setSelectedDemandId('');
                setSelectedDemand(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleWarningConfirm}>Continuar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição */}
      {selectedDemand && (
        <DemandDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              handleClose();
            }
          }}
          demand={selectedDemand}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default ScopeChangeDialog;
