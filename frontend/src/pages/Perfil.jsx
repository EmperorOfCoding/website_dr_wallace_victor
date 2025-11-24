import React from 'react';
import ProtectedPage from '../components/ProtectedPage';

export default function Perfil({ onNavigate }) {
  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        <h1>Meu Perfil</h1>
        <p>Dados do paciente e ajustes de conta ficarão aqui.</p>
      </div>
    </ProtectedPage>
  );
}
