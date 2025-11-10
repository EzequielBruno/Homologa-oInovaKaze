import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AutoTransitionConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPRESAS = ['ZC', 'Eletro', 'ZF', 'ZS'];
const CRITICIDADES = ['Baixa', 'Média', 'Alta', 'Crítica'];

interface Config {
  empresa: string;
  criticidade: string;
  auto_transition: boolean;
}

export const AutoTransitionConfigDialog = ({
  open,
  onOpenChange
}: AutoTransitionConfigDialogProps) => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadConfigs();
    }
  }, [open]);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_transition_config')
        .select('*')
        .order('empresa')
        .order('criticidade');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (empresa: string, criticidade: string, enabled: boolean) => {
    // Atualiza localmente primeiro
    setConfigs(prev => 
      prev.map(c => 
        c.empresa === empresa && c.criticidade === criticidade
          ? { ...c, auto_transition: enabled }
          : c
      )
    );

    try {
      const { error } = await supabase
        .from('auto_transition_config')
        .update({ auto_transition: enabled })
        .eq('empresa', empresa)
        .eq('criticidade', criticidade);

      if (error) throw error;

      toast.success(
        enabled 
          ? `Auto-transição ativada para ${empresa} - ${criticidade}`
          : `Auto-transição desativada para ${empresa} - ${criticidade}`
      );
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Erro ao atualizar configuração');
      // Reverte em caso de erro
      setConfigs(prev => 
        prev.map(c => 
          c.empresa === empresa && c.criticidade === criticidade
            ? { ...c, auto_transition: !enabled }
            : c
        )
      );
    }
  };

  const getConfig = (empresa: string, criticidade: string): boolean => {
    const config = configs.find(c => c.empresa === empresa && c.criticidade === criticidade);
    return config?.auto_transition ?? false;
  };

  const enabledCount = configs.filter(c => c.auto_transition).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configuração de Auto-Transição
          </DialogTitle>
          <DialogDescription>
            Configure quais níveis de criticidade devem avançar automaticamente de "GP Aprovado" para "Em Progresso".
            {enabledCount > 0 && (
              <span className="block mt-1 text-primary font-medium">
                {enabledCount} de {configs.length} configurações ativas
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando configurações...
            </div>
          ) : (
            <div className="space-y-4">
              {EMPRESAS.map(empresa => (
                <Card key={empresa}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{empresa}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {CRITICIDADES.map(criticidade => {
                      const isEnabled = getConfig(empresa, criticidade);
                      return (
                        <div
                          key={`${empresa}-${criticidade}`}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                criticidade === 'Crítica' || criticidade === 'Alta'
                                  ? 'destructive'
                                  : criticidade === 'Média'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {criticidade}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">
                                {isEnabled ? 'Transição automática ativa' : 'Transição manual'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isEnabled 
                                  ? 'Demandas avançam automaticamente' 
                                  : 'Requer ação manual para avançar'
                                }
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleToggle(empresa, criticidade, checked)}
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
