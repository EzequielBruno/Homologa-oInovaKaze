import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DemandDialog from '@/components/demands/DemandDialog';

const Planning = () => {
  const { toast } = useToast();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchApprovedDemands();
  }, []);

  const fetchApprovedDemands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('status', 'Aprovado')
        .order('prioridade', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDemands(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar demandas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartDemand = async (demand: any) => {
    try {
      const { error } = await supabase
        .from('demands')
        .update({
          status: 'Em_Progresso',
          data_inicio: new Date().toISOString(),
        })
        .eq('id', demand.id);

      if (error) throw error;

      toast({
        title: 'Demanda iniciada!',
        description: `A demanda ${demand.codigo} foi movida para Em Progresso.`,
      });

      fetchApprovedDemands();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Crítica': return 'bg-destructive text-destructive-foreground';
      case 'Alta': return 'bg-orange-500 text-white';
      case 'Média': return 'bg-yellow-500 text-white';
      case 'Baixa': return 'bg-blue-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary" />
          Planning - Planejamento de Sprint
        </h1>
        <p className="text-muted-foreground">
          Organize e priorize as demandas aprovadas para a próxima sprint
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-6 text-center">
            <Target className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground mb-1">{demands.length}</h3>
            <p className="text-sm text-muted-foreground">Demandas Aprovadas</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-secondary/30">
          <CardContent className="p-6 text-center">
            <Calendar className="w-10 h-10 text-secondary mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {demands.reduce((sum, d) => sum + (d.horas_estimadas || 0), 0)}h
            </h3>
            <p className="text-sm text-muted-foreground">Total de Horas</p>
          </CardContent>
        </Card>

        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="p-6 text-center">
            <Users className="w-10 h-10 text-accent mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {new Set(demands.map(d => d.squad)).size}
            </h3>
            <p className="text-sm text-muted-foreground">Squads Envolvidas</p>
          </CardContent>
        </Card>
      </div>

      {demands.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma demanda aprovada disponível para planning</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {demands.map((demand) => (
            <Card key={demand.id} className="bg-gradient-card border-border hover:shadow-zema transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl font-bold text-primary">
                        {demand.codigo}
                      </CardTitle>
                      <Badge className={getPriorityColor(demand.prioridade)}>
                        {demand.prioridade}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {demand.empresa} - {demand.squad}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solicitante: {demand.solicitante?.full_name || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground">{demand.descricao}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Horas Estimadas</p>
                    <p className="text-lg font-bold text-secondary">
                      {demand.horas_estimadas || 'N/A'}h
                    </p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Custo</p>
                    <p className="text-lg font-bold text-primary">
                      {demand.custo_estimado ? `R$ ${demand.custo_estimado.toLocaleString('pt-BR')}` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Prazo</p>
                    <p className="text-lg font-bold text-foreground">
                      {demand.horas_estimadas ? `${Math.ceil(demand.horas_estimadas / 8)} dias` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Sprint</p>
                    <p className="text-lg font-bold text-accent">
                      {demand.sprint_atual || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDemand(demand);
                      setDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => handleStartDemand(demand)}
                  >
                    Iniciar na Sprint
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DemandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        demand={selectedDemand}
        onSuccess={fetchApprovedDemands}
      />
    </div>
  );
};

export default Planning;
