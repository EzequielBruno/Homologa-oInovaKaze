import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPermissions {
  isCommitteeMember: boolean;
  isSolicitante: boolean;
  solicitanteEmpresa: string | null;
  canApprove: boolean;
  loading: boolean;
  userEmpresa: string | null;
  hasManageAccess: boolean;
  empresaAccess: Record<string, string>;
  hasGerencialAccess: (empresa: string) => boolean;
  hasOperacionalAccess: (empresa: string) => boolean;
  hasDepartamentalAccess: (empresa: string) => boolean;
  hasRelatoriosAccess: boolean;
}

export const useUserPermissions = (): UserPermissions => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    isCommitteeMember: false,
    isSolicitante: false,
    solicitanteEmpresa: null,
    canApprove: false,
    loading: true,
    userEmpresa: null,
    hasManageAccess: false,
    empresaAccess: {},
    hasGerencialAccess: () => false,
    hasOperacionalAccess: () => false,
    hasDepartamentalAccess: () => false,
    hasRelatoriosAccess: false,
  });

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions({
          isCommitteeMember: false,
          isSolicitante: false,
          solicitanteEmpresa: null,
          canApprove: false,
          loading: false,
          userEmpresa: null,
          hasManageAccess: false,
          empresaAccess: {},
          hasGerencialAccess: () => false,
          hasOperacionalAccess: () => false,
          hasDepartamentalAccess: () => false,
          hasRelatoriosAccess: false,
        });
        return;
      }

      try {
        // Verifica se é membro do comitê
        const { data: committee } = await supabase
          .from('committee_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        // Verifica se é solicitante
        const { data: solicitante } = await supabase
          .from('solicitantes')
          .select('*')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        // Verifica se tem roles de admin ou tech_lead
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const hasAdminRole = roles?.some(r => r.role === 'admin' || r.role === 'tech_lead');

        const isCommitteeMember = !!committee;

        // Pega empresa do perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa')
          .eq('id', user.id)
          .maybeSingle();

        // Buscar grupos do usuário
        const { data: userGroups } = await supabase
          .from('user_access_groups')
          .select('group_id')
          .eq('user_id', user.id);

        const empresaAccess: Record<string, string> = {};
        let hasFullAccess = hasAdminRole;

        let hasRelatoriosAccess = hasFullAccess;

        if (userGroups && userGroups.length > 0) {
          const groupIds = userGroups.map(g => g.group_id);

          // Verificar se pertence ao grupo Administrador Master ou Tech Lead
          const { data: groupDetails } = await supabase
            .from('access_groups')
            .select('id, nome')
            .in('id', groupIds);

          const hasMasterGroup = (groupDetails || []).some(group => 
            group.nome === 'Administrador Master' || group.nome === 'Tech Lead'
          );
          
          if (hasMasterGroup) {
            hasFullAccess = true;
          }

          // Buscar permissões de empresa dos grupos
          const { data: empresaPerms } = await supabase
            .from('empresa_permissions')
            .select('empresa, nivel_acesso')
            .in('group_id', groupIds);

          // Organizar por empresa (prioridade: gerencial > operacional > departamental)
          (empresaPerms || []).forEach(perm => {
            const currentLevel = empresaAccess[perm.empresa];
            if (!currentLevel || 
                (perm.nivel_acesso === 'gerencial') ||
                (perm.nivel_acesso === 'operacional' && currentLevel === 'departamental')) {
              empresaAccess[perm.empresa] = perm.nivel_acesso;
            }
          });

          // Verificar se tem acesso a relatórios
          const { data: relatoriosPerms } = await supabase
            .from('group_permissions')
            .select('id')
            .in('group_id', groupIds)
            .eq('resource', 'relatorios')
            .eq('action', 'view')
            .limit(1);

          hasRelatoriosAccess = hasFullAccess || (relatoriosPerms || []).length > 0;
        }

        const canApprove = isCommitteeMember || hasFullAccess;
        const hasManageAccess = hasFullAccess;

        const hasGerencialAccess = (empresa: string) => {
          return hasFullAccess || empresaAccess[empresa] === 'gerencial';
        };

        const hasOperacionalAccess = (empresa: string) => {
          return hasFullAccess || empresaAccess[empresa] === 'operacional' || empresaAccess[empresa] === 'gerencial';
        };

        const hasDepartamentalAccess = (empresa: string) => {
          return hasFullAccess || !!empresaAccess[empresa];
        };

        setPermissions({
          isCommitteeMember,
          isSolicitante: !!solicitante,
          solicitanteEmpresa: solicitante?.empresa || null,
          canApprove,
          loading: false,
          userEmpresa: profile?.empresa || solicitante?.empresa || null,
          hasManageAccess,
          empresaAccess,
          hasGerencialAccess,
          hasOperacionalAccess,
          hasDepartamentalAccess,
          hasRelatoriosAccess,
        });
      } catch (error) {
        console.error('Error loading user permissions:', error);
        setPermissions({
          isCommitteeMember: false,
          isSolicitante: false,
          solicitanteEmpresa: null,
          canApprove: false,
          loading: false,
          userEmpresa: null,
          hasManageAccess: false,
          empresaAccess: {},
          hasGerencialAccess: () => false,
          hasOperacionalAccess: () => false,
          hasDepartamentalAccess: () => false,
          hasRelatoriosAccess: false,
        });
      }
    };

    loadPermissions();
  }, [user]);

  return permissions;
};
