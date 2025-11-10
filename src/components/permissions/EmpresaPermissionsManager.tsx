import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Save, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMPRESAS } from '@/types/demand';

interface AccessGroup {
  id: string;
  nome: string;
}

interface EmpresaPermission {
  id: string;
  empresa: string;
  nivel_acesso: string;
}

const NIVEL_ACESSO = [
  { value: 'gerencial', label: 'Gerencial', description: 'Acesso a relatórios e gestão completa da empresa' },
  { value: 'operacional', label: 'Operacional', description: 'Acesso operacional limitado TI à empresa vinculada' },
  { value: 'departamental', label: 'Departamental', description: 'Acesso limitado ao departamento específico - Solicitantes/Gestores' },
];

export function EmpresaPermissionsManager() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<AccessGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [empresaPermissions, setEmpresaPermissions] = useState<EmpresaPermission[]>([]);
  const [permissionState, setPermissionState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadEmpresaPermissions();
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('access_groups')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar grupos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadEmpresaPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empresa_permissions')
        .select('*')
        .eq('group_id', selectedGroupId);

      if (error) throw error;
      setEmpresaPermissions(data || []);

      // Organize permissions by empresa
      const state: Record<string, string> = {};
      (data || []).forEach((perm) => {
        state[perm.empresa] = perm.nivel_acesso;
      });
      setPermissionState(state);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar permissões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEmpresaPermission = (empresa: string, nivel: string) => {
    setPermissionState(prev => ({
      ...prev,
      [empresa]: prev[empresa] === nivel ? '' : nivel
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      // Delete all existing permissions for this group
      await supabase
        .from('empresa_permissions')
        .delete()
        .eq('group_id', selectedGroupId);

      // Insert new permissions
      const newPermissions = Object.entries(permissionState)
        .filter(([_, nivel]) => nivel)
        .map(([empresa, nivel]) => ({
          group_id: selectedGroupId,
          empresa,
          nivel_acesso: nivel,
        }));

      if (newPermissions.length > 0) {
        const { error } = await supabase
          .from('empresa_permissions')
          .insert(newPermissions);

        if (error) throw error;
      }

      toast({ title: 'Permissões de empresa salvas com sucesso' });
      loadEmpresaPermissions();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar permissões',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Permissões por Empresa
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure o nível de acesso de cada grupo às empresas do sistema
            </p>
          </div>
          {selectedGroupId && (
            <Button onClick={handleSavePermissions} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Permissões
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Selecione o Grupo</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedGroupId
                  ? groups.find((group) => group.id === selectedGroupId)?.nome
                  : "Escolha um grupo"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar grupo..." />
                <CommandList>
                  <CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
                  <CommandGroup>
                    {groups.map((group) => (
                      <CommandItem
                        key={group.id}
                        value={group.nome}
                        onSelect={() => {
                          setSelectedGroupId(group.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedGroupId === group.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {group.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedGroupId && !loading && (
          <div className="space-y-4 mt-6">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm mb-2">Sobre os Níveis de Acesso:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {NIVEL_ACESSO.map(nivel => (
                  <li key={nivel.value}>
                    <span className="font-medium text-foreground">{nivel.label}:</span> {nivel.description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold">Acesso às Empresas</h3>
              <Badge variant="secondary">
                {Object.values(permissionState).filter(v => v).length} empresas configuradas
              </Badge>
            </div>

            <div className="grid gap-4">
              {EMPRESAS.map((empresa) => (
                <div key={empresa.value} className="p-4 border rounded-lg bg-background/50">
                  <h4 className="font-medium text-sm mb-3">{empresa.label}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {NIVEL_ACESSO.map((nivel) => (
                      <div key={nivel.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${empresa.value}-${nivel.value}`}
                          checked={permissionState[empresa.value] === nivel.value}
                          onCheckedChange={() => toggleEmpresaPermission(empresa.value, nivel.value)}
                        />
                        <Label
                          htmlFor={`${empresa.value}-${nivel.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {nivel.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedGroupId && loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando permissões...</p>
          </div>
        )}

        {!selectedGroupId && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Selecione um grupo para configurar permissões de empresa</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}