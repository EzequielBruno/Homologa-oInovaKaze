import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, DollarSign, GitBranch, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EMPRESAS } from '@/types/demand';

interface EstimativaItem {
  id: string;
  codigo: string;
  empresa: string;
  departamento: string | null;
  setor: string | null;
  status: string;
  fases: number;
  horasEstimadas: number | null;
  custoEstimado: number | null;
  roiEstimado: number | null;
  complexidade: string;
}

const DEFAULT_HOURLY_RATE = 150;

const Estimativas = () => {
  const { toast } = useToast();
  const [estimativas, setEstimativas] = useState<EstimativaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEstimativas = useCallback(async () => {
    setLoading(true);
    try {
      const { data: demandsData, error: demandsError } = await supabase
        .from('demands')
        .select('id, codigo, empresa, departamento, setor, horas_estimadas, custo_estimado, roi_estimado, status')
        .not('status', 'eq', 'Recusado')
        .order('created_at', { ascending: false });

      if (demandsError) throw demandsError;

      const demandIds = demandsData?.map((demand) => demand.id) || [];
      const phasesMap = new Map<string, { count: number; totalHours: number }>();

      if (demandIds.length > 0) {
        const { data: phasesData, error: phasesError } = await supabase
          .from('phases')
          .select('demanda_id, horas_estimadas')
          .in('demanda_id', demandIds);

        if (phasesError) throw phasesError;

        phasesData?.forEach((phase) => {
          const current = phasesMap.get(phase.demanda_id) || { count: 0, totalHours: 0 };
          current.count += 1;
          current.totalHours += phase.horas_estimadas || 0;
          phasesMap.set(phase.demanda_id, current);
        });
      }

      const complexityMap = new Map<string, string>();

      if (demandIds.length > 0) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('technical_reviews' as any)
          .select('demand_id, complexidade, created_at')
          .in('demand_id', demandIds)
          .order('created_at', { ascending: false });

        if (!reviewsError && reviewsData) {
          reviewsData.forEach((review: any) => {
            if (!complexityMap.has(review.demand_id) && review.complexidade) {
              complexityMap.set(review.demand_id, review.complexidade);
            }
          });
        } else if (reviewsError) {
          console.warn('Não foi possível carregar pareceres técnicos:', reviewsError);
        }
      }

      const formattedEstimativas: EstimativaItem[] = (demandsData || [])
        .map((demand) => {
          const phaseInfo = phasesMap.get(demand.id) || { count: 0, totalHours: 0 };
          const horas = demand.horas_estimadas ?? (phaseInfo.count > 0 ? phaseInfo.totalHours : null);
          const custo = demand.custo_estimado ?? (horas !== null ? horas * DEFAULT_HOURLY_RATE : null);
          const complexidadeRaw = complexityMap.get(demand.id);

          return {
            id: demand.id,
            codigo: demand.codigo,
            empresa: demand.empresa,
            departamento: demand.departamento,
            setor: demand.setor || demand.departamento,
            status: demand.status,
            fases: phaseInfo.count,
            horasEstimadas: horas,
            custoEstimado: custo,
            roiEstimado: demand.roi_estimado,
            complexidade: normalizeComplexity(complexidadeRaw, horas, phaseInfo.count),
          };
        })
        .filter((item) => item.horasEstimadas !== null || item.custoEstimado !== null || item.fases > 0);

      setEstimativas(formattedEstimativas);
    } catch (error: any) {
      console.error('Error fetching estimativas:', error);
      toast({
        title: 'Erro ao carregar estimativas',
        description: error?.message || 'Não foi possível carregar as estimativas no momento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEstimativas();
  }, [fetchEstimativas]);

  const resumo = useMemo(() => {
    const totalHoras = estimativas.reduce((sum, est) => sum + (est.horasEstimadas || 0), 0);
    const totalCusto = estimativas.reduce((sum, est) => sum + (est.custoEstimado || 0), 0);
    const roiValues = estimativas
      .map((est) => est.roiEstimado)
      .filter((value): value is number => typeof value === 'number');
    const roiMedio = roiValues.length > 0
      ? roiValues.reduce((sum, value) => sum + value, 0) / roiValues.length
      : 0;
    const custoHoraMedio = totalHoras > 0 ? totalCusto / totalHoras : 0;

    return {
      totalHoras,
      totalCusto,
      custoHoraMedio,
      roiMedio,
    };
  }, [estimativas]);

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  if (estimativas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-accent" />
            Estimativas de Horas e Custos
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada de tempo e recursos necessários por demanda
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">
              Nenhuma estimativa disponível
            </p>
            <p className="text-muted-foreground">
              As estimativas serão exibidas assim que houver demandas com parecer técnico e faseamento definidos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-accent" />
          Estimativas de Horas e Custos
        </h1>
        <p className="text-muted-foreground">
          Análise detalhada de tempo e recursos necessários por demanda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {estimativas.map((est) => (
          <Card key={est.id} className="bg-gradient-card border-border hover:shadow-zema transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-primary">
                    {est.codigo}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{getEmpresaLabel(est.empresa)}</span>
                    {(est.setor || est.departamento) && (
                      <span className="text-xs">• {est.setor || est.departamento}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Status: {formatStatus(est.status)}
                  </p>
                </div>
                <Badge className={getComplexityColor(est.complexidade)}>
                  {est.complexidade}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <GitBranch className="w-4 h-4" />
                    <span className="text-sm">Fases</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{est.fases > 0 ? est.fases : 0}</p>
                </div>

                <div className="bg-background/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Horas</span>
                  </div>
                  <p className="text-2xl font-bold text-secondary">
                    {est.horasEstimadas !== null ? `${est.horasEstimadas.toLocaleString('pt-BR')}h` : '—'}
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-semibold">Custo Estimado</span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {est.custoEstimado
                    ? est.custoEstimado.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 2,
                      })
                    : '—'}
                </p>
              </div>

              <div className="bg-accent/10 p-4 rounded-lg border border-accent/30 mt-4">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-semibold">ROI Estimado</span>
                </div>
                <p className="text-3xl font-bold text-accent">
                  {typeof est.roiEstimado === 'number'
                    ? `${est.roiEstimado.toLocaleString('pt-BR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}%`
                    : '—'}
                </p>
              </div>

              <div className="text-sm text-muted-foreground mt-4">
                {est.horasEstimadas !== null ? (
                  <p>
                    Prazo estimado:{' '}
                    <span className="font-semibold text-foreground">
                      {Math.ceil(est.horasEstimadas / 8)} dias úteis
                    </span>
                  </p>
                ) : (
                  <p>Prazo estimado: —</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-accent text-primary-foreground">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Resumo Geral</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm opacity-90 mb-1">Total de Horas</p>
              <p className="text-3xl font-bold">
                {resumo.totalHoras.toLocaleString('pt-BR')}h
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Investimento Total</p>
              <p className="text-3xl font-bold">
                {resumo.totalCusto.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Média de Custo/Hora</p>
              <p className="text-3xl font-bold">
                {resumo.custoHoraMedio.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">ROI Médio Estimado</p>
              <p className="text-3xl font-bold">
                {resumo.roiMedio.toLocaleString('pt-BR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const getComplexityColor = (complexity: string) => {
  const normalized = complexity.toLowerCase();

  if (normalized.includes('alta')) {
    return 'bg-destructive/20 text-destructive';
  }

  if (normalized.includes('média') || normalized.includes('media')) {
    return 'bg-primary/20 text-primary';
  }

  if (normalized.includes('baixa')) {
    return 'bg-accent/20 text-accent';
  }

  return 'bg-muted text-muted-foreground';
};

const normalizeComplexity = (
  complexity: string | null | undefined,
  horas: number | null,
  fases: number
) => {
  if (complexity) {
    switch (complexity.toLowerCase()) {
      case 'alta':
        return 'Alta';
      case 'media':
      case 'média':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return complexity;
    }
  }

  if (horas === null) {
    return 'Não definida';
  }

  if (horas >= 160 || fases >= 5) {
    return 'Alta';
  }

  if (horas >= 80 || fases >= 3) {
    return 'Média';
  }

  return 'Baixa';
};

const getEmpresaLabel = (empresa: string) => {
  const match = EMPRESAS.find((item) => item.value === empresa);
  return match?.label ?? empresa;
};

const formatStatus = (status: string) => {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default Estimativas;
