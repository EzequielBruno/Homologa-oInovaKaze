import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRiskAssessment = () => {
  const { user } = useAuth();
  const [isProjectManager, setIsProjectManager] = useState(false);
  const [managerEmpresa, setManagerEmpresa] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManagerStatus();
  }, [user]);

  const loadManagerStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: manager } = await supabase
        .from('project_managers')
        .select('empresa, ativo')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (manager) {
        setIsProjectManager(true);
        setManagerEmpresa(manager.empresa);
      }
    } catch (error) {
      console.error('Error loading manager status:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isProjectManager,
    managerEmpresa,
    loading,
  };
};
