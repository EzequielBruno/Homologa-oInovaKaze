import { supabase } from '@/integrations/supabase/client';

interface NotifySquadParams {
  demandId: string;
  demandCode: string;
  demandTitle: string;
  empresa: string;
  squad: string;
  oldVersion: number;
  newVersion: number;
  changedBy: string;
}

/**
 * Envia notificações para todos os membros da squad quando há mudança de escopo
 */
export const notifySquadAboutScopeChange = async ({
  demandId,
  demandCode,
  demandTitle,
  empresa,
  squad,
  oldVersion,
  newVersion,
  changedBy,
}: NotifySquadParams) => {
  try {
    // Buscar membros da squad
    const { data: squadMembers, error: squadError } = await supabase
      .from('squad_members')
      .select('user_id')
      .eq('empresa', empresa)
      .eq('squad', squad);

    if (squadError) {
      console.error('Erro ao buscar membros da squad:', squadError);
      return;
    }

    if (!squadMembers || squadMembers.length === 0) {
      console.log('Nenhum membro encontrado na squad');
      return;
    }

    // Buscar nome do usuário que fez a mudança
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', changedBy)
      .single();

    const changedByName = userProfile?.full_name || 'Usuário';

    // Criar notificações para cada membro
    const notifications = squadMembers.map((member) => ({
      user_id: member.user_id,
      tipo: 'mudanca_escopo',
      title: `⚠️ Mudança de Escopo: ${demandCode}`,
      message: `${changedByName} realizou uma mudança de escopo na demanda "${demandTitle}". A demanda foi atualizada da versão ${oldVersion} para versão ${newVersion} e retornou para o Backlog. Revise as alterações.`,
      relacionado_id: demandId,
      lida: false,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Erro ao criar notificações:', notificationError);
    } else {
      console.log(`${notifications.length} notificações criadas para mudança de escopo`);
    }

    // Também notificar o solicitante da demanda se não for membro da squad
    const { data: demand } = await supabase
      .from('demands')
      .select('solicitante_id')
      .eq('id', demandId)
      .single();

    if (demand?.solicitante_id) {
      const isSquadMember = squadMembers.some(
        (member) => member.user_id === demand.solicitante_id
      );

      if (!isSquadMember) {
        await supabase.from('notifications').insert({
          user_id: demand.solicitante_id,
          tipo: 'mudanca_escopo',
          title: `⚠️ Mudança de Escopo: ${demandCode}`,
          message: `${changedByName} realizou uma mudança de escopo na sua demanda "${demandTitle}". A demanda foi atualizada da versão ${oldVersion} para versão ${newVersion}. Revise as alterações.`,
          relacionado_id: demandId,
          lida: false,
        });
      }
    }
  } catch (error) {
    console.error('Erro ao enviar notificações de mudança de escopo:', error);
  }
};

/**
 * Verifica as preferências de notificação do usuário
 */
export const shouldNotifyUser = async (
  userId: string,
  eventType: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('enabled')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar preferências:', error);
      return true; // Por padrão, notifica
    }

    // Se não há preferência definida, notifica por padrão
    if (!data) return true;

    return data.enabled;
  } catch (error) {
    console.error('Erro ao verificar preferências:', error);
    return true;
  }
};
