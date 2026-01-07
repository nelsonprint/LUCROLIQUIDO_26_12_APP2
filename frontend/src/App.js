import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

// Contexts
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Components
import { SubscriptionExpiredBanner } from './components/SubscriptionExpiredBanner';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Lancamentos from './pages/Lancamentos';
import ContasPagar from './pages/ContasPagar';
import ContasReceber from './pages/ContasReceber';
import CategoriasPersonalizadas from './pages/CategoriasPersonalizadas';
import Empresa from './pages/Empresa';
import MetaMensal from './pages/MetaMensal';
import Precificacao from './pages/Precificacao';
import Orcamentos from './pages/Orcamentos';
import OrcamentoDetalhe from './pages/OrcamentoDetalhe';
import EditarOrcamento from './pages/EditarOrcamento';
import Materiais from './pages/Materiais';
import { Clientes } from './pages/Clientes';
import ConfiguracaoOrcamento from './pages/ConfiguracaoOrcamento';
import TabelaPrecos from './pages/TabelaPrecos';
import PlanoContas from './pages/PlanoContas';
import NovoOrcamentoGrid from './pages/NovoOrcamentoGrid';
import Assinatura from './pages/Assinatura';
import AdminPanel from './pages/AdminPanel';
import Funcionarios from './pages/Funcionarios';
import DFCRelatorio from './pages/DFCRelatorio';

// Relatórios
import Relatorios from './pages/Relatorios';
import RelContasPagar from './pages/relatorios/RelContasPagar';
import RelContasReceber from './pages/relatorios/RelContasReceber';
import RelAgingPagar from './pages/relatorios/RelAgingPagar';
import RelFluxoProjetado from './pages/relatorios/RelFluxoProjetado';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const axiosInstance = axios.create({
  baseURL: API,
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-white">Carregando...</div>
      </div>
    );
  }

  // Componente auxiliar para rotas protegidas
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Se não há usuário logado, mostrar landing page
  if (!user) {
    return (
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<LandingPage setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Usuário logado - mostrar app com provider de subscription
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <SubscriptionProvider user={user}>
        <SubscriptionExpiredBanner />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
          <Route path="/lancamentos" element={<Lancamentos user={user} onLogout={handleLogout} />} />
          <Route path="/contas-pagar" element={<ContasPagar user={user} onLogout={handleLogout} />} />
          <Route path="/contas-receber" element={<ContasReceber user={user} onLogout={handleLogout} />} />
          <Route path="/categorias" element={<CategoriasPersonalizadas user={user} onLogout={handleLogout} />} />
          <Route path="/empresa" element={<Empresa user={user} onLogout={handleLogout} />} />
          <Route path="/meta-mensal" element={<MetaMensal user={user} onLogout={handleLogout} />} />
          <Route path="/precificacao" element={<Precificacao user={user} onLogout={handleLogout} />} />
          <Route path="/orcamentos" element={<Orcamentos user={user} onLogout={handleLogout} />} />
          <Route path="/orcamento/:id" element={<OrcamentoDetalhe user={user} onLogout={handleLogout} />} />
          <Route path="/orcamento/:id/editar" element={<EditarOrcamento user={user} onLogout={handleLogout} />} />
          <Route path="/orcamentos/novo" element={<NovoOrcamentoGrid user={user} onLogout={handleLogout} />} />
          <Route path="/materiais" element={<Materiais user={user} onLogout={handleLogout} />} />
          <Route path="/clientes" element={<Clientes user={user} onLogout={handleLogout} />} />
          <Route path="/funcionarios" element={<Funcionarios user={user} onLogout={handleLogout} />} />
          <Route path="/tabela-precos" element={<TabelaPrecos user={user} onLogout={handleLogout} />} />
          <Route path="/plano-contas" element={<PlanoContas user={user} onLogout={handleLogout} />} />
          <Route path="/dfc" element={<DFCRelatorio user={user} onLogout={handleLogout} />} />
          <Route path="/relatorios" element={<Relatorios user={user} onLogout={handleLogout} />} />
          <Route path="/relatorios/pagar-periodo" element={<RelContasPagar user={user} onLogout={handleLogout} />} />
          <Route path="/relatorios/receber-periodo" element={<RelContasReceber user={user} onLogout={handleLogout} />} />
          <Route path="/relatorios/pagar-aging" element={<RelAgingPagar user={user} onLogout={handleLogout} />} />
          <Route path="/relatorios/fluxo-projetado" element={<RelFluxoProjetado user={user} onLogout={handleLogout} />} />
          <Route path="/config-orcamento" element={<ConfiguracaoOrcamento user={user} onLogout={handleLogout} />} />
          <Route path="/assinatura" element={<Assinatura user={user} onLogout={handleLogout} />} />
          <Route 
            path="/admin" 
            element={
              user.role === 'admin' 
                ? <AdminPanel user={user} onLogout={handleLogout} /> 
                : <Navigate to="/dashboard" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SubscriptionProvider>
    </BrowserRouter>
  );
}

export default App;
