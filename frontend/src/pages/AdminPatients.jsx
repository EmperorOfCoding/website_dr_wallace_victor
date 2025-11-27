import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ProtectedAdmin from "../components/ProtectedAdmin";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminPatients.module.css";

function decodeDoctorId(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.doctor_id || null;
  } catch (_) {
    return null;
  }
}

export default function AdminPatients({ onNavigate }) {
  const { token } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doctorId = useMemo(() => decodeDoctorId(token), [token]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.append("limit", 50);
        if (doctorId) params.append("doctor_id", doctorId);
        if (search) params.append("search", search);
        const resp = await fetch(`/api/admin/patients?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) {
          setPatients(data.patients || []);
        } else if (resp.status >= 500) {
          throw new Error(data.message || "Não foi possível carregar pacientes.");
        } else {
          setPatients([]);
        }
      } catch (err) {
        setError(err.message || "Não foi possível carregar pacientes.");
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, search, doctorId]);

  return (
    <ProtectedAdmin onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <div>
              <p className={styles.badge}>Gestão de Pacientes</p>
              <h1 className={styles.title}>Meus Pacientes</h1>
              <p className={styles.lead}>
                Gerencie seus pacientes, visualize históricos e agende consultas.
              </p>
            </div>
          </header>

          {/* Search and Filters */}
          <section className={styles.searchSection}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>👥</span>
                <span className={styles.statValue}>{patients.length}</span>
                <span className={styles.statLabel}>Pacientes</span>
              </div>
            </div>
          </section>

          {/* Patients Grid */}
          <section className={styles.patientsSection}>
            {loading && (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Carregando pacientes...</p>
              </div>
            )}

            {error && (
              <div className={styles.errorState}>
                <span className={styles.errorIcon}>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && patients.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <h3 className={styles.emptyTitle}>Nenhum paciente encontrado</h3>
                <p className={styles.emptyText}>
                  {search
                    ? "Tente ajustar os filtros de busca."
                    : "Seus pacientes aparecerão aqui após o primeiro agendamento."}
                </p>
              </div>
            )}

            {!loading && !error && patients.length > 0 && (
              <div className={styles.patientsWrapper}>
                <div className={styles.patientsGrid}>
                  {patients.map((patient, idx) => (
                    <motion.div
                      key={patient.id}
                      className={styles.patientCard}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                    <div className={styles.patientHeader}>
                      <div className={styles.patientAvatar}>
                        {patient.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className={styles.patientInfo}>
                        <h3 className={styles.patientName}>{patient.name}</h3>
                        <p className={styles.patientEmail}>{patient.email}</p>
                      </div>
                    </div>

                    <div className={styles.patientDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailIcon}>📞</span>
                        <span className={styles.detailText}>
                          {patient.phone || "Não informado"}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailIcon}>📅</span>
                        <span className={styles.detailText}>
                          Cadastrado em {new Date(patient.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className={styles.patientActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => onNavigate(`painel-medico/pacientes/${patient.id}`)}
                      >
                        <span>Ver Detalhes</span>
                      </button>
                      <button
                        className={styles.actionBtnSecondary}
                        onClick={() => onNavigate("agendar")}
                      >
                        <span>Agendar</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            )}
          </section>
        </div>
      </div>
    </ProtectedAdmin>
  );
}
