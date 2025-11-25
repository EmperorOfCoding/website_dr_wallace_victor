import React, { useEffect, useState } from "react";
import ProtectedAdmin from "../components/ProtectedAdmin";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminDashboard.module.css";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
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

  useEffect(() => {
    async function loadAppointments() {
      setLoadingAppt(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (date) params.append("date", date);
        if (search) params.append("patient", search);
        const resp = await fetch(`/api/admin/appointments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data.message || "Não foi possível carregar agendamentos.");
        }
        setAppointments(data.appointments || []);
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
        if (search) params.append("search", search);
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
  }, [token, date, search]);

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
                        <p className={styles.value}>{appt.type_id}</p>
                      </div>
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
                <button type="button" className={styles.secondary} onClick={() => onNavigate("perfil")}>Ver perfil</button>
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
    </ProtectedAdmin>
  );
}
