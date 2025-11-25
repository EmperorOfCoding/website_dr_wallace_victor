import React, { useEffect, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import { useAuth } from "../context/AuthContext";
import styles from "./MinhaAgenda.module.css";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function MinhaAgenda({ onNavigate }) {
  const { patient, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!patient?.id) return;
      setLoading(true);
      setError("");
      try {
        const resp = await fetch(`/api/appointments?patient_id=${patient.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data.message || "Não foi possível carregar sua agenda.");
        }
        setAppointments(data.appointments || []);
      } catch (err) {
        setError(err.message || "Não foi possível carregar sua agenda.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patient?.id, token]);

  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div>
              <p className={styles.badge}>Minha agenda</p>
              <h1 className={styles.title}>Consultas agendadas</h1>
              <p className={styles.subtitle}>Revise seus horários e volte sempre que precisar reagendar ou cancelar.</p>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => onNavigate("agendar")}>
                Nova consulta
              </button>
            </div>
          </header>

          {loading && <div className={styles.info}>Carregando sua agenda...</div>}
          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && appointments.length === 0 && (
            <div className={styles.empty}>
              <p>Nenhuma consulta agendada ainda.</p>
              <button type="button" className={styles.primary} onClick={() => onNavigate("agendar")}>
                Agendar agora
              </button>
            </div>
          )}

          {!loading && !error && appointments.length > 0 && (
            <div className={styles.list}>
              {appointments.map((appt) => (
                <article key={appt.id} className={styles.card}>
                  <div>
                    <p className={styles.date}>{formatDate(appt.date)}</p>
                    <p className={styles.time}>{appt.time?.slice(0, 5)}</p>
                  </div>
                  <div className={styles.details}>
                    <p className={styles.type}>{appt.typeName || "Consulta"}</p>
                    <p className={styles.duration}>{appt.durationMinutes || "--"} min</p>
                    <span className={styles.status}>{appt.status}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
