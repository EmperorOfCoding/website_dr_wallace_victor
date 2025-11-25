import React from 'react';
import ProtectedPage from '../components/ProtectedPage';

export default function Dashboard({ onNavigate }) {
  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        <h1>Dashboard do Paciente</h1>
        <p>Aqui você poderá gerenciar seus agendamentos e atualizar seus dados.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <button type="button" onClick={() => onNavigate('agendar')}>
            Agendar nova consulta
          </button>
          <button type="button" onClick={() => onNavigate('minha-agenda')}>
            Ver minha agenda
          </button>
          <button type="button" onClick={() => onNavigate('perfil')}>
            Meu perfil
          </button>
        </div>
      </div>
    </ProtectedPage>
  );
}
