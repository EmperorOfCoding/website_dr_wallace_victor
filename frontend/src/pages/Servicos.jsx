import React, { useEffect, useState } from 'react';
import styles from './Servicos.module.css';

export default function Servicos() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        const response = await fetch('/api/consultation-types');
        if (!response.ok) {
          throw new Error('Falha ao carregar serviços.');
        }
        const data = await response.json();
        if (isMounted) {
          setServices(data.types || []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Não foi possível carregar os serviços. Tente novamente em instantes.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAgendar = () => {
    window.location.href = '/agendar';
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Serviços</h1>
          <p className={styles.subtitle}>
            Aqui você encontra todos os tipos de consultas e atendimentos disponíveis, com duração e descrição de cada
            serviço.
          </p>
        </header>

        {loading && <div className={styles.status}>Carregando serviços...</div>}
        {!loading && error && <div className={styles.error}>{error}</div>}
        {!loading && !error && services.length === 0 && (
          <div className={styles.status}>Nenhum serviço encontrado.</div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className={styles.grid}>
            {services.map((service) => (
              <article key={service.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.icon} aria-hidden="true">
                    🩺
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>{service.name}</h3>
                    <span className={styles.duration}>{service.duration} minutos</span>
                  </div>
                </div>
                <p className={styles.description}>{service.description || 'Descrição breve do serviço.'}</p>
                <button type="button" className={styles.cta} onClick={handleAgendar}>
                  Agendar Consulta
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
