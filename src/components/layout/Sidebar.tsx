import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, LayoutDashboard, FileText, Users, Settings, ClipboardList, Building2, Layers, Clock, CheckCircle, AlertCircle, FileCheck, GitBranch, BarChart3, Calendar, ClipboardCheck, History, MessageSquare, Shield, UserCircle, FileSignature } from 'lucide-react';
import { useState } from 'react';
import { useEmpresas } from '@/hooks/useEmpresas';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const { isAdmin, loading: permissionsLoading } = usePermissions();
  const { data: empresas, isLoading } = useEmpresas({ enabled: isAdmin });
  const [empresasOpen, setEmpresasOpen] = useState<Record<string, boolean>>({});
  const [tecnicoOpen, setTecnicoOpen] = useState(false);
  const [cerimoniaOpen, setCerimoniaOpen] = useState(false);

  const toggleEmpresa = (codigo: string) => {
    setEmpresasOpen(prev => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  const NavItem = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{children}</span>}
    </NavLink>
  );

  const SubMenu = ({ 
    title, 
    icon: Icon, 
    isOpen, 
    onToggle, 
    children 
  }: { 
    title: string; 
    icon: any; 
    isOpen: boolean; 
    onToggle: () => void; 
    children: React.ReactNode 
  }) => (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{title}</span>}
        </div>
        {!collapsed && (
          isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {isOpen && !collapsed && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-4">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-card border-r border-border transition-all duration-300 flex flex-col h-screen sticky top-0`}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold text-primary">Inova Kaze</h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Dashboard */}
        <NavItem to="/" icon={LayoutDashboard}>
          Dashboard
        </NavItem>

        {isAdmin && (
          <NavItem to="/empresas" icon={Building2}>
            Gerenciar Empresas
          </NavItem>
        )}

        <NavItem to="/fornecedores" icon={Settings}>
          Gerenciar Fornecedores
        </NavItem>

        <NavItem to="/solicitar-demanda" icon={ClipboardList}>
          Demandas
        </NavItem>

        {isAdmin && (
          <>
            {!collapsed && <div className="pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">Empresas</div>}

            {permissionsLoading || isLoading ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">Carregando empresas...</div>
            ) : (
              empresas?.map((empresa) => (
                <SubMenu
                  key={empresa.id}
                  title={empresa.nome_exibicao}
                  icon={Building2}
                  isOpen={empresasOpen[empresa.codigo] || false}
                  onToggle={() => toggleEmpresa(empresa.codigo)}
                >
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/kanban`}
                    className="block py-2 text-sm hover:text-primary transition-colors"
                  >
                    📊 Kanban
                  </NavLink>
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/squads`}
                    className="block py-2 text-sm hover:text-primary transition-colors"
                  >
                    👥 Squads
                  </NavLink>
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/gestao-riscos`}
                    className="block py-2 text-sm hover:text-primary transition-colors"
                  >
                    🛡️ Gestão de Riscos
                  </NavLink>
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/linha-do-tempo`}
                    className="block py-2 text-sm hover:text-primary transition-colors"
                  >
                    📅 Linha do Tempo
                  </NavLink>
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/backlog`}
                    className="block py-2 text-sm hover:text-primary transition-colors"
                  >
                    Backlog
                  </NavLink>
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/sprint-atual`}
                    className="block py-2 text-sm hover:text-primary transition-colors"
                  >
                    Sprint Atual
                  </NavLink>
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/gerenciar-sprint`}
                    className="block py-2 text-sm hover:text-primary transition-colors"
                  >
                    Gerenciar Sprint
                  </NavLink>
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/concluidas`}
                    className="block py-2 text-sm hover:text-primary transition-colors"
                  >
                    Concluídas
                  </NavLink>
                  <NavLink
                    to={`/empresa/${empresa.codigo.toLowerCase()}/arquivadas`}
                    className="block py-2 text-sm hover:text-primary transition-colors text-muted-foreground"
                  >
                    📦 Arquivadas
                  </NavLink>
                </SubMenu>
              ))
            )}
          </>
        )}

        {!collapsed && <div className="pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">Gestão</div>}

        <NavItem to="/demandas/minhas" icon={FileText}>
          Minhas Solicitações
        </NavItem>

        <NavItem to="/demandas/historico" icon={History}>
          Histórico de Ações
        </NavItem>

        <NavItem to="/demandas/concluidas" icon={CheckCircle}>
          Demandas Finalizadas
        </NavItem>

        {/* Análise Técnica */}
        <SubMenu title="Análise Técnica" icon={FileCheck} isOpen={tecnicoOpen} onToggle={() => setTecnicoOpen(!tecnicoOpen)}>
          <NavLink to="/tecnico/pendentes" className="block py-2 text-sm hover:text-primary transition-colors">
            Pareceres Pendentes
          </NavLink>
          <NavLink to="/tecnico/estimativas" className="block py-2 text-sm hover:text-primary transition-colors">
            Estimativas
          </NavLink>
        </SubMenu>

        {/* Cerimônias */}
        <SubMenu title="Cerimônias" icon={Calendar} isOpen={cerimoniaOpen} onToggle={() => setCerimoniaOpen(!cerimoniaOpen)}>
          <NavLink to="/cerimonia/retrospectiva" className="block py-2 text-sm hover:text-primary transition-colors">
            Retrospectiva
          </NavLink>
          <NavLink to="/cerimonia/planning" className="block py-2 text-sm hover:text-primary transition-colors">
            Planning
          </NavLink>
          <NavLink to="/cerimonia/atualizacao-demandas" className="block py-2 text-sm hover:text-primary transition-colors">
            Atualização Demanda em Progresso
          </NavLink>
        </SubMenu>

        {!collapsed && <div className="pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">Administração</div>}

        <NavItem to="/aprovacoes" icon={ClipboardCheck}>
          Aprovações
        </NavItem>

        <NavItem to="/requisitos-funcionais" icon={FileSignature}>
          Requisitos Funcionais
        </NavItem>

        <NavItem to="/permissoes" icon={Users}>
          Permissões
        </NavItem>

        <NavItem to="/formularios-personalizados" icon={FileText}>
          Formulários Personalizados
        </NavItem>

        <NavItem to="/relatorios" icon={BarChart3}>
          Relatórios
        </NavItem>

      </nav>
    </aside>
  );
};

export default Sidebar;
