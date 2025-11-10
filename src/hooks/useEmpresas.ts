import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Empresa {
  id: string;
  codigo: string;
  nome_completo: string;
  nome_exibicao: string;
  ativo: boolean;
  ordem: number;
}

export const useEmpresas = () => {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as Empresa[];
    },
  });
};
