import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';

interface NotificationPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_TYPES = [
  {
    id: 'status_change',
    label: 'Mudanças de Status',
    description: 'Quando uma demanda muda de status'
  },
  {
    id: 'approval_request',
    label: 'Solicitações de Aprovação',
    description: 'Quando uma aprovação é solicitada de você'
  },
  {
    id: 'approval_granted',
    label: 'Aprovações Concedidas',
    description: 'Quando suas demandas são aprovadas'
  },
  {
    id: 'approval_rejected',
    label: 'Aprovações Recusadas',
    description: 'Quando suas demandas são recusadas'
  },
  {
    id: 'comment_added',
    label: 'Novos Comentários',
    description: 'Quando alguém comenta em suas demandas'
  },
  {
    id: 'assignment',
    label: 'Atribuições',
    description: 'Quando você é atribuído a uma demanda'
  },
  {
    id: 'insumo_request',
    label: 'Solicitações de Insumo',
    description: 'Quando insumos são solicitados para suas demandas'
  },
  {
    id: 'risk_assessment',
    label: 'Avaliações de Risco',
    description: 'Quando uma avaliação de risco é realizada'
  },
  {
    id: 'deadline_approaching',
    label: 'Prazos Próximos',
    description: 'Alertas de datas limite se aproximando'
  },
  {
    id: 'dependency_completed',
    label: 'Dependências Concluídas',
    description: 'Quando dependências de suas demandas são finalizadas'
  }
];

export const NotificationPreferencesDialog = ({
  open,
  onOpenChange
}: NotificationPreferencesDialogProps) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      loadPreferences();
    }
  }, [open, user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('event_type, enabled')
        .eq('user_id', user.id);

      const prefs: Record<string, boolean> = {};
      EVENT_TYPES.forEach(type => {
        const existing = data?.find(p => p.event_type === type.id);
        prefs[type.id] = existing?.enabled ?? true; // Padrão: habilitado
      });

      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Erro ao carregar preferências');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (eventType: string, enabled: boolean) => {
    if (!user) return;

    // Atualiza localmente primeiro para feedback imediato
    setPreferences(prev => ({ ...prev, [eventType]: enabled }));

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          event_type: eventType,
          enabled: enabled,
        }, {
          onConflict: 'user_id,event_type'
        });

      if (error) throw error;

      toast.success(enabled ? 'Notificação ativada' : 'Notificação desativada');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Erro ao atualizar preferência');
      // Reverte em caso de erro
      setPreferences(prev => ({ ...prev, [eventType]: !enabled }));
    }
  };

  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferências de Notificação
          </DialogTitle>
          <DialogDescription>
            Escolha quais tipos de eventos você deseja receber notificações.
            {enabledCount > 0 && (
              <span className="block mt-1 text-primary font-medium">
                {enabledCount} de {EVENT_TYPES.length} tipos ativos
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando preferências...
            </div>
          ) : (
            EVENT_TYPES.map((eventType) => (
              <Card key={eventType.id}>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {preferences[eventType.id] ? (
                          <Bell className="h-4 w-4 text-primary" />
                        ) : (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        {eventType.label}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {eventType.description}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={preferences[eventType.id] ?? true}
                      onCheckedChange={(checked) => handleToggle(eventType.id, checked)}
                    />
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
