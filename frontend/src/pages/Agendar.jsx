import React, { useEffect, useState } from 'react';
import ProtectedPage from '../components/ProtectedPage';
import { useAuth } from '../context/AuthContext';

function formatDateInput(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

export default function Agendar({ onNavigate }) {
  const { patient } = useAuth();
  const [date, setDate] = useState(() => formatDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [available, setAvailable] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadAvailable() {
      setLoading(true);
      setError('');
      setMessage('');
      setSelectedTime('');
      try {
        const resp = await fetch(`/api/appointments/available?date=${date}`);
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.message || 'Falha ao carregar horários.');
        }
        setAvailable(data.available_times || []);
      } catch (err) {
        setError(err.message || 'Falha ao carregar horários.');
        setAvailable([]);
      } finally {
        setLoading(false);
      }
    }
    loadAvailable();
    async function loadTypes() {
      try {
        const resp = await fetch('/api/consultation-types');
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.message || 'Falha ao carregar tipos.');
        }
        setTypes(data.types || []);
        if ((data.types || []).length > 0) {
          setSelectedType((data.types || [])[0].id);
        }
      } catch (err) {
        setError(err.message || 'Falha ao carregar tipos.');
      }
    }
    loadTypes();
  }, [date]);

  const handleBook = async () => {
    if (!selectedTime) {
      setError('Selecione um horário.');
      return;
    }
    if (!selectedType) {
      setError('Selecione um tipo de consulta.');
      return;
    }
    setBooking(true);
    setError('');
    setMessage('');
    try {
      const resp = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient?.id,
          doctor_id: 1,
          type_id: selectedType,
          date,
          time: selectedTime
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.message || 'Não foi possível agendar.');
      }
      setMessage('Consulta agendada com sucesso.');
      setSelectedTime('');
      onNavigate('minha-agenda');
    } catch (err) {
      setError(err.message || 'Não foi possível agendar.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div style={{ padding: '32px 24px', maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        <h1>Agendar consulta</h1>
        <p>Escolha uma data e selecione um horário disponível.</p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '16px 0' }}>
          <label htmlFor="date">
            Data:{' '}
            <input
              id="date"
              type="date"
              value={date}
              min={formatDateInput(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label htmlFor="type">
            Tipo:
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(Number(e.target.value))}
              style={{ marginLeft: 8 }}
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.duration} min)
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && <div>Carregando horários...</div>}
        {error && <div style={{ color: '#c0392b', marginBottom: 8 }}>{error}</div>}
        {message && <div style={{ color: '#1f7a47', marginBottom: 8 }}>{message}</div>}

        {!loading && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 10,
              marginTop: 12
            }}
          >
            {available.length === 0 && <div>Nenhum horário disponível.</div>}
            {available.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: selectedTime === time ? '2px solid #3b5bfd' : '1px solid #d9e4ff',
                  background: selectedTime === time ? '#e8eeff' : '#fff',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                {time}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={handleBook} disabled={booking || !selectedTime}>
            {booking ? 'Agendando...' : 'Confirmar agendamento'}
          </button>
        </div>
      </div>
    </ProtectedPage>
  );
}
