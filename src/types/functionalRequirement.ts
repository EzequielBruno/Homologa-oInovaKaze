import { Database } from '@/integrations/supabase/types';

export type FunctionalRequirement = Database['public']['Tables']['functional_requirements']['Row'];
export type FunctionalRequirementSignature = Database['public']['Tables']['functional_requirement_signatures']['Row'];
export type FunctionalRequirementStatus = Database['public']['Enums']['functional_requirement_status'];
export type FunctionalRequirementSignatureStatus = Database['public']['Enums']['functional_requirement_signature_status'];

export const FUNCTIONAL_REQUIREMENT_STATUS_CONFIG: Record<FunctionalRequirementStatus, {
  label: string;
  badgeClass: string;
  description: string;
}> = {
  rascunho: {
    label: 'Rascunho',
    badgeClass: 'bg-muted text-muted-foreground border-muted-foreground/30',
    description: 'Requisito em preparação aguardando definição dos aprovadores.',
  },
  pendente: {
    label: 'Pendente',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    description: 'Requisito encaminhado e aguardando assinaturas digitais.',
  },
  assinado: {
    label: 'Assinado',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    description: 'Fluxo de assinatura concluído com sucesso.',
  },
  rejeitado: {
    label: 'Rejeitado',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
    description: 'Requisito foi reprovado e necessita de ajustes.',
  },
};

export const FUNCTIONAL_REQUIREMENT_SIGNATURE_STATUS_CONFIG: Record<FunctionalRequirementSignatureStatus, {
  label: string;
  badgeClass: string;
}> = {
  pendente: {
    label: 'Pendente',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  assinado: {
    label: 'Assinado',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  rejeitado: {
    label: 'Rejeitado',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};
