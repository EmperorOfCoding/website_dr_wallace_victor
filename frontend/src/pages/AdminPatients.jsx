import { useEffect, useMemo, useState } from "react";
import ProtectedAdmin from "../components/ProtectedAdmin";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminDashboard.module.css";

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
              <p className={styles.badge}>Admin</p>
              <h1 className={styles.title}>Pacientes</h1>
              <p className={styles.lead}>Consulta rápida de pacientes para contato e histórico.</p>
            </div>
            <div className={styles.filters}>
              <label className={styles.field} htmlFor="search">
                Buscar paciente
                <input
                  id="search"
                  type="text"
                  placeholder="Nome, e-mail ou telefone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
          </header>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.badge}>Lista</p>
                <h2 className={styles.cardTitle}>Pacientes cadastrados</h2>
                <p className={styles.muted}>Até 50 resultados mais recentes.</p>
              </div>
            </div>
            {loading && <p className={styles.info}>Carregando pacientes...</p>}
            {error && <p className={styles.error}>{error}</p>}
            {!loading && !error && patients.length === 0 && <div className={styles.empty}>Nenhum paciente encontrado.</div>}
            {!loading && !error && patients.length > 0 && (
              <div className={styles.patientList}>
                {patients.map((p) => (
                  <div key={p.id} className={styles.patientRow}>
                    <div>
                      <p className={styles.patient}>{p.name}</p>
                      <p className={styles.sub}>{p.email}</p>
                    </div>
                    <p className={styles.value}>{p.phone || "--"}</p>
                    <button 
                        className={styles.actionButton}
                        onClick={() => onNavigate(`admin/pacientes/${p.id}`)}
                        style={{marginLeft: 'auto', padding: '4px 12px', fontSize: '0.9rem', cursor: 'pointer'}}
                    >
                        Ver Detalhes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </ProtectedAdmin>
  );
}
