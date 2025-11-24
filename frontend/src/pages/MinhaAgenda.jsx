import React from 'react';
import ProtectedPage from '../components/ProtectedPage';

export default function MinhaAgenda({ onNavigate }) {
  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        <h1>Minha Agenda</h1>
        <p>Listagem de consultas do paciente ficará aqui.</p>
      </div>
    </ProtectedPage>
  );
}
