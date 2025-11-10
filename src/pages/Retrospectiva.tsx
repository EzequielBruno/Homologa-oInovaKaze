import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Smile, Frown, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const Retrospectiva = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [empresa, setEmpresa] = useState('');
  const [reviewNumber, setReviewNumber] = useState('');
  const [dataReview, setDataReview] = useState('');
  const [pontosPositivos, setPontosPositivos] = useState('');
  const [pontosMelhoria, setPontosMelhoria] = useState('');
  const [solicitacoesApoio, setSolicitacoesApoio] = useState('');
  const [qualidadeEntrega, setQualidadeEntrega] = useState('');
  const [velocidadeSprint, setVelocidadeSprint] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('data_review', { ascending: false });

      if (error) throw error;

      // Busca os nomes dos criadores separadamente
      const userIds = [...new Set(data?.map(r => r.created_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]));
      
      const reviewsWithCreators = data?.map(review => ({
        ...review,
        creator: { full_name: profileMap.get(review.created_by) || 'N/A' }
      }));

      setReviews(reviewsWithCreators || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar retrospectivas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('reviews')
        .insert([{
          empresa,
          review_number: parseInt(reviewNumber),
          data_review: dataReview,
          pontos_positivos: pontosPositivos,
          pontos_melhoria: pontosMelhoria,
          solicitacoes_apoio: solicitacoesApoio || null,
          qualidade_entrega: qualidadeEntrega ? parseFloat(qualidadeEntrega) : null,
          velocidade_sprint: velocidadeSprint ? parseFloat(velocidadeSprint) : null,
          created_by: user.id,
        }]);

      if (error) throw error;

      toast({
        title: 'Retrospectiva registrada!',
        description: 'A retrospectiva foi salva com sucesso.',
      });

      // Reset form
      setEmpresa('');
      setReviewNumber('');
      setDataReview('');
      setPontosPositivos('');
      setPontosMelhoria('');
      setSolicitacoesApoio('');
      setQualidadeEntrega('');
      setVelocidadeSprint('');
      setShowForm(false);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Retrospectivas
          </h1>
          <p className="text-muted-foreground">
            Registre e acompanhe as retrospectivas de cada sprint
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nova Retrospectiva'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle>Registrar Nova Retrospectiva</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa *</Label>
                  <Input
                    id="empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Ex: Zema Seguros"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewNumber">Número da Review *</Label>
                  <Input
                    id="reviewNumber"
                    type="number"
                    value={reviewNumber}
                    onChange={(e) => setReviewNumber(e.target.value)}
                    placeholder="Ex: 15"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataReview">Data da Retrospectiva *</Label>
                <Input
                  id="dataReview"
                  type="date"
                  value={dataReview}
                  onChange={(e) => setDataReview(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="positivos">Pontos Positivos *</Label>
                <Textarea
                  id="positivos"
                  value={pontosPositivos}
                  onChange={(e) => setPontosPositivos(e.target.value)}
                  placeholder="O que funcionou bem nesta sprint..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="melhoria">Pontos de Melhoria *</Label>
                <Textarea
                  id="melhoria"
                  value={pontosMelhoria}
                  onChange={(e) => setPontosMelhoria(e.target.value)}
                  placeholder="O que pode ser melhorado..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apoio">Solicitações de Apoio</Label>
                <Textarea
                  id="apoio"
                  value={solicitacoesApoio}
                  onChange={(e) => setSolicitacoesApoio(e.target.value)}
                  placeholder="Necessidades de suporte ou recursos..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualidade">Qualidade de Entrega (0-10)</Label>
                  <Input
                    id="qualidade"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={qualidadeEntrega}
                    onChange={(e) => setQualidadeEntrega(e.target.value)}
                    placeholder="8.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="velocidade">Velocidade da Sprint (0-10)</Label>
                  <Input
                    id="velocidade"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={velocidadeSprint}
                    onChange={(e) => setVelocidadeSprint(e.target.value)}
                    placeholder="7.5"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Salvar Retrospectiva
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nenhuma retrospectiva registrada ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-gradient-card border-border hover:shadow-zema transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-primary mb-2">
                      Review #{review.review_number} - {review.empresa}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Data: {new Date(review.data_review).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registrado por: {review.creator?.full_name || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {review.qualidade_entrega && (
                      <Badge className="bg-accent/20 text-accent">
                        Qualidade: {review.qualidade_entrega}
                      </Badge>
                    )}
                    {review.velocidade_sprint && (
                      <Badge className="bg-secondary/20 text-secondary">
                        Velocidade: {review.velocidade_sprint}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Smile className="w-5 h-5 text-accent" />
                    <h4 className="font-semibold text-foreground">Pontos Positivos:</h4>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap pl-7">{review.pontos_positivos}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Frown className="w-5 h-5 text-orange-500" />
                    <h4 className="font-semibold text-foreground">Pontos de Melhoria:</h4>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap pl-7">{review.pontos_melhoria}</p>
                </div>

                {review.solicitacoes_apoio && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-semibold text-foreground">Solicitações de Apoio:</h4>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap pl-7">{review.solicitacoes_apoio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Retrospectiva;
