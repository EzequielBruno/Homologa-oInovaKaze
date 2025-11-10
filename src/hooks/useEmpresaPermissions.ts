import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EmpresaPermissions {
  empresaAccess: Record<string, string>; // empresa -> nivel_acesso
  hasGerencialAccess: (empresa: string) => boolean;
  hasOperacionalAccess: (empresa: string) => boolean;
  hasDepartamentalAccess: (empresa: string) => boolean;
  hasRelatoriosAccess: boolean;
  userEmpresa: string | null;
  loading: boolean;
}

export const useEmpresaPermissions = (): EmpresaPermissions => {
  const { user } = useAuth();
  const [empresaAccess, setEmpresaAccess] = useState<Record<string, string>>({});
  const [hasRelatoriosAccess, setHasRelatoriosAccess] = useState(false);
  const [userEmpresa, setUserEmpresa] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmpresaPermissions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Buscar empresa do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa')
          .eq('id', user.id)
          .maybeSingle();

        setUserEmpresa(profile?.empresa || null);

        // Buscar grupos do usuário
        const { data: userGroups } = await supabase
          .from('user_access_groups')
          .select('group_id')
          .eq('user_id', user.id);

        if (!userGroups || userGroups.length === 0) {
          setLoading(false);
          return;
        }

        const groupIds = userGroups.map(g => g.group_id);

        // Buscar permissões de empresa dos grupos
        const { data: empresaPerms } = await supabase
          .from('empresa_permissions')
          .select('empresa, nivel_acesso')
          .in('group_id', groupIds);

        // Organizar por empresa (prioridade: gerencial > operacional > departamental)
        const access: Record<string, string> = {};
        (empresaPerms || []).forEach(perm => {
          const currentLevel = access[perm.empresa];
          if (!currentLevel || 
              (perm.nivel_acesso === 'gerencial') ||
              (perm.nivel_acesso === 'operacional' && currentLevel === 'departamental')) {
            access[perm.empresa] = perm.nivel_acesso;
          }
        });

        setEmpresaAccess(access);

        // Verificar se tem acesso a relatórios
        const { data: relatoriosPerms } = await supabase
          .from('group_permissions')
          .select('id')
          .in('group_id', groupIds)
          .eq('resource', 'relatorios')
          .eq('action', 'view')
          .limit(1);

        setHasRelatoriosAccess((relatoriosPerms || []).length > 0);

      } catch (error) {
        console.error('Error loading empresa permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmpresaPermissions();
  }, [user]);

  const hasGerencialAccess = (empresa: string) => {
    return empresaAccess[empresa] === 'gerencial';
  };

  const hasOperacionalAccess = (empresa: string) => {
    return empresaAccess[empresa] === 'operacional' || empresaAccess[empresa] === 'gerencial';
  };

  const hasDepartamentalAccess = (empresa: string) => {
    return !!empresaAccess[empresa];
  };

  return {
    empresaAccess,
    hasGerencialAccess,
    hasOperacionalAccess,
    hasDepartamentalAccess,
    hasRelatoriosAccess,
    userEmpresa,
    loading,
  };
};