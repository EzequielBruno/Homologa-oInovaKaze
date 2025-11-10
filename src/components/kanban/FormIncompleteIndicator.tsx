import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FormIncompleteIndicatorProps {
  demandId: string;
  empresa: string;
  squad: string | null;
}

export const FormIncompleteIndicator = ({ demandId, empresa, squad }: FormIncompleteIndicatorProps) => {
  const [status, setStatus] = useState<{
    hasForm: boolean;
    totalQuestions: number;
    answeredQuestions: number;
    isComplete: boolean;
    loading: boolean;
  }>({
    hasForm: false,
    totalQuestions: 0,
    answeredQuestions: 0,
    isComplete: true,
    loading: true,
  });

  useEffect(() => {
    checkFormCompleteness();
  }, [demandId, empresa, squad]);

  const checkFormCompleteness = async () => {
    try {
      // Buscar formulário personalizado da empresa/squad
      const { data: formData } = await supabase
        .from('custom_squad_forms')
        .select('id')
        .eq('empresa', empresa)
        .eq('squad', squad || '')
        .eq('ativo', true)
        .maybeSingle();

      if (!formData) {
        setStatus({
          hasForm: false,
          totalQuestions: 0,
          answeredQuestions: 0,
          isComplete: true,
          loading: false,
        });
        return;
      }

      // Buscar TODAS as perguntas do formulário
      const { data: allQuestions } = await supabase
        .from('form_questions')
        .select('id, obrigatoria')
        .eq('form_id', formData.id);

      if (!allQuestions || allQuestions.length === 0) {
        setStatus({
          hasForm: true,
          totalQuestions: 0,
          answeredQuestions: 0,
          isComplete: true,
          loading: false,
        });
        return;
      }

      // Buscar respostas fornecidas
      const { data: responses } = await supabase
        .from('form_responses')
        .select('question_id, resposta')
        .eq('demand_id', demandId);

      const answeredQuestionIds = new Set(
        (responses || [])
          .filter(r => r.resposta && r.resposta.trim() !== '')
          .map(r => r.question_id)
      );

      // Verificar perguntas obrigatórias não respondidas
      const mandatoryQuestions = allQuestions.filter(q => q.obrigatoria);
      const unansweredMandatory = mandatoryQuestions.filter(
        q => !answeredQuestionIds.has(q.id)
      );

      setStatus({
        hasForm: true,
        totalQuestions: allQuestions.length,
        answeredQuestions: answeredQuestionIds.size,
        isComplete: unansweredMandatory.length === 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking form completeness:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  if (status.loading) {
    return null;
  }

  if (!status.hasForm || status.totalQuestions === 0) {
    return null;
  }

  const percentage = Math.round((status.answeredQuestions / status.totalQuestions) * 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={status.isComplete ? 'default' : 'destructive'}
            className="text-xs gap-1 cursor-help"
          >
            {status.isComplete ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {percentage}% Form
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">
              {status.isComplete ? 'Formulário completo' : 'Formulário incompleto'}
            </p>
            <p className="text-xs">
              {status.answeredQuestions} de {status.totalQuestions} perguntas respondidas
            </p>
            {!status.isComplete && (
              <p className="text-xs text-destructive">
                Algumas perguntas obrigatórias não foram respondidas
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
