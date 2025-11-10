import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

const ImprimirDemanda = () => {
  const { id } = useParams();
  const [demand, setDemand] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        // Carregar demanda
        const { data: demandData } = await supabase
          .from('demands')
          .select('*, profiles:solicitante_id(full_name)')
          .eq('id', id)
          .maybeSingle();

        // Carregar aprovações
        const { data: approvalsData } = await supabase
          .from('demand_approvals')
          .select('*, profiles:approver_id(full_name)')
          .eq('demand_id', id)
          .order('created_at', { ascending: false });

        // Carregar histórico
        const { data: historyData } = await supabase
          .from('demand_history')
          .select('*, profiles:user_id(full_name)')
          .eq('demand_id', id)
          .order('created_at', { ascending: false });

        // Carregar atribuições
        const { data: assignmentsData } = await supabase
          .from('demand_assignments')
          .select('*, assigned_to_profile:assigned_to(full_name), assigned_by_profile:assigned_by(full_name)')
          .eq('demand_id', id)
          .order('created_at', { ascending: false });

        // Carregar formulário personalizado
        if (demandData) {
          const { data: formData } = await supabase
            .from('custom_squad_forms')
            .select('id')
            .eq('empresa', demandData.empresa)
            .eq('squad', demandData.squad || '')
            .eq('ativo', true)
            .maybeSingle();

          if (formData) {
            const { data: questionsData } = await supabase
              .from('form_questions')
              .select('*')
              .eq('form_id', formData.id)
              .order('ordem', { ascending: true });

            const { data: responsesData } = await supabase
              .from('form_responses')
              .select('question_id, resposta')
              .eq('demand_id', id);

            if (questionsData) {
              setQuestions(questionsData);
              const responsesMap: Record<string, string> = {};
              responsesData?.forEach((r) => {
                responsesMap[r.question_id] = r.resposta;
              });
              setResponses(responsesMap);
            }
          }
        }

        setDemand(demandData);
        setApprovals(approvalsData || []);
        setHistory(historyData || []);
        setAssignments(assignmentsData || []);
      } catch (error) {
        console.error('Error loading demand:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'StandBy': 'Stand By',
      'Backlog': 'Backlog',
      'Aguardando_Gerente': 'Aguardando Gerente',
      'Aprovado_GP': 'Aprovado GP',
      'Aguardando_Validacao_TI': 'Aguardando Validação TI',
      'Aguardando_Comite': 'Aguardando Comitê',
      'Revisao': 'Em Revisão',
      'Aprovado': 'Aprovado',
      'Em_Progresso': 'Em Progresso',
      'Concluido': 'Concluído',
      'Bloqueado': 'Bloqueado',
      'Recusado': 'Recusado',
      'Arquivado': 'Arquivado',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Demanda não encontrada</p>
      </div>
    );
  }

  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background p-8">
      <style>
        {`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
            
            .page-break {
              page-break-after: always;
            }
            
            .no-break {
              page-break-inside: avoid;
            }
          }
          
          .print-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          
          .print-title {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 10px;
          }
          
          .print-subtitle {
            font-size: 18px;
            opacity: 0.95;
          }
          
          .section-title {
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            margin: 40px 0 20px 0;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .info-box {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 6px;
          }
          
          .info-label {
            font-size: 12px;
            font-weight: 700;
            color: #4a5568;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          
          .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #1a202c;
          }
          
          .text-box {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          
          .text-content {
            font-size: 14px;
            color: #2d3748;
            white-space: pre-wrap;
            line-height: 1.8;
          }
          
          .form-question {
            background: white;
            border: 1px solid #cbd5e0;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
          }
          
          .form-question-number {
            display: inline-block;
            background: #667eea;
            color: white;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 12px;
            margin-bottom: 10px;
          }
          
          .form-question-text {
            font-size: 14px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 10px;
          }
          
          .form-answer {
            font-size: 14px;
            color: #4a5568;
            padding: 12px;
            background: #f7fafc;
            border-radius: 6px;
          }
          
          .highlight-box {
            background: #edf2f7;
            border: 2px solid #667eea;
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
          }
          
          .table-print {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          
          .table-print thead {
            background: #2d3748;
            color: white;
          }
          
          .table-print th,
          .table-print td {
            border: 1px solid #cbd5e0;
            padding: 12px;
            text-align: left;
          }
          
          .table-print tbody tr:nth-child(even) {
            background: #f7fafc;
          }
        `}
      </style>

      {/* Botão para imprimir */}
      <div className="no-print mb-6 flex justify-end">
        <button
          onClick={() => window.print()}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          🖨️ Imprimir Documento
        </button>
      </div>

      {/* Cabeçalho */}
      <div className="print-header no-break">
        <div className="print-title">Demanda {demand.codigo}</div>
        <div className="print-subtitle">
          {demand.empresa} • {demand.setor || demand.departamento} {demand.squad ? `• Squad: ${demand.squad}` : ''}
        </div>
        <div style={{ marginTop: '15px', fontSize: '14px', opacity: 0.9 }}>
          📅 Gerado em {generatedAt}
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="highlight-box no-break">
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#2d3748', marginBottom: '20px' }}>
          Resumo Executivo
        </div>
        <div className="info-grid">
          <div className="info-box">
            <div className="info-label">Status Atual</div>
            <div className="info-value">{getStatusLabel(demand.status)}</div>
          </div>
          <div className="info-box">
            <div className="info-label">Prioridade</div>
            <div className="info-value">{demand.prioridade}</div>
          </div>
          <div className="info-box">
            <div className="info-label">Classificação</div>
            <div className="info-value">{demand.classificacao || '-'}</div>
          </div>
          <div className="info-box">
            <div className="info-label">Sprint Atual</div>
            <div className="info-value">{demand.sprint_atual || '-'}</div>
          </div>
          <div className="info-box">
            <div className="info-label">Horas Estimadas</div>
            <div className="info-value">{demand.horas_estimadas ? `${demand.horas_estimadas}h` : '-'}</div>
          </div>
          <div className="info-box">
            <div className="info-label">Custo Estimado</div>
            <div className="info-value">
              {demand.custo_estimado ? `R$ ${demand.custo_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
            </div>
          </div>
          {demand.regulatorio && (
            <>
              <div className="info-box" style={{ borderLeftColor: '#f56565' }}>
                <div className="info-label">⚠️ Demanda Regulatória</div>
                <div className="info-value">Sim</div>
              </div>
              {demand.data_limite_regulatorio && (
                <div className="info-box" style={{ borderLeftColor: '#f56565' }}>
                  <div className="info-label">Data Limite</div>
                  <div className="info-value">
                    {format(new Date(demand.data_limite_regulatorio), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Descrição */}
      <div className="no-break">
        <div className="section-title">📋 Descrição da Demanda</div>
        <div className="text-box">
          <div className="text-content">{demand.descricao}</div>
        </div>
      </div>

      {/* História do Usuário */}
      {demand.requisitos_funcionais && (
        <div className="no-break">
          <div className="section-title">👤 História do Usuário</div>
          <div className="text-box">
            {demand.requisitos_funcionais.split('\n').map((line: string, index: number) => (
              <div key={index} style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>
                  {line.includes('Solicitante/Cargo:') && '👨‍💼 Solicitante/Cargo'}
                  {line.includes('Ação ou funcionalidade') && '⚡ Ação ou funcionalidade desejada'}
                  {line.includes('Outros usuários') && '👥 Outros usuários ou áreas'}
                  {line.includes('Benefício ou objetivo') && '🎯 Benefício ou objetivo esperado'}
                </div>
                <div className="text-content">
                  {line.replace(/^- [^:]+:\s*/, '')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist de Entrega */}
      {demand.checklist_entrega && (
        <div className="no-break">
          <div className="section-title">📦 Checklist de Entrega</div>
          <div className="text-box">
            {demand.checklist_entrega.split('\n').filter((item: string) => item.trim()).map((item: string, index: number) => (
              <div key={index} style={{ 
                padding: '10px 15px',
                marginBottom: '8px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '2px solid #667eea',
                  borderRadius: '4px'
                }}></span>
                <span style={{ fontSize: '14px', color: '#2d3748' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observações */}
      {demand.observacoes && (
        <div className="no-break">
          <div className="section-title">📝 Observações</div>
          <div className="text-box">
            <div className="text-content">{demand.observacoes}</div>
          </div>
        </div>
      )}

      {/* Campos de Melhoria */}
      {demand.classificacao === 'Melhoria' && (
        <>
          {demand.melhoria_problema_atual && (
            <div className="no-break">
              <div className="section-title">⚠️ Problema Atual (Melhoria)</div>
              <div className="text-box">
                <div className="text-content">{demand.melhoria_problema_atual}</div>
              </div>
            </div>
          )}
          {demand.melhoria_beneficio_esperado && (
            <div className="no-break">
              <div className="section-title">✨ Benefício Esperado (Melhoria)</div>
              <div className="text-box">
                <div className="text-content">{demand.melhoria_beneficio_esperado}</div>
              </div>
            </div>
          )}
          {demand.melhoria_alternativas && (
            <div className="no-break">
              <div className="section-title">🔄 Alternativas Consideradas</div>
              <div className="text-box">
                <div className="text-content">{demand.melhoria_alternativas}</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Justificativa do Comitê */}
      {demand.justificativa_comite && (
        <div className="no-break">
          <div className="section-title">💼 Justificativa do Comitê</div>
          <div className="text-box">
            <div className="text-content">{demand.justificativa_comite}</div>
          </div>
        </div>
      )}

      {/* Resultados Alcançados */}
      {demand.resultados_alcancados && (
        <div className="no-break">
          <div className="section-title">🎯 Resultados Alcançados</div>
          <div className="text-box">
            <div className="text-content">{demand.resultados_alcancados}</div>
          </div>
        </div>
      )}

      {/* Formulário Personalizado */}
      {questions.length > 0 && (
        <div className="page-break">
          <div className="section-title">📄 Formulário Personalizado da Squad</div>
          <div style={{ marginTop: '25px' }}>
            {questions.map((question: any, index: number) => (
              <div key={question.id} className="form-question no-break">
                <div className="form-question-number">Questão {index + 1}</div>
                <div className="form-question-text">{question.texto}</div>
                <div className="form-answer">
                  {responses[question.id] || '❌ Não respondido'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arquivos Anexados */}
      {demand.documentos_anexados && demand.documentos_anexados.length > 0 && (
        <div className="no-break">
          <div className="section-title">📎 Documentos Anexados</div>
          <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            {demand.documentos_anexados.map((doc: string, index: number) => (
              <div key={index} style={{ 
                padding: '12px', 
                borderBottom: index < demand.documentos_anexados.length - 1 ? '1px solid #e2e8f0' : 'none',
                fontSize: '14px',
                color: '#2d3748'
              }}>
                <span style={{ fontWeight: '600', marginRight: '12px' }}>{index + 1}.</span>
                {doc.split('/').pop()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aprovações */}
      {approvals.length > 0 && (
        <div className="page-break">
          <div className="section-title">✅ Aprovações</div>
          <table className="table-print">
            <thead>
              <tr>
                <th>Nível de Aprovação</th>
                <th>Status</th>
                <th>Aprovador</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval: any, index: number) => (
                <tr key={index}>
                  <td style={{ fontWeight: '600' }}>{approval.approval_level}</td>
                  <td>{approval.status}</td>
                  <td>{approval.profiles?.full_name || '-'}</td>
                  <td>{format(new Date(approval.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <div className="page-break">
          <div className="section-title">📜 Histórico de Alterações</div>
          <table className="table-print">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ação</th>
                <th>Descrição</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                  <td style={{ fontWeight: '600' }}>{item.action}</td>
                  <td>{item.descricao}</td>
                  <td>{item.profiles?.full_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Atribuições */}
      {assignments.length > 0 && (
        <div className="no-break">
          <div className="section-title">👥 Histórico de Atribuições</div>
          <table className="table-print">
            <thead>
              <tr>
                <th>Sprint</th>
                <th>Atribuído para</th>
                <th>Atribuído por</th>
                <th>Data</th>
                <th>Faseamento Completo</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment: any, index: number) => (
                <tr key={index}>
                  <td style={{ fontWeight: '600' }}>Sprint {assignment.sprint_number}</td>
                  <td>{assignment.assigned_to_profile?.full_name || '-'}</td>
                  <td>{assignment.assigned_by_profile?.full_name || '-'}</td>
                  <td>{format(new Date(assignment.created_at), "dd/MM/yyyy", { locale: ptBR })}</td>
                  <td>{assignment.faseamento_completo ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: '50px', paddingTop: '25px', borderTop: '2px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#718096' }}>
        <div style={{ fontWeight: '700', fontSize: '14px', color: '#2d3748', marginBottom: '10px' }}>
          Sistema de Gestão de Projetos
        </div>
        <div>
          Documento gerado automaticamente em {generatedAt}
        </div>
        <div style={{ marginTop: '10px', fontSize: '11px' }}>
          Este documento contém informações confidenciais e destinadas exclusivamente ao uso interno.
        </div>
      </div>
    </div>
  );
};

export default ImprimirDemanda;
