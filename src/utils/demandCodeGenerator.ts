import { supabase } from '@/integrations/supabase/client';

export const generateDemandCode = async (
  empresa: string, 
  _squad: string,
  createdAt?: Date
): Promise<string> => {
  // Usa a função do banco de dados para gerar o código
  // Cast explícito para empresa_type para evitar erro de tipo
  const { data, error } = await supabase
    .rpc('generate_new_demand_code', {
      p_empresa: empresa as any,
      p_created_at: createdAt?.toISOString() || new Date().toISOString()
    });

  if (error) {
    console.error('Erro ao gerar código da demanda:', error);
    throw error;
  }

  return data as string;
};

/**
 * Gera o código com versão para uma demanda
 * @param codigoBase - Código base da demanda (ex: ZS-00040-112025)
 * @param versao - Número da versão
 * @returns Código com versão (ex: ZS-00040-112025.V2)
 */
export const generateVersionedCode = (codigoBase: string, versao: number): string => {
  if (versao <= 1) {
    return codigoBase;
  }
  return `${codigoBase}.V${versao}`;
};

