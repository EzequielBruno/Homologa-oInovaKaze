import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Phase {
  id: string;
  nome: string;
  horas: number;
  descricao: string;
}

interface ParecerTecnicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parecer: any;
  onAction: (action: 'solicitar_insumo' | 'recusar' | 'aprovar', comentario: string, phases?: Phase[]) => void;
}

export const ParecerTecnicoDialog = ({
  open,
  onOpenChange,
  parecer,
  onAction,
}: ParecerTecnicoDialogProps) => {
  const [comentario, setComentario] = useState('');
  const [activeTab, setActiveTab] = useState('comentario');
  const [phases, setPhases] = useState<Phase[]>([
    { id: '1', nome: '', horas: 0, descricao: '' }
  ]);

  const handleAction = (action: 'solicitar_insumo' | 'recusar' | 'aprovar') => {
    if (!comentario.trim() && action !== 'aprovar') {
      alert('Por favor, adicione um comentário');
      return;
    }

    if (action === 'aprovar') {
      // Valida se todas as fases têm nome e horas
      const invalidPhases = phases.filter(p => !p.nome.trim() || p.horas <= 0);
      if (invalidPhases.length > 0) {
        alert('Para aprovar, todas as fases devem ter nome e horas estimadas');
        return;
      }
      onAction(action, comentario, phases);
    } else {
      onAction(action, comentario);
    }

    setComentario('');
    setPhases([{ id: '1', nome: '', horas: 0, descricao: '' }]);
    setActiveTab('comentario');
  };

  const addPhase = () => {
    const newId = (Math.max(...phases.map(p => parseInt(p.id))) + 1).toString();
    setPhases([...phases, { id: newId, nome: '', horas: 0, descricao: '' }]);
  };

  const removePhase = (id: string) => {
    if (phases.length > 1) {
      setPhases(phases.filter(p => p.id !== id));
    }
  };

  const updatePhase = (id: string, field: keyof Phase, value: any) => {
    setPhases(phases.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const totalHoras = phases.reduce((sum, p) => sum + (p.horas || 0), 0);
  const custoEstimado = totalHoras * 150; // R$ 150/hora
  const prazoEstimado = Math.ceil(totalHoras / 40); // semanas (40h/semana)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Parecer Técnico - {parecer?.codigo}</DialogTitle>
          <DialogDescription>
            {parecer?.empresa} - {parecer?.departamento}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Descrição da Demanda:</p>
            <p className="text-sm">{parecer?.descricao}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comentario">Comentário</TabsTrigger>
              <TabsTrigger value="faseamento">Faseamento (Obrigatório para Aprovação)</TabsTrigger>
            </TabsList>

            <TabsContent value="comentario" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comentario">Comentário / Parecer Técnico</Label>
                <Textarea
                  id="comentario"
                  placeholder="Digite seu parecer técnico sobre a demanda..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={6}
                />
              </div>
            </TabsContent>

            <TabsContent value="faseamento" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  O faseamento é obrigatório para aprovação. Defina as fases para estimativa de horas.
                </p>
                <Button onClick={addPhase} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Fase
                </Button>
              </div>

              {phases.map((phase, index) => (
                <Card key={phase.id} className="bg-gradient-card border-border">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-primary">Fase {index + 1}</h4>
                      {phases.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePhase(phase.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome da Fase *</Label>
                        <Input
                          placeholder="Ex: Análise e Levantamento"
                          value={phase.nome}
                          onChange={(e) => updatePhase(phase.id, 'nome', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Horas Estimadas *</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="40"
                          value={phase.horas || ''}
                          onChange={(e) => updatePhase(phase.id, 'horas', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição da Fase</Label>
                      <Textarea
                        placeholder="Descreva as atividades desta fase..."
                        value={phase.descricao}
                        onChange={(e) => updatePhase(phase.id, 'descricao', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-accent/10 border-accent">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total de Fases</p>
                      <p className="text-2xl font-bold text-primary">{phases.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total de Horas</p>
                      <p className="text-2xl font-bold text-primary">{totalHoras}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Custo Estimado</p>
                      <p className="text-2xl font-bold text-primary">
                        {custoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">Prazo Estimado</p>
                    <p className="text-xl font-bold text-accent">{prazoEstimado} semana(s)</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAction('solicitar_insumo')}
          >
            Solicitar Insumo
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAction('recusar')}
          >
            Recusar
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => handleAction('aprovar')}
          >
            Aprovar com Faseamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
