import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCustomFormResponses = (demandId: string | undefined) => {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResponses = async () => {
      if (!demandId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Primeiro, buscar a demanda para saber a empresa e squad
        const { data: demand } = await supabase
          .from('demands')
          .select('empresa, squad')
          .eq('id', demandId)
          .maybeSingle();

        if (!demand) {
          setLoading(false);
          return;
        }

        // Buscar o formulário personalizado da empresa/squad
        const { data: formData } = await supabase
          .from('custom_squad_forms')
          .select('id')
          .eq('empresa', demand.empresa)
          .eq('squad', demand.squad || '')
          .eq('ativo', true)
          .maybeSingle();

        if (formData) {
          // Buscar TODAS as perguntas do formulário
          const { data: allQuestions } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', formData.id)
            .order('ordem', { ascending: true });

          // Buscar as respostas já fornecidas
          const { data: responsesData } = await supabase
            .from('form_responses')
            .select('question_id, resposta')
            .eq('demand_id', demandId);

          if (allQuestions) {
            setQuestions(allQuestions);
            
            // Criar mapa de respostas
            const responsesMap: Record<string, string> = {};
            responsesData?.forEach((r) => {
              responsesMap[r.question_id] = r.resposta;
            });
            setResponses(responsesMap);
          }
        }
      } catch (error) {
        console.error('Error loading form responses:', error);
      }

      setLoading(false);
    };

    loadResponses();
  }, [demandId]);

  return { responses, questions, loading };
};
