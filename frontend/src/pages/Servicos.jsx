import { useEffect, useState } from "react";
import styles from "./Servicos.module.css";

// Function to get icon based on service name
function getServiceIcon(serviceName) {
  const name = serviceName.toLowerCase();
  if (name.includes("consulta") || name.includes("geral")) return "🩺";
  if (name.includes("retorno")) return "🔄";
  if (name.includes("exame")) return "🔬";
  if (name.includes("emergência") || name.includes("urgência")) return "🚑";
  if (name.includes("online") || name.includes("telemedicina")) return "💻";
  if (name.includes("avaliação")) return "📋";
  if (name.includes("procedimento")) return "⚕️";
  return "💡"; // default icon
}

export default function Servicos({ onNavigate }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/consultation-types`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Falha ao carregar serviços.");
        }
        if (isMounted) {
          setServices(data.types || []);
        }
      } catch (err) {
        if (isMounted) {
          setError("Não foi possível carregar os serviços. Tente novamente em instantes.");
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
    onNavigate?.("agendar");
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Nossos Serviços</h1>
          <p className={styles.subtitle}>
            Oferecemos uma ampla gama de serviços médicos para cuidar da sua saúde. Confira abaixo todos os tipos de
            consultas e atendimentos disponíveis.
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
                <div className={styles.iconWrapper}>
                  <div className={styles.icon} aria-hidden="true">
                    {getServiceIcon(service.name)}
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{service.name}</h3>
                  <span className={styles.duration}>⏱️ {service.duration} minutos</span>
                  <p className={styles.description}>{service.description || "Atendimento especializado para cuidar da sua saúde."}</p>
                </div>
                <button type="button" className={styles.cta} onClick={handleAgendar}>
                  <span>Agendar Consulta</span>
                  <span className={styles.arrow}>→</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
