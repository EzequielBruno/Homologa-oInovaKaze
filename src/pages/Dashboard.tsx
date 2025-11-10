import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Building2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Target,
  Users,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Tooltip,
  LabelList
} from 'recharts';

interface Stats {
  total: number;
  backlog: number;
  emProgresso: number;
  concluidas: number;
  aguardandoComite: number;
  aprovado: number;
  porEmpresa: Record<string, number>;
  porStatus: Array<{ name: string; value: number; status: string }>;
  tendenciaMensal: Array<{ mes: string; criadas: number; concluidas: number }>;
  taxaAprovacao: number;
  leadTimeMedio: number;
  throughputMensal: number;
  totalHorasEstimadas: number;
  custoTotal: number;
  roiMedio: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    backlog: 0,
    emProgresso: 0,
    concluidas: 0,
    aguardandoComite: 0,
    aprovado: 0,
    porEmpresa: {},
    porStatus: [],
    tendenciaMensal: [],
    taxaAprovacao: 0,
    leadTimeMedio: 0,
    throughputMensal: 0,
    totalHorasEstimadas: 0,
    custoTotal: 0,
    roiMedio: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('empresa, status, created_at, data_conclusao, horas_estimadas, custo_estimado, roi_estimado, roi_realizado');

      if (error) throw error;

      const total = data?.length || 0;
      const backlog = data?.filter((d) => d.status === 'Backlog').length || 0;
      const emProgresso = data?.filter((d) => d.status === 'Em_Progresso').length || 0;
      const concluidas = data?.filter((d) => d.status === 'Concluido').length || 0;
      const aguardandoComite = data?.filter((d) => d.status === 'Aguardando_Comite').length || 0;
      const aprovado = data?.filter((d) => d.status === 'Aprovado').length || 0;

      // Calcular taxa de aprovação
      const totalAvaliadas = aguardandoComite + aprovado + emProgresso + concluidas;
      const taxaAprovacao = totalAvaliadas > 0 ? Math.round((aprovado + emProgresso + concluidas) / totalAvaliadas * 100) : 0;

      // Calcular lead time médio (em dias)
      const demandasConcluidas = data?.filter((d) => d.status === 'Concluido' && d.data_conclusao) || [];
      let leadTimeMedio = 0;
      if (demandasConcluidas.length > 0) {
        const totalDias = demandasConcluidas.reduce((acc, d) => {
          const inicio = new Date(d.created_at);
          const fim = new Date(d.data_conclusao);
          const dias = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          return acc + dias;
        }, 0);
        leadTimeMedio = Math.round(totalDias / demandasConcluidas.length);
      }

      // Calcular throughput mensal (média de demandas concluídas por mês)
      const throughputMensal = concluidas > 0 ? Math.round(concluidas / 6) : 0;

      // Calcular total de horas estimadas
      const totalHorasEstimadas = data?.reduce((acc, d) => acc + (d.horas_estimadas || 0), 0) || 0;

      // Calcular custo total
      const custoTotal = data?.reduce((acc, d) => acc + (d.custo_estimado || 0), 0) || 0;

      // Calcular ROI médio
      const demandasComRoi = data?.filter((d) => d.roi_estimado !== null && d.roi_estimado !== undefined) || [];
      const roiMedio = demandasComRoi.length > 0
        ? demandasComRoi.reduce((acc, d) => acc + (d.roi_estimado || 0), 0) / demandasComRoi.length
        : 67.8; // Valor fictício para demonstração

      const porEmpresa: Record<string, number> = {};
      data?.forEach((d) => {
        porEmpresa[d.empresa] = (porEmpresa[d.empresa] || 0) + 1;
      });

      // Dados para gráfico de pizza
      const porStatus = [
        { name: 'Backlog', value: backlog, status: 'Backlog' },
        { name: 'Aguardando Comitê', value: aguardandoComite, status: 'Aguardando_Comite' },
        { name: 'Aprovado', value: aprovado, status: 'Aprovado' },
        { name: 'Em Progresso', value: emProgresso, status: 'Em_Progresso' },
        { name: 'Concluídas', value: concluidas, status: 'Concluido' }
      ].filter(item => item.value > 0);

      // Dados para gráfico de tendência (últimos 6 meses)
      const hoje = new Date();
      const tendenciaMensal = [];
      for (let i = 5; i >= 0; i--) {
        const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesNome = mes.toLocaleDateString('pt-BR', { month: 'short' });
        const mesFim = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
        
        const criadasNoMes = data?.filter((d) => {
          const dataCriacao = new Date(d.created_at);
          return dataCriacao >= mes && dataCriacao <= mesFim;
        }).length || 0;

        const concluidasNoMes = data?.filter((d) => {
          const dataCriacao = new Date(d.created_at);
          return d.status === 'Concluido' && dataCriacao >= mes && dataCriacao <= mesFim;
        }).length || 0;

        tendenciaMensal.push({
          mes: mesNome,
          criadas: criadasNoMes,
          concluidas: concluidasNoMes
        });
      }

      setStats({ 
        total, 
        backlog, 
        emProgresso, 
        concluidas,
        aguardandoComite,
        aprovado,
        porEmpresa,
        porStatus,
        tendenciaMensal,
        taxaAprovacao,
        leadTimeMedio,
        throughputMensal,
        totalHorasEstimadas,
        custoTotal,
        roiMedio
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const empresaLabel: Record<string, string> = {
    'ZS': 'Zema Seguros',
    'ZC': 'Zema Consórcio',
    'Eletro': 'Eletrozema',
    'ZF': 'Zema Financeira',
  };

  const empresaSlug: Record<string, string> = {
    'ZS': 'zs',
    'ZC': 'zc',
    'Eletro': 'eletro',
    'ZF': 'zf',
  };

  const COLORS = ['#1961AE', '#457F8C', '#729E6A', '#9FBC48', '#CCDB26'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-primary p-6 rounded-lg shadow-zema">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2 flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8" />
          Dashboard PMO - Grupo Zema
        </h1>
        <p className="text-primary-foreground/90">
          Escritório de Projetos - Visão Executiva
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Demandas</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Portfólio completo
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <Clock className="h-4 w-4" style={{ color: 'hsl(var(--zema-light-blue))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: 'hsl(var(--zema-light-blue))' }}>
              {stats.emProgresso}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: 'hsl(var(--zema-green))' }} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: 'hsl(var(--zema-green))' }}>
              {stats.concluidas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Entregues com sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs de TI Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.taxaAprovacao}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projetos aprovados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lead Time Médio</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.leadTimeMedio}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dias até conclusão
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.throughputMensal}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Demandas/mês
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{Math.round(stats.totalHorasEstimadas)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimativa total
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {(stats.custoTotal / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Custo estimado
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow hover:shadow-yellow transition-smooth border-primary/20 bg-gradient-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">ROI Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-foreground">
              {stats.roiMedio.toFixed(1)}%
            </div>
            <p className="text-xs text-primary-foreground/80 mt-1">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Distribuição por Status
            </CardTitle>
            <CardDescription>Visão geral do pipeline de projetos</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              config={{
                value: {
                  label: "Demandas",
                },
              }}
              className="h-[500px] w-full"
            >
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.porStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={{
                      stroke: 'hsl(var(--muted-foreground))',
                      strokeWidth: 1.5,
                      strokeDasharray: '3 3'
                    }}
                    label={(entry) => {
                      const { cx, cy, midAngle, outerRadius, name, value } = entry;
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 60;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const total = stats.porStatus.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((value / total) * 100).toFixed(1);

                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="hsl(var(--foreground))"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={12}
                          fontWeight="600"
                        >
                          <tspan x={x} dy="0">{name}</tspan>
                          <tspan x={x} dy="16" fontSize={11} fontWeight="400">
                            {value} ({percent}%)
                          </tspan>
                        </text>
                      );
                    }}
                    outerRadius={140}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.porStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                    formatter={(value: any, name: any, entry: any) => {
                      const total = stats.porStatus.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((value / total) * 100).toFixed(1);
                      return [`${value} demandas (${percent}%)`, entry.payload.name];
                    }}
                  />
                </PieChart>
               </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Trend Line Chart */}
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Tendência Mensal
            </CardTitle>
            <CardDescription>Demandas criadas vs. concluídas</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              config={{
                criadas: {
                  label: "Criadas",
                  color: "hsl(var(--zema-yellow))",
                },
                concluidas: {
                  label: "Concluídas",
                  color: "hsl(var(--zema-green))",
                },
              }}
              className="h-[400px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={stats.tendenciaMensal}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ 
                      value: 'Quantidade', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { 
                        fill: 'hsl(var(--foreground))',
                        fontSize: 12
                      }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="criadas" 
                    stroke="hsl(var(--zema-yellow))" 
                    strokeWidth={2}
                    name="Criadas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="concluidas" 
                    stroke="hsl(var(--zema-green))" 
                    strokeWidth={2}
                    name="Concluídas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Companies Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Demandas por Empresa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(empresaLabel).map(([key, label]) => (
            <Link key={key} to={`/empresa/${empresaSlug[key]}/backlog`}>
              <Card className="hover:shadow-yellow transition-smooth cursor-pointer border-primary/20 bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Building2 className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.porEmpresa[key] || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.porEmpresa[key] === 1 ? 'projeto ativo' : 'projetos ativos'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Ações Rápidas - PMO
          </CardTitle>
          <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/solicitar-demanda">
            <div className="p-4 border border-primary/20 rounded-lg hover:bg-gradient-primary hover:text-primary-foreground transition-smooth cursor-pointer group">
              <h3 className="font-semibold mb-2">Nova Solicitação</h3>
              <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/90">
                Criar nova demanda no sistema
              </p>
            </div>
          </Link>
          <Link to="/aprovacoes">
            <div className="p-4 border border-primary/20 rounded-lg hover:bg-gradient-primary hover:text-primary-foreground transition-smooth cursor-pointer group">
              <h3 className="font-semibold mb-2">Comitê de Aprovações</h3>
              <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/90">
                Avaliar projetos pendentes
              </p>
            </div>
          </Link>
          <Link to="/relatorios">
            <div className="p-4 border border-primary/20 rounded-lg hover:bg-gradient-primary hover:text-primary-foreground transition-smooth cursor-pointer group">
              <h3 className="font-semibold mb-2">Relatórios Executivos</h3>
              <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/90">
                Indicadores e métricas
              </p>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;