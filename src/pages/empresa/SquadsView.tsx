import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, Filter, Edit2, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SquadColumn } from '@/components/squads/SquadColumn';
import { AssignUserDialog } from '@/components/squads/AssignUserDialog';
import { CreateSquadDialog } from '@/components/squads/CreateSquadDialog';
import { EditSquadDialog } from '@/components/squads/EditSquadDialog';
import { ManageSquadMembersDialog } from '@/components/squads/ManageSquadMembersDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SQUADS, EMPRESA_URL_MAP } from '@/types/demand';

interface SquadMember {
  id: string;
  user_id: string;
  squad: string;
  is_scrum: boolean;
  horas_dia: number;
  profiles: {
    full_name: string;
    cargo: string | null;
  };
}

interface SquadData {
  id: string;
  nome: string;
  descricao: string | null;
  empresa: string;
  ativo: boolean;
}

export default function SquadsView() {
  const { empresa } = useParams<{ empresa: string }>();
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [allSquads, setAllSquads] = useState<string[]>([]);
  const [customSquadsData, setCustomSquadsData] = useState<SquadData[]>([]);
  const [filteredSquad, setFilteredSquad] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCreateSquadDialog, setShowCreateSquadDialog] = useState(false);
  const [showEditSquadDialog, setShowEditSquadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageMembersDialog, setShowManageMembersDialog] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<string>('');
  const [selectedSquadData, setSelectedSquadData] = useState<SquadData | null>(null);
  const { toast } = useToast();

  // Normalizar empresa da URL para o formato do sistema
  const empresaNormalizada = EMPRESA_URL_MAP[empresa?.toLowerCase() || ''] || empresa?.toUpperCase() || '';
  const defaultSquads = SQUADS[empresaNormalizada] || [];

  useEffect(() => {
    loadSquads();
    loadMembers();
  }, [empresa]);

  const loadSquads = async () => {
    try {
      // Carregar squads customizadas do banco
      const { data: customSquads, error } = await supabase
        .from('squads')
        .select('*')
        .eq('empresa', empresaNormalizada)
        .eq('ativo', true);

      if (error) throw error;

      setCustomSquadsData(customSquads || []);

      // Buscar squads padrão que foram desativadas
      const { data: inactiveSquads } = await supabase
        .from('squads')
        .select('nome')
        .eq('empresa', empresaNormalizada)
        .eq('ativo', false);

      const inactiveSquadNames = new Set(inactiveSquads?.map(s => s.nome) || []);

      // Combinar squads padrão (removendo as inativas) com customizadas ativas
      const activeDefaultSquads = defaultSquads.filter(s => !inactiveSquadNames.has(s));
      const customSquadNames = customSquads?.map(s => s.nome) || [];
      const combined = [...activeDefaultSquads, ...customSquadNames];
      
      // Remover duplicatas
      const unique = Array.from(new Set(combined));
      setAllSquads(unique);
    } catch (error: any) {
      console.error('Erro ao carregar squads:', error);
      setAllSquads(defaultSquads);
      setCustomSquadsData([]);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      // Buscar membros das squads
      const { data: squadMembers, error: membersError } = await supabase
        .from('squad_members')
        .select('*')
        .eq('empresa', empresaNormalizada);

      if (membersError) throw membersError;

      if (!squadMembers || squadMembers.length === 0) {
        setMembers([]);
        return;
      }

      // Buscar perfis dos usuários
      const userIds = squadMembers.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, cargo')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar dados
      const membersWithProfiles = squadMembers.map(member => ({
        ...member,
        profiles: profiles?.find(p => p.id === member.user_id) || {
          full_name: 'Usuário sem nome',
          cargo: null
        }
      }));

      setMembers(membersWithProfiles as any);
    } catch (error: any) {
      console.error('Erro ao carregar membros:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar membros das squads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSquadMembers = (squadName: string) => {
    return members
      .filter(m => m.squad === squadName)
      .map(m => ({
        id: m.id,
        user_id: m.user_id,
        full_name: m.profiles?.full_name || 'Usuário sem nome',
        cargo: m.profiles?.cargo,
        is_scrum: m.is_scrum,
        horas_dia: m.horas_dia,
      }));
  };

  const displaySquads = filteredSquad === 'all' 
    ? allSquads 
    : allSquads.filter(s => s === filteredSquad);

  const handleAssignClick = (squadName: string) => {
    setSelectedSquad(squadName);
    setShowAssignDialog(true);
  };

  const handleEditClick = (squadData: SquadData) => {
    setSelectedSquadData(squadData);
    setShowEditSquadDialog(true);
  };

  const handleDeleteClick = (squadData: SquadData) => {
    setSelectedSquadData(squadData);
    setShowDeleteDialog(true);
  };

  const handleManageMembersClick = (squadName: string) => {
    setSelectedSquad(squadName);
    setShowManageMembersDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSquadData) return;

    try {
      // Se for uma squad customizada do banco, desativa
      if (selectedSquadData.id) {
        const { error } = await supabase
          .from('squads')
          .update({ ativo: false })
          .eq('id', selectedSquadData.id);

        if (error) throw error;
      } else {
        // Se for uma squad padrão, criar entrada inativa no banco
        const { error } = await supabase
          .from('squads')
          .insert({
            empresa: empresaNormalizada,
            nome: selectedSquadData.nome,
            ativo: false,
            descricao: 'Squad padrão desativada'
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Squad excluída com sucesso",
      });

      // Recarregar squads para refletir a mudança
      loadSquads();
      setShowDeleteDialog(false);
      setSelectedSquadData(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isCustomSquad = (squadName: string) => {
    return customSquadsData.some(sq => sq.nome === squadName);
  };

  const getCustomSquadData = (squadName: string) => {
    return customSquadsData.find(sq => sq.nome === squadName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold">Squads - {empresaNormalizada}</h1>
        <p className="text-muted-foreground">
          Gerencie os membros de cada squad
        </p>
        </div>
        <Button onClick={() => setShowCreateSquadDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Squad
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtrar por Squad:</span>
        </div>
        <Select value={filteredSquad} onValueChange={setFilteredSquad}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as squads" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as squads</SelectItem>
            {allSquads.map((squad) => (
              <SelectItem key={squad} value={squad}>
                {squad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Clique em um membro para ver detalhes, editar horas de trabalho e definir o Scrum Master da squad.
        </AlertDescription>
      </Alert>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {displaySquads.map((squad) => {
          const squadData = getCustomSquadData(squad);
          const isCustom = isCustomSquad(squad);

          return (
            <div key={squad} className="flex flex-col gap-2 w-80">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignClick(squad)}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Atribuir Usuário
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageMembersClick(squad)}
                  title="Gerenciar Membros"
                >
                  <Users className="h-4 w-4" />
                </Button>
                {isCustom && squadData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(squadData)}
                    title="Editar Squad"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isCustom && squadData) {
                      handleDeleteClick(squadData);
                    } else {
                      // Para squads padrão, criar um objeto temporário
                      setSelectedSquadData({
                        id: '',
                        nome: squad,
                        descricao: null,
                        empresa: empresaNormalizada,
                        ativo: true
                      });
                      setShowDeleteDialog(true);
                    }
                  }}
                  title="Excluir Squad"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <SquadColumn
                squadName={squad}
                members={getSquadMembers(squad)}
                empresa={empresaNormalizada}
                onRefresh={loadMembers}
              />
            </div>
          );
        })}
      </div>

      {showAssignDialog && (
        <AssignUserDialog
          empresa={empresaNormalizada}
          squad={selectedSquad}
          onClose={() => setShowAssignDialog(false)}
          onSuccess={() => {
            loadMembers();
            setShowAssignDialog(false);
          }}
        />
      )}

      {showCreateSquadDialog && (
        <CreateSquadDialog
          empresa={empresaNormalizada}
          onClose={() => setShowCreateSquadDialog(false)}
          onSuccess={() => {
            loadSquads();
            setShowCreateSquadDialog(false);
          }}
        />
      )}

      {showEditSquadDialog && selectedSquadData && (
        <EditSquadDialog
          squadId={selectedSquadData.id}
          empresa={empresaNormalizada}
          currentNome={selectedSquadData.nome}
          currentDescricao={selectedSquadData.descricao}
          onClose={() => {
            setShowEditSquadDialog(false);
            setSelectedSquadData(null);
          }}
          onSuccess={() => {
            loadSquads();
            loadMembers();
            setShowEditSquadDialog(false);
            setSelectedSquadData(null);
          }}
        />
      )}

      {showManageMembersDialog && (
        <ManageSquadMembersDialog
          squadName={selectedSquad}
          empresa={empresaNormalizada}
          members={members.filter(m => m.squad === selectedSquad)}
          availableSquads={allSquads}
          onClose={() => {
            setShowManageMembersDialog(false);
            setSelectedSquad('');
          }}
          onSuccess={() => {
            loadMembers();
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a squad "{selectedSquadData?.nome}"?
              {selectedSquadData?.id ? (
                <span className="block mt-2">Esta squad customizada será desativada permanentemente.</span>
              ) : (
                <span className="block mt-2">Esta squad será removida da visualização nesta empresa.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setSelectedSquadData(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
