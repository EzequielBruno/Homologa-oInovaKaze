import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateDemand from "./pages/CreateDemand";
import MinhasSolicitacoes from "./pages/demands/MinhasSolicitacoes";
import SprintAtual from "./pages/demands/SprintAtual";
import EmpresaDemands from "./pages/empresa/EmpresaDemands";
import KanbanView from "./pages/empresa/KanbanView";
import SquadsView from "./pages/empresa/SquadsView";
import Arquivadas from "./pages/empresa/Arquivadas";
import GerenciarSprint from "./pages/empresa/GerenciarSprint";
import PareceresPendentes from "./pages/technical/PareceresPendentes";
import Estimativas from "./pages/technical/Estimativas";
import Retrospectiva from "./pages/Retrospectiva";
import Planning from "./pages/Planning";
import Aprovacoes from "./pages/Aprovacoes";
import Permissoes from "./pages/Permissoes";
import Relatorios from "./pages/Relatorios";
import HistoricoAcoes from "./pages/demands/HistoricoAcoes";
import Dailys from "./pages/Dailys";
import Concluidas from "./pages/demands/Concluidas";
import GestaoRiscos from "./pages/GestaoRiscos";
import LinhaDoTempo from "./pages/LinhaDoTempo";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import FormulariosPersonalizados from "./pages/FormulariosPersonalizados";
import AdminResetPassword from "./pages/AdminResetPassword";
import ImprimirDemanda from "./pages/ImprimirDemanda";
import SupplierRegistration from "./pages/suppliers/SupplierRegistration";
import SupplierManagement from "./pages/suppliers/SupplierManagement";
import FunctionalRequirements from "./pages/FunctionalRequirements";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-reset-password" element={<AdminResetPassword />} />
            <Route 
              path="/imprimir-demanda/:id" 
              element={
                <ProtectedRoute>
                  <ImprimirDemanda />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="solicitar-demanda" element={<CreateDemand />} />
              
              {/* Demandas */}
              <Route path="demandas/minhas" element={<MinhasSolicitacoes />} />
              <Route path="demandas/historico" element={<HistoricoAcoes />} />
              <Route path="demandas/concluidas" element={<Concluidas />} />
              
              {/* Empresas */}
              <Route path="empresa/:empresa/:status" element={<EmpresaDemands />} />
              <Route path="empresa/:empresa/kanban" element={<KanbanView />} />
              <Route path="empresa/:empresa/squads" element={<SquadsView />} />
              <Route path="empresa/:empresa/gestao-riscos" element={<GestaoRiscos />} />
              <Route path="empresa/:empresa/linha-do-tempo" element={<LinhaDoTempo />} />
              <Route path="empresa/:empresa/sprint-atual" element={<SprintAtual />} />
              <Route path="empresa/:empresa/gerenciar-sprint" element={<GerenciarSprint />} />
              <Route path="empresa/:empresa/arquivadas" element={<Arquivadas />} />
              
              {/* Análise Técnica */}
              <Route path="tecnico/pendentes" element={<PareceresPendentes />} />
              <Route path="tecnico/estimativas" element={<Estimativas />} />
              
              {/* Cerimônias */}
              <Route path="cerimonia/retrospectiva" element={<Retrospectiva />} />
              <Route path="cerimonia/planning" element={<Planning />} />
              <Route path="cerimonia/atualizacao-demandas" element={<Dailys />} />
              
              {/* Governança */}
              <Route path="aprovacoes" element={<Aprovacoes />} />
              <Route path="requisitos-funcionais" element={<FunctionalRequirements />} />
              <Route path="permissoes" element={<Permissoes />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="formularios-personalizados" element={<FormulariosPersonalizados />} />
              <Route path="fornecedores" element={<SupplierManagement />} />

              {/* Perfil */}
              <Route path="perfil" element={<Perfil />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
