import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import styles from "./AppointmentDetails.module.css";

export default function AppointmentDetails({ onNavigate }) {
  const { appointmentId } = useParams();
    const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
        credentials: 'include', // Send cookies
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.appointment) {
        setAppointment(data.appointment);
      } else {
        setError("Consulta não encontrada.");
      }
    } catch (err) {
      setError("Erro ao carregar detalhes da consulta.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>Carregando detalhes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
          <div className={styles.actions}>
            <button className={styles.secondary} onClick={() => onNavigate("minha-agenda")}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.badge}>Detalhes da Consulta</span>
          <h1 className={styles.title}>
            {appointment.typeName || "Consulta"}
          </h1>
          <p className={styles.subtitle}>
            {formatDate(appointment.date)} às {appointment.time?.slice(0, 5)}
          </p>
        </header>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Informações Gerais</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Status</span>
                <span className={`${styles.status} ${styles[`status_${appointment.status}`]}`}>
                  {getStatusLabel(appointment.status)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Médico</span>
                <span className={styles.value}>{appointment.doctorName || "Dr. Wallace Victor"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Duração</span>
                <span className={styles.value}>{appointment.duration || "30"} minutos</span>
              </div>
            </div>
          </section>

          {appointment.notes && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Observações</h2>
              <p>{appointment.notes}</p>
            </section>
          )}

          <div className={styles.actions}>
            <button 
              className={styles.secondary} 
              onClick={() => onNavigate("minha-agenda")}
            >
              Voltar para Agenda
            </button>
            
            {appointment.status === 'completed' && (
              <button 
                className={styles.primary}
                onClick={() => onNavigate(`avaliar/${appointment.id}`)}
              >
                Avaliar Consulta
              </button>
            )}

            {appointment.status === 'scheduled' && (
               <button 
               className={styles.primary}
               onClick={() => onNavigate(`documentos/${appointment.id}`)}
             >
               Enviar Documentos
             </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
