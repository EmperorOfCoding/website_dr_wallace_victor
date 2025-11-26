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

export default function AdminAgenda({ onNavigate }) {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (date) params.append("date", date);
        if (debouncedSearch) params.append("patient", debouncedSearch);
        const resp = await fetch(`/api/admin/appointments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data.message || "Não foi possível carregar a agenda.");
        }
        setAppointments(data.appointments || []);
      } catch (err) {
        setError(err.message || "Não foi possível carregar a agenda.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, date, debouncedSearch]);

  return (
    <ProtectedAdmin onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <div>
              <p className={styles.badge}>Admin</p>
              <h1 className={styles.title}>Agenda da clínica</h1>
              <p className={styles.lead}>Filtros rápidos por data ou paciente.</p>
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

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.badge}>Agenda</p>
                <h2 className={styles.cardTitle}>Próximos horários</h2>
                <p className={styles.muted}>Veja rapidamente quem está agendado.</p>
              </div>
            </div>
            {loading && <p className={styles.info}>Carregando...</p>}
            {error && <p className={styles.error}>{error}</p>}
            {!loading && !error && appointments.length === 0 && (
              <div className={styles.empty}>Nenhum horário encontrado.</div>
            )}
            {!loading && !error && appointments.length > 0 && (
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
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </ProtectedAdmin>
  );
}
