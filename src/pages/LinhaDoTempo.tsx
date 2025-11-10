import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Clock, User, FileText, AlertTriangle, MessageSquare, CheckCircle, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMPRESAS } from '@/types/demand';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'creation' | 'history' | 'risk' | 'review' | 'retrospective' | 'form_response' | 'assignment' | 'approval';
  title: string;
  description: string;
  user?: string;
  metadata?: any;
}

export default function LinhaDoTempo() {
  const { empresa } = useParams<{ empresa: string }>();
  const empresaSelecionada = empresa?.toUpperCase() || '';
  const [demandas, setDemandas] = useState<any[]>([]);
  const [selectedDemand, setSelectedDemand] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  const handleDownloadFile = async (fileUrl: string) => {
    try {
      const fileName = fileUrl.split('/').pop() || 'arquivo';
      const { data, error } = await supabase.storage
        .from('demand-documents')
        .download(fileName);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Arquivo baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const isFileUrl = (text: string) => {
    return text && (text.includes('/demand-documents/') || text.startsWith('http'));
  };

  useEffect(() => {
    loadDemands();
  }, [empresaSelecionada]);

  useEffect(() => {
    if (selectedDemand) {
      loadTimeline();
    }
  }, [selectedDemand]);

  const loadDemands = async () => {
    const { data, error } = await supabase
      .from('demands')
      .select('id, codigo, descricao')
      .eq('empresa', empresaSelecionada as 'ZC' | 'Eletro' | 'ZF' | 'ZS')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar demandas');
      return;
    }

    setDemandas(data || []);
  };

  const loadTimeline = async () => {
    if (!selectedDemand) return;
    
    setLoading(true);
    try {
      const events: TimelineEvent[] = [];

      // Carregar dados da demanda
      const { data: demand } = await supabase
        .from('demands')
        .select('*')
        .eq('id', selectedDemand)
        .single();

      if (demand) {
        // Evento de criação
        events.push({
          id: `creation-${demand.id}`,
          timestamp: demand.created_at,
          type: 'creation',
          title: 'Demanda Criada',
          description: `Demanda ${demand.codigo} criada`,
          user: demand.solicitante_id,
          metadata: demand,
        });

        // Histórico de alterações
        const { data: history } = await supabase
          .from('demand_history')
          .select('*')
          .eq('demand_id', selectedDemand)
          .order('created_at', { ascending: true });

        history?.forEach(h => {
          events.push({
            id: h.id,
            timestamp: h.created_at,
            type: 'history',
            title: getActionLabel(h.action),
            description: h.descricao,
            user: h.user_id,
            metadata: { dados_anteriores: h.dados_anteriores, dados_novos: h.dados_novos },
          });
        });

        // Avaliações de risco
        const { data: risks } = await supabase
          .from('risk_assessments')
          .select('*')
          .eq('demand_id', selectedDemand)
          .order('created_at', { ascending: true });

        risks?.forEach(r => {
          events.push({
            id: r.id,
            timestamp: r.created_at,
            type: 'risk',
            title: 'Avaliação de Risco',
            description: `Índice de risco: ${r.indice_risco.toFixed(0)} - ${r.status}`,
            user: r.manager_id,
            metadata: r,
          });
        });

        // Respostas de formulário
        const { data: responses } = await supabase
          .from('form_responses')
          .select(`
            *,
            form_questions (texto)
          `)
          .eq('demand_id', selectedDemand);

        responses?.forEach(r => {
          events.push({
            id: r.id,
            timestamp: r.created_at,
            type: 'form_response',
            title: 'Resposta de Formulário',
            description: `${r.form_questions?.texto}: ${r.resposta}`,
            metadata: r,
          });
        });

        // Aprovações
        const { data: approvals } = await supabase
          .from('demand_approvals')
          .select('*')
          .eq('demand_id', selectedDemand)
          .order('created_at', { ascending: true });

        approvals?.forEach(a => {
          events.push({
            id: a.id,
            timestamp: a.created_at,
            type: 'approval',
            title: `Aprovação ${a.approval_level}`,
            description: `Status: ${a.status}${a.motivo_recusa ? ` - ${a.motivo_recusa}` : ''}`,
            user: a.approver_id,
            metadata: a,
          });
        });

        // Atribuições
        const { data: assignments } = await supabase
          .from('demand_assignments')
          .select('*')
          .eq('demand_id', selectedDemand)
          .order('created_at', { ascending: true });

        assignments?.forEach(a => {
          events.push({
            id: a.id,
            timestamp: a.created_at,
            type: 'assignment',
            title: 'Atribuição de Tarefa',
            description: `Sprint ${a.sprint_number}${a.faseamento_completo ? ' - Faseamento completo' : ''}`,
            user: a.assigned_by,
            metadata: a,
          });
        });
      }

      // Ordenar eventos por data
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Carregar perfis dos usuários
      const userIds = [...new Set(events.map(e => e.user).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profilesMap: Record<string, any> = {};
        profilesData?.forEach(p => {
          profilesMap[p.id] = p;
        });
        setProfiles(profilesMap);
      }

      setTimeline(events);
    } catch (error) {
      console.error('Error loading timeline:', error);
      toast.error('Erro ao carregar linha do tempo');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'criacao': 'Criação',
      'edicao': 'Edição',
      'mudanca_status': 'Mudança de Status',
      'atribuicao': 'Atribuição',
      'comentario': 'Comentário',
      'aprovacao': 'Aprovação',
      'reprovacao': 'Reprovação',
    };
    return labels[action] || action;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <FileText className="h-5 w-5" />;
      case 'history':
        return <Clock className="h-5 w-5" />;
      case 'risk':
        return <AlertTriangle className="h-5 w-5" />;
      case 'review':
      case 'retrospective':
        return <MessageSquare className="h-5 w-5" />;
      case 'form_response':
        return <FileText className="h-5 w-5" />;
      case 'assignment':
        return <User className="h-5 w-5" />;
      case 'approval':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'creation':
        return 'bg-blue-500';
      case 'history':
        return 'bg-gray-500';
      case 'risk':
        return 'bg-red-500';
      case 'review':
      case 'retrospective':
        return 'bg-purple-500';
      case 'form_response':
        return 'bg-green-500';
      case 'assignment':
        return 'bg-orange-500';
      case 'approval':
        return 'bg-teal-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Linha do Tempo - {EMPRESAS.find(e => e.value === empresaSelecionada)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione uma Demanda</label>
              <Select value={selectedDemand} onValueChange={setSelectedDemand}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma demanda..." />
                </SelectTrigger>
                <SelectContent>
                  {demandas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.codigo} - {d.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Carregando linha do tempo...</p>
          </CardContent>
        </Card>
      ) : timeline.length > 0 ? (
        <Card>
          <CardContent className="py-6">
            <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-8">
                {timeline.map((event, index) => (
                  <div key={event.id} className="relative flex gap-6">
                    {/* Ícone do evento */}
                    <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full ${getEventColor(event.type)} text-white flex-shrink-0`}>
                      {getEventIcon(event.type)}
                    </div>

                    {/* Conteúdo do evento */}
                    <div className="flex-1 pb-8">
                      <div className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(event.timestamp), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                        </div>

                        <Separator className="my-3" />

                        {/* Descrição com botão de download se for arquivo */}
                        {event.type === 'form_response' && event.metadata?.resposta ? (
                          isFileUrl(event.metadata.resposta) ? (
                            <div className="flex items-center gap-2 mb-3">
                              <p className="text-sm flex-1">{event.description}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadFile(event.metadata.resposta)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Baixar Arquivo
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm mb-3">{event.description}</p>
                          )
                        ) : (
                          <p className="text-sm mb-3">{event.description}</p>
                        )}

                        {event.user && profiles[event.user] && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {profiles[event.user].full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{profiles[event.user].full_name}</span>
                          </div>
                        )}

                        {/* Detalhes adicionais baseados no tipo */}
                        {event.type === 'risk' && event.metadata && (
                          <div className="mt-3 p-3 bg-muted rounded-md text-sm space-y-1">
                            <p><strong>Probabilidade:</strong> {event.metadata.probabilidade}</p>
                            <p><strong>Impacto:</strong> {event.metadata.impacto}</p>
                            <p><strong>Resposta:</strong> {event.metadata.resposta_risco}</p>
                            {event.metadata.acoes_mitigadoras && (
                              <p><strong>Ações:</strong> {event.metadata.acoes_mitigadoras}</p>
                            )}
                          </div>
                        )}

                        {event.type === 'history' && event.metadata?.dados_novos && (
                          <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                            <p className="font-semibold mb-1">Alterações:</p>
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(event.metadata.dados_novos, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : selectedDemand ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Nenhum evento encontrado para esta demanda</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
