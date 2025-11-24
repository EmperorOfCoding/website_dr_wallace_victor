import React from 'react';
import ProtectedPage from '../components/ProtectedPage';

export default function Agendar({ onNavigate }) {
  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        <h1>Agendar</h1>
        <p>Aqui ficará a interface de agendamento do paciente.</p>
      </div>
    </ProtectedPage>
  );
}
