import React, { useEffect, useMemo, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import { useAuth } from "../context/AuthContext";
import styles from "./Perfil.module.css";

const STORAGE_KEY = "patient_profile_preferences";

function buildStorageKey(patientId) {
  return `${STORAGE_KEY}_${patientId || "anon"}`;
}

export default function Perfil({ onNavigate }) {
  const { patient } = useAuth();
  const [form, setForm] = useState({
    phone: "",
    birthdate: "",
    emergencyName: "",
    emergencyPhone: "",
    allergies: "",
    notes: "",
    contactPreference: "whatsapp",
    reminders: true,
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const displayName = useMemo(() => patient?.name || "Paciente", [patient]);

  useEffect(() => {
    if (!patient) return;
    const cached = localStorage.getItem(buildStorageKey(patient.id));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch (_) {
        // ignora se o cache estiver inválido
      }
    } else if (patient?.phone) {
      setForm((prev) => ({ ...prev, phone: patient.phone }));
    }
  }, [patient?.id]);

  const handleChange = (field) => (event) => {
    const value = field === "reminders" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatus("");
    setError("");
  };

  const handleSave = () => {
    if (!patient) {
      setError("É necessário estar autenticado para salvar.");
      return;
    }
    try {
      localStorage.setItem(buildStorageKey(patient.id), JSON.stringify(form));
      setStatus("Preferências salvas para este perfil.");
    } catch (_) {
      setError("Não foi possível salvar as preferências.");
    }
  };

  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <div>
              <p className={styles.badge}>Conta do paciente</p>
              <h1 className={styles.title}>Olá, {displayName}</h1>
              <p className={styles.lead}>
                Revise seus dados, ajuste preferências de contato e mantenha informações de segurança sempre atualizadas.
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={() => onNavigate("agendar")}>
                  Agendar consulta
                </button>
                <button type="button" className={styles.secondary} onClick={() => onNavigate("minha-agenda")}>
                  Ver minha agenda
                </button>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <div>
                  <p className={styles.summaryLabel}>E-mail</p>
                  <p className={styles.summaryValue}>{patient?.email || "Não informado"}</p>
                </div>
              </div>
              <div className={styles.summaryRow}>
                <div>
                  <p className={styles.summaryLabel}>Telefone</p>
                  <p className={styles.summaryValue}>{form.phone || "Adicionar número"}</p>
                </div>
              </div>
              <div className={styles.summaryRow}>
                <div>
                  <p className={styles.summaryLabel}>Preferência de contato</p>
                  <p className={styles.summaryValue}>
                    {form.contactPreference === "whatsapp" ? "WhatsApp" : "E-mail"}
                  </p>
                </div>
                <span className={styles.tag}>{form.reminders ? "Lembretes ativos" : "Lembretes desativados"}</span>
              </div>
              <p className={styles.muted}>Somente você vê estes dados. Salvos localmente neste dispositivo.</p>
            </div>
          </header>

          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.badge}>Contato e saúde</p>
                  <h2 className={styles.cardTitle}>Dados principais</h2>
                  <p className={styles.muted}>Atualize telefone, preferências de contato e observações importantes.</p>
                </div>
                <button type="button" className={styles.primary} onClick={handleSave}>
                  Salvar preferências
                </button>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="phone">
                  Telefone
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    placeholder="(00) 00000-0000"
                  />
                </label>
                <label className={styles.field} htmlFor="birthdate">
                  Data de nascimento
                  <input
                    id="birthdate"
                    type="date"
                    value={form.birthdate}
                    onChange={handleChange("birthdate")}
                  />
                </label>
                <label className={styles.field} htmlFor="contactPreference">
                  Preferência de contato
                  <select
                    id="contactPreference"
                    value={form.contactPreference}
                    onChange={handleChange("contactPreference")}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                  </select>
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={form.reminders}
                    onChange={handleChange("reminders")}
                  />
                  Receber lembretes de consultas e exames
                </label>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="allergies">
                  Alergias e alertas
                  <textarea
                    id="allergies"
                    rows={3}
                    value={form.allergies}
                    onChange={handleChange("allergies")}
                    placeholder="Descreva alergias, condições crônicas ou medicações relevantes."
                  />
                </label>
                <label className={styles.field} htmlFor="notes">
                  Observações
                  <textarea
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={handleChange("notes")}
                    placeholder="Informações adicionais que ajudem no atendimento."
                  />
                </label>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.field} htmlFor="emergencyName">
                  Contato de emergência
                  <input
                    id="emergencyName"
                    type="text"
                    value={form.emergencyName}
                    onChange={handleChange("emergencyName")}
                    placeholder="Nome do responsável"
                  />
                </label>
                <label className={styles.field} htmlFor="emergencyPhone">
                  Telefone do contato
                  <input
                    id="emergencyPhone"
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={handleChange("emergencyPhone")}
                    placeholder="(00) 00000-0000"
                  />
                </label>
              </div>
              {error && <p className={styles.error}>{error}</p>}
              {status && <p className={styles.success}>{status}</p>}
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.badge}>Segurança</p>
                  <h2 className={styles.cardTitle}>Dados da conta</h2>
                  <p className={styles.muted}>Reveja informações chave e acesse ações rápidas.</p>
                </div>
              </div>
              <div className={styles.accountInfo}>
                <div>
                  <p className={styles.summaryLabel}>Nome completo</p>
                  <p className={styles.summaryValue}>{patient?.name || "Atualize seus dados"}</p>
                </div>
                <div>
                  <p className={styles.summaryLabel}>E-mail</p>
                  <p className={styles.summaryValue}>{patient?.email || "Não informado"}</p>
                </div>
                <div>
                  <p className={styles.summaryLabel}>ID do paciente</p>
                  <p className={styles.summaryValue}>{patient?.id ?? "--"}</p>
                </div>
              </div>
              <div className={styles.actionsRow}>
                <button type="button" className={styles.secondary} onClick={() => onNavigate("agendar")}>
                  Agendar nova consulta
                </button>
                <button type="button" className={styles.secondary} onClick={() => onNavigate("minha-agenda")}>
                  Ver minha agenda
                </button>
              </div>
              <p className={styles.muted}>
                Caso precise atualizar e-mail ou senha, solicite suporte via "Esqueceu a senha?" na tela de login.
              </p>
            </section>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
