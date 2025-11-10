import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCustomFormResponses } from '@/hooks/useCustomFormResponses';
import { Edit, Trash2, Clock, DollarSign, Archive, MoreVertical, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

interface DemandCardProps {
  demand: any;
  onEdit?: (demand: any) => void;
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
}

const DemandCard = ({ demand, onEdit, onDelete, onUpdate }: DemandCardProps) => {
  const { responses, questions } = useCustomFormResponses(demand.id);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Crítica': 'bg-red-500 hover:bg-red-600',
      'Alta': 'bg-orange-500 hover:bg-orange-600',
      'Média': 'bg-yellow-500 hover:bg-yellow-600',
      'Baixa': 'bg-green-500 hover:bg-green-600',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Backlog': 'bg-slate-500',
      'Aprovado_GP': 'status-badge-evaluation',
      'Aguardando_Comite': 'status-badge-committee',
      'Aprovado': 'status-badge-approved',
      'Em_Progresso': 'status-badge-in-progress',
      'Revisao': 'bg-orange-500',
      'Concluido': 'status-badge-completed',
      'StandBy': 'bg-gray-500',
      'Bloqueado': 'bg-red-600',
      'Nao_Entregue': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatStatus = (status: string) => {
    const statusLabels: Record<string, string> = {
      'Backlog': 'Backlog',
      'Aprovado_GP': 'Aprovado GP',
      'Aguardando_Comite': 'Aguardando Comitê',
      'Aprovado': 'Aprovado',
      'Em_Progresso': 'Em Progresso',
      'Revisao': 'Revisão',
      'Concluido': 'Concluído',
      'StandBy': 'Stand By',
      'Bloqueado': 'Bloqueado',
      'Nao_Entregue': 'Não Entregue',
      'Arquivado': 'Arquivado',
    };
    return statusLabels[status] || status.replace(/_/g, ' ');
  };

  const handleArquivar = async () => {
    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: 'Arquivado' as any })
        .eq('id', demand.id);

      if (error) throw error;

      // Log action
      await supabase.from('demand_history').insert({
        demand_id: demand.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'arquivar',
        descricao: `Demanda ${demand.codigo} foi arquivada`,
        dados_anteriores: { status: demand.status },
        dados_novos: { status: 'Arquivado' },
      });

      toast({
        title: 'Sucesso',
        description: 'Demanda arquivada',
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error archiving demand:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao arquivar demanda',
        variant: 'destructive',
      });
    }
  };

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
      
      sonnerToast.success('Arquivo baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading file:', error);
      sonnerToast.error('Erro ao baixar arquivo');
    }
  };

  const isFileUrl = (text: string) => {
    return text && (text.includes('/demand-documents/') || text.startsWith('http'));
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-lg font-bold text-primary">
            {demand.codigo}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge className={getPriorityColor(demand.prioridade)}>
              {demand.prioridade}
            </Badge>
            <Badge className={getStatusColor(demand.status)} variant="outline">
              {formatStatus(demand.status)}
            </Badge>
            {demand.regulatorio && (
              <Badge variant="destructive">Regulatório</Badge>
            )}
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(demand)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {demand.status !== 'Arquivado' && (
                  <DropdownMenuItem onClick={handleArquivar}>
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(demand.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {demand.empresa} - {demand.setor || demand.departamento}
          </p>
          {demand.squad && (
            <p className="text-xs text-primary font-medium flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Squad: {demand.squad}
            </p>
          )}
        </div>
        <p className="text-sm text-foreground line-clamp-3">
          {demand.descricao}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          {demand.horas_estimadas && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {demand.horas_estimadas}h
            </div>
          )}
          {demand.custo_estimado && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              R$ {demand.custo_estimado.toLocaleString('pt-BR')}
            </div>
          )}
        </div>
        {demand.created_at && (
          <p className="text-xs text-muted-foreground">
            Criado em {format(new Date(demand.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        )}

        {/* Respostas do formulário personalizado */}
        {questions.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <p className="font-semibold text-sm">Formulário Personalizado da Squad:</p>
            {questions.map((question: any, index: number) => {
              const answer = responses[question.id] || 'Não respondido';
              const isFile = isFileUrl(answer);
              
              return (
                <div key={question.id} className="text-sm">
                  <span className="font-medium">{index + 1}. {question.texto}:</span>{' '}
                  {isFile ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground flex-1">{answer.split('/').pop()}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadFile(answer)}
                        className="h-6 px-2"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{answer}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DemandCard;
