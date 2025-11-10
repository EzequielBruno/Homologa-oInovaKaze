import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ActionType =
  | 'criar'
  | 'editar'
  | 'reativar'
  | 'excluir'
  | 'cancelar'
  | 'arquivar'
  | 'aprovar'
  | 'reprovar'
  | 'mudar_status'
  | 'adicionar_fase'
  | 'atualizar_fase'
  | 'solicitar_insumo'
  | 'enviar_notificacao'
  | 'solicitar_atualizacao'
  | 'atribuir_responsavel'
  | 'solicitar_change'
  | 'solicitar_aprovacao_gerente'
  | 'aprovar_gerente'
  | 'recusar_gerente'
  | 'aprovar_comite'
  | 'recusar_comite'
  | 'aprovar_ti'
  | 'recusar_ti'
  | 'registrar_daily';

interface LogActionParams {
  demandId: string;
  action: ActionType;
  descricao: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
}

export const useDemandHistory = () => {
  const { user } = useAuth();

  const logAction = async ({
    demandId,
    action,
    descricao,
    dadosAnteriores,
    dadosNovos,
  }: LogActionParams) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('demand_history').insert([{
        demand_id: demandId,
        user_id: user.id,
        action: action as any,
        descricao,
        dados_anteriores: dadosAnteriores || null,
        dados_novos: dadosNovos || null,
      }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  return { logAction };
};
