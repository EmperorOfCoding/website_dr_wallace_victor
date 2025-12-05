import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import { API_BASE_URL } from "../config";
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

export default function MinhaAgenda({ onNavigate }) {
  const { patient, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [patient?.id, token]);

  const loadAppointments = async () => {
    // Get patient_id - try from patient object first, then from token
    let patientIdToUse = patient?.id;
    
    // Fallback: if patient.id is undefined, try to extract from token
    if (!patientIdToUse && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        patientIdToUse = payload.patient_id || payload.patientId;

      } catch (e) {
        console.error('[MinhaAgenda] Failed to decode token:', e);
      }
    }
    
    if (!patientIdToUse) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API_BASE_URL}/api/appointments?patient_id=${patientIdToUse}`, {
        credentials: 'include', // Send cookies for authentication
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

  // Upcoming appointments: future dates, regardless of status (cancelled future appointments still appear here)
  const upcomingAppointments = appointments.filter(
    (appt) => isUpcoming(appt.date, appt.time)
  );

  // Past appointments: only past dates (cancelled future appointments should not appear here)
  const pastAppointments = appointments.filter(
    (appt) => isPast(appt.date, appt.time)
  );

  const handleCancelClick = (appt) => {
    setSelectedAppointment(appt);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;
    setCancellingId(selectedAppointment.id);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/appointments/${selectedAppointment.id}/cancel`, {
        method: "PUT",
        credentials: 'include', // Send cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: cancelReason || "Cancelado pelo paciente" }),
      });
      if (resp.ok) {
        setShowCancelModal(false);
        loadAppointments();
      } else {
        const data = await resp.json().catch(() => ({}));
        setError(data.message || "Não foi possível cancelar.");
      }
    } catch (err) {
      setError("Erro ao cancelar agendamento.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReschedule = (appt) => {
    // Store original appointment ID for tracking
    sessionStorage.setItem("reschedule_from", appt.id);
    onNavigate("agendar");
  };

  const handleReview = (appt) => {
    onNavigate(`avaliar/${appt.id}`);
  };

  const handleUploadDocs = (appt) => {
    onNavigate(`documentos/${appt.id}`);
  };

  const canCancel = (appt) => {
    // Can cancel if appointment is in the future
    const appointmentDate = new Date(`${appt.date}T${appt.time}`);
    const now = new Date();
    const hoursUntil = (appointmentDate - now) / (1000 * 60 * 60);
    return hoursUntil > 2 && appt.status !== "cancelled";
  };

  const canReview = (appt) => {
    // Can review if appointment is in the past and completed
    return isPast(appt.date, appt.time) && appt.status === "completed" && !appt.hasReview;
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

  const AppointmentCard = ({ appt, showActions = true }) => {
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
            {appt.doctorName && (
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>👨‍⚕️</span>
                <span>{appt.doctorName}</span>
              </div>
            )}
          </div>

          {showActions && (
            <div className={styles.actions}>
              {canCancel(appt) && (
                <>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleReschedule(appt)}
                    title="Reagendar"
                  >
                    📅 Reagendar
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.cancelBtn}`}
                    onClick={() => handleCancelClick(appt)}
                    title="Cancelar"
                  >
                    ❌ Cancelar
                  </button>
                </>
              )}
              {isUpcoming(appt.date, appt.time) && appt.status !== "cancelled" && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleUploadDocs(appt)}
                  title="Enviar documentos"
                >
                  📄 Documentos
                </button>
              )}
              {canReview(appt) && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.reviewBtn}`}
                  onClick={() => handleReview(appt)}
                  title="Avaliar consulta"
                >
                  ⭐ Avaliar
                </button>
              )}
              {appt.hasReview && (
                <span className={styles.reviewed}>✓ Avaliado</span>
              )}
            </div>
          )}
        </div>

        {appt.cancellationReason && (
          <div className={styles.cancellationNote}>
            <strong>Motivo do cancelamento:</strong> {appt.cancellationReason}
          </div>
        )}
      </motion.article>
    );
  };

  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div>
              <p className={styles.badge}>Minha agenda</p>
              <h1 className={styles.title}>Consultas</h1>
              <p className={styles.subtitle}>
                Gerencie suas consultas, reagende ou cancele quando necessário.
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
                onClick={() => onNavigate("documentos")}
              >
                📄 Meus documentos
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
                    <button
                      type="button"
                      className={styles.primary}
                      onClick={() => onNavigate("agendar")}
                    >
                      Agendar agora
                    </button>
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

          {/* Cancel Modal */}
          <AnimatePresence>
            {showCancelModal && (
              <motion.div
                className={styles.modalOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCancelModal(false)}
              >
                <motion.div
                  className={styles.modal}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className={styles.modalTitle}>Cancelar Consulta</h2>
                  <p className={styles.modalText}>
                    Tem certeza que deseja cancelar a consulta de{" "}
                    <strong>{formatDate(selectedAppointment?.date)}</strong> às{" "}
                    <strong>{selectedAppointment?.time?.slice(0, 5)}</strong>?
                  </p>
                  <div className={styles.modalField}>
                    <label htmlFor="cancelReason">Motivo do cancelamento (opcional)</label>
                    <textarea
                      id="cancelReason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Informe o motivo..."
                      rows={3}
                    />
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => setShowCancelModal(false)}
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={handleCancelConfirm}
                      disabled={cancellingId === selectedAppointment?.id}
                    >
                      {cancellingId === selectedAppointment?.id ? "Cancelando..." : "Confirmar cancelamento"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedPage>
  );
}
