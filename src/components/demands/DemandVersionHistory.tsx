import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, FileText, User } from 'lucide-react';

interface DemandVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demandId: string;
  currentVersion: number;
}

interface VersionHistoryEntry {
  id: string;
  created_at: string;
  descricao: string;
  snapshot_completo: any;
  user_id: string;
  user_name?: string;
}

const DemandVersionHistory = ({ open, onOpenChange, demandId, currentVersion }: DemandVersionHistoryProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<VersionHistoryEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<VersionHistoryEntry | null>(null);

  useEffect(() => {
    if (open) {
      loadVersionHistory();
    }
  }, [open, demandId]);

  const loadVersionHistory = async () => {
    setLoading(true);
    try {
      // Buscar histórico de mudanças de escopo
      const { data: historyData, error: historyError } = await supabase
        .from('demand_history')
        .select('*')
        .eq('demand_id', demandId)
        .eq('action', 'mudanca_escopo')
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Buscar nomes dos usuários
      const userIds = [...new Set(historyData?.map(h => h.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const versionsWithNames = (historyData || []).map(h => ({
        ...h,
        user_name: profileMap.get(h.user_id) || 'Usuário desconhecido',
      }));

      setVersions(versionsWithNames);
    } catch (error: any) {
      console.error('Erro ao carregar histórico de versões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de versões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getVersionNumber = (index: number) => {
    return currentVersion - index;
  };

  return (
    <>
      <Dialog open={open && !selectedVersion} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Histórico de Versões
              <Badge variant="secondary">V{currentVersion} (Atual)</Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando histórico...</div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma mudança de escopo registrada ainda.</p>
                <p className="text-sm mt-1">Esta é a versão original da demanda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version, index) => {
                  const versionNum = getVersionNumber(index);
                  return (
                    <div
                      key={version.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={versionNum === currentVersion ? 'default' : 'outline'}>
                              V{versionNum}
                            </Badge>
                            <span className="text-sm font-medium">{version.descricao}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {version.user_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes da Versão */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Detalhes da Versão - {selectedVersion.descricao}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Informações Anteriores</h3>
                
                {/* Identificação */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary">Identificação</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">ID Demanda Anterior:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.codigo || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Empresa:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.empresa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Departamento:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.departamento || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Setor:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.setor || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Squad:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.squad || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.status || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary">Descrição</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Descrição:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.snapshot_completo?.descricao || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Classificação:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.classificacao || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Tipo de Projeto:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.tipo_projeto || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Prioridade:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.prioridade || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Requisitos Funcionais */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary">Requisitos Funcionais</h4>
                  <div>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedVersion.snapshot_completo?.requisitos_funcionais || '-'}
                    </p>
                  </div>
                </div>

                {/* Problema e Benefícios */}
                {(selectedVersion.snapshot_completo?.melhoria_problema_atual || 
                  selectedVersion.snapshot_completo?.melhoria_beneficio_esperado ||
                  selectedVersion.snapshot_completo?.melhoria_alternativas) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Problema e Benefícios</h4>
                    <div className="space-y-3">
                      {selectedVersion.snapshot_completo?.melhoria_problema_atual && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Problema Atual:</span>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.snapshot_completo.melhoria_problema_atual}</p>
                        </div>
                      )}
                      {selectedVersion.snapshot_completo?.melhoria_beneficio_esperado && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Benefício Esperado:</span>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.snapshot_completo.melhoria_beneficio_esperado}</p>
                        </div>
                      )}
                      {selectedVersion.snapshot_completo?.melhoria_alternativas && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Alternativas Consideradas:</span>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.snapshot_completo.melhoria_alternativas}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estimativas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary">Estimativas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Horas Estimadas:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.horas_estimadas || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Custo Estimado:</span>
                      <p className="text-sm mt-1">
                        {selectedVersion.snapshot_completo?.custo_estimado
                          ? `R$ ${Number(selectedVersion.snapshot_completo.custo_estimado).toFixed(2)}`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">ROI Estimado:</span>
                      <p className="text-sm mt-1">
                        {selectedVersion.snapshot_completo?.roi_estimado
                          ? `R$ ${Number(selectedVersion.snapshot_completo.roi_estimado).toFixed(2)}`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">ROI Realizado:</span>
                      <p className="text-sm mt-1">
                        {selectedVersion.snapshot_completo?.roi_realizado
                          ? `R$ ${Number(selectedVersion.snapshot_completo.roi_realizado).toFixed(2)}`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Pontuação de Seleção:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo?.pontuacao_selecao || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary">Datas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedVersion.snapshot_completo?.data_inicio && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Data de Início:</span>
                        <p className="text-sm mt-1">
                          {format(new Date(selectedVersion.snapshot_completo.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    {selectedVersion.snapshot_completo?.data_conclusao && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Data de Conclusão:</span>
                        <p className="text-sm mt-1">
                          {format(new Date(selectedVersion.snapshot_completo.data_conclusao), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    {selectedVersion.snapshot_completo?.data_aprovacao_comite && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Data Aprovação Comitê:</span>
                        <p className="text-sm mt-1">
                          {format(new Date(selectedVersion.snapshot_completo.data_aprovacao_comite), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    {selectedVersion.snapshot_completo?.data_limite_regulatorio && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Data Limite Regulatório:</span>
                        <p className="text-sm mt-1">
                          {format(new Date(selectedVersion.snapshot_completo.data_limite_regulatorio), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Regulatório */}
                {selectedVersion.snapshot_completo?.regulatorio && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Informações Regulatórias</h4>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Demanda Regulatória:</span>
                      <p className="text-sm mt-1">Sim</p>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {(selectedVersion.snapshot_completo?.observacoes || 
                  selectedVersion.snapshot_completo?.justificativa_comite ||
                  selectedVersion.snapshot_completo?.resultados_alcancados ||
                  selectedVersion.snapshot_completo?.checklist_entrega) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Observações e Resultados</h4>
                    <div className="space-y-3">
                      {selectedVersion.snapshot_completo?.observacoes && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Observações:</span>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.snapshot_completo.observacoes}</p>
                        </div>
                      )}
                      {selectedVersion.snapshot_completo?.justificativa_comite && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Justificativa Comitê:</span>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.snapshot_completo.justificativa_comite}</p>
                        </div>
                      )}
                      {selectedVersion.snapshot_completo?.resultados_alcancados && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Resultados Alcançados:</span>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.snapshot_completo.resultados_alcancados}</p>
                        </div>
                      )}
                      {selectedVersion.snapshot_completo?.checklist_entrega && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Checklist de Entrega:</span>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedVersion.snapshot_completo.checklist_entrega}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documentos */}
                {(selectedVersion.snapshot_completo?.estudo_viabilidade_url || 
                  selectedVersion.snapshot_completo?.documentos_anexados?.length > 0) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Documentos</h4>
                    <div className="space-y-3">
                      {selectedVersion.snapshot_completo?.estudo_viabilidade_url && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Estudo de Viabilidade:</span>
                          <p className="text-sm mt-1">
                            <a 
                              href={selectedVersion.snapshot_completo.estudo_viabilidade_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {selectedVersion.snapshot_completo.estudo_viabilidade_url}
                            </a>
                          </p>
                        </div>
                      )}
                      {selectedVersion.snapshot_completo?.documentos_anexados?.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Documentos Anexados:</span>
                          <div className="mt-2 space-y-2">
                            {selectedVersion.snapshot_completo.documentos_anexados.map((doc: string, idx: number) => {
                              const fileName = doc.split('/').pop() || doc;
                              
                              const handleDownload = async () => {
                                try {
                                  const { data, error } = await supabase.storage
                                    .from('demand-documents')
                                    .createSignedUrl(doc, 60);
                                  
                                  if (error) throw error;
                                  if (data?.signedUrl) {
                                    window.open(data.signedUrl, '_blank');
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: 'Erro ao baixar arquivo',
                                    description: error.message,
                                    variant: 'destructive',
                                  });
                                }
                              };
                              
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <button
                                    onClick={handleDownload}
                                    className="text-sm text-primary hover:underline text-left"
                                  >
                                    {fileName}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sprint */}
                {selectedVersion.snapshot_completo?.sprint_atual && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-primary">Sprint</h4>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Sprint Atual:</span>
                      <p className="text-sm mt-1">{selectedVersion.snapshot_completo.sprint_atual}</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedVersion(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default DemandVersionHistory;
