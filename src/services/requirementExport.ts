import { Document, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FunctionalRequirementRecord } from './functionalRequirements';
import {
  FUNCTIONAL_REQUIREMENT_STATUS_CONFIG,
  FUNCTIONAL_REQUIREMENT_SIGNATURE_STATUS_CONFIG,
} from '@/types/functionalRequirement';

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const exportToWord = async (requirement: FunctionalRequirementRecord) => {
  const statusConfig = FUNCTIONAL_REQUIREMENT_STATUS_CONFIG[requirement.status];
  
  // Criar tabela de assinaturas
  const signatureRows = (requirement.approver_ids || []).map((approverId) => {
    const signature = requirement.signatures?.find((s) => s.signer_id === approverId);
    const sigStatus = signature?.status ?? 'pendente';
    const sigConfig = FUNCTIONAL_REQUIREMENT_SIGNATURE_STATUS_CONFIG[sigStatus];
    
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: signature?.signer?.full_name || 'Não identificado' })],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: sigConfig.label })],
          width: { size: 20, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: signature?.signed_at ? formatDateTime(signature.signed_at) : '-' })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ text: signature?.comment || '-' })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'ESPECIFICAÇÃO FUNCIONAL',
            heading: 'Title',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Título: ', bold: true }),
              new TextRun({ text: requirement.titulo }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Descrição: ', bold: true }),
              new TextRun({ text: requirement.descricao }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Setor: ', bold: true }),
              new TextRun({ text: requirement.setor }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Status: ', bold: true }),
              new TextRun({ text: statusConfig.label }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Criado por: ', bold: true }),
              new TextRun({ text: requirement.creator?.full_name || 'Não identificado' }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Data de criação: ', bold: true }),
              new TextRun({ text: formatDateTime(requirement.created_at) }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'ASSINATURAS DIGITAIS',
            heading: 'Heading1',
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Aprovador', bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Data/Hora', bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Comentário', bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              ...signatureRows,
            ],
          }),
          new Paragraph({
            text: '',
            spacing: { before: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: 'Este documento contém assinaturas digitais registradas com códigos criptográficos únicos.',
                italics: true,
                size: 20,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `requisito-funcional-${requirement.id.substring(0, 8)}.docx`);
};

export const exportToPDF = async (requirement: FunctionalRequirementRecord) => {
  const statusConfig = FUNCTIONAL_REQUIREMENT_STATUS_CONFIG[requirement.status];
  const pdf = new jsPDF();

  // Título
  pdf.setFontSize(18);
  pdf.text('ESPECIFICAÇÃO FUNCIONAL', pdf.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  // Informações gerais
  pdf.setFontSize(12);
  let yPos = 40;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Título:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(requirement.titulo, 50, yPos);
  yPos += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Descrição:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  const descLines = pdf.splitTextToSize(requirement.descricao, 150);
  pdf.text(descLines, 50, yPos);
  yPos += descLines.length * 7 + 5;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Setor:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(requirement.setor, 50, yPos);
  yPos += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Status:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(statusConfig.label, 50, yPos);
  yPos += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Criado por:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(requirement.creator?.full_name || 'Não identificado', 50, yPos);
  yPos += 10;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Data de criação:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDateTime(requirement.created_at), 50, yPos);
  yPos += 20;

  // Tabela de assinaturas
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASSINATURAS DIGITAIS', 20, yPos);
  yPos += 10;

  const signatureData = (requirement.approver_ids || []).map((approverId) => {
    const signature = requirement.signatures?.find((s) => s.signer_id === approverId);
    const sigStatus = signature?.status ?? 'pendente';
    const sigConfig = FUNCTIONAL_REQUIREMENT_SIGNATURE_STATUS_CONFIG[sigStatus];

    return [
      signature?.signer?.full_name || 'Não identificado',
      sigConfig.label,
      signature?.signed_at ? formatDateTime(signature.signed_at) : '-',
      signature?.comment || '-',
    ];
  });

  autoTable(pdf, {
    head: [['Aprovador', 'Status', 'Data/Hora', 'Comentário']],
    body: signatureData,
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [71, 85, 105] },
  });

  // Nota de rodapé
  const finalY = (pdf as any).lastAutoTable.finalY || yPos + 50;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text(
    'Este documento contém assinaturas digitais registradas com códigos criptográficos únicos.',
    pdf.internal.pageSize.getWidth() / 2,
    finalY + 15,
    { align: 'center' }
  );

  pdf.save(`requisito-funcional-${requirement.id.substring(0, 8)}.pdf`);
};
