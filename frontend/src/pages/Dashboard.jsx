import { useEffect, useMemo, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import styles from "./Dashboard.module.css";

const PREF_KEY = "patient_profile_preferences";

function buildStorageKey(patientId) {
  return `${PREF_KEY}_${patientId || "anon"}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function Dashboard({ onNavigate }) {
  const { patient, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState({ reminders: true, contactPreference: "whatsapp" });

  useEffect(() => {
    if (!patient?.id) return;
    try {
      const cached = localStorage.getItem(buildStorageKey(patient.id));
      if (cached) {
        setPrefs((prev) => ({ ...prev, ...JSON.parse(cached) }));
      }
    } catch (_) {
      /* ignore */
    }
  }, [patient?.id]);

  useEffect(() => {
    async function load() {
      // Fallback: try to get patient_id from token if not in context
      let patientId = patient?.id;
      if (!patientId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          patientId = payload.patient_id;
          console.log("Extracted patient_id from token:", patientId);
        } catch (e) {
          console.error("Error decoding token:", e);
        }
      }

      if (!patientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const resp = await fetch(`${API_BASE_URL}/api/appointments?patient_id=${patientId}`, {
          credentials: 'include', // Send cookies for authentication
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data.message || "Não foi possível carregar seus agendamentos.");
        }
        setAppointments(data.appointments || []);
      } catch (err) {
        setError(err.message || "Não foi possível carregar seus agendamentos.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patient?.id, token]);

  const nextAppointment = useMemo(() => {
    if (!appointments.length) return null;
    const now = new Date();
    const upcoming = appointments
      .map((a) => ({
        ...a,
        dateTime: new Date(`${a.date}T${a.time}`),
      }))
      .filter((a) => !Number.isNaN(a.dateTime.getTime()) && a.dateTime >= now)
      .sort((a, b) => a.dateTime - b.dateTime);
    return upcoming[0] || null;
  }, [appointments]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const done = appointments.filter((a) => a.status === "done").length;
    return { total, scheduled, done };
  }, [appointments]);

  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <div>
              <p className={styles.badge}>Área do paciente</p>
              <h1 className={styles.title}>Olá, {patient?.name || "Paciente"}</h1>
              <p className={styles.lead}>
                Acompanhe seus próximos horários, ajuste preferências e agende consultas com poucos cliques.
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={() => onNavigate("agendar")}>
                  Agendar nova consulta
                </button>
                <button type="button" className={styles.secondary} onClick={() => onNavigate("minha-agenda")}>
                  Minha agenda
                </button>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Contato preferencial</p>
              <p className={styles.summaryValue}>
                {prefs.contactPreference === "email" ? "E-mail" : "WhatsApp"}
              </p>
              <p className={styles.summaryLabel}>Lembretes</p>
              <p className={styles.summaryValue}>{prefs.reminders ? "Ativados" : "Desativados"}</p>
              <p className={styles.muted}>Gerencie em Perfil &gt; Preferências.</p>
            </div>
          </header>

          <section className={styles.grid}>
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.badge}>Próximo</p>
                  <h2 className={styles.cardTitle}>Próxima consulta</h2>
                  <p className={styles.muted}>Veja o próximo horário confirmado.</p>
                </div>
                <button type="button" className={styles.secondary} onClick={() => onNavigate("minha-agenda")}>
                  Ver agenda
                </button>
              </div>
              {loading && <p className={styles.info}>Carregando...</p>}
              {error && <p className={styles.error}>{error}</p>}
              {!loading && !error && !nextAppointment && (
                <div className={styles.empty}>Nenhuma consulta futura. Agende a próxima.</div>
              )}
              {!loading && !error && nextAppointment && (
                <div className={styles.nextCard}>
                  <div>
                    <p className={styles.date}>{formatDate(nextAppointment.date)}</p>
                    <p className={styles.time}>{nextAppointment.time?.slice(0, 5)}</p>
                  </div>
                  <div className={styles.nextDetails}>
                    <p className={styles.type}>{nextAppointment.typeName || "Consulta"}</p>
                    <p className={styles.duration}>{nextAppointment.durationMinutes || "--"} min</p>
                    <span className={styles.status}>
                      {nextAppointment.status === 'scheduled' ? 'AGENDADO' : 
                       nextAppointment.status === 'confirmed' ? 'CONFIRMADO' :
                       nextAppointment.status === 'completed' ? 'CONCLUÍDO' :
                       nextAppointment.status === 'cancelled' ? 'CANCELADO' :
                       nextAppointment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </article>

            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.badge}>Resumo</p>
                  <h2 className={styles.cardTitle}>Seu status</h2>
                  <p className={styles.muted}>Visão rápida das suas consultas.</p>
                </div>
              </div>
              <div className={styles.stats}>
                <div className={styles.statBox}>
                  <p className={styles.statNumber}>{stats.scheduled}</p>
                  <p className={styles.statLabel}>Agendadas</p>
                </div>
                <div className={styles.statBox}>
                  <p className={styles.statNumber}>{stats.done}</p>
                  <p className={styles.statLabel}>Concluídas</p>
                </div>
                <div className={styles.statBox}>
                  <p className={styles.statNumber}>{stats.total}</p>
                  <p className={styles.statLabel}>Total</p>
                </div>
              </div>
              <div className={styles.quickLinks}>
                <button type="button" className={styles.linkButton} onClick={() => onNavigate("perfil")}>
                  Atualizar dados
                </button>
                <button type="button" className={styles.linkButton} onClick={() => onNavigate("agendar")}>
                  Agendar consulta
                </button>
              </div>
            </article>
          </section>
        </div>
      </div>
    </ProtectedPage>
  );
}
