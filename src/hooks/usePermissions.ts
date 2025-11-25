import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Interface unificada e clara
export interface Permissions {
  // Roles básicas
  isAdmin: boolean;
  isTechLead: boolean;
  isCommitteeMember: boolean;
  isSolicitante: boolean;
  isProjectManager: boolean;
  
  // Acesso por empresa
  empresas: {
    [empresa: string]: {
      nivel: 'gerencial' | 'operacional' | 'departamental' | null;
      canView: boolean;
      canEdit: boolean;
      canApprove: boolean;
    };
  };
  
  // Permissões específicas
  permissions: {
    relatorios: boolean;
    usuarios: boolean;
    configuracoes: boolean;
    aprovacoesComite: boolean;
  };
  
  // Helper functions
  hasEmpresaAccess: (empresa: string, nivel?: 'gerencial' | 'operacional' | 'departamental') => boolean;
  canAccessResource: (resource: string, action: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  
  // Estado
  userEmpresa: string | null;
  loading: boolean;
}

export const usePermissions = (): Permissions => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>({
    isAdmin: false,
    isTechLead: false,
    isCommitteeMember: false,
    isSolicitante: false,
    isProjectManager: false,
    empresas: {},
    permissions: {
      relatorios: false,
      usuarios: false,
      configuracoes: false,
      aprovacoesComite: false,
    },
    hasEmpresaAccess: () => false,
    canAccessResource: () => false,
    hasAnyRole: () => false,
    userEmpresa: null,
    loading: true,
  });

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions({
          isAdmin: false,
          isTechLead: false,
          isCommitteeMember: false,
          isSolicitante: false,
          isProjectManager: false,
          empresas: {},
          permissions: {
            relatorios: false,
            usuarios: false,
            configuracoes: false,
            aprovacoesComite: false,
          },
          hasEmpresaAccess: () => false,
          canAccessResource: () => false,
          hasAnyRole: () => false,
          userEmpresa: null,
          loading: false,
        });
        return;
      }

      try {
        // 1. Buscar roles do usuário
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const roles = rolesData?.map(r => r.role) || [];
        const isAdmin = roles.includes('admin');
        const isTechLead = roles.includes('tech_lead');

        // 2. Buscar perfil e empresa do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa')
          .eq('id', user.id)
          .maybeSingle();

        const userEmpresa = profile?.empresa || null;

        // 3. Buscar se é membro do comitê
        const { data: committeeData } = await supabase
          .from('committee_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        const isCommitteeMember = !!committeeData;

        // 4. Buscar se é solicitante
        const { data: solicitanteData } = await supabase
          .from('solicitantes')
          .select('id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        const isSolicitante = !!solicitanteData;

        // 5. Buscar se é gerente de projeto
        const { data: pmData } = await supabase
          .from('project_managers')
          .select('id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        const isProjectManager = !!pmData;

        // 6. Buscar grupos do usuário
        const { data: userGroups } = await supabase
          .from('user_access_groups')
          .select('group_id')
          .eq('user_id', user.id);

        const groupIds = userGroups?.map(g => g.group_id) || [];

        // 7. Buscar todas as empresas ativas (para admins/tech leads)
        const { data: empresasAtivas } = await supabase
          .from('empresas')
          .select('codigo')
          .eq('ativo', true)
          .order('ordem', { ascending: true });

        // 8. Buscar permissões de empresa por grupo
        const empresasMap: Permissions['empresas'] = {};
        
        if (groupIds.length > 0) {
          const { data: empresaPerms } = await supabase
            .from('empresa_permissions')
            .select('empresa, nivel_acesso')
            .in('group_id', groupIds);

          // Organizar por empresa (prioridade: gerencial > operacional > departamental)
          (empresaPerms || []).forEach(perm => {
            const currentNivel = empresasMap[perm.empresa]?.nivel;
            const newNivel = perm.nivel_acesso as 'gerencial' | 'operacional' | 'departamental';
            
            const shouldUpdate = !currentNivel || 
              (newNivel === 'gerencial') ||
              (newNivel === 'operacional' && currentNivel === 'departamental');

            if (shouldUpdate) {
              empresasMap[perm.empresa] = {
                nivel: newNivel,
                canView: true,
                canEdit: newNivel === 'operacional' || newNivel === 'gerencial',
                canApprove: newNivel === 'gerencial',
              };
            }
          });
        }

        // Admins e Tech Leads têm acesso total
        if (isAdmin || isTechLead) {
          (empresasAtivas || []).forEach(emp => {
            empresasMap[emp.codigo] = {
              nivel: 'gerencial',
              canView: true,
              canEdit: true,
              canApprove: true,
            };
          });
        }

        // 9. Buscar permissões específicas por grupo
        let hasRelatorios = false;
        let hasUsuarios = false;
        let hasConfiguracoes = false;

        if (groupIds.length > 0) {
          const { data: groupPerms } = await supabase
            .from('group_permissions')
            .select('resource, action')
            .in('group_id', groupIds);

        hasRelatorios = (groupPerms || []).some(
            p => p.resource === 'relatorios' && p.action === 'view'
          );
          hasUsuarios = isAdmin; // Apenas admins podem gerenciar usuários
          hasConfiguracoes = isAdmin; // Apenas admins podem gerenciar configurações
        }

        // Helper functions
        const hasEmpresaAccess = (
          empresa: string, 
          nivel?: 'gerencial' | 'operacional' | 'departamental'
        ) => {
          if (isAdmin || isTechLead) return true;
          
          const empresaData = empresasMap[empresa];
          if (!empresaData) return false;
          
          if (!nivel) return empresaData.canView;
          
          if (nivel === 'gerencial') return empresaData.nivel === 'gerencial';
          if (nivel === 'operacional') {
            return empresaData.nivel === 'gerencial' || empresaData.nivel === 'operacional';
          }
          return !!empresaData.nivel;
        };

        const canAccessResource = (resource: string, action: string) => {
          if (isAdmin) return true;
          // Adicionar lógica de verificação de permissões customizadas se necessário
          return false;
        };

        const hasAnyRole = (...rolesToCheck: string[]) => {
          return rolesToCheck.some(role => {
            if (role === 'admin') return isAdmin;
            if (role === 'tech_lead') return isTechLead;
            if (role === 'committee') return isCommitteeMember;
            if (role === 'solicitante') return isSolicitante;
            if (role === 'project_manager') return isProjectManager;
            return false;
          });
        };

        setPermissions({
          isAdmin,
          isTechLead,
          isCommitteeMember,
          isSolicitante,
          isProjectManager,
          empresas: empresasMap,
          permissions: {
            relatorios: hasRelatorios || isAdmin || isTechLead,
            usuarios: hasUsuarios || isAdmin,
            configuracoes: hasConfiguracoes || isAdmin,
            aprovacoesComite: isCommitteeMember || isAdmin || isTechLead,
          },
          hasEmpresaAccess,
          canAccessResource,
          hasAnyRole,
          userEmpresa,
          loading: false,
        });

      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions(prev => ({ ...prev, loading: false }));
      }
    };

    loadPermissions();
  }, [user]);

  return permissions;
};
