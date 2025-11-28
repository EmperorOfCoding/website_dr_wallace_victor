import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProtectedPage from "../components/ProtectedPage";
import { useAuth } from "../context/AuthContext";
import styles from "./AppointmentDetails.module.css";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("pt-BR");
}

export default function AppointmentDetails({ onNavigate }) {
  const { id } = useParams();
  const { token, isAdmin } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointmentDetails();
  }, [id, token]);

  const loadAppointmentDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`/api/appointments/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.message || "Erro ao carregar detalhes da consulta");
      }
      
      setAppointment(data.appointment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const handleDownloadDocument = async (docId, filename) => {
    try {
      const resp = await fetch(`/api/documents/${docId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Erro ao baixar documento");
      
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Erro ao baixar documento");
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!appointment) return <div className={styles.error}>Consulta não encontrada</div>;

  const status = getStatusBadge(appointment.status);

  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <header className={styles.header}>
            <button onClick={() => onNavigate(isAdmin ? "painel-medico-agenda" : "minha-agenda")} className={styles.backBtn}>
              ← Voltar
            </button>
            <div className={styles.headerContent}>
              <p className={styles.badge}>Detalhes da Consulta</p>
              <h1 className={styles.title}>Consulta #{appointment.id}</h1>
              <div className={styles.headerMeta}>
                <span className={`${styles.status} ${status.class}`}>{status.label}</span>
                <span className={styles.date}>📅 {formatDate(appointment.date)} às {appointment.time?.slice(0, 5)}</span>
              </div>
            </div>
          </header>

          <div className={styles.grid}>
            {/* Main Info Card */}
            <div className={styles.mainColumn}>
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Informações da Consulta</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>🏥 Tipo</span>
                    <span className={styles.infoValue}>{appointment.type_name || "Consulta"}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>⏱️ Duração</span>
                    <span className={styles.infoValue}>{appointment.duration_minutes || "30"} minutos</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      {appointment.modality === 'online' ? '💻' : '🏥'} Modalidade
                    </span>
                    <span className={styles.infoValue}>{appointment.modality === 'online' ? 'Online' : 'Presencial'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>📅 Agendado em</span>
                    <span className={styles.infoValue}>{formatDateTime(appointment.created_at)}</span>
                  </div>
                </div>

                {appointment.type_description && (
                  <div className={styles.description}>
                    <h3>Sobre este tipo de consulta</h3>
                    <p>{appointment.type_description}</p>
                  </div>
                )}

                {appointment.notes && (
                  <div className={styles.notes}>
                    <h3>📝 Observações</h3>
                    <p>{appointment.notes}</p>
                  </div>
                )}

                {appointment.cancellation_reason && (
                  <div className={styles.cancellationNote}>
                    <h3>❌ Motivo do Cancelamento</h3>
                    <p>{appointment.cancellation_reason}</p>
                  </div>
                )}
              </section>

              {/* Documents */}
              {appointment.documents && appointment.documents.length > 0 && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>📄 Documentos Anexados</h2>
                  <div className={styles.documentsList}>
                    {appointment.documents.map((doc) => (
                      <div key={doc.id} className={styles.documentCard}>
                        <div className={styles.docIcon}>📄</div>
                        <div className={styles.docInfo}>
                          <p className={styles.docName}>{doc.original_name}</p>
                          <p className={styles.docMeta}>
                            {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")} • {(doc.size_bytes / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc.id, doc.original_name)}
                          className={styles.downloadBtn}
                          title="Baixar"
                        >
                          ⬇️
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className={styles.sidebar}>
              {/* Patient Info */}
              {isAdmin && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>👤 Paciente</h2>
                  <div className={styles.personInfo}>
                    <p className={styles.personName}>{appointment.patient_name}</p>
                    <p className={styles.personDetail}>📧 {appointment.patient_email}</p>
                    {appointment.patient_phone && (
                      <p className={styles.personDetail}>📱 {appointment.patient_phone}</p>
                    )}
                    <button
                      onClick={() => onNavigate(`painel-medico/pacientes/${appointment.patient_id}`)}
                      className={styles.linkBtn}
                    >
                      Ver Perfil Completo →
                    </button>
                  </div>
                </section>
              )}

              {/* Doctor Info */}
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>👨‍⚕️ Médico</h2>
                <div className={styles.personInfo}>
                  <p className={styles.personName}>{appointment.doctor_name || "Dr. Wallace Victor"}</p>
                  {appointment.doctor_specialty && (
                    <p className={styles.personDetail}>🩺 {appointment.doctor_specialty}</p>
                  )}
                  {appointment.doctor_email && (
                    <p className={styles.personDetail}>📧 {appointment.doctor_email}</p>
                  )}
                </div>
              </section>

              {/* Actions */}
              {!isAdmin && appointment.status === 'scheduled' && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>Ações</h2>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onNavigate(`avaliar/${appointment.id}`)}
                      className={styles.actionBtn}
                      disabled={appointment.hasReview}
                    >
                      {appointment.hasReview ? '⭐ Já Avaliado' : '⭐ Avaliar Consulta'}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
