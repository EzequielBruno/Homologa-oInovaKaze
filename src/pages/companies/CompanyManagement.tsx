import { useState } from 'react';
import { Building2, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEmpresas } from '@/hooks/useEmpresas';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

const CompanyManagement = () => {
  const { isAdmin, loading: permissionsLoading } = usePermissions();
  const { data: empresas, isLoading, refetch } = useEmpresas({ onlyActive: false, enabled: isAdmin });
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    codigo: '',
    nomeCompleto: '',
    nomeExibicao: '',
    ordem: '',
    ativo: true,
  });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.codigo.trim() || !formData.nomeCompleto.trim() || !formData.nomeExibicao.trim()) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha código, nome completo e nome de exibição.',
        variant: 'destructive',
      });
      return;
    }

    const ordemNumber = formData.ordem ? Number(formData.ordem) : undefined;

    setSaving(true);
    try {
      const payload: Database['public']['Tables']['empresas']['Insert'] = {
        codigo: formData.codigo.trim().toUpperCase(),
        nome_completo: formData.nomeCompleto.trim(),
        nome_exibicao: formData.nomeExibicao.trim(),
        ativo: formData.ativo,
        ordem: Number.isNaN(ordemNumber) ? undefined : ordemNumber,
      };

      const { error } = await supabase.from('empresas').insert(payload);
      if (error) throw error;

      toast({
        title: 'Empresa cadastrada',
        description: 'A empresa foi adicionada ao catálogo e aparecerá no menu de navegação.',
      });

      setFormData({ codigo: '', nomeCompleto: '', nomeExibicao: '', ordem: '', ativo: true });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'A visibilidade da empresa no menu foi atualizada.',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando permissões...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>Somente administradores podem gerenciar empresas.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Gerenciar Empresas
          </h1>
          <p className="text-muted-foreground">
            Cadastre novas empresas e controle quais aparecem na navegação.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar lista
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Cadastrar nova empresa</CardTitle>
            <CardDescription>Informe os dados principais da empresa.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex.: ZF"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Código curto usado nas URLs e integrações.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome-completo">Nome completo</Label>
                <Input
                  id="nome-completo"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  placeholder="Nome corporativo da empresa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome-exibicao">Nome para exibição</Label>
                <Input
                  id="nome-exibicao"
                  value={formData.nomeExibicao}
                  onChange={(e) => setFormData({ ...formData, nomeExibicao: e.target.value })}
                  placeholder="Como aparecerá no menu"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem de exibição</Label>
                <Input
                  id="ordem"
                  type="number"
                  min="0"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                  placeholder="Opcional"
                />
                <p className="text-xs text-muted-foreground">Quanto menor o número, mais acima na lista.</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm">Empresa ativa</Label>
                  <p className="text-xs text-muted-foreground">
                    Controla a visibilidade no menu lateral.
                  </p>
                </div>
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Salvar empresa
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Empresas cadastradas</CardTitle>
            <CardDescription>As empresas ativas aparecem automaticamente no menu lateral.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando empresas...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas?.map((empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{empresa.nome_exibicao}</span>
                          <span className="text-xs text-muted-foreground">{empresa.nome_completo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          {empresa.codigo}
                        </Badge>
                      </TableCell>
                      <TableCell>{empresa.ordem ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={empresa.ativo ? 'default' : 'secondary'}>
                          {empresa.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus(empresa.id, empresa.ativo)}
                          disabled={updatingId === empresa.id}
                        >
                          {updatingId === empresa.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          {empresa.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyManagement;
