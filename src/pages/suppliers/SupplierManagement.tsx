import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Globe,
  FileText,
  Edit,
  Power,
  CreditCard,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { SupplierRegistrationDialog } from "@/components/suppliers/SupplierRegistrationDialog";
import { PaymentConditionsManager } from "@/components/suppliers/PaymentConditionsManager";
import { EditSupplierDialog } from "@/components/suppliers/EditSupplierDialog";

type Supplier = Database["public"]["Tables"]["fornecedores"]["Row"];
type StatusFilter = "all" | Extract<Supplier["status"], "ativo" | "inativo">;
type SortField = "nome_fantasia" | "cnpj" | "cidade" | "status" | "categoria" | "contato_nome";
type SortDirection = "asc" | "desc";

const SupplierManagement = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [updatingSupplierId, setUpdatingSupplierId] = useState<string | null>(null);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("nome_fantasia");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("fornecedores")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Erro ao buscar fornecedores:", fetchError);
      setError("Não foi possível carregar os fornecedores. Tente novamente.");
      setSuppliers([]);
    } else {
      setSuppliers(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = suppliers.filter((supplier) => {
      const matchesStatus =
        statusFilter === "all" || supplier.status === statusFilter;

      if (!term) return matchesStatus;

      const target = [
        supplier.razao_social,
        supplier.nome_fantasia,
        supplier.cnpj,
        supplier.email,
        supplier.cidade,
        supplier.estado,
        supplier.contato_nome,
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());

      const matchesSearch = target.some((value) => value.includes(term));
      return matchesStatus && matchesSearch;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      
      const comparison = aValue.toString().localeCompare(bValue.toString());
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [suppliers, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleStatusToggle = async (supplier: Supplier) => {
    const newStatus = supplier.status === "ativo" ? "inativo" : "ativo";
    setUpdatingSupplierId(supplier.id);
    
    const { error: updateError } = await supabase
      .from("fornecedores")
      .update({ status: newStatus })
      .eq("id", supplier.id);

    if (updateError) {
      console.error("Erro ao atualizar status do fornecedor:", updateError);
      toast({
        title: "Erro ao atualizar",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado",
        description: `Fornecedor marcado como ${newStatus}.`,
      });
      setSuppliers((current) =>
        current.map((item) =>
          item.id === supplier.id ? { ...item, status: newStatus } : item,
        ),
      );
    }

    setUpdatingSupplierId(null);
  };

  const activeCount = suppliers.filter((s) => s.status === "ativo").length;
  const inactiveCount = suppliers.filter((s) => s.status === "inativo").length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie todos os fornecedores cadastrados no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSuppliers} disabled={loading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => setIsRegistrationDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">Fornecedores cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Power className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCount}</div>
            <p className="text-xs text-muted-foreground">Fornecedores inativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ, cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Nenhum fornecedor encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("nome_fantasia")}
                    >
                      Nome Fantasia
                      <SortIcon field="nome_fantasia" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("cnpj")}
                    >
                      CNPJ
                      <SortIcon field="cnpj" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("categoria")}
                    >
                      Categoria
                      <SortIcon field="categoria" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("cidade")}
                    >
                      Cidade
                      <SortIcon field="cidade" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("contato_nome")}
                    >
                      Contato
                      <SortIcon field="contato_nome" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort("status")}
                    >
                      Status
                      <SortIcon field="status" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <TableCell className="font-medium">
                      <div>
                        <div>{supplier.nome_fantasia}</div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.razao_social}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {supplier.cnpj}
                    </TableCell>
                    <TableCell>{supplier.categoria}</TableCell>
                    <TableCell>
                      {supplier.cidade} - {supplier.estado}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{supplier.contato_nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.status === "ativo" ? "default" : "secondary"}>
                        {supplier.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusToggle(supplier);
                          }}
                          disabled={updatingSupplierId === supplier.id}
                        >
                          {updatingSupplierId === supplier.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={Boolean(selectedSupplier)}
        onOpenChange={(open) => !open && setSelectedSupplier(null)}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{selectedSupplier?.nome_fantasia}</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedSupplier?.razao_social}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          </DialogHeader>

          {selectedSupplier && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="payment">Condições de Pagamento</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Identificação */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4" />
                        Identificação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">CNPJ</p>
                        <p className="text-sm font-mono">{selectedSupplier.cnpj}</p>
                      </div>
                      {selectedSupplier.inscricao_estadual && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Inscrição Estadual</p>
                          <p className="text-sm">{selectedSupplier.inscricao_estadual}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Categoria</p>
                        <p className="text-sm">{selectedSupplier.categoria}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Status</p>
                        <Badge variant={selectedSupplier.status === "ativo" ? "default" : "secondary"}>
                          {selectedSupplier.status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contato */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Mail className="h-4 w-4" />
                        Contato
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">E-mail</p>
                        <a
                          href={`mailto:${selectedSupplier.email}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedSupplier.email}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Telefone</p>
                        <p className="text-sm">{selectedSupplier.telefone}</p>
                      </div>
                      {selectedSupplier.celular && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Celular</p>
                          <p className="text-sm">{selectedSupplier.celular}</p>
                        </div>
                      )}
                      {selectedSupplier.site && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Site</p>
                          <a
                            href={selectedSupplier.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            {selectedSupplier.site}
                          </a>
                        </div>
                      )}
                      {selectedSupplier.portal_suporte && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Portal de Suporte</p>
                          <a
                            href={selectedSupplier.portal_suporte}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {selectedSupplier.portal_suporte}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Endereço */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4" />
                        Endereço
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>{selectedSupplier.endereco}, {selectedSupplier.numero}</p>
                      {selectedSupplier.complemento && (
                        <p className="text-muted-foreground">{selectedSupplier.complemento}</p>
                      )}
                      <p>{selectedSupplier.bairro}</p>
                      <p className="font-medium">
                        {selectedSupplier.cidade} - {selectedSupplier.estado}
                      </p>
                      <p className="text-muted-foreground">CEP: {selectedSupplier.cep}</p>
                      <p className="text-muted-foreground">{selectedSupplier.pais}</p>
                    </CardContent>
                  </Card>

                  {/* Contato Principal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        Contato Principal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Nome</p>
                        <p className="text-sm font-medium">{selectedSupplier.contato_nome}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">E-mail</p>
                        <a
                          href={`mailto:${selectedSupplier.contato_email}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedSupplier.contato_email}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Telefone</p>
                        <p className="text-sm">{selectedSupplier.contato_telefone}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dados Bancários */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="h-4 w-4" />
                        Dados Bancários
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Banco</p>
                        <p className="text-sm">{selectedSupplier.banco}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Agência</p>
                        <p className="text-sm font-mono">{selectedSupplier.agencia}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Conta</p>
                        <p className="text-sm font-mono">{selectedSupplier.conta}</p>
                      </div>
                      {selectedSupplier.pix && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">PIX</p>
                          <p className="text-sm">{selectedSupplier.pix}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Prazo de Pagamento</p>
                        <p className="text-sm">{selectedSupplier.prazo_pagamento}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Serviços e Observações */}
                {selectedSupplier.servicos_oferecidos && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        Serviços Oferecidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedSupplier.servicos_oferecidos}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedSupplier.observacoes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        Observações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedSupplier.observacoes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="payment" className="mt-4">
                <PaymentConditionsManager fornecedorId={selectedSupplier.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <SupplierRegistrationDialog
        open={isRegistrationDialogOpen}
        onOpenChange={setIsRegistrationDialogOpen}
        onSuccess={fetchSuppliers}
      />

      {selectedSupplier && (
        <EditSupplierDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          supplier={selectedSupplier}
          onSuccess={() => {
            fetchSuppliers();
            const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
            if (updatedSupplier) {
              setSelectedSupplier(updatedSupplier);
            }
          }}
        />
      )}
    </div>
  );
};

export default SupplierManagement;
