import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import ProtectedAdmin from "../components/ProtectedAdmin";
import { useAuth } from "../context/AuthContext";
import styles from "./MinhaAgenda.module.css";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function isUpcoming(dateStr, timeStr) {
  const appointmentDate = new Date(`${dateStr}T${timeStr}`);
  return appointmentDate > new Date();
}

function isPast(dateStr, timeStr) {
  const appointmentDate = new Date(`${dateStr}T${timeStr}`);
  return appointmentDate <= new Date();
}

export default function DoctorAgenda({ onNavigate }) {
  const { patient, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  // Get doctor_id from patient object (when logged in as admin, patient contains doctor info)
  const doctorId = patient?.doctor_id || patient?.id;

  useEffect(() => {
    loadAppointments();
  }, [doctorId, token]);

  const loadAppointments = async () => {
    if (!doctorId) {
      setLoading(false);
      setError("Não foi possível identificar o médico.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`/api/appointments?doctor_id=${doctorId}`, {
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
  };

  const upcomingAppointments = appointments.filter(
    (appt) => isUpcoming(appt.date, appt.time)
  );

  const pastAppointments = appointments.filter(
    (appt) => isPast(appt.date, appt.time)
  );

  const handleViewPatient = (appt) => {
    onNavigate(`painel-medico/pacientes/${appt.patientId}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { label: "Agendado", class: styles.statusScheduled },
      confirmed: { label: "Confirmado", class: styles.statusConfirmed },
      completed: { label: "Concluído", class: styles.statusCompleted },
      cancelled: { label: "Cancelado", class: styles.statusCancelled },
      no_show: { label: "Não compareceu", class: styles.statusNoShow },
    };
    return badges[status] || { label: status, class: "" };
  };

  const AppointmentCard = ({ appt }) => {
    const status = getStatusBadge(appt.status);

    return (
      <motion.article
        key={appt.id}
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        layout
      >
        <div className={styles.cardHeader}>
          <div className={styles.dateTime}>
            <p className={styles.date}>{formatDate(appt.date)}</p>
            <p className={styles.time}>{appt.time?.slice(0, 5)}</p>
          </div>
          <span className={`${styles.status} ${status.class}`}>{status.label}</span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>👤</span>
              <span><strong>{appt.patientName}</strong></span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>📧</span>
              <span>{appt.patientEmail}</span>
            </div>
            {appt.patientPhone && (
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>📱</span>
                <span>{appt.patientPhone}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>🏥</span>
              <span>{appt.typeName || "Consulta"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>⏱️</span>
              <span>{appt.durationMinutes || "30"} min</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>{appt.modality === 'online' ? '💻' : '🏥'}</span>
              <span>{appt.modality === 'online' ? 'Online' : 'Presencial'}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => handleViewPatient(appt)}
              title="Ver perfil do paciente"
            >
              👤 Ver Perfil
            </button>
            {appt.hasReview && (
              <span className={styles.reviewed}>⭐ Avaliado</span>
            )}
          </div>
        </div>

        {appt.notes && (
          <div className={styles.cancellationNote} style={{ background: 'var(--bg-hover)', borderLeft: '3px solid var(--primary)' }}>
            <strong>Observações:</strong> {appt.notes}
          </div>
        )}

        {appt.cancellationReason && (
          <div className={styles.cancellationNote}>
            <strong>Motivo do cancelamento:</strong> {appt.cancellationReason}
          </div>
        )}
      </motion.article>
    );
  };

  return (
    <ProtectedAdmin onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div>
              <p className={styles.badge}>Minha agenda</p>
              <h1 className={styles.title}>Consultas</h1>
              <p className={styles.subtitle}>
                Visualize todas as consultas agendadas com você.
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => onNavigate("agendar")}
              >
                + Nova consulta
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => onNavigate("painel-medico-pacientes")}
              >
                👥 Ver pacientes
              </button>
            </div>
          </header>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "upcoming" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Próximas ({upcomingAppointments.length})
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "past" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("past")}
            >
              Histórico ({pastAppointments.length})
            </button>
          </div>

          {loading && <div className={styles.info}>Carregando sua agenda...</div>}
          {error && <div className={styles.error}>{error}</div>}

          <AnimatePresence mode="wait">
            {!loading && !error && activeTab === "upcoming" && (
              <motion.div
                key="upcoming"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {upcomingAppointments.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📅</div>
                    <p>Nenhuma consulta agendada.</p>
                  </div>
                ) : (
                  <div className={styles.list}>
                    {upcomingAppointments.map((appt) => (
                      <AppointmentCard key={appt.id} appt={appt} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {!loading && !error && activeTab === "past" && (
              <motion.div
                key="past"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {pastAppointments.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📋</div>
                    <p>Nenhuma consulta no histórico.</p>
                  </div>
                ) : (
                  <div className={styles.list}>
                    {pastAppointments.map((appt) => (
                      <AppointmentCard key={appt.id} appt={appt} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedAdmin>
  );
}
