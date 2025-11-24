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
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';

// Navegação simples sem roteador: alterna a página atual pelo estado interno.
export default function App() {
  const [page, setPage] = useState('home');

  const CurrentPage = useMemo(() => {
    if (page === 'sobre') return () => <Sobre />;
    if (page === 'servicos') return () => <Servicos />;
    if (page === 'contato') return () => <Contato />;
    if (page === 'login') return () => <Login onNavigate={setPage} />;
    if (page === 'cadastro') return () => <Register onNavigate={setPage} />;
    if (page === 'agendar') return () => <Agendar onNavigate={setPage} />;
    if (page === 'minha-agenda') return () => <MinhaAgenda onNavigate={setPage} />;
    if (page === 'perfil') return () => <Perfil onNavigate={setPage} />;
    return () => <Home onNavigate={setPage} />;
  }, [page]);

  return (
    <AuthProvider>
      <Header currentPage={page} onNavigate={setPage} />
      <main style={{ marginTop: '8px' }}>
        <CurrentPage />
      </main>
      <Footer />
    </AuthProvider>
  );
}
