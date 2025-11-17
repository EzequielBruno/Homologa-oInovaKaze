import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSearch, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ParecerTecnicoDialog } from './ParecerTecnicoDialog';
import { useDemandHistory } from '@/hooks/useDemandHistory';

const PareceresPendentes = () => {
  const { toast } = useToast();
  const { logAction } = useDemandHistory();
  const [pareceres, setPareceres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParecer, setSelectedParecer] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPareceresPendentes();
  }, []);

  const fetchPareceresPendentes = async () => {
    setLoading(true);
    try {
      // Busca demandas aguardando parecer técnico
      const { data: demands, error } = await supabase
        .from('demands')
        .select('*')
        .eq('status', 'Aguardando_Validacao_TI' as any)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Busca os dados dos solicitantes
      const solicitanteIds = demands?.map(d => d.solicitante_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', solicitanteIds);

      // Mapeia os solicitantes
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const pareceresList = demands?.map(d => ({
        ...d,
        solicitante: profilesMap.get(d.solicitante_id),
        dias: Math.floor((new Date().getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }));

      setPareceres(pareceresList || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar pareceres',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    action: 'solicitar_insumo' | 'recusar' | 'aprovar',
    comentario: string,
    phases?: any[]
  ) => {
    if (!selectedParecer) return;

    try {
      let newStatus = selectedParecer.status;
      let updateData: any = {};

      if (action === 'aprovar') {
        if (!phases || phases.length === 0) {
          toast({
            title: 'Faseamento obrigatório',
            description: 'Para aprovar, é necessário criar o faseamento da demanda',
            variant: 'destructive',
          });
          return;
        }

        // Move para Aguardando GP após avaliação TI
        newStatus = 'Aguardando_Gerente';
        const totalHoras = phases.reduce((sum, p) => sum + (p.horas || 0), 0);
        updateData = {
          status: newStatus,
          horas_estimadas: totalHoras,
          custo_estimado: totalHoras * 150,
        };

        // Insere as fases
        const { error: phasesError } = await supabase
          .from('phases')
          .insert(
            phases.map((phase, index) => ({
              demanda_id: selectedParecer.id,
              fase_numero: index + 1,
              nome_fase: phase.nome,
              descricao_fase: phase.descricao,
              horas_estimadas: phase.horas,
              ordem_execucao: index + 1,
              status: 'Backlog' as any,
            }))
          );

        if (phasesError) throw phasesError;
      } else if (action === 'recusar') {
        newStatus = 'Recusado';
        updateData = { status: newStatus };
      } else if (action === 'solicitar_insumo') {
        newStatus = 'Aguardando_Insumos';
        updateData = { status: newStatus };
      }

      const { error } = await supabase
        .from('demands')
        .update(updateData)
        .eq('id', selectedParecer.id);

      if (error) throw error;

      // Log da ação
      await logAction({
        demandId: selectedParecer.id,
        action: action === 'aprovar' ? 'aprovar_ti' : action === 'recusar' ? 'recusar_ti' : 'solicitar_insumo',
        descricao: `${action === 'aprovar' ? 'Aprovado' : action === 'recusar' ? 'Recusado' : 'Solicitado insumo'} pela TI: ${comentario}`,
        dadosAnteriores: { status: selectedParecer.status },
        dadosNovos: { status: newStatus, comentario, ...(phases && { faseamento: phases }) },
      });

      toast({
        title: 'Parecer técnico registrado',
        description: `Demanda ${action === 'aprovar' ? 'aprovada' : action === 'recusar' ? 'recusada' : 'com solicitação de insumo'}`,
      });

      setDialogOpen(false);
      setSelectedParecer(null);
      fetchPareceresPendentes();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileSearch className="w-8 h-8 text-primary" />
          Pareceres Técnicos Pendentes
        </h1>
        <p className="text-muted-foreground">
          Demandas aguardando análise e parecer técnico da equipe de TI
        </p>
      </div>

      {pareceres.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum parecer técnico pendente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pareceres.map((parecer) => (
            <Card key={parecer.id} className="bg-gradient-card border-border hover:shadow-zema transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-primary mb-2">
                      {parecer.codigo}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {parecer.empresa} - {parecer.departamento}
                    </p>
                  </div>
                  <Badge className="bg-primary/20 text-primary">
                    <Clock className="w-3 h-3 mr-1" />
                    {parecer.dias} dias
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição:</p>
                  <p className="text-foreground">{parecer.descricao}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Solicitante:</p>
                  <p className="text-foreground">{parecer.solicitante?.full_name || 'N/A'}</p>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setSelectedParecer(parecer);
                    setDialogOpen(true);
                  }}
                >
                  Elaborar Parecer Técnico
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ParecerTecnicoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parecer={selectedParecer}
        onAction={handleAction}
      />
    </div>
  );
};

export default PareceresPendentes;
