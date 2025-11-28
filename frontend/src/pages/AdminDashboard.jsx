import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ExamPanel from "../components/ExamPanel";
import ProtectedAdmin from "../components/ProtectedAdmin";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminDashboard.module.css";
import { API_BASE_URL } from "../config";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function AdminDashboard({ onNavigate }) {
  const { token } = useAuth();
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, patients: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientForExams, setSelectedPatientForExams] = useState(null);

  useEffect(() =>{
    loadDashboardData();
  }, [token]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load appointments
      const apptResp = await fetch(`${API_BASE_URL}/api/admin/appointments?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const apptData = await apptResp.json().catch(() => ({}));
      
      // Load patients count
      const patientsResp = await fetch(`${API_BASE_URL}/api/admin/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const patientsData = await patientsResp.json().catch(() => ({}));

      if (apptResp.ok) {
        const appointments = apptData.appointments || [];
        setRecentAppointments(appointments.slice(0, 5));
        
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        setStats({
          total: appointments.length,
          today: appointments.filter(a => a.date === today).length,
          pending: appointments.filter(a => a.status === 'scheduled').length,
          patients: patientsData.patients?.length || 0
        });
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const quickActions = [
    { label: "Agendar Consulta", action: () => onNavigate("agendar"), color: "primary" },
    { label: "Ver Pacientes", action: () => onNavigate("painel-medico-pacientes"), color: "secondary" },
    { label: "Ver Agenda", action: () => onNavigate("painel-medico-agenda"), color: "secondary" },
    { label: "Calendario", action: () => onNavigate("painel-medico-calendario"), color: "secondary" },
  ];

  return (
    <ProtectedAdmin onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <div>
              <p className={styles.badge}>Painel Médico</p>
              <h1 className={styles.title}>Bem-vindo, Dr(a)!</h1>
              <p className={styles.lead}>
                Gerencie suas consultas, pacientes e agenda de forma eficiente.
              </p>
            </div>
          </header>

          {/* Metrics Cards */}
          <div className={styles.metricsCard}>
            <section className={styles.metricsGrid}>
              <motion.div
                className={`${styles.metricCard} ${styles.metricPrimary}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className={styles.metricContent}>
                  <p className={styles.metricValue}>{loading ? "..." : stats.total}</p>
                  <p className={styles.metricLabel}>Total de Consultas</p>
                </div>
              </motion.div>

              <motion.div
                className={`${styles.metricCard} ${styles.metricSuccess}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className={styles.metricContent}>
                  <p className={styles.metricValue}>{loading ? "..." : stats.today}</p>
                  <p className={styles.metricLabel}>Consultas Hoje</p>
                </div>
              </motion.div>

              <motion.div
                className={`${styles.metricCard} ${styles.metricWarning}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className={styles.metricContent}>
                  <p className={styles.metricValue}>{loading ? "..." : stats.pending}</p>
                  <p className={styles.metricLabel}>Pendentes</p>
                </div>
              </motion.div>

              <motion.div
                className={`${styles.metricCard} ${styles.metricInfo}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className={styles.metricContent}>
                  <p className={styles.metricValue}>{loading ? "..." : stats.patients}</p>
                  <p className={styles.metricLabel}>Total de Pacientes</p>
                </div>
              </motion.div>
            </section>
          </div>

          {/* Quick Actions */}
          <div className={styles.actionsCard}>
            <section className={styles.quickActionsSection}>
              <div className={styles.quickActionsGrid}>
                {quickActions.map((action, idx) => (
                  <motion.button
                    key={action.label}
                    className={`${styles.quickActionCard} ${styles[action.color]}`}
                    onClick={action.action}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={styles.actionLabel}>{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </section>
          </div>

          {/* Recent Appointments */}
          <section className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Consultas Recentes</h2>
                <p className={styles.sectionSubtitle}>Últimas 5 consultas agendadas</p>
              </div>
              <button
                className={styles.secondary}
                onClick={() => onNavigate("painel-medico-agenda")}
              >
                Ver Todas
              </button>
            </div>

            {loading && <p className={styles.info}>Carregando...</p>}
            
            {!loading && recentAppointments.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <p className={styles.emptyTitle}>Nenhuma consulta agendada</p>
                <p className={styles.emptyText}>As próximas consultas aparecerão aqui.</p>
              </div>
            )}

            {!loading && recentAppointments.length > 0 && (
              <div className={styles.appointmentsList}>
                {recentAppointments.map((appt, idx) => (
                  <motion.div
                    key={appt.appointment_id}
                    className={styles.appointmentCard}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                  >
                    <div className={styles.appointmentDate}>
                      <p className={styles.dateDay}>{formatDate(appt.date)}</p>
                      <p className={styles.dateTime}>{appt.time?.slice(0, 5)}</p>
                    </div>
                    <div className={styles.appointmentInfo}>
                      <p className={styles.patientName}>{appt.patient_name}</p>
                      <p className={styles.appointmentType}>{appt.type_name || "Consulta"}</p>
                      <p className={styles.appointmentModality}>
                        {appt.modality === 'online' ? '🌐 Online' : '🏥 Presencial'}
                      </p>
                    </div>
                    <div className={styles.appointmentActions}>
                      <span className={`${styles.statusBadge} ${styles[appt.status]}`}>
                        {appt.status === 'scheduled' ? 'Agendado' : 
                         appt.status === 'confirmed' ? 'Confirmado' :
                         appt.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {selectedPatientForExams && (
        <ExamPanel 
          patientId={selectedPatientForExams} 
          onClose={() => setSelectedPatientForExams(null)} 
        />
      )}
    </ProtectedAdmin>
  );
}
