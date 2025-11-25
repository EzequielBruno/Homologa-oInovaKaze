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

interface UseEmpresasOptions {
  onlyActive?: boolean;
  enabled?: boolean;
}

export const useEmpresas = ({ onlyActive = true, enabled = true }: UseEmpresasOptions = {}) => {
  return useQuery({
    queryKey: ['empresas', { onlyActive }],
    queryFn: async () => {
      let query = supabase
        .from('empresas')
        .select('*')
        .order('ordem', { ascending: true });

      if (onlyActive) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Empresa[];
    },
    enabled,
  });
};
