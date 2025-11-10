import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { generateDemandCode } from '@/utils/demandCodeGenerator';
import { EMPRESAS, SQUADS, SETORES, TODOS_SETORES } from '@/types/demand';
import FileUpload from './FileUpload';

interface DemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand?: any;
  onSuccess?: () => void;
}

interface SupplierOption {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
}

const DemandDialog = ({ open, onOpenChange, demand, onSuccess }: DemandDialogProps) => {
  const { toast } = useToast();
  const permissions = useUserPermissions();
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState('');
  const [setor, setSetor] = useState('');
  const [squad, setSquad] = useState('');
  const [descricao, setDescricao] = useState('');
  const [historiaUsuarioSolicitante, setHistoriaUsuarioSolicitante] = useState('');
  const [historiaUsuarioAcao, setHistoriaUsuarioAcao] = useState('');
  const [historiaUsuarioOutros, setHistoriaUsuarioOutros] = useState('');
  const [historiaUsuarioBeneficio, setHistoriaUsuarioBeneficio] = useState('');
  const [documentosAnexados, setDocumentosAnexados] = useState<string[]>([]);
  const [prioridade, setPrioridade] = useState('Média');
  const [status, setStatus] = useState('Backlog');
  const [regulatorio, setRegulatorio] = useState(false);
  const [dataLimite, setDataLimite] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [classificacao, setClassificacao] = useState<'Melhoria' | 'Projeto'>('Projeto');
  const [melhoriaProblemaAtual, setMelhoriaProblemaAtual] = useState('');
  const [melhoriaBeneficioEsperado, setMelhoriaBeneficioEsperado] = useState('');
  const [melhoriaAlternativas, setMelhoriaAlternativas] = useState('');
  const [roiEstimado, setRoiEstimado] = useState('');
  const [roiRealizado, setRoiRealizado] = useState('');
  const [checklistEntrega, setChecklistEntrega] = useState<string[]>(['', '']);
  const [customFormId, setCustomFormId] = useState<string | null>(null);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [availableSquads, setAvailableSquads] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [fornecedorOrcamentoId, setFornecedorOrcamentoId] = useState('');
  const [fornecedorPopoverOpen, setFornecedorPopoverOpen] = useState(false);
  const [temOrcamentoTerceiros, setTemOrcamentoTerceiros] = useState<string>('');

  // Carrega squads disponíveis (padrão + customizadas) quando empresa é selecionada
  useEffect(() => {
    const loadSquads = async () => {
      if (!empresa) {
        setAvailableSquads([]);
        return;
      }

      try {
        const defaultSquads = SQUADS[empresa] || [];
        
        // Carregar squads customizadas ativas do banco
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

        // Combinar squads padrão (removendo as inativas) com customizadas ativas
        const activeDefaultSquads = defaultSquads.filter(s => !inactiveSquadNames.has(s));
        const customSquadNames = customSquads?.map(s => s.nome) || [];
        const combined = [...activeDefaultSquads, ...customSquadNames];
        
        // Remover duplicatas e ordenar (mas manter "Avaliar" no início)
        const uniqueCombined = Array.from(new Set([...combined, 'Avaliar']));
        const ordered = [
          'Avaliar',
          ...uniqueCombined.filter(s => s && s !== 'Avaliar').sort(),
        ];

        // Garantir que a squad atual da demanda apareça mesmo se estiver inativa
        const finalSquads =
          demand?.squad && !ordered.includes(demand.squad)
            ? [...ordered, demand.squad]
            : ordered;

        setAvailableSquads(finalSquads);
      } catch (error: any) {
        console.error('Erro ao carregar squads:', error);
        setAvailableSquads(['Avaliar', ...(SQUADS[empresa] || [])]);
      }
    };

    loadSquads();
  }, [empresa, demand?.squad]);


  const hasSetSquad = useRef(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!open) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('fornecedores')
          .select('id, nome_fantasia, razao_social, cnpj')
          .order('nome_fantasia', { ascending: true });

        if (error) throw error;

        setSuppliers(data || []);
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        setSuppliers([]);
      }
    };

    fetchSuppliers();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFornecedorPopoverOpen(false);
    }
  }, [open]);

  const selectedFornecedor = suppliers.find((supplier) => supplier.id === fornecedorOrcamentoId);

  useEffect(() => {
    if (!open || !demand?.squad || !empresa || hasSetSquad.current) return;

    const validSquad = availableSquads.includes(demand.squad);
    if (validSquad) {
      setSquad(demand.squad);
      hasSetSquad.current = true;
    }
  }, [empresa, availableSquads, demand?.squad, open]);

  useEffect(() => {
    if (open) hasSetSquad.current = false;

    if (!demand) {
      // Sempre reseta quando o diálogo abre sem demanda (nova criação)
      resetForm();
      if (permissions.isSolicitante && permissions.solicitanteEmpresa) {
        setEmpresa(permissions.solicitanteEmpresa);
      }
      return;
    }

    // Ao alternar entre cards, garante que o formulário seja limpo
    resetForm();

    // Carrega os dados da demanda para edição
    setEmpresa(demand.empresa || '');
    setSquad(demand.squad || 'Avaliar');
    const setorValue = demand.setor || demand.departamento || '';
    const isValidSetor = TODOS_SETORES.some(option => option.value === setorValue);
    setSetor(isValidSetor ? setorValue : '');
    setDescricao(demand.descricao || '');

    // Parse história do usuário
    if (demand.requisitos_funcionais) {
      const lines = demand.requisitos_funcionais.split('\n');
      setHistoriaUsuarioSolicitante(lines[0]?.replace('- Solicitante/Cargo: ', '') || '');
      setHistoriaUsuarioAcao(lines[1]?.replace('- Ação ou funcionalidade desejada: ', '') || '');
      setHistoriaUsuarioOutros(lines[2]?.replace('- Outros usuários ou áreas: ', '') || '');
      setHistoriaUsuarioBeneficio(lines[3]?.replace('- Benefício ou objetivo esperado: ', '') || '');
    }

    setDocumentosAnexados(demand.documentos_anexados || []);
    setPrioridade(demand.prioridade || 'Média');
    setStatus(demand.status || 'Backlog');
    setRegulatorio(demand.regulatorio || false);
    setDataLimite(demand.data_limite_regulatorio || '');
    setObservacoes(demand.observacoes || '');
    setClassificacao(demand.classificacao || 'Projeto');
    setMelhoriaProblemaAtual(demand.melhoria_problema_atual || '');
    setMelhoriaBeneficioEsperado(demand.melhoria_beneficio_esperado || '');
    setMelhoriaAlternativas(demand.melhoria_alternativas || '');
    setRoiEstimado(demand.roi_estimado?.toString() || '');
    setRoiRealizado(demand.roi_realizado?.toString() || '');
    setFornecedorOrcamentoId(demand.orcamento_fornecedor_id || '');
    setTemOrcamentoTerceiros(demand.orcamento_fornecedor_id ? 'Sim' : '');
    // Parse checklist from string to array
    if (demand.checklist_entrega) {
      const items = demand.checklist_entrega.split('\n').filter((item: string) => item.trim());
      setChecklistEntrega(items.length > 0 ? items : ['', '']);
    } else {
      setChecklistEntrega(['', '']);
    }
  }, [demand, open, permissions.isSolicitante, permissions.solicitanteEmpresa]);


  // Carrega formulário personalizado quando squad é selecionada
  useEffect(() => {
    const loadCustomForm = async () => {
      if (!empresa || !squad || squad === 'Avaliar') {
        setCustomFormId(null);
        setCustomQuestions([]);
        setShowCustomForm(false);
        setCustomResponses({});
        return;
      }

      const { data: formData } = await supabase
        .from('custom_squad_forms')
        .select('id')
        .eq('empresa', empresa)
        .eq('squad', squad)
        .eq('ativo', true)
        .maybeSingle();

      if (formData) {
        setCustomFormId(formData.id);
        
        const { data: questionsData } = await supabase
          .from('form_questions')
          .select('*')
          .eq('form_id', formData.id)
          .order('ordem', { ascending: true });

        setCustomQuestions(questionsData || []);
        // Limpar respostas antigas quando mudar de squad
        if (!demand) {
          setCustomResponses({});
        }
      } else {
        setCustomFormId(null);
        setCustomQuestions([]);
        setCustomResponses({});
      }
    };

    if (open) {
      loadCustomForm();
    }
  }, [empresa, squad, open, demand]);

  // Carrega respostas customizadas se estiver editando
  useEffect(() => {
    const loadCustomResponses = async () => {
      if (!demand?.id || !customFormId) return;

      const { data } = await supabase
        .from('form_responses')
        .select('question_id, resposta')
        .eq('demand_id', demand.id);

      if (data) {
        const responses: Record<string, string> = {};
        data.forEach(r => {
          responses[r.question_id] = r.resposta;
        });
        setCustomResponses(responses);
      }
    };

    if (open && demand) {
      loadCustomResponses();
    }
  }, [demand, customFormId, open]);

  
  const resetForm = () => {
    setEmpresa('');
    setSetor('');
    setSquad('');
    setDescricao('');
    setHistoriaUsuarioSolicitante('');
    setHistoriaUsuarioAcao('');
    setHistoriaUsuarioOutros('');
    setHistoriaUsuarioBeneficio('');
    setDocumentosAnexados([]);
    setPrioridade('Média');
    setStatus('Backlog');
    setRegulatorio(false);
    setDataLimite('');
    setObservacoes('');
    setClassificacao('Projeto');
    setMelhoriaProblemaAtual('');
    setMelhoriaBeneficioEsperado('');
    setMelhoriaAlternativas('');
    setRoiEstimado('');
    setRoiRealizado('');
    setChecklistEntrega(['', '']);
    setCustomResponses({});
    setShowCustomForm(false);
    setFornecedorOrcamentoId('');
    setTemOrcamentoTerceiros('');
  };

  useEffect(() => {
    if (!empresa) {
      setSetor('');
      return;
    }

    const empresaKey = empresa as keyof typeof SETORES;
    const setoresDaEmpresa = SETORES[empresaKey];

    if (setoresDaEmpresa && !setoresDaEmpresa.some(option => option.value === setor)) {
      setSetor('');
    }
  }, [empresa, setor]);

  const getSetorOptions = () => {
    if (empresa && Object.prototype.hasOwnProperty.call(SETORES, empresa)) {
      return [...SETORES[empresa as keyof typeof SETORES]];
    }

    return [...TODOS_SETORES];
  };

  const setorOptions = getSetorOptions();

  if (setor && !setorOptions.some(option => option.value === setor)) {
    setorOptions.push({ value: setor as any, label: setor as any });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (!setor) {
        throw new Error('Campo "Setor" é obrigatório');
      }

      // Validar campos obrigatórios do formulário padrão
      if (!historiaUsuarioSolicitante.trim()) {
        throw new Error('Campo "Solicitante" é obrigatório');
      }
      if (!historiaUsuarioAcao.trim()) {
        throw new Error('Campo "Ação ou funcionalidade desejada" é obrigatório');
      }
      if (!historiaUsuarioOutros.trim()) {
        throw new Error('Campo "Outros usuários ou áreas" é obrigatório');
      }
      if (!historiaUsuarioBeneficio.trim()) {
        throw new Error('Campo "Benefício ou objetivo esperado" é obrigatório');
      }
      
      // Validar checklist de entrega
      const checklistPreenchido = checklistEntrega.filter(item => item.trim()).length;
      if (checklistPreenchido === 0) {
        throw new Error('É necessário adicionar pelo menos uma condição no Checklist de Entrega');
      }

      // Se houver formulário customizado, validar que foi preenchido
      if (customQuestions.length > 0) {
        if (!showCustomForm && !demand) {
          throw new Error('É necessário preencher o Formulário Interno da Squad antes de criar a demanda');
        }

        // Validar perguntas obrigatórias do formulário customizado
        const visibleQuestions = customQuestions.filter(question => {
          // Verifica se a pergunta deve ser exibida baseado em condições
          if (question.condicao_pergunta_id && question.condicao_resposta) {
            const condicaoAtendida = customResponses[question.condicao_pergunta_id] === question.condicao_resposta;
            return condicaoAtendida;
          }
          return true;
        });

        for (const question of visibleQuestions) {
          if (question.obrigatoria) {
            const response = customResponses[question.id]?.trim();
            if (!response) {
              throw new Error(`Pergunta obrigatória não respondida: "${question.texto}"`);
            }
            // Validação específica para múltipla escolha
            if (question.tipo === 'escolha_multipla' && !response.split(',').some(v => v.trim())) {
              throw new Error(`Pergunta obrigatória não respondida: "${question.texto}"`);
            }
          }
        }
      }

      // Monta a história do usuário a partir dos campos individuais
      const requisitos_funcionais = [
        `- Solicitante/Cargo: ${historiaUsuarioSolicitante}`,
        `- Ação ou funcionalidade desejada: ${historiaUsuarioAcao}`,
        `- Outros usuários ou áreas: ${historiaUsuarioOutros}`,
        `- Benefício ou objetivo esperado: ${historiaUsuarioBeneficio}`
      ].join('\n');

      const demandData: any = {
        empresa: empresa as 'ZC' | 'Eletro' | 'ZF' | 'ZS',
        squad: squad || null,
        departamento: setor,
        setor: setor,
        descricao,
        requisitos_funcionais: requisitos_funcionais || null,
        documentos_anexados: documentosAnexados.length > 0 ? documentosAnexados : null,
        prioridade: prioridade as 'Baixa' | 'Média' | 'Alta' | 'Crítica',
        status: status as any,
        regulatorio,
        data_limite_regulatorio: dataLimite || null,
        orcamento_fornecedor_id: fornecedorOrcamentoId || null,
        observacoes: observacoes || null,
        classificacao,
        melhoria_problema_atual: classificacao === 'Melhoria' ? melhoriaProblemaAtual : null,
        melhoria_beneficio_esperado: classificacao === 'Melhoria' ? melhoriaBeneficioEsperado : null,
        melhoria_alternativas: classificacao === 'Melhoria' ? melhoriaAlternativas : null,
        roi_estimado: roiEstimado ? parseFloat(roiEstimado) : null,
        roi_realizado: roiRealizado ? parseFloat(roiRealizado) : null,
        checklist_entrega: checklistEntrega.filter(item => item.trim()).join('\n') || null,
      };

      if (demand) {
        // Update
        const { error } = await supabase
          .from('demands')
          .update(demandData)
          .eq('id', demand.id);

        if (error) throw error;

        toast({
          title: 'Demanda atualizada!',
          description: 'A demanda foi atualizada com sucesso.',
        });
      } else {
        // Create
        const codigo = await generateDemandCode(empresa as 'ZC' | 'Eletro' | 'ZF' | 'ZS', setor);
        
        const { data: newDemand, error } = await supabase
          .from('demands')
          .insert([{
            ...demandData,
            codigo,
            solicitante_id: user.id,
          }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Demanda criada!',
          description: `Código: ${codigo}`,
        });

        // Salvar respostas customizadas se houver
        if (newDemand && customFormId && Object.keys(customResponses).length > 0) {
          const responses = Object.entries(customResponses).map(([question_id, resposta]) => ({
            demand_id: newDemand.id,
            question_id,
            resposta,
          }));

          await supabase.from('form_responses').insert(responses);
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {demand ? 'Editar Demanda' : 'Nova Demanda'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!showCustomForm && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-base font-semibold">Empresa *</Label>
                <Select
                  value={empresa}
                  onValueChange={setEmpresa}
                  required
                  disabled={permissions.isSolicitante && !permissions.canApprove}
                >
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
                {permissions.isSolicitante && !permissions.canApprove && (
                  <p className="text-xs text-muted-foreground">
                    Você só pode criar demandas para {permissions.solicitanteEmpresa}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="setor" className="text-base font-semibold">Setor *</Label>
                <Select value={setor} onValueChange={setSetor} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {setorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="squad" className="text-base font-semibold">Squad *</Label>
                <Select
                  value={squad}
                  onValueChange={setSquad}
                  required
                  disabled={!empresa}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Squad" />
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
            </div>
          )}

          {/* Campos condicionais baseados na Squad selecionada */}
          {squad && !showCustomForm ? (
            <>
              {/* Formulário padrão para demandas a definir pelo GP ou sem formulário customizado */}
              <div className="space-y-2">
                <Label htmlFor="classificacao" className="text-base font-semibold">Classificação da Demanda *</Label>
                <Select value={classificacao} onValueChange={(value: 'Melhoria' | 'Projeto') => setClassificacao(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Projeto">Projeto</SelectItem>
                    <SelectItem value="Melhoria">Melhoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-base font-semibold">Título *</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Digite o título da demanda..."
                  required
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">História do Usuário</Label>
                  <div className="mt-2 p-3 rounded-lg bg-transparent">
                    <p className="text-sm font-semibold" style={{ color: '#EDD46E' }}>
                      ⚠️ Atenção: Preencha com clareza e completude para evitar erros e retrabalho.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-semibold">Solicitante *</Label>
                    <p className="text-sm text-muted-foreground">Quem está pedindo a demanda.</p>
                    <Input
                      value={historiaUsuarioSolicitante}
                      onChange={(e) => setHistoriaUsuarioSolicitante(e.target.value)}
                      placeholder="Digite o nome do solicitante e cargo..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Ação ou funcionalidade desejada *</Label>
                    <p className="text-sm text-muted-foreground">O que você quer que o sistema ou processo faça.</p>
                    <p className="text-xs text-muted-foreground italic">Ex: gerar relatórios automáticos, cadastrar produtos, enviar notificações</p>
                    <Textarea
                      value={historiaUsuarioAcao}
                      onChange={(e) => setHistoriaUsuarioAcao(e.target.value)}
                      placeholder="Descreva a ação ou funcionalidade..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Outros usuários ou áreas *</Label>
                    <p className="text-sm text-muted-foreground">Quem será beneficiado ou usará o resultado.</p>
                    <p className="text-xs text-muted-foreground italic">Ex: equipe de vendas, setor financeiro, usuários finais</p>
                    <Textarea
                      value={historiaUsuarioOutros}
                      onChange={(e) => setHistoriaUsuarioOutros(e.target.value)}
                      placeholder="Quem mais será beneficiado..."
                      rows={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Benefício ou objetivo esperado *</Label>
                    <p className="text-sm text-muted-foreground">Qual é o ganho ou a finalidade da funcionalidade.</p>
                    <p className="text-xs text-muted-foreground italic">Ex: acompanhar metas, reduzir erros, agilizar o atendimento</p>
                    <Textarea
                      value={historiaUsuarioBeneficio}
                      onChange={(e) => setHistoriaUsuarioBeneficio(e.target.value)}
                      placeholder="Qual o benefício esperado..."
                      rows={2}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="checklist" className="text-base font-semibold">Checklist de Entrega *</Label>
                
                <div className="space-y-3 p-4 rounded-lg text-sm mt-0">
                  <p className="text-muted-foreground">
                    Lista de Verificação destinada a assegurar que o resultado final atenda integralmente às expectativas do solicitante.
                  </p>
                  <p className="font-semibold" style={{ color: '#EDD46E' }}>
                    ⚠️ Itens não especificados nesta lista não deverão ser objeto de cobrança posterior, salvo em casos de solicitação formal de mudança de escopo, devidamente registrada antes de qualquer reivindicação.
                  </p>
                </div>

                <div className="space-y-3">
                  {checklistEntrega.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newChecklist = [...checklistEntrega];
                          newChecklist[index] = e.target.value;
                          setChecklistEntrega(newChecklist);
                        }}
                        placeholder={`Condição ${index + 1}`}
                      />
                      {checklistEntrega.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newChecklist = checklistEntrega.filter((_, i) => i !== index);
                            setChecklistEntrega(newChecklist);
                          }}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setChecklistEntrega([...checklistEntrega, ''])}
                  >
                    + Incluir opção
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Documentos e Fluxogramas</Label>
                <FileUpload
                  onFilesUploaded={setDocumentosAnexados}
                  existingFiles={documentosAnexados}
                  maxFiles={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade" className="text-base font-semibold">Prioridade *</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="regulatorio"
                  checked={regulatorio}
                  onCheckedChange={setRegulatorio}
                />
                <Label htmlFor="regulatorio" className="text-base font-semibold">Demanda regulatória</Label>
              </div>

              {regulatorio && (
                <div className="space-y-2">
                  <Label htmlFor="dataLimite" className="text-base font-semibold">Data Limite Regulatória</Label>
                  <Input
                    id="dataLimite"
                    type="date"
                    value={dataLimite}
                    onChange={(e) => setDataLimite(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Foi realizado Orçamento com Terceiros?</Label>
                  <Select value={temOrcamentoTerceiros} onValueChange={(value) => {
                    setTemOrcamentoTerceiros(value);
                    if (value === 'Não') {
                      setFornecedorOrcamentoId('');
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {temOrcamentoTerceiros === 'Sim' && (
                  <div className="space-y-3">
                    {suppliers.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Selecione o Fornecedor</Label>
                        <Popover open={fornecedorPopoverOpen} onOpenChange={setFornecedorPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={fornecedorPopoverOpen}
                              className="w-full justify-between"
                            >
                              <span className="flex flex-col items-start text-left">
                                {selectedFornecedor ? (
                                  <span className="font-medium">{selectedFornecedor.nome_fantasia}</span>
                                ) : (
                                  'Selecione um fornecedor'
                                )}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[320px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar fornecedor..." />
                              <CommandList>
                                <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="limpar-selecao"
                                    onSelect={() => {
                                      setFornecedorOrcamentoId('');
                                      setFornecedorPopoverOpen(false);
                                    }}
                                  >
                                    <span className="mr-2 h-4 w-4" />
                                    Nenhum fornecedor
                                  </CommandItem>
                                  {suppliers.map((supplier) => {
                                    const isSelected = supplier.id === fornecedorOrcamentoId;
                                    return (
                                      <CommandItem
                                        key={supplier.id}
                                        value={`${supplier.nome_fantasia} ${supplier.razao_social} ${supplier.cnpj}`}
                                        onSelect={() => {
                                          setFornecedorOrcamentoId(supplier.id);
                                          setFornecedorPopoverOpen(false);
                                        }}
                                      >
                                        <Check className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                        <div className="flex flex-col">
                                          <span>{supplier.nome_fantasia}</span>
                                          <span className="text-xs text-muted-foreground">{supplier.razao_social}</span>
                                          <span className="text-xs text-muted-foreground">CNPJ: {supplier.cnpj}</span>
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            window.open('/fornecedores/cadastro', '_blank');
                          }}
                        >
                          Cadastrar Fornecedor
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          O cadastro será aberto em nova aba. Após cadastrar, volte aqui e atualize a página para ver o novo fornecedor.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-base font-semibold">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              {/* Botão para ir ao formulário customizado se houver */}
              {customQuestions.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowCustomForm(true)}
                  >
                    Continuar para Formulário Interno da Squad (Obrigatório) →
                  </Button>
                </div>
              )}
            </>
          ) : showCustomForm && customQuestions.length > 0 ? (
            <>
              {/* Formulário personalizado da squad */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Formulário Interno - {squad}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomForm(false)}
                  >
                    ← Voltar ao formulário padrão
                  </Button>
                </div>

                {customQuestions.map((question, index) => {
                  // Verifica se a pergunta deve ser exibida baseado em condições
                  if (question.condicao_pergunta_id && question.condicao_resposta) {
                    const condicaoAtendida = customResponses[question.condicao_pergunta_id] === question.condicao_resposta;
                    if (!condicaoAtendida) return null;
                  }

                  return (
                    <div key={question.id} className="space-y-2">
                      <Label className="font-semibold">
                        {index + 1}. {question.texto}
                        {question.obrigatoria && <span className="text-destructive ml-1">*</span>}
                      </Label>

                      {question.tipo === 'texto' && (
                        <Input
                          value={customResponses[question.id] || ''}
                          onChange={(e) => setCustomResponses({ ...customResponses, [question.id]: e.target.value })}
                          required={question.obrigatoria}
                        />
                      )}

                      {question.tipo === 'textarea' && (
                        <Textarea
                          value={customResponses[question.id] || ''}
                          onChange={(e) => setCustomResponses({ ...customResponses, [question.id]: e.target.value })}
                          required={question.obrigatoria}
                          rows={4}
                        />
                      )}

                      {question.tipo === 'escolha_unica' && (
                        <Select
                          value={customResponses[question.id] || ''}
                          onValueChange={(value) => setCustomResponses({ ...customResponses, [question.id]: value })}
                          required={question.obrigatoria}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {question.opcoes?.map((opcao: string) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {question.tipo === 'data' && (
                        <Input
                          type="date"
                          value={customResponses[question.id] || ''}
                          onChange={(e) => setCustomResponses({ ...customResponses, [question.id]: e.target.value })}
                          required={question.obrigatoria}
                        />
                      )}

                      {question.tipo === 'numero' && (
                        <Input
                          type="number"
                          value={customResponses[question.id] || ''}
                          onChange={(e) => setCustomResponses({ ...customResponses, [question.id]: e.target.value })}
                          required={question.obrigatoria}
                        />
                      )}

                      {question.tipo === 'classificacao' && (
                        <Select
                          value={customResponses[question.id] || ''}
                          onValueChange={(value) => setCustomResponses({ ...customResponses, [question.id]: value })}
                          required={question.obrigatoria}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Classificação..." />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} - {num === 1 ? 'Muito Baixo' : num === 2 ? 'Baixo' : num === 3 ? 'Médio' : num === 4 ? 'Alto' : 'Muito Alto'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {question.tipo === 'escolha_multipla' && (
                        <div className="space-y-2">
                          {question.opcoes?.map((opcao: string) => {
                            const currentValues = customResponses[question.id]?.split(',') || [];
                            const isChecked = currentValues.includes(opcao);
                            
                            return (
                              <label key={opcao} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const newValues = e.target.checked
                                      ? [...currentValues, opcao]
                                      : currentValues.filter(v => v !== opcao);
                                    setCustomResponses({ 
                                      ...customResponses, 
                                      [question.id]: newValues.join(',') 
                                    });
                                  }}
                                  className="w-4 h-4"
                                />
                                <span>{opcao}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                     </div>
                  );
                })}
              </div>
            </>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : demand ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DemandDialog;
