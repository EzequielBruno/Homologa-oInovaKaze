import { supabase } from '@/integrations/supabase/client';
import type {
  FunctionalRequirement,
  FunctionalRequirementSignature,
  FunctionalRequirementSignatureStatus,
} from '@/types/functionalRequirement';
import type { TablesInsert } from '@/integrations/supabase/types';

export interface FunctionalRequirementRecord extends FunctionalRequirement {
  signatures: (FunctionalRequirementSignature & {
    signer?: { full_name: string | null };
  })[];
  creator?: { full_name: string | null };
  currentApprover?: { full_name: string | null };
}

export interface CreateFunctionalRequirementPayload {
  titulo: string;
  descricao: string;
  setor: FunctionalRequirement['setor'];
  approverIds: string[];
  creatorId: string;
}

export interface EvaluateFunctionalRequirementPayload {
  requirementId: string;
  signerId: string;
  signaturePhrase: string;
  comment?: string;
}

const NOTIFICATION_TYPE = 'requisito_funcional';

const createSignatureHash = async (
  requirementId: string,
  signerId: string,
  signaturePhrase: string,
) => {
  const normalized = `${requirementId}:${signerId}:${signaturePhrase.trim()}`;

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const globalBuffer = (
    globalThis as unknown as {
      Buffer?: { from: (input: string) => { toString: (encoding: string) => string } };
    }
  ).Buffer;
  if (globalBuffer) {
    return globalBuffer.from(normalized).toString('base64');
  }

  if (typeof btoa === 'function') {
    return btoa(normalized);
  }

  return normalized;
};

const sendNotification = async (
  notification: Omit<TablesInsert<'notifications'>, 'created_at' | 'updated_at' | 'id'>,
) => {
  const payload: TablesInsert<'notifications'> = {
    ...notification,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('notifications').insert(payload);
  if (error) {
    console.error('Erro ao enviar notificação de requisito funcional:', error);
  }
};

const loadRequirementContext = async (requirementId: string) => {
  const { data, error } = await supabase
    .from('functional_requirements')
    .select('id, titulo, approver_ids, created_by, current_approver_id, status')
    .eq('id', requirementId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const listRequirementSignatures = async (requirementId: string) => {
  const { data, error } = await supabase
    .from('functional_requirement_signatures')
    .select('signer_id, status')
    .eq('requirement_id', requirementId);

  if (error) {
    throw error;
  }

  return data || [];
};

const nextPendingApprover = (
  requirement: Pick<FunctionalRequirement, 'approver_ids'>,
  signatures: { signer_id: string; status: FunctionalRequirementSignatureStatus | null }[],
) => {
  const sequence = requirement.approver_ids || [];
  for (const signerId of sequence) {
    const signature = signatures.find((item) => item.signer_id === signerId);
    if (!signature || signature.status === 'pendente' || !signature.status) {
      return signerId;
    }
    if (signature.status === 'rejeitado') {
      return null;
    }
  }

  return null;
};

export const listFunctionalRequirements = async (
  userId?: string,
): Promise<FunctionalRequirementRecord[]> => {
  // Buscar requisitos
  const { data: requirements, error } = await supabase
    .from('functional_requirements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !requirements) {
    throw error || new Error('Não foi possível carregar requisitos');
  }

  if (requirements.length === 0) {
    return [];
  }

  // Buscar assinaturas
  const { data: signatures } = await supabase
    .from('functional_requirement_signatures')
    .select('*')
    .in('requirement_id', requirements.map(r => r.id));

  // Buscar perfis de todos os usuários envolvidos
  const userIds = new Set<string>();
  requirements.forEach(req => {
    if (req.created_by) userIds.add(req.created_by);
    if (req.current_approver_id) userIds.add(req.current_approver_id);
  });
  signatures?.forEach(sig => {
    if (sig.signer_id) userIds.add(sig.signer_id);
  });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', Array.from(userIds));

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Montar a estrutura final
  const allRecords: FunctionalRequirementRecord[] = requirements.map(req => {
    const reqSignatures = signatures?.filter(s => s.requirement_id === req.id) || [];
    
    return {
      ...req,
      signatures: reqSignatures.map(sig => ({
        ...sig,
        signer: profileMap.get(sig.signer_id) || null,
      })),
      creator: profileMap.get(req.created_by) || null,
      currentApprover: req.current_approver_id ? profileMap.get(req.current_approver_id) || null : null,
    };
  });

  if (!userId) {
    return allRecords;
  }

  return allRecords.filter(
    (requirement) =>
      requirement.created_by === userId || (requirement.approver_ids || []).includes(userId),
  );
};

export interface ActiveProfile {
  id: string;
  full_name: string | null;
  departamento: string | null;
  cargo: string | null;
}

export const listActiveProfiles = async (): Promise<ActiveProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, departamento, cargo, is_active')
    .order('full_name');

  if (error) {
    throw error;
  }

  return (data || [])
    .filter((profile) => profile.is_active ?? true)
    .map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      departamento: profile.departamento,
      cargo: profile.cargo,
    }));
};

export const createFunctionalRequirement = async (
  payload: CreateFunctionalRequirementPayload,
): Promise<FunctionalRequirement> => {
  const now = new Date().toISOString();

  const { data: requirement, error } = await supabase
    .from('functional_requirements')
    .insert({
      titulo: payload.titulo,
      descricao: payload.descricao,
      setor: payload.setor,
      approver_ids: payload.approverIds,
      created_by: payload.creatorId,
      status: payload.approverIds.length ? 'pendente' : 'assinado',
      current_approver_id: payload.approverIds[0] ?? null,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  if (payload.approverIds.length) {
    const signatureRows: TablesInsert<'functional_requirement_signatures'>[] = payload.approverIds.map(
      (signerId) => ({
        requirement_id: requirement.id,
        signer_id: signerId,
        status: 'pendente',
        signed_at: null,
        comment: null,
        signature_hash: null,
      }),
    );

    const { error: signaturesError } = await supabase
      .from('functional_requirement_signatures')
      .insert(signatureRows);

    if (signaturesError) {
      throw signaturesError;
    }

    await sendNotification({
      user_id: payload.approverIds[0],
      title: 'Assinatura necessária',
      message: `Você foi designado como aprovador do requisito "${requirement.titulo}".`,
      tipo: NOTIFICATION_TYPE,
      relacionado_id: requirement.id,
      lida: false,
    });
  } else {
    await sendNotification({
      user_id: payload.creatorId,
      title: 'Requisito assinado automaticamente',
      message: `O requisito "${requirement.titulo}" foi marcado como assinado sem fluxo de aprovação.`,
      tipo: NOTIFICATION_TYPE,
      relacionado_id: requirement.id,
      lida: false,
    });
  }

  return requirement as FunctionalRequirement;
};

export const approveFunctionalRequirement = async (
  payload: EvaluateFunctionalRequirementPayload,
) => {
  const requirement = await loadRequirementContext(payload.requirementId);
  if (!requirement) {
    throw new Error('Requisito funcional não encontrado.');
  }

  if (requirement.current_approver_id !== payload.signerId) {
    throw new Error('Você não é o aprovador atual deste requisito.');
  }

  const signatureHash = await createSignatureHash(
    payload.requirementId,
    payload.signerId,
    payload.signaturePhrase,
  );

  const { error: updateSignatureError } = await supabase
    .from('functional_requirement_signatures')
    .update({
      status: 'assinado',
      comment: payload.comment || null,
      signed_at: new Date().toISOString(),
      signature_hash: signatureHash,
    })
    .eq('requirement_id', payload.requirementId)
    .eq('signer_id', payload.signerId);

  if (updateSignatureError) {
    throw updateSignatureError;
  }

  const signatures = await listRequirementSignatures(payload.requirementId);
  const upcomingApprover = nextPendingApprover(requirement, signatures);

  if (!upcomingApprover) {
    const { error: finalizeError } = await supabase
      .from('functional_requirements')
      .update({
        status: 'assinado',
        current_approver_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.requirementId);

    if (finalizeError) {
      throw finalizeError;
    }

    if (requirement.created_by) {
      await sendNotification({
        user_id: requirement.created_by,
        title: 'Requisito assinado',
        message: `O requisito "${requirement.titulo}" concluiu todas as assinaturas digitais.`,
        tipo: NOTIFICATION_TYPE,
        relacionado_id: requirement.id,
        lida: false,
      });
    }

    return;
  }

  const { error: progressionError } = await supabase
    .from('functional_requirements')
    .update({
      status: 'pendente',
      current_approver_id: upcomingApprover,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.requirementId);

  if (progressionError) {
    throw progressionError;
  }

  await sendNotification({
    user_id: upcomingApprover,
    title: 'Aprovação necessária',
    message: `Você foi direcionado para aprovar o requisito "${requirement.titulo}".`,
    tipo: NOTIFICATION_TYPE,
    relacionado_id: requirement.id,
    lida: false,
  });
};

export const rejectFunctionalRequirement = async (
  payload: EvaluateFunctionalRequirementPayload,
) => {
  const requirement = await loadRequirementContext(payload.requirementId);
  if (!requirement) {
    throw new Error('Requisito funcional não encontrado.');
  }

  if (requirement.current_approver_id !== payload.signerId) {
    throw new Error('Você não é o aprovador atual deste requisito.');
  }

  const signatureHash = await createSignatureHash(
    payload.requirementId,
    payload.signerId,
    payload.signaturePhrase,
  );

  const { error: signatureError } = await supabase
    .from('functional_requirement_signatures')
    .update({
      status: 'rejeitado',
      comment: payload.comment || null,
      signed_at: new Date().toISOString(),
      signature_hash: signatureHash,
    })
    .eq('requirement_id', payload.requirementId)
    .eq('signer_id', payload.signerId);

  if (signatureError) {
    throw signatureError;
  }

  const { error: updateRequirementError } = await supabase
    .from('functional_requirements')
    .update({
      status: 'rejeitado',
      current_approver_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.requirementId);

  if (updateRequirementError) {
    throw updateRequirementError;
  }

  if (requirement.created_by) {
    await sendNotification({
      user_id: requirement.created_by,
      title: 'Requisito rejeitado',
      message: `O requisito "${requirement.titulo}" foi rejeitado com um parecer.`,
      tipo: NOTIFICATION_TYPE,
      relacionado_id: requirement.id,
      lida: false,
    });
  }
};
