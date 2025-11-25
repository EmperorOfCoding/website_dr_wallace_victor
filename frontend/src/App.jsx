import React, { useMemo, useState } from 'react';
import Home from './pages/Home';
import Sobre from './pages/Sobre';
import Servicos from './pages/Servicos';
import Contato from './pages/Contato';
import Login from './pages/Login';
import Agendar from './pages/Agendar';
import MinhaAgenda from './pages/MinhaAgenda';
import Perfil from './pages/Perfil';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Navegação simples sem roteador: alterna a página atual pelo estado interno.
function AppShell() {
  const { isAuthenticated, logout } = useAuth();
  const [page, setPage] = useState('home');
  const protectedPages = ['agendar', 'minha-agenda', 'perfil', 'dashboard'];

  const handleNavigate = (target) => {
    if (protectedPages.includes(target) && !isAuthenticated) {
      setPage('login');
    } else {
      setPage(target);
    }
  };

  const CurrentPage = useMemo(() => {
    if (page === 'sobre') return () => <Sobre onNavigate={handleNavigate} />;
    if (page === 'servicos') return () => <Servicos />;
    if (page === 'contato') return () => <Contato />;
    if (page === 'login') return () => <Login onNavigate={handleNavigate} />;
    if (page === 'cadastro') return () => <Register onNavigate={handleNavigate} />;
    if (page === 'agendar') return () => <Agendar onNavigate={handleNavigate} />;
    if (page === 'minha-agenda') return () => <MinhaAgenda onNavigate={handleNavigate} />;
    if (page === 'perfil') return () => <Perfil onNavigate={handleNavigate} />;
    if (page === 'dashboard') return () => <Dashboard onNavigate={handleNavigate} />;
    return () => <Home onNavigate={handleNavigate} />;
  }, [page, isAuthenticated]);

  return (
    <>
      <Header currentPage={page} onNavigate={handleNavigate} isAuthenticated={isAuthenticated} onLogout={logout} />
      <main style={{ marginTop: '8px' }}>
        <CurrentPage />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
