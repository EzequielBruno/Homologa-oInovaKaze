import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Layers, CheckCircle } from 'lucide-react';
import { ApprovalDialog } from '@/components/demands/ApprovalDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useDemandHistory } from '@/hooks/useDemandHistory';

const Backlog = () => {
  const { user } = useAuth();
  const { logAction } = useDemandHistory();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  useEffect(() => {
    fetchBacklogDemands();
  }, []);

  const fetchBacklogDemands = async () => {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('status', 'Backlog')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDemands(data || []);
    } catch (error) {
      console.error('Error fetching backlog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarAprovacao = (demand: any) => {
    setSelectedDemand(demand);
    setApprovalDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Layers className="w-8 h-8 text-primary" />
          Backlog
        </h1>
        <p className="text-muted-foreground">
          Demandas aguardando priorização e planejamento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demands.map((demand) => (
          <Card key={demand.id} className="bg-gradient-card border-border hover:shadow-zema transition-smooth">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-primary">
                {demand.codigo}
              </CardTitle>
              <Badge className="w-fit">
                {demand.prioridade}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">
                {demand.empresa} - {demand.setor || demand.departamento}
              </p>
              <p className="text-foreground line-clamp-3 text-sm">
                {demand.descricao}
              </p>
              <Button
                onClick={() => handleSolicitarAprovacao(demand)}
                className="w-full bg-accent hover:bg-accent/90"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovação Gerente de Projeto
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedDemand && (
        <ApprovalDialog
          demand={selectedDemand}
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          onSuccess={fetchBacklogDemands}
          level="gerente"
        />
      )}
    </div>
  );
};

export default Backlog;
