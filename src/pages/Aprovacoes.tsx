import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { ApprovalDialog } from '@/components/demands/ApprovalDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Aprovacoes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const permissions = useUserPermissions();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [userLevel, setUserLevel] = useState<'gerente' | 'comite' | 'ti' | null>(null);

  useEffect(() => {
    checkUserLevel();
    fetchPendingApprovals();
  }, []);

  const checkUserLevel = async () => {
    if (!user) return;

    // Verifica se é membro do comitê
    const { data: committee } = await supabase
      .from('committee_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .maybeSingle();

    if (committee) {
      setUserLevel('comite');
      return;
    }

    // Verifica se é scrum master
    const { data: scrum } = await supabase
      .from('scrum_masters')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .maybeSingle();

    if (scrum) {
      setUserLevel('ti');
      return;
    }

    // Por padrão, o usuário pode aprovar como gerente
    setUserLevel('gerente');
  };

  const fetchPendingApprovals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('demands')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtra baseado no nível do usuário
      const { data: committee } = await supabase
        .from('committee_members')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .maybeSingle();

      const { data: scrum } = await supabase
        .from('scrum_masters')
        .select('empresa')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .maybeSingle();

      if (committee) {
        // Comitê vê demandas Aguardando_Comite
        query = query.eq('status', 'Aguardando_Comite');
      } else if (scrum) {
        // Scrum Master vê demandas Aguardando_Validacao_TI da sua empresa
        query = query
          .eq('status', 'Aguardando_Validacao_TI')
          .eq('empresa', scrum.empresa as any);
      } else {
        // Gerentes veem demandas no Backlog ou Aguardando_Gerente
        query = query.in('status', ['Backlog', 'Aguardando_Gerente']);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtra apenas demandas que o usuário ainda não aprovou neste nível
      const filtered = [];
      if (data) {
        for (const demand of data) {
          // Se a demanda está no Backlog, verifica se já tem alguma ação deste usuário
          if (demand.status === 'Backlog') {
            const { data: anyAction } = await supabase
              .from('demand_approvals')
              .select('*')
              .eq('demand_id', demand.id)
              .eq('approver_id', user.id)
              .eq('approval_level', userLevel || 'gerente');

            // Se já teve alguma ação (aprovação ou recusa), não mostra mais
            if (!anyAction || anyAction.length === 0) {
              filtered.push(demand);
            }
            continue;
          }

          // Para outros status, verifica se já aprovou
          const { data: approval } = await supabase
            .from('demand_approvals')
            .select('*')
            .eq('demand_id', demand.id)
            .eq('approver_id', user.id)
            .eq('approval_level', userLevel || 'gerente')
            .maybeSingle();

          if (!approval) {
            filtered.push(demand);
          }
        }
      }

      console.log('Demandas filtradas:', filtered.length, 'de', data?.length || 0);
      setDemands(filtered);
    } catch (error: any) {
      console.error('Erro ao carregar aprovações:', error);
      toast({
        title: 'Erro ao carregar aprovações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const [initialAction, setInitialAction] = useState<'aprovar' | 'recusar' | 'solicitar_insumos' | null>(null);

  const handleOpenApproval = (demand: any, action: 'aprovar' | 'recusar' | 'solicitar_insumos') => {
    setSelectedDemand(demand);
    setInitialAction(action);
    setApprovalDialogOpen(true);
  };

  if (loading || permissions.loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  // Solicitantes não têm acesso à página de aprovações
  if (permissions.isSolicitante && !permissions.canApprove) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar a página de aprovações.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getLevelTitle = () => {
    switch (userLevel) {
      case 'gerente':
        return 'Pendência de Aprovação';
      case 'comite':
        return 'Aprovações - Comitê';
      case 'ti':
        return 'Aprovações - Validação TI';
      default:
        return 'Centro de Aprovações';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-primary" />
          {getLevelTitle()}
        </h1>
        <p className="text-muted-foreground">
          Demandas aguardando sua aprovação
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg max-w-sm">
        <CardContent className="p-8 text-center">
          <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-5xl font-bold text-foreground mb-2">{demands.length}</h3>
          <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
        </CardContent>
      </Card>

      {demands.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma demanda pendente de aprovação</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {demands.map((demand) => (
            <Card
              key={demand.id}
              className="bg-gradient-to-br from-card to-card/80 border-border hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-primary mb-1">
                      {demand.codigo}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {demand.empresa} - {demand.squad || demand.setor || demand.departamento}
                    </p>
                  </div>
                  <Badge 
                    className={`
                      ${demand.prioridade === 'Alta' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                      ${demand.prioridade === 'Média' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                      ${demand.prioridade === 'Baixa' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                      text-xs px-2 py-0.5 border
                    `}
                  >
                    {demand.prioridade}
                  </Badge>
                </div>

                <div className="mb-3">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Descrição:</h4>
                  <p className="text-foreground text-sm leading-relaxed">{demand.descricao}</p>
                </div>

                {demand.requisitos_funcionais && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Requisitos:</h4>
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {demand.requisitos_funcionais}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-background/60 p-2 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground mb-0.5">Horas Estimadas</p>
                    <p className="text-base font-bold text-primary">
                      {demand.horas_estimadas ? `${demand.horas_estimadas}h` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-background/60 p-2 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground mb-0.5">Custo Estimado</p>
                    <p className="text-base font-bold text-primary">
                      {demand.custo_estimado
                        ? `R$ ${demand.custo_estimado.toLocaleString('pt-BR')}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-background/60 p-2 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                    <p className="text-xs font-bold text-accent">
                      {demand.status === 'Backlog' && 'Backlog'}
                      {demand.status === 'Aguardando_Gerente' && 'Aguardando Gerente'}
                      {demand.status === 'Aguardando_Comite' && 'Aguardando Comitê'}
                      {demand.status === 'Aguardando_Validacao_TI' && 'Aguardando Validação TI'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start pt-4 border-t border-border/50">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-white hover:text-white/80 hover:bg-white/10 font-bold text-base px-8 border-white/30 shadow-md hover:shadow-lg transition-all"
                      >
                        Ação
                        <ChevronDown className="w-5 h-5 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start" 
                      className="w-48 bg-popover border-border z-50"
                    >
                      <DropdownMenuItem
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 cursor-pointer"
                        onClick={() => handleOpenApproval(demand, 'solicitar_insumos')}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Solicitar Insumos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                        onClick={() => handleOpenApproval(demand, 'recusar')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Recusar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 cursor-pointer"
                        onClick={() => handleOpenApproval(demand, 'aprovar')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedDemand && userLevel && (
        <ApprovalDialog
          demand={selectedDemand}
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          onSuccess={fetchPendingApprovals}
          level={userLevel}
          initialAction={initialAction}
        />
      )}
    </div>
  );
};

export default Aprovacoes;
