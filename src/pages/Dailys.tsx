import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { SQUADS } from '@/types/demand';
import { useDemandHistory } from '@/hooks/useDemandHistory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyUpdate {
  id: string;
  demand_id: string;
  update_text: string;
  created_by: string;
  created_at: string;
  demands: {
    codigo: string;
    empresa: string;
    squad: string | null;
    descricao: string;
  };
  author_name?: string;
}

const Dailys = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const permissions = useUserPermissions();
  const { logAction } = useDemandHistory();
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [selectedDemand, setSelectedDemand] = useState('');
  const [updateText, setUpdateText] = useState('');
  
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('all');
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [availableSquads, setAvailableSquads] = useState<string[]>([]);
  
  const empresas = ['ZS', 'ZC', 'Eletro', 'ZF'];

  useEffect(() => {
    loadSquads();
  }, [selectedEmpresa]);

  useEffect(() => {
    loadData();
  }, [selectedEmpresa, selectedSquad]);

  const loadSquads = async () => {
    if (selectedEmpresa === 'all') {
      // Carregar todas as squads de todas as empresas
      try {
        const allSquads = new Set<string>();
        
        for (const emp of empresas) {
          const defaultSquads = SQUADS[emp] || [];
          
          const { data: customSquads } = await supabase
            .from('squads')
            .select('nome')
            .eq('empresa', emp)
            .eq('ativo', true);

          const { data: inactiveSquads } = await supabase
            .from('squads')
            .select('nome')
            .eq('empresa', emp)
            .eq('ativo', false);

          const inactiveSet = new Set(inactiveSquads?.map(s => s.nome) || []);
          const activeDefaults = defaultSquads.filter(s => !inactiveSet.has(s));
          const customs = customSquads?.map(s => s.nome) || [];
          
          [...activeDefaults, ...customs].forEach(s => allSquads.add(s));
        }
        
        setAvailableSquads(['Avaliar', ...Array.from(allSquads).sort()]);
      } catch (error) {
        console.error('Erro ao carregar squads:', error);
        setAvailableSquads(['Avaliar']);
      }
    } else {
      // Carregar squads da empresa específica
      try {
        const defaultSquads = SQUADS[selectedEmpresa] || [];
        
        const { data: customSquads } = await supabase
          .from('squads')
          .select('nome')
          .eq('empresa', selectedEmpresa)
          .eq('ativo', true);

        const { data: inactiveSquads } = await supabase
          .from('squads')
          .select('nome')
          .eq('empresa', selectedEmpresa)
          .eq('ativo', false);

        const inactiveSet = new Set(inactiveSquads?.map(s => s.nome) || []);
        const activeDefaults = defaultSquads.filter(s => !inactiveSet.has(s));
        const customs = customSquads?.map(s => s.nome) || [];
        const combined = [...activeDefaults, ...customs];
        
        setAvailableSquads(['Avaliar', ...Array.from(new Set(combined)).sort()]);
      } catch (error) {
        console.error('Erro ao carregar squads:', error);
        setAvailableSquads(['Avaliar', ...(SQUADS[selectedEmpresa] || [])]);
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Carrega updates com filtros
      let query = supabase
        .from('daily_updates' as any)
        .select(`
          *,
          demands!inner (codigo, empresa, squad, descricao)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Aplica filtros
      if (selectedEmpresa !== 'all') {
        query = query.eq('demands.empresa', selectedEmpresa as any);
      }
      if (selectedSquad !== 'all') {
        query = query.eq('demands.squad', selectedSquad);
      }

      const { data: updatesData, error: updatesError } = await query;

      if (updatesError) throw updatesError;

      // Busca os nomes dos usuários
      if (updatesData && updatesData.length > 0) {
        const userIds = [...new Set(updatesData.map((u: any) => u.created_by))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
        
        const updatesWithAuthors = updatesData.map((update: any) => ({
          ...update,
          author_name: profilesMap.get(update.created_by) || 'Usuário'
        }));
        
        setUpdates(updatesWithAuthors as any || []);
      } else {
        setUpdates([]);
      }

      // Carrega todas as demandas em progresso e em validação
      const { data: demandsData, error: demandsError } = await supabase
        .from('demands')
        .select('id, codigo, descricao, empresa, squad, status')
        .or('status.eq.Em_Progresso,status.eq.Aguardando_Validacao_TI,status.eq.Revisao')
        .order('codigo');

      if (demandsError) throw demandsError;
      setDemands(demandsData || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!selectedDemand || !updateText.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    try {
      const selectedDemandData = demands.find((demand) => demand.id === selectedDemand);
      const { error } = await supabase
        .from('daily_updates' as any)
        .insert({
          demand_id: selectedDemand,
          update_text: updateText.trim(),
          created_by: user?.id,
        });

      if (error) throw error;

      await logAction({
        demandId: selectedDemand,
        action: 'registrar_daily',
        descricao: selectedDemandData
          ? `Atualização diária registrada para a demanda ${selectedDemandData.codigo}.`
          : 'Atualização diária registrada.',
        dadosNovos: {
          update_text: updateText.trim(),
        },
      });

      toast({
        title: 'Sucesso',
        description: 'Atualização registrada',
      });

      setDialogOpen(false);
      setSelectedDemand('');
      setUpdateText('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar atualização',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  // Apenas membros do comitê, tech leads e admins podem adicionar updates
  const canAddUpdate = permissions.canApprove;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Atualização Demanda em Progresso
          </h1>
          <p className="text-muted-foreground">
            Acompanhe as atualizações diárias das demandas em progresso
          </p>
        </div>

        {canAddUpdate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nova Atualização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Atualização Daily</DialogTitle>
                <DialogDescription>
                  Registre o progresso de uma demanda em andamento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demand-select">Demanda</Label>
                  <Select value={selectedDemand} onValueChange={setSelectedDemand}>
                    <SelectTrigger id="demand-select">
                      <SelectValue placeholder="Selecione a demanda" />
                    </SelectTrigger>
                    <SelectContent>
                      {demands.map((demand) => (
                        <SelectItem key={demand.id} value={demand.id}>
                          {demand.codigo} - {demand.descricao.substring(0, 50)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update-text">Atualização</Label>
                  <Textarea
                    id="update-text"
                    placeholder="Descreva o progresso, bloqueios ou próximos passos..."
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {updateText.length}/500 caracteres
                  </p>
                </div>

                <Button onClick={handleAddUpdate} className="w-full">
                  Registrar Atualização
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Últimas Atualizações
            </CardTitle>
            
            <div className="flex gap-2">
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Empresas</SelectItem>
                  {empresas.map(emp => (
                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSquad} onValueChange={setSelectedSquad}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Squad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Squads</SelectItem>
                  {availableSquads.map(squad => (
                    <SelectItem key={squad} value={squad}>{squad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma atualização registrada</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {updates.map((update) => (
                  <Card key={update.id} className="bg-background/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="font-mono">
                              {update.demands.codigo}
                            </Badge>
                            <Badge variant="outline">
                              {update.demands.empresa}
                            </Badge>
                            {update.demands.squad && (
                              <Badge variant="outline" className="text-xs">
                                {update.demands.squad}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {update.demands.descricao}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {format(new Date(update.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg mb-2">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {update.update_text}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Por:</span>
                        <span className="font-medium">{update.author_name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dailys;
