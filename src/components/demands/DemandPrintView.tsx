import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DemandPrintViewProps {
  demand: any;
  approvals?: any[];
  history?: any[];
  assignments?: any[];
  questions?: any[];
  responses?: Record<string, string>;
}

export const DemandPrintView = ({ 
  demand, 
  approvals = [], 
  history = [], 
  assignments = [],
  questions = [],
  responses = {}
}: DemandPrintViewProps) => {
  const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
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

  return (
    <div id="print-content" className="hidden print:block">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            
            body * {
              visibility: hidden;
            }
            
            #print-content,
            #print-content * {
              visibility: visible;
            }
            
            #print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1a202c;
              line-height: 1.6;
            }
            
            .page-break {
              page-break-after: always;
            }
            
            .no-break {
              page-break-inside: avoid;
            }
            
            .print-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              margin: -20mm -20mm 20px -20mm;
              border-radius: 0;
            }
            
            .print-title {
              font-size: 32px;
              font-weight: 800;
              margin-bottom: 10px;
              letter-spacing: -0.5px;
            }
            
            .print-subtitle {
              font-size: 16px;
              opacity: 0.95;
              font-weight: 500;
            }
            
            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: #2d3748;
              border-bottom: 3px solid #667eea;
              padding-bottom: 8px;
              margin: 30px 0 20px 0;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 25px;
            }
            
            .info-box {
              background: #f7fafc;
              border-left: 4px solid #667eea;
              padding: 12px 15px;
              border-radius: 4px;
            }
            
            .info-label {
              font-size: 11px;
              font-weight: 700;
              color: #4a5568;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }
            
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #1a202c;
            }
            
            .text-box {
              background: #f7fafc;
              border: 1px solid #e2e8f0;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 15px;
            }
            
            .text-content {
              font-size: 13px;
              color: #2d3748;
              white-space: pre-wrap;
              line-height: 1.7;
            }
            
            .form-question {
              background: white;
              border: 1px solid #cbd5e0;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 12px;
              border-left: 4px solid #667eea;
            }
            
            .form-question-number {
              display: inline-block;
              background: #667eea;
              color: white;
              font-size: 11px;
              font-weight: 700;
              padding: 3px 10px;
              border-radius: 12px;
              margin-bottom: 8px;
            }
            
            .form-question-text {
              font-size: 12px;
              font-weight: 700;
              color: #2d3748;
              margin-bottom: 8px;
            }
            
            .form-answer {
              font-size: 13px;
              color: #4a5568;
              padding: 8px 12px;
              background: #f7fafc;
              border-radius: 4px;
            }
            
            .table-print {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 12px;
            }
            
            .table-print thead {
              background: #2d3748;
              color: white;
            }
            
            .table-print th,
            .table-print td {
              border: 1px solid #cbd5e0;
              padding: 10px;
              text-align: left;
            }
            
            .table-print tbody tr:nth-child(even) {
              background: #f7fafc;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 700;
            }
            
            .status-approved {
              background: #c6f6d5;
              color: #22543d;
            }
            
            .status-rejected {
              background: #fed7d7;
              color: #742a2a;
            }
            
            .status-pending {
              background: #feebc8;
              color: #7c2d12;
            }
            
            .timeline-item {
              border-left: 3px solid #667eea;
              padding-left: 15px;
              padding-bottom: 15px;
              margin-left: 10px;
              position: relative;
            }
            
            .timeline-item::before {
              content: '';
              position: absolute;
              left: -7px;
              top: 0;
              width: 11px;
              height: 11px;
              border-radius: 50%;
              background: #667eea;
              border: 2px solid white;
            }
            
            .timeline-date {
              font-size: 11px;
              color: #718096;
              font-weight: 600;
            }
            
            .timeline-action {
              font-size: 13px;
              font-weight: 700;
              color: #2d3748;
              margin: 5px 0;
            }
            
            .timeline-description {
              font-size: 12px;
              color: #4a5568;
            }
            
            .footer-print {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              font-size: 11px;
              color: #718096;
            }
            
            .highlight-box {
              background: #edf2f7;
              border: 2px solid #667eea;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
          }
        `}
      </style>

      {/* Cabeçalho Sofisticado */}
      <div className="print-header no-break">
        <div className="print-title">Demanda {demand.codigo}</div>
        <div className="print-subtitle">
          {demand.empresa} • {demand.setor || demand.departamento} {demand.squad ? `• Squad: ${demand.squad}` : ''}
        </div>
        <div style={{ marginTop: '15px', fontSize: '13px', opacity: 0.9 }}>
          📅 Gerado em {generatedAt}
        </div>
      </div>

      {/* Informações Principais em Destaque */}
      <div className="highlight-box no-break">
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#2d3748', marginBottom: '15px' }}>
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
          {demand.roi_estimado && (
            <div className="info-box" style={{ borderLeftColor: '#48bb78' }}>
              <div className="info-label">ROI Estimado</div>
              <div className="info-value">{demand.roi_estimado}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Descrição e Detalhes */}
      <div className="no-break">
        <div className="section-title">📋 Descrição da Demanda</div>
        <div className="text-box">
          <div className="text-content">{demand.descricao}</div>
        </div>
      </div>

      {demand.requisitos_funcionais && (
        <div className="no-break">
          <div className="section-title">👤 História do Usuário</div>
          <div className="text-box">
            {demand.requisitos_funcionais.split('\n').map((line: string, index: number) => (
              <div key={index} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>
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

      {demand.checklist_entrega && (
        <div className="no-break">
          <div className="section-title">📦 Checklist de Entrega</div>
          <div className="text-box">
            {demand.checklist_entrega.split('\n').filter((item: string) => item.trim()).map((item: string, index: number) => (
              <div key={index} style={{ 
                padding: '8px 12px',
                marginBottom: '6px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ 
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '2px solid #667eea',
                  borderRadius: '4px'
                }}></span>
                <span style={{ fontSize: '13px', color: '#2d3748' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {demand.observacoes && (
        <div className="no-break">
          <div className="section-title">📝 Observações</div>
          <div className="text-box">
            <div className="text-content">{demand.observacoes}</div>
          </div>
        </div>
      )}

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

      {demand.justificativa_comite && (
        <div className="no-break">
          <div className="section-title">💼 Justificativa do Comitê</div>
          <div className="text-box">
            <div className="text-content">{demand.justificativa_comite}</div>
          </div>
        </div>
      )}

      {demand.resultados_alcancados && (
        <div className="no-break">
          <div className="section-title">🎯 Resultados Alcançados</div>
          <div className="text-box">
            <div className="text-content">{demand.resultados_alcancados}</div>
          </div>
        </div>
      )}

      {/* Formulários Personalizados Enumerados */}
      {questions && questions.length > 0 && (
        <div className="page-break">
          <div className="section-title">📄 Formulário Personalizado da Squad</div>
          <div style={{ marginTop: '20px' }}>
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
          <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '6px', marginTop: '15px' }}>
            {demand.documentos_anexados.map((doc: string, index: number) => (
              <div key={index} style={{ 
                padding: '10px', 
                borderBottom: index < demand.documentos_anexados.length - 1 ? '1px solid #e2e8f0' : 'none',
                fontSize: '13px',
                color: '#2d3748'
              }}>
                <span style={{ fontWeight: '600', marginRight: '10px' }}>{index + 1}.</span>
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
              {approvals.map((approval: any, index: number) => {
                const statusLabel =
                  approval.status === 'aprovado'
                    ? 'Aprovado'
                    : approval.status === 'recusado'
                      ? 'Recusado'
                      : 'Pendente';

                const statusClass =
                  approval.status === 'aprovado'
                    ? 'status-approved'
                    : approval.status === 'recusado'
                      ? 'status-rejected'
                      : 'status-pending';

                const approvalDate = approval.updated_at || approval.created_at;

                return (
                  <tr key={index}>
                    <td style={{ fontWeight: '600' }}>{approval.approval_level}</td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>
                        {statusLabel}
                      </span>
                      {approval.motivo_recusa && (
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#4A5568' }}>
                          Motivo: {approval.motivo_recusa}
                        </div>
                      )}
                    </td>
                    <td>{approval.profiles?.full_name || '-'}</td>
                    <td>
                      {approvalDate
                        ? format(new Date(approvalDate), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <div className="page-break">
          <div className="section-title">📜 Histórico de Alterações</div>
          <div style={{ marginTop: '20px' }}>
            {history.map((item: any, index: number) => (
              <div key={index} className="timeline-item">
                <div className="timeline-date">
                  {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div className="timeline-action">{item.action}</div>
                <div className="timeline-description">{item.descricao}</div>
                {item.profiles?.full_name && (
                  <div style={{ fontSize: '11px', color: '#718096', marginTop: '5px' }}>
                    Por: {item.profiles.full_name}
                  </div>
                )}
              </div>
            ))}
          </div>
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
                  <td>
                    <span className={`status-badge ${assignment.faseamento_completo ? 'status-approved' : 'status-pending'}`}>
                      {assignment.faseamento_completo ? 'Sim' : 'Não'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé Profissional */}
      <div className="footer-print">
        <div style={{ fontWeight: '700', fontSize: '12px', color: '#2d3748', marginBottom: '8px' }}>
          Sistema de Gestão de Projetos
        </div>
        <div>
          Documento gerado automaticamente em {generatedAt}
        </div>
        <div style={{ marginTop: '8px', fontSize: '10px' }}>
          Este documento contém informações confidenciais e destinadas exclusivamente ao uso interno.
        </div>
      </div>
    </div>
  );
};
