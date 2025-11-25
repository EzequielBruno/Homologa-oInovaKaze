import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Plus, Trash2, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EMPRESAS } from '@/types/demand';
import { AccessGroupsManager } from '@/components/permissions/AccessGroupsManager';
import { GroupPermissionsManager } from '@/components/permissions/GroupPermissionsManager';
import { UserGroupsManager } from '@/components/permissions/UserGroupsManager';
import { UserManagementCombined } from '@/components/permissions/UserManagementCombined';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useSearchParams } from 'react-router-dom';

interface CommitteeMember {
  id: string;
  user_id: string;
  nome: string;
  cargo: string | null;
  ativo: boolean;
}

interface Solicitante {
  id: string;
  user_id: string;
  nome: string;
  empresa: string;
  cargo: string;
  ativo: boolean;
}

const Permissoes = () => {
  const { toast } = useToast();
  const permissions = useUserPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const resetUserId = searchParams.get('resetUser');
  const desiredTab = searchParams.get('tab') ?? 'management';
  const [activeTab, setActiveTab] = useState(desiredTab);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [solicitantes, setSolicitantes] = useState<Solicitante[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Verifica se tem acesso master (apenas administradores/grupos com acesso total)
  const hasManageAccess = permissions.hasManageAccess;
  
  // Add Committee Member Dialog
  const [addCommitteeOpen, setAddCommitteeOpen] = useState(false);
  const [selectedUserCommittee, setSelectedUserCommittee] = useState<string>('');
  const [cargoCommittee, setCargoCommittee] = useState<string>('');
  
  // Add Solicitante Dialog
  const [addSolicitanteOpen, setAddSolicitanteOpen] = useState(false);
  const [selectedUserSolicitante, setSelectedUserSolicitante] = useState<string>('');
  const [empresaSolicitante, setEmpresaSolicitante] = useState<string>('');
  const [cargoSolicitante, setCargoSolicitante] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (desiredTab !== activeTab) {
      setActiveTab(desiredTab);
    }
  }, [desiredTab, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      setAllUsers(profiles || []);

      // Load committee members
      const { data: committee } = await supabase
        .from('committee_members')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      setCommitteeMembers(committee || []);

      // Load solicitantes
      const { data: solicitantesData } = await supabase
        .from('solicitantes')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      setSolicitantes(solicitantesData || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommitteeMember = async () => {
    if (!selectedUserCommittee || !cargoCommittee.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    const user = allUsers.find(u => u.id === selectedUserCommittee);
    if (!user) return;

    try {
      // Verifica se já existe um registro para este usuário (ativo ou inativo)
      const { data: existing } = await supabase
        .from('committee_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Se já existe, apenas reativa e atualiza o cargo
        const { error } = await supabase
          .from('committee_members')
          .update({
            ativo: true,
            cargo: cargoCommittee.trim(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Se não existe, insere um novo
        const { error } = await supabase
          .from('committee_members')
          .insert({
            user_id: user.id,
            nome: user.full_name,
            cargo: cargoCommittee.trim(),
            ativo: true,
          });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Membro do comitê adicionado',
      });

      setAddCommitteeOpen(false);
      setSelectedUserCommittee('');
      setCargoCommittee('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar membro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCommitteeMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('committee_members')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Membro do comitê removido',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover membro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddSolicitante = async () => {
    if (!selectedUserSolicitante || !empresaSolicitante || !cargoSolicitante.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    const user = allUsers.find(u => u.id === selectedUserSolicitante);
    if (!user) return;

    try {
      // Verifica se já existe um registro para este usuário
      const { data: existing } = await supabase
        .from('solicitantes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Se já existe, apenas reativa e atualiza
        const { error } = await supabase
          .from('solicitantes')
          .update({
            ativo: true,
            empresa: empresaSolicitante,
            cargo: cargoSolicitante.trim(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Se não existe, insere um novo
        const { error } = await supabase
          .from('solicitantes')
          .insert({
            user_id: user.id,
            nome: user.full_name,
            empresa: empresaSolicitante,
            cargo: cargoSolicitante.trim(),
            ativo: true,
          });

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Solicitante adicionado',
      });

      setAddSolicitanteOpen(false);
      setSelectedUserSolicitante('');
      setEmpresaSolicitante('');
      setCargoSolicitante('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar solicitante',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveSolicitante = async (id: string) => {
    try {
      const { error } = await supabase
        .from('solicitantes')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Solicitante removido',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover solicitante',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading || permissions.loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  if (!hasManageAccess) {
    return (
      <div className="space-y-6 text-center p-8">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Acesso restrito</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Você não possui permissão para gerenciar grupos de acesso, permissões ou usuários.
            Entre em contato com um administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    if (value !== 'management') {
      newParams.delete('resetUser');
    }
    setSearchParams(newParams);
  };

  const handleResetIntentHandled = () => {
    if (!resetUserId) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('resetUser');
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Gestão de Permissões
        </h1>
        <p className="text-muted-foreground">
          Gerencie grupos de acesso, permissões e usuários do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="management">Gestão de Usuários</TabsTrigger>
          <TabsTrigger value="groups">Grupos de Acesso</TabsTrigger>
          <TabsTrigger value="permissions">Permissões dos Grupos</TabsTrigger>
          <TabsTrigger value="users">Atribuir Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          <UserManagementCombined
            focusUserId={resetUserId ?? undefined}
            onResetPasswordIntentHandled={handleResetIntentHandled}
          />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <AccessGroupsManager />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <GroupPermissionsManager />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserGroupsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Permissoes;
