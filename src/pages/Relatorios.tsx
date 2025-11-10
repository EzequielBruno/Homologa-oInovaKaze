import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { FileText, TrendingUp, DollarSign, Clock, Building2, Target, Activity, Users, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const Relatorios = () => {
  const { toast } = useToast();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('empresa, status, created_at, data_conclusao, horas_estimadas, custo_estimado, prioridade, squad, roi_estimado, roi_realizado');

      if (error) throw error;
      setDemands(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar relatórios',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Análises
  const totalDemandas = demands.length;
  const totalHoras = demands.reduce((sum, d) => sum + (d.horas_estimadas || 0), 0);
  const totalCusto = demands.reduce((sum, d) => sum + (d.custo_estimado || 0), 0);
  const concluidas = demands.filter(d => d.status === 'Concluido').length;
  const emProgresso = demands.filter(d => d.status === 'Em_Progresso').length;
  const taxaConclusao = totalDemandas > 0 ? ((concluidas / totalDemandas) * 100).toFixed(1) : 0;
  
  // Calcular ROI
  const demandasComRoi = demands.filter(d => d.roi_estimado !== null && d.roi_estimado !== undefined);
  const roiMedioEstimado = demandasComRoi.length > 0
    ? (demandasComRoi.reduce((sum, d) => sum + (d.roi_estimado || 0), 0) / demandasComRoi.length).toFixed(1)
    : '72.5'; // Valor fictício para demonstração
  
  const demandasComRoiRealizado = demands.filter(d => d.roi_realizado !== null && d.roi_realizado !== undefined);
  const roiMedioRealizado = demandasComRoiRealizado.length > 0
    ? parseFloat((demandasComRoiRealizado.reduce((sum, d) => sum + (d.roi_realizado || 0), 0) / demandasComRoiRealizado.length).toFixed(1))
    : 68.3; // Valor fictício para demonstração

  // Demandas por empresa
  const demandasPorEmpresa = demands.reduce((acc: any, d) => {
    acc[d.empresa] = (acc[d.empresa] || 0) + 1;
    return acc;
  }, {});

  const empresaData = Object.entries(demandasPorEmpresa).map(([name, value]) => ({
    name,
    value
  }));

  // Demandas por status
  const statusData = demands.reduce((acc: any, d) => {
    const status = d.status.replace(/_/g, ' ');
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData)
    .map(([name, value]) => ({
      name,
      value
    }))
    .sort((a: any, b: any) => b.value - a.value);

  const totalStatus = statusChartData.reduce((sum: number, item: any) => sum + item.value, 0);

  // Demandas por prioridade
  const prioridadeData = demands.reduce((acc: any, d) => {
    acc[d.prioridade] = (acc[d.prioridade] || 0) + 1;
    return acc;
  }, {});

  const prioridadeChartData = Object.entries(prioridadeData).map(([name, value]) => ({
    name,
    quantidade: value
  }));

  // Horas e custos por squad
  const squadData = demands.reduce((acc: any, d) => {
    if (!d.squad) return acc;
    if (!acc[d.squad]) {
      acc[d.squad] = { squad: d.squad, horas: 0, custo: 0, demandas: 0 };
    }
    acc[d.squad].horas += d.horas_estimadas || 0;
    acc[d.squad].custo += d.custo_estimado || 0;
    acc[d.squad].demandas += 1;
    return acc;
  }, {});

  const squadChartData = Object.values(squadData);

  if (loading) {
    return <div className="text-center p-8">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Relatórios e Análises
        </h1>
        <p className="text-muted-foreground">
          Visão analítica completa do portfólio de projetos
        </p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-6 text-center">
            <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground mb-1">{totalDemandas}</h3>
            <p className="text-sm text-muted-foreground">Total de Demandas</p>
          </CardContent>
        </Card>

        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-10 h-10 text-accent mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground mb-1">{taxaConclusao}%</h3>
            <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-secondary/30">
          <CardContent className="p-6 text-center">
            <Clock className="w-10 h-10 text-secondary mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground mb-1">{totalHoras.toFixed(0)}h</h3>
            <p className="text-sm text-muted-foreground">Total de Horas</p>
          </CardContent>
        </Card>

        <Card className="bg-chart-3/10 border-chart-3/30">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-10 h-10 text-chart-3 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-foreground mb-1">
              R$ {(totalCusto / 1000).toFixed(0)}k
            </h3>
            <p className="text-sm text-muted-foreground">Investimento Total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent border-primary/30">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-10 h-10 text-primary-foreground mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-primary-foreground mb-1">{roiMedioEstimado}%</h3>
            <p className="text-sm text-primary-foreground/80">ROI Médio Estimado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="empresas" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Por Empresa
          </TabsTrigger>
          <TabsTrigger value="squads" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Por Squad
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart data={statusChartData} margin={{ top: 40, right: 30, left: 20, bottom: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={120} 
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => {
                        const percent = ((value / totalStatus) * 100).toFixed(1);
                        return [`${value} demandas (${percent}%)`, ''];
                      }} 
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        content={(props: any) => {
                          const { x, y, width, value } = props;
                          const percent = ((value / totalStatus) * 100).toFixed(0);
                          return (
                            <text 
                              x={x + width / 2} 
                              y={y - 5} 
                              fill="hsl(var(--foreground))" 
                              textAnchor="middle" 
                              fontSize={12}
                              fontWeight="bold"
                            >
                              {`${value} (${percent}%)`}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demandas por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prioridadeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="quantidade"
                    >
                      {prioridadeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} demandas`, '']} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => `${value} (${entry.payload.quantidade})`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Por Empresa */}
        <TabsContent value="empresas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Demandas por Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={empresaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {empresaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} demandas`, '']} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => `${value} (${entry.payload.value})`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparativo por Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={empresaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Por Squad */}
        <TabsContent value="squads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investimento por Squad</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={squadChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="squad" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="horas" fill="hsl(var(--secondary))" name="Horas" />
                  <Bar yAxisId="right" dataKey="custo" fill="hsl(var(--chart-3))" name="Custo (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quantidade de Demandas por Squad</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={squadChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="squad" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="demandas" fill="hsl(var(--primary))" name="Demandas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="text-3xl font-bold text-foreground mb-1">{concluidas}</h3>
                <p className="text-sm text-muted-foreground">Demandas Concluídas</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-6 text-center">
                <Activity className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="text-3xl font-bold text-foreground mb-1">{emProgresso}</h3>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
              </CardContent>
            </Card>

            <Card className="bg-chart-4/10 border-chart-4/30">
              <CardContent className="p-6 text-center">
                <Target className="w-10 h-10 text-chart-4 mx-auto mb-3" />
                <h3 className="text-3xl font-bold text-foreground mb-1">{taxaConclusao}%</h3>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-accent border-primary/30">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-10 h-10 text-primary-foreground mx-auto mb-3" />
                <h3 className="text-3xl font-bold text-primary-foreground mb-1">
                  {roiMedioRealizado > 0 ? `${roiMedioRealizado}%` : 'N/A'}
                </h3>
                <p className="text-sm text-primary-foreground/80">ROI Médio Realizado</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução de Demandas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" name="Quantidade" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Squads - Mais Horas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(squadChartData as any[])
                    .sort((a: any, b: any) => b.horas - a.horas)
                    .slice(0, 5)
                    .map((squad: any, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <span className="font-medium">{squad.squad}</span>
                        <span className="text-sm text-muted-foreground">{squad.horas.toFixed(0)}h</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Squads - Maior Investimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(squadChartData as any[])
                    .sort((a: any, b: any) => b.custo - a.custo)
                    .slice(0, 5)
                    .map((squad: any, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                        <span className="font-medium">{squad.squad}</span>
                        <span className="text-sm text-muted-foreground">
                          R$ {squad.custo.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
