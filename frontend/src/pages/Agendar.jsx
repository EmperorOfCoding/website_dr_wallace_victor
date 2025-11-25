import React, { useEffect, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import { useAuth } from "../context/AuthContext";
import styles from "./Agendar.module.css";

function formatDateInput(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

export default function Agendar({ onNavigate }) {
  const { patient, token, isAdmin } = useAuth();
  const [date, setDate] = useState(() => formatDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [available, setAvailable] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDoctors() {
      try {
        const resp = await fetch("/api/doctors");
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && Array.isArray(data.doctors)) {
          setDoctors(data.doctors);
          if (data.doctors.length > 0) {
            setSelectedDoctor(data.doctors[0].id);
          }
        }
      } catch (_) {
        /* ignore */
      }
    }
    loadDoctors();
  }, []);

  useEffect(() => {
    async function loadAvailable() {
      if (!selectedDoctor) return;
      setLoading(true);
      setError("");
      setMessage("");
      setSelectedTime("");
      try {
        const resp = await fetch(`/api/appointments/available?date=${date}&doctor_id=${selectedDoctor}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data.message || "Falha ao carregar horários.");
        }
        setAvailable(data.available_times || []);
      } catch (err) {
        setError(err.message || "Falha ao carregar horários.");
        setAvailable([]);
      } finally {
        setLoading(false);
      }
    }

    async function loadTypes() {
      if (!selectedDoctor) return;
      try {
        const resp = await fetch(`/api/consultation-types?doctor_id=${selectedDoctor}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data.message || "Falha ao carregar tipos.");
        }
        setTypes(data.types || []);
        if ((data.types || []).length > 0) {
          setSelectedType((data.types || [])[0].id);
        }
      } catch (err) {
        setError(err.message || "Falha ao carregar tipos.");
        setTypes([]);
      }
    }

    loadAvailable();
    loadTypes();
  }, [date, token, selectedDoctor]);

  useEffect(() => {
    async function loadPatients() {
      if (!isAdmin) return;
      setLoadingPatients(true);
      try {
        const params = new URLSearchParams();
        params.append("limit", 50);
        if (patientSearch) params.append("search", patientSearch);
        const resp = await fetch(`/api/admin/patients?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) {
          setPatientOptions(data.patients || []);
          if (!selectedPatientId && (data.patients || []).length > 0) {
            setSelectedPatientId(data.patients[0].id);
          }
        }
      } catch (_) {
        setPatientOptions([]);
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, [isAdmin, patientSearch, token, selectedPatientId]);

  const handleBook = async () => {
    if (!selectedDoctor) {
      setError("Selecione um médico.");
      return;
    }
    if (isAdmin && !selectedPatientId) {
      setError("Selecione um paciente.");
      return;
    }
    if (!selectedTime) {
      setError("Selecione um horário.");
      return;
    }
    if (!selectedType) {
      setError("Selecione um tipo de consulta.");
      return;
    }
    setBooking(true);
    setError("");
    setMessage("");
    try {
      const resp = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patient_id: isAdmin ? selectedPatientId : patient?.id,
          doctor_id: selectedDoctor,
          type_id: selectedType,
          date,
          time: selectedTime,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.message || "Não foi possível agendar.");
      }
      setMessage("Consulta agendada com sucesso.");
      setSelectedTime("");
      onNavigate("minha-agenda");
    } catch (err) {
      setError(err.message || "Não foi possível agendar.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <p className={styles.badge}>Agendamento online</p>
            <h1 className={styles.title}>Agendar consulta</h1>
            <p className={styles.lead}>Escolha a melhor data, médico e tipo de atendimento para você.</p>
          </header>

          <section className={styles.grid}>
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Dados do agendamento</h2>
                  <p className={styles.muted}>Selecione a data, médico e tipo de consulta.</p>
                </div>
              </div>
              <div className={styles.inputs}>
                <label className={styles.field} htmlFor="date">
                  Data
                  <input
                    id="date"
                    type="date"
                    value={date}
                    min={formatDateInput(new Date())}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label className={styles.field} htmlFor="doctor">
                  Médico
                  <select
                    id="doctor"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(Number(e.target.value))}
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} {doc.specialty ? `- ${doc.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field} htmlFor="type">
                  Tipo de consulta
                  <select
                    id="type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(Number(e.target.value))}
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.duration} min)
                      </option>
                    ))}
                  </select>
                </label>
                {isAdmin && (
                  <>
                    <label className={styles.field} htmlFor="patientSearch">
                      Buscar paciente
                      <input
                        id="patientSearch"
                        type="text"
                        placeholder="Nome, e-mail ou telefone"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </label>
                    <label className={styles.field} htmlFor="patient">
                      Selecionar paciente
                      <select
                        id="patient"
                        value={selectedPatientId || ""}
                        onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                        disabled={loadingPatients}
                      >
                        {patientOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {p.email}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </div>
              <div className={styles.statusRow}>
                {loading && <p className={styles.muted}>Carregando horários...</p>}
                {loadingPatients && isAdmin && <p className={styles.muted}>Carregando pacientes...</p>}
                {error && <p className={styles.error}>{error}</p>}
                {message && <p className={styles.success}>{message}</p>}
              </div>
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <p className={styles.label}>Data</p>
                  <p className={styles.value}>{formatDateDisplay(date)}</p>
                </div>
                <div className={styles.summaryRow}>
                  <p className={styles.label}>Médico</p>
                  <p className={styles.value}>
                    {doctors.find((d) => d.id === selectedDoctor)?.name || "Selecione o médico"}
                  </p>
                </div>
                <div className={styles.summaryRow}>
                  <p className={styles.label}>Especialidade</p>
                  <p className={styles.value}>
                    {doctors.find((d) => d.id === selectedDoctor)?.specialty || "--"}
                  </p>
                </div>
                {isAdmin && (
                  <div className={styles.summaryRow}>
                    <p className={styles.label}>Paciente</p>
                    <p className={styles.value}>
                      {patientOptions.find((p) => p.id === selectedPatientId)?.name || "Selecione o paciente"}
                    </p>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <p className={styles.label}>Tipo</p>
                  <p className={styles.value}>
                    {types.find((t) => t.id === selectedType)?.name || "Selecione o tipo"}
                  </p>
                </div>
                <div className={styles.summaryRow}>
                  <p className={styles.label}>Horário</p>
                  <p className={styles.value}>{selectedTime || "Selecione um horário"}</p>
                </div>
              </div>
            </article>
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Confirmar</h2>
                  <p className={styles.muted}>Confira os dados e finalize.</p>
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={handleBook}
                  disabled={booking || !selectedTime || !selectedType || !selectedDoctor}
                >
                  {booking ? "Agendando..." : "Confirmar agendamento"}
                </button>
                <button type="button" className={styles.ghost} onClick={() => onNavigate("minha-agenda")}>
                  Ir para minha agenda
                </button>
              </div>
            </article>
          </section>

          <section className={styles.slotsCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Horários disponíveis</h2>
                <p className={styles.muted}>Escolha um horário para a data e médico selecionados.</p>
              </div>
            </div>
            {!loading && !error && available.length === 0 && (
              <div className={styles.empty}>Nenhum horário disponível para esta data.</div>
            )}
            {loading && <p className={styles.muted}>Carregando horários...</p>}
            {error && <p className={styles.error}>{error}</p>}
            {!loading && !error && available.length > 0 && (
              <div className={styles.slotsGrid}>
                {available.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`${styles.slot} ${selectedTime === time ? styles.slotActive : ""}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </ProtectedPage>
  );
}
