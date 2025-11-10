import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, SlidersHorizontal, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface KanbanFiltersState {
  squad: string;
  sprint: string;
  prioridade: string;
  classificacao: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  demanda: string;
  solicitante: string;
}

interface KanbanFiltersProps {
  filters: KanbanFiltersState;
  onFiltersChange: (filters: KanbanFiltersState) => void;
  squads: string[];
  sprints: number[];
  classificacoes: string[];
  statuses: { value: string; label: string }[];
  demandas: { id: string; codigo: string; descricao: string }[];
  solicitantes: string[];
}

export const KanbanFilters = ({
  filters,
  onFiltersChange,
  squads,
  sprints,
  classificacoes,
  statuses,
  demandas,
  solicitantes,
}: KanbanFiltersProps) => {
  const [demandaPopoverOpen, setDemandaPopoverOpen] = useState(false);

  const sortedSquads = useMemo(
    () => [...squads].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })),
    [squads],
  );

  const sortedSolicitantes = useMemo(
    () => [...solicitantes].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })),
    [solicitantes],
  );

  const sortedStatuses = useMemo(
    () =>
      [...statuses].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })),
    [statuses],
  );

  const sortedClassificacoes = useMemo(
    () => [...classificacoes].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })),
    [classificacoes],
  );

  const sortedDemandas = useMemo(
    () =>
      [...demandas].sort((a, b) =>
        `${a.codigo} ${a.descricao}`.localeCompare(`${b.codigo} ${b.descricao}`, 'pt-BR', {
          sensitivity: 'base',
        }),
      ),
    [demandas],
  );

  const sortedSprints = useMemo(() => [...sprints].sort((a, b) => a - b), [sprints]);

  const activeFiltersCount = [
    filters.squad !== 'all',
    filters.sprint !== 'all',
    filters.prioridade !== 'all',
    filters.classificacao !== 'all',
    filters.status !== 'all',
    filters.solicitante !== 'all',
    Boolean(filters.demanda),
    Boolean(filters.dataInicio),
    Boolean(filters.dataFim),
  ].filter(Boolean).length;

  const selectedDemand = demandas.find((demanda) => demanda.id === filters.demanda);
  const selectedStatus = statuses.find((status) => status.value === filters.status);
  const hasActiveFilters = activeFiltersCount > 0;

  const clearAllFilters = () => {
    onFiltersChange({
      squad: 'all',
      sprint: 'all',
      prioridade: 'all',
      classificacao: 'all',
      status: 'all',
      dataInicio: '',
      dataFim: '',
      demanda: '',
      solicitante: 'all',
    });
  };

  const removeFilter = (key: keyof KanbanFiltersState) => {
    onFiltersChange({
      ...filters,
      [key]: key === 'dataInicio' || key === 'dataFim' || key === 'demanda' ? '' : 'all',
    });
  };

  return (
    <Card className="border-border/60 shadow-sm w-full">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Filtros</CardTitle>
            {hasActiveFilters && (
              <Badge variant="outline" className="text-xs font-medium">
                {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 px-3" onClick={clearAllFilters}>
                Limpar tudo
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Refine a visualização do Kanban por squad, status, período e mais.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          {/* Grid de filtros principais */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {/* Período - De */}
            <div className="flex flex-col gap-2">
              <Label>Período - De</Label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => onFiltersChange({ ...filters, dataInicio: e.target.value })}
                className="bg-background"
              />
            </div>

            {/* Até */}
            <div className="flex flex-col gap-2">
              <Label>Até</Label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => onFiltersChange({ ...filters, dataFim: e.target.value })}
                className="bg-background"
              />
            </div>

            {/* Solicitante */}
            <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-1">
              <Label>Solicitante (Setor)</Label>
              <Select
                value={filters.solicitante}
                onValueChange={(value) => onFiltersChange({ ...filters, solicitante: value })}
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  {sortedSolicitantes.map((solicitante) => (
                    <SelectItem key={solicitante} value={solicitante}>
                      {solicitante}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Squad */}
            <div className="flex flex-col gap-2">
              <Label>Squad</Label>
              <Select
                value={filters.squad}
                onValueChange={(value) => onFiltersChange({ ...filters, squad: value })}
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  {sortedSquads.map((squad) => (
                    <SelectItem key={squad} value={squad}>
                      {squad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  {sortedStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid de filtros secundários */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {/* Demanda */}
            <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-1">
              <Label className="text-foreground">Demanda</Label>
              <Popover open={demandaPopoverOpen} onOpenChange={setDemandaPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={demandaPopoverOpen}
                    className="w-full justify-between bg-background"
                  >
                    <span className="truncate text-left">
                      {selectedDemand
                        ? `${selectedDemand.codigo} - ${selectedDemand.descricao}`
                        : 'Todas as demandas'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(320px,90vw)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar demanda..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma demanda encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todas"
                          onSelect={() => {
                            onFiltersChange({ ...filters, demanda: '' });
                            setDemandaPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn('mr-2 h-4 w-4', filters.demanda ? 'opacity-0' : 'opacity-100')}
                          />
                          Todas as demandas
                        </CommandItem>
                        {sortedDemandas.map((demanda) => {
                          const isSelected = filters.demanda === demanda.id;
                          return (
                            <CommandItem
                              key={demanda.id}
                              value={`${demanda.codigo} ${demanda.descricao}`}
                              onSelect={() => {
                                onFiltersChange({ ...filters, demanda: demanda.id });
                                setDemandaPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{demanda.codigo}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {demanda.descricao}
                                </span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Sprint */}
            <div className="flex flex-col gap-2">
              <Label>Sprint</Label>
              <Select
                value={filters.sprint}
                onValueChange={(value) => onFiltersChange({ ...filters, sprint: value })}
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Todas</SelectItem>
                  {sortedSprints.map((sprint) => (
                    <SelectItem key={sprint} value={sprint.toString()}>
                      Sprint {sprint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="flex flex-col gap-2">
              <Label>Prioridade</Label>
              <Select
                value={filters.prioridade}
                onValueChange={(value) => onFiltersChange({ ...filters, prioridade: value })}
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Classificação */}
            <div className="flex flex-col gap-2">
              <Label>Classificação</Label>
              <Select
                value={filters.classificacao}
                onValueChange={(value) => onFiltersChange({ ...filters, classificacao: value })}
              >
                <SelectTrigger className="bg-background w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">Todas</SelectItem>
                  {sortedClassificacoes.map((classificacao) => (
                    <SelectItem key={classificacao} value={classificacao}>
                      {classificacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chips de filtros ativos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Filtros ativos
              </span>

              {filters.squad !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  Squad: {filters.squad}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('squad')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  Status: {selectedStatus?.label || filters.status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('status')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.sprint !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  Sprint {filters.sprint}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('sprint')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.prioridade !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  {filters.prioridade}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('prioridade')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.classificacao !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  {filters.classificacao}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('classificacao')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.solicitante !== 'all' && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  Solicitante: {filters.solicitante}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('solicitante')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {selectedDemand && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  Demanda: {selectedDemand.codigo}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('demanda')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.dataInicio && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  Início: {filters.dataInicio}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('dataInicio')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.dataFim && (
                <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                  Fim: {filters.dataFim}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeFilter('dataFim')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
