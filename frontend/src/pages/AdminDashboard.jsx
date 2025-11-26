import { useEffect, useState } from "react";
import ProtectedAdmin from "../components/ProtectedAdmin";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminDashboard.module.css";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AdminDashboard({ onNavigate }) {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [loadingAppt, setLoadingAppt] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [error, setError] = useState("");
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [apptDocs, setApptDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    async function loadAppointments() {
      setLoadingAppt(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (date) params.append("date", date);
        if (debouncedSearch) params.append("patient", debouncedSearch);
        const resp = await fetch(`/api/admin/appointments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) {
          setAppointments(data.appointments || []);
          setError("");
        } else if (resp.status >= 500) {
          throw new Error(data.message || "Não foi possível carregar agendamentos.");
        } else {
          // Erros 4xx tratam como lista vazia
          setAppointments([]);
          setError("");
        }
      } catch (err) {
        setError(err.message || "Não foi possível carregar agendamentos.");
      } finally {
        setLoadingAppt(false);
      }
    }
    async function loadPatients() {
      setLoadingPatients(true);
      try {
        const params = new URLSearchParams();
        params.append("limit", 5);
        if (debouncedSearch) params.append("search", debouncedSearch);
        const resp = await fetch(`/api/admin/patients?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) {
          setPatients(data.patients || []);
        }
      } catch (_) {
        /* ignore silently */
      } finally {
        setLoadingPatients(false);
      }
    }
    loadAppointments();
    loadPatients();
  }, [token, date, debouncedSearch]);

  async function handleViewDetails(appt) {
    setSelectedAppt(appt);
    setApptDocs([]);
    setLoadingDocs(true);
    try {
      const resp = await fetch(`/api/documents?appointment_id=${appt.appointment_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setApptDocs(data.documents || []);
      }
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
    } finally {
      setLoadingDocs(false);
    }
  }

  function closeDetails() {
    setSelectedAppt(null);
    setApptDocs([]);
  }

  return (
    <ProtectedAdmin onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <div>
              <p className={styles.badge}>Admin</p>
              <h1 className={styles.title}>Painel do Médico</h1>
              <p className={styles.lead}>Consulte rapidamente os pacientes agendados e sua agenda diária.</p>
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={() => onNavigate("agendar")}>
                  Agendar paciente
                </button>
                <button type="button" className={styles.secondary} onClick={() => onNavigate("home")}>
                  Voltar ao site
                </button>
              </div>
            </div>
            <div className={styles.filters}>
              <label className={styles.field} htmlFor="dateFilter">
                Data
                <input
                  id="dateFilter"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className={styles.field} htmlFor="search">
                Buscar paciente
                <input
                  id="search"
                  type="text"
                  placeholder="Nome ou e-mail"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
          </header>

          <section className={styles.grid}>
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.badge}>Agenda</p>
                  <h2 className={styles.cardTitle}>Agendamentos</h2>
                  <p className={styles.muted}>Próximos horários com dados do paciente.</p>
                </div>
              </div>
              {loadingAppt && <p className={styles.info}>Carregando agendamentos...</p>}
              {error && <p className={styles.error}>{error}</p>}
              {!loadingAppt && !error && appointments.length === 0 && (
                <div className={styles.empty}>Nenhum agendamento encontrado.</div>
              )}
              {!loadingAppt && !error && appointments.length > 0 && (
                <div className={styles.list}>
                  {appointments.map((appt) => (
                    <article key={appt.appointment_id} className={styles.row}>
                      <div>
                        <p className={styles.date}>{formatDate(appt.date)}</p>
                        <p className={styles.time}>{appt.time?.slice(0, 5)}</p>
                      </div>
                      <div className={styles.detailBlock}>
                        <p className={styles.patient}>{appt.patient_name}</p>
                        <p className={styles.sub}>{appt.patient_email}</p>
                      </div>
                      <div className={styles.detailBlock}>
                        <p className={styles.sub}>Tipo</p>
                        <p className={styles.value}>{appt.type_name || appt.type_id}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => handleViewDetails(appt)}
                        style={{ marginLeft: "auto" }}
                      >
                        Ver Detalhes
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.badge}>Pacientes</p>
                  <h2 className={styles.cardTitle}>Pacientes recentes</h2>
                  <p className={styles.muted}>Lista rápida para contato.</p>
                </div>
                <button type="button" className={styles.secondary} onClick={() => onNavigate("perfil")}>
                  Ver perfil
                </button>
              </div>
              {loadingPatients && <p className={styles.info}>Carregando pacientes...</p>}
              {!loadingPatients && patients.length === 0 && <div className={styles.empty}>Nenhum paciente encontrado.</div>}
              {!loadingPatients && patients.length > 0 && (
                <div className={styles.patientList}>
                  {patients.map((p) => (
                    <div key={p.id} className={styles.patientRow}>
                      <div>
                        <p className={styles.patient}>{p.name}</p>
                        <p className={styles.sub}>{p.email}</p>
                      </div>
                      <p className={styles.value}>{p.phone || "--"}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </div>
      </div>
      {selectedAppt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Detalhes do Agendamento</h3>
              <button onClick={closeDetails} className={styles.closeBtn}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>Paciente:</strong> {selectedAppt.patient_name}</p>
              <p><strong>Data:</strong> {formatDate(selectedAppt.date)} - {selectedAppt.time?.slice(0, 5)}</p>
              <p><strong>Tipo:</strong> {selectedAppt.type_name || selectedAppt.type_id}</p>
              
              <div className={styles.section}>
                <h4>Resumo do problema</h4>
                <p className={styles.notes}>{selectedAppt.notes || "Nenhuma observação."}</p>
              </div>

              <div className={styles.section}>
                <h4>Documentos anexados</h4>
                {loadingDocs && <p>Carregando documentos...</p>}
                {!loadingDocs && apptDocs.length === 0 && <p className={styles.muted}>Nenhum documento anexado.</p>}
                {!loadingDocs && apptDocs.length > 0 && (
                  <ul className={styles.docList}>
                    {apptDocs.map((doc) => (
                      <li key={doc.id}>
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {doc.original_name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={closeDetails} className={styles.primary}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedAdmin>
  );
}
