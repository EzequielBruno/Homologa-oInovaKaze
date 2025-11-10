import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EMPRESAS, SQUADS } from '@/types/demand';

interface Question {
  id?: string;
  ordem: number;
  texto: string;
  tipo: string;
  opcoes?: string[] | null;
  obrigatoria: boolean;
  permite_outro?: boolean;
  condicao_pergunta_id?: string | null;
  condicao_resposta?: string | null;
  acao_ramificacao?: 'mostrar' | 'pular' | 'encerrar' | null;
  pular_para_pergunta_id?: string | null;
  form_id?: string;
  created_at?: string;
}

const FormulariosPersonalizados = () => {
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState('');
  const [squad, setSquad] = useState('');
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [availableSquads, setAvailableSquads] = useState<string[]>([]);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    const loadSquads = async () => {
      if (!empresa) {
        setAvailableSquads([]);
        return;
      }

      try {
        const defaultSquads = (SQUADS[empresa] || []).filter(s => s !== 'Avaliar');
        
        // Carregar squads customizadas do banco
        const { data: customSquads, error } = await supabase
          .from('squads')
          .select('nome, ativo')
          .eq('empresa', empresa)
          .eq('ativo', true);

        if (error) throw error;

        // Buscar squads padrão que foram desativadas
        const { data: inactiveSquads } = await supabase
          .from('squads')
          .select('nome')
          .eq('empresa', empresa)
          .eq('ativo', false);

        const inactiveSquadNames = new Set(inactiveSquads?.map(s => s.nome) || []);

        // Combinar squads padrão (removendo as inativas) com customizadas
        const activeDefaultSquads = defaultSquads.filter(s => !inactiveSquadNames.has(s));
        const customSquadNames = customSquads?.map(s => s.nome) || [];
        const combined = [...activeDefaultSquads, ...customSquadNames];
        
        // Remover duplicatas e ordenar
        const unique = Array.from(new Set(combined)).sort();
        setAvailableSquads(unique);
      } catch (error: any) {
        console.error('Erro ao carregar squads:', error);
        setAvailableSquads((SQUADS[empresa] || []).filter(s => s !== 'Avaliar'));
      }
    };

    loadSquads();
  }, [empresa]);

  const loadForms = async () => {
    const { data, error } = await supabase
      .from('custom_squad_forms')
      .select('*')
      .order('empresa', { ascending: true })
      .order('squad', { ascending: true });

    if (error) {
      toast({
        title: 'Erro ao carregar formulários',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setForms(data || []);
  };

  const loadQuestions = async (formId: string) => {
    const { data, error } = await supabase
      .from('form_questions')
      .select('*')
      .eq('form_id', formId)
      .order('ordem', { ascending: true });

    if (error) {
      toast({
        title: 'Erro ao carregar perguntas',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Mapear as perguntas carregadas mantendo os IDs e tipos corretos
    const mappedQuestions: Question[] = (data || []).map(q => ({
      id: q.id,
      ordem: q.ordem,
      texto: q.texto,
      tipo: q.tipo,
      opcoes: q.opcoes,
      obrigatoria: q.obrigatoria,
      permite_outro: q.permite_outro,
      condicao_pergunta_id: q.condicao_pergunta_id,
      condicao_resposta: q.condicao_resposta,
      acao_ramificacao: q.acao_ramificacao as 'mostrar' | 'pular' | 'encerrar' | null,
      pular_para_pergunta_id: q.pular_para_pergunta_id,
      form_id: q.form_id,
      created_at: q.created_at,
    }));

    setQuestions(mappedQuestions);
  };

  const createForm = async () => {
    if (!empresa || !squad) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione empresa e squad',
        variant: 'destructive',
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('custom_squad_forms')
      .insert([{
        empresa,
        squad,
        created_by: user.id,
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro ao criar formulário',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Formulário criado!',
      description: 'Agora você pode adicionar perguntas.',
    });

    setSelectedForm(data);
    setQuestions([]);
    setEditDialogOpen(true);
    loadForms();
  };

  const editForm = async (form: any) => {
    setSelectedForm(form);
    await loadQuestions(form.id);
    setEditDialogOpen(true);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      ordem: questions.length + 1,
      texto: '',
      tipo: 'texto',
      obrigatoria: false,
      permite_outro: false,
      acao_ramificacao: null,
      pular_para_pergunta_id: null,
    }]);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const currentOptions = newQuestions[questionIndex].opcoes || [];
    newQuestions[questionIndex].opcoes = [...currentOptions, ''];
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    const currentOptions = [...(newQuestions[questionIndex].opcoes || [])];
    currentOptions[optionIndex] = value;
    newQuestions[questionIndex].opcoes = currentOptions;
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const currentOptions = [...(newQuestions[questionIndex].opcoes || [])];
    currentOptions.splice(optionIndex, 1);
    newQuestions[questionIndex].opcoes = currentOptions;
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    // Atualizar a ordem
    newQuestions.forEach((q, i) => {
      q.ordem = i + 1;
    });
    setQuestions(newQuestions);
  };

  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    // Atualizar a ordem
    newQuestions.forEach((q, i) => {
      q.ordem = i + 1;
    });
    setQuestions(newQuestions);
  };

  const saveQuestions = async () => {
    if (!selectedForm) return;

    // Separar perguntas existentes e novas
    const existingQuestions = questions.filter(q => q.id);
    const newQuestions = questions.filter(q => !q.id);

    // Inserir novas perguntas primeiro
    let insertedQuestions: any[] = [];
    if (newQuestions.length > 0) {
      const { data: newData, error: insertError } = await supabase
        .from('form_questions')
        .insert(
          newQuestions.map((q, index) => ({
            form_id: selectedForm.id,
            ordem: questions.indexOf(q) + 1,
            texto: q.texto,
            tipo: q.tipo,
            opcoes: q.opcoes || null,
            obrigatoria: q.obrigatoria,
            permite_outro: q.permite_outro || false,
            condicao_pergunta_id: null,
            condicao_resposta: null,
            acao_ramificacao: null,
            pular_para_pergunta_id: null,
          }))
        )
        .select();

      if (insertError) {
        toast({
          title: 'Erro ao salvar perguntas',
          description: insertError.message,
          variant: 'destructive',
        });
        return;
      }

      insertedQuestions = newData || [];
    }

    // Atualizar perguntas existentes
    if (existingQuestions.length > 0) {
      for (const q of existingQuestions) {
        const { error: updateError } = await supabase
          .from('form_questions')
          .update({
            ordem: questions.indexOf(q) + 1,
            texto: q.texto,
            tipo: q.tipo,
            opcoes: q.opcoes || null,
            obrigatoria: q.obrigatoria,
            permite_outro: q.permite_outro || false,
          })
          .eq('id', q.id);

        if (updateError) {
          toast({
            title: 'Erro ao atualizar pergunta',
            description: updateError.message,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    // Criar mapeamento completo de índice para ID
    const indexToIdMap = new Map<number, string>();
    questions.forEach((q, index) => {
      if (q.id) {
        indexToIdMap.set(index, q.id);
      } else {
        // Encontrar a pergunta inserida correspondente
        const insertedIndex = newQuestions.indexOf(q);
        if (insertedIndex >= 0 && insertedQuestions[insertedIndex]) {
          indexToIdMap.set(index, insertedQuestions[insertedIndex].id);
        }
      }
    });

    // Atualizar ramificações com IDs reais
    for (let index = 0; index < questions.length; index++) {
      const q = questions[index];
      const realId = indexToIdMap.get(index);
      if (!realId) continue;

      // Converter índices para IDs reais
      let condicaoPerguntaId = null;
      if (q.condicao_pergunta_id && q.condicao_pergunta_id !== 'nenhuma') {
        const targetIndex = parseInt(q.condicao_pergunta_id);
        condicaoPerguntaId = indexToIdMap.get(targetIndex) || null;
      }

      let pularParaPerguntaId = null;
      if (q.pular_para_pergunta_id) {
        const targetIndex = parseInt(q.pular_para_pergunta_id);
        pularParaPerguntaId = indexToIdMap.get(targetIndex) || null;
      }

      // Atualizar apenas se houver ramificações
      if (condicaoPerguntaId || pularParaPerguntaId || q.acao_ramificacao) {
        const { error: updateError } = await supabase
          .from('form_questions')
          .update({
            condicao_pergunta_id: condicaoPerguntaId,
            condicao_resposta: q.condicao_resposta || null,
            acao_ramificacao: q.acao_ramificacao || null,
            pular_para_pergunta_id: pularParaPerguntaId,
          })
          .eq('id', realId);

        if (updateError) {
          toast({
            title: 'Erro ao salvar ramificações',
            description: updateError.message,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    toast({
      title: 'Perguntas salvas!',
      description: 'Formulário atualizado com sucesso.',
    });

    setEditDialogOpen(false);
    setSelectedForm(null);
    loadForms();
  };

  const deleteForm = async (formId: string) => {
    const { error } = await supabase
      .from('custom_squad_forms')
      .delete()
      .eq('id', formId);

    if (error) {
      toast({
        title: 'Erro ao deletar formulário',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Formulário deletado',
    });

    loadForms();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Formulários Personalizados
        </h1>
        <p className="text-muted-foreground">
          Crie formulários personalizados para cada squad
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Formulário</CardTitle>
          <CardDescription>Selecione a empresa e squad para criar um formulário personalizado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={empresa} onValueChange={setEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {EMPRESAS.map((emp) => (
                    <SelectItem key={emp.value} value={emp.value}>
                      {emp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Squad</Label>
              <Select value={squad} onValueChange={setSquad} disabled={!empresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {availableSquads.map((sq) => (
                    <SelectItem key={sq} value={sq}>
                      {sq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={createForm} disabled={!empresa || !squad}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Formulário
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {forms.map((form) => (
          <Card key={form.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{form.empresa} - {form.squad}</CardTitle>
                  <CardDescription>
                    Criado em {new Date(form.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => editForm(form)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteForm(form.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Formulário - {selectedForm?.empresa} - {selectedForm?.squad}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col gap-1 mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestionUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestionDown(index)}
                          disabled={index === questions.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg font-bold text-primary">Pergunta {index + 1}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Pergunta *</Label>
                            <Input
                              value={question.texto}
                              onChange={(e) => updateQuestion(index, 'texto', e.target.value)}
                              placeholder="Digite a pergunta..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Tipo de Resposta</Label>
                            <Select
                              value={question.tipo}
                              onValueChange={(value) => updateQuestion(index, 'tipo', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="texto">Texto Curto</SelectItem>
                                <SelectItem value="textarea">Texto Longo</SelectItem>
                                <SelectItem value="escolha_unica">Escolha Única</SelectItem>
                                <SelectItem value="escolha_multipla">Escolha Múltipla</SelectItem>
                                <SelectItem value="classificacao">Classificação (1-5)</SelectItem>
                                <SelectItem value="data">Data</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {(question.tipo === 'escolha_unica' || question.tipo === 'escolha_multipla') && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Opções de Resposta</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(index)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar Opção
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {(question.opcoes || []).map((opcao, optIndex) => (
                                <div key={optIndex} className="flex gap-2">
                                  <Input
                                    value={opcao}
                                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                    placeholder={`Opção ${optIndex + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOption(index, optIndex)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={question.permite_outro || false}
                                onCheckedChange={(checked) => updateQuestion(index, 'permite_outro', checked)}
                              />
                              <Label>Permitir resposta personalizada ("Outro")</Label>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 border-t pt-4">
                          <Label className="text-sm font-semibold">Ramificação Lógica (Opcional)</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Se a resposta da pergunta:</Label>
                              <Select
                                value={question.condicao_pergunta_id || 'nenhuma'}
                                onValueChange={(value) => updateQuestion(index, 'condicao_pergunta_id', value === 'nenhuma' ? null : value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Nenhuma condição" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="nenhuma">Nenhuma condição</SelectItem>
                                  {questions.slice(0, index).map((q, qIndex) => (
                                    <SelectItem key={qIndex} value={String(qIndex)}>
                                      {q.texto || `Pergunta ${qIndex + 1}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {question.condicao_pergunta_id && question.condicao_pergunta_id !== 'nenhuma' && (
                              <div className="space-y-2">
                                <Label className="text-xs">For igual a:</Label>
                                <Input
                                  value={question.condicao_resposta || ''}
                                  onChange={(e) => updateQuestion(index, 'condicao_resposta', e.target.value)}
                                  placeholder="Valor esperado..."
                                />
                              </div>
                            )}
                          </div>

                          {question.condicao_pergunta_id && question.condicao_pergunta_id !== 'nenhuma' && question.condicao_resposta && (
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="space-y-2">
                                <Label className="text-xs">Então:</Label>
                                <Select
                                  value={question.acao_ramificacao || 'mostrar'}
                                  onValueChange={(value) => updateQuestion(index, 'acao_ramificacao', value as 'mostrar' | 'pular' | 'encerrar')}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mostrar">Mostrar esta pergunta</SelectItem>
                                    <SelectItem value="pular">Pular para outra pergunta</SelectItem>
                                    <SelectItem value="encerrar">Encerrar formulário</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {question.acao_ramificacao === 'pular' && (
                                <div className="space-y-2">
                                  <Label className="text-xs">Pular para pergunta:</Label>
                                  <Select
                                    value={question.pular_para_pergunta_id || ''}
                                    onValueChange={(value) => updateQuestion(index, 'pular_para_pergunta_id', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a pergunta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {questions.slice(index + 1).map((q, qIndex) => (
                                        <SelectItem key={index + qIndex + 1} value={String(index + qIndex + 1)}>
                                          {q.texto || `Pergunta ${index + qIndex + 2}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={question.obrigatoria}
                            onCheckedChange={(checked) => updateQuestion(index, 'obrigatoria', checked)}
                          />
                          <Label>Pergunta obrigatória</Label>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button onClick={addQuestion} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Pergunta
            </Button>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveQuestions}>
                Salvar Formulário
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormulariosPersonalizados;