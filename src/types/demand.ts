export interface Demand {
  id: string;
  codigo: string;
  empresa: 'ZC' | 'Eletro' | 'ZF' | 'ZS';
  departamento: string;
  setor?: SetorType;
  squad?: string;
  descricao: string;
  requisitos_funcionais?: string;
  documentos_anexados?: string[];
  estudoViabilidadeFinanceira: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  regulatorio: boolean;
  dataLimiteRegulatorio?: string;
  status: DemandStatus;
  createdAt: string;
  updatedAt: string;
  solicitante: string;
  classificacao?: 'Melhoria' | 'Projeto';
  melhoria_problema_atual?: string;
  melhoria_beneficio_esperado?: string;
  melhoria_alternativas?: string;
}

export type DemandStatus =
  | 'Backlog'
  | 'Aprovado_GP'
  | 'Aguardando_Gerente'
  | 'Aguardando_Comite'
  | 'Aprovado'
  | 'Em_Progresso'
  | 'Revisao'
  | 'Concluido'
  | 'StandBy'
  | 'Bloqueado'
  | 'Nao_Entregue';

export interface Phase {
  id: string;
  demandaId: string;
  faseNumero: number;
  nomeFase: string;
  descricaoFase: string;
  horasEstimadas: number;
  ordemExecucao: number;
  dependencias: string;
}

export interface Review {
  id: string;
  reviewId: number;
  dataReview: string;
  empresa: string;
  demandasEntregues: string[];
  pontosPositivos: string;
  pontosMelhoria: string;
  solicitacoesApoio: string;
  participantes: string[];
  velocidadeSprint: number;
  qualidadeEntrega: number;
}

export const EMPRESAS = [
  { value: 'ZC', label: 'Zema Consórcio' },
  { value: 'Eletro', label: 'Eletrozema' },
  { value: 'ZF', label: 'Zema Financeira' },
  { value: 'ZS', label: 'Zema Seguros' }
] as const;

export const SETORES = {
  ZF: [
    { value: 'Auditoria Interna', label: 'Auditoria Interna' },
    { value: 'Cartão e Conta Digital', label: 'Cartão e Conta Digital' },
    { value: 'Comercial', label: 'Comercial' },
    { value: 'Contabilidade', label: 'Contabilidade' },
    { value: 'Financeiro', label: 'Financeiro' },
    { value: 'Projetos', label: 'Projetos' },
    { value: 'Riscos e Compliance', label: 'Riscos e Compliance' },
  ],
  ZS: [
    { value: 'Projetos', label: 'Projetos' },
    { value: 'Operações', label: 'Operações' },
    { value: 'Administrativo', label: 'Administrativo' },
    { value: 'Comercial', label: 'Comercial' },
  ],
  ZC: [
    { value: 'Administrativo', label: 'Administrativo' },
    { value: 'Atendimento', label: 'Atendimento' },
    { value: 'Comercial', label: 'Comercial' },
    { value: 'Jurídico', label: 'Jurídico' },
    { value: 'Projetos', label: 'Projetos' },
  ],
  Eletro: [
    { value: 'Auditoria', label: 'Auditoria' },
    { value: 'Compras', label: 'Compras' },
    { value: 'Contabilidade', label: 'Contabilidade' },
    { value: 'Departamento Pessoal', label: 'Departamento Pessoal' },
    { value: 'E-commerce', label: 'E-commerce' },
    { value: 'Fiscal', label: 'Fiscal' },
    { value: 'Financeiro', label: 'Financeiro' },
    { value: 'Jurídico', label: 'Jurídico' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Operações Centro Distribuição', label: 'Operações Centro Distribuição' },
    { value: 'Planejamento', label: 'Planejamento' },
    { value: 'Recursos Humanos', label: 'Recursos Humanos' },
    { value: 'Segurança Trabalho', label: 'Segurança Trabalho' },
  ],
} as const satisfies Record<Demand['empresa'], readonly { value: string; label: string }[]>;

export const TODOS_SETORES = [
  ...SETORES.ZF,
  ...SETORES.ZS,
  ...SETORES.ZC,
  ...SETORES.Eletro,
] as const;

export type SetorType = (typeof TODOS_SETORES)[number]['value'];

// Mapa de normalização para URLs
export const EMPRESA_URL_MAP: Record<string, string> = {
  'zc': 'ZC',
  'eletro': 'Eletro',
  'zf': 'ZF',
  'zs': 'ZS'
};

export const SQUADS: Record<string, string[]> = {
  'ZF': ['Avaliar', 'Squad App', 'Squad BackOffice', 'Squad BI', 'Squad Produtos Financeiros'],
  'ZS': ['Avaliar', 'Auditoria', 'Recursos Humanos', 'Departamento Pessoal', 'Financeiro', 'Fiscal', 'Contabilidade', 'Compras', 'Planejamento', 'Gestão Integrada', 'E-commerce', 'Comercial', 'Logística', 'Tecnologia da Informação'],
  'ZC': ['Avaliar', 'Auditoria', 'Recursos Humanos', 'Departamento Pessoal', 'Financeiro', 'Fiscal', 'Contabilidade', 'Compras', 'Planejamento', 'Gestão Integrada', 'E-commerce', 'Comercial', 'Logística', 'Tecnologia da Informação'],
  'Eletro': ['Avaliar', 'Auditoria', 'Recursos Humanos', 'Departamento Pessoal', 'Financeiro', 'Fiscal', 'Contabilidade', 'Compras', 'Planejamento', 'Gestão Integrada', 'E-commerce', 'Comercial', 'Logística', 'Tecnologia da Informação']
};

// Mantém departamentos para compatibilidade
export const DEPARTAMENTOS = SQUADS;
