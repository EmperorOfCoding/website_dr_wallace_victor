import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../App";
import ProtectedPage from "../components/ProtectedPage";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import DoctorProfile from "./DoctorProfile";
import styles from "./Perfil.module.css";

export default function Perfil({ onNavigate }) {
  const { patient, token, isAdmin } = useAuth();
  
  // Route to doctor profile if user is admin (doctor)
  if (isAdmin) {
    return <DoctorProfile onNavigate={onNavigate} />;
  }
  
  // Patient profile below
  const { darkMode, toggleTheme } = useTheme();
  const [form, setForm] = useState({
    phone: "",
    birthdate: "",
    emergency_name: "",
    emergency_phone: "",
    allergies: "",
    notes: "",
    contact_preference: "whatsapp",
    reminders_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const displayName = useMemo(() => patient?.name || "Paciente", [patient]);

  useEffect(() => {
    loadProfile();
  }, [patient?.id, token]);

  const loadProfile = async () => {
    if (!patient?.id || !token) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.profile) {
        setForm((prev) => ({
          ...prev,
          phone: data.profile.phone || patient?.phone || "",
          birthdate: data.profile.birthdate?.split("T")[0] || "",
          emergency_name: data.profile.emergency_name || "",
          emergency_phone: data.profile.emergency_phone || "",
          allergies: data.profile.allergies || "",
          notes: data.profile.notes || "",
          contact_preference: data.profile.contact_preference || "whatsapp",
          reminders_enabled: data.profile.reminders_enabled !== false,
        }));
      } else if (patient?.phone) {
        setForm((prev) => ({ ...prev, phone: patient.phone }));
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = field === "reminders_enabled" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatus("");
    setError("");
  };

  const handleSave = async () => {
    if (!patient || !token) {
      setError("É necessário estar autenticado para salvar.");
      return;
    }
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const resp = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setStatus("Perfil atualizado com sucesso!");
      } else {
        setError(data.message || "Erro ao salvar perfil.");
      }
    } catch (err) {
      setError("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async () => {
    // Calculate the new theme value BEFORE updating state
    // Since React state updates are asynchronous, we need to use the current value
    const newDarkMode = !darkMode;

    // Update UI state
    toggleTheme();

    // Save to backend with the calculated new value
    try {
      await fetch(`${API_BASE_URL}/api/profile/theme`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dark_mode: newDarkMode }),
      });
    } catch (err) {
      // Silent fail for theme preference
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
                <button type="button" className={styles.secondary} onClick={() => onNavigate("documentos")}>
                  📄 Meus documentos
                </button>
              </div>
            </div>
            <motion.div
              className={styles.summaryCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
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
                    {form.contact_preference === "whatsapp" ? "WhatsApp" : "E-mail"}
                  </p>
                </div>
                <span className={styles.tag}>{form.reminders_enabled ? "Lembretes ativos" : "Lembretes desativados"}</span>
              </div>
              <p className={styles.muted}>Seus dados são armazenados com segurança.</p>
            </motion.div>
          </header>

          {loading && <div className={styles.loading}>Carregando perfil...</div>}

          {!loading && (
            <div className={styles.grid}>
              <motion.section
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.badge}>Contato e saúde</p>
                    <h2 className={styles.cardTitle}>Dados principais</h2>
                    <p className={styles.muted}>Atualize telefone, preferências de contato e observações importantes.</p>
                  </div>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar perfil"}
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
                  <label className={styles.field} htmlFor="contact_preference">
                    Preferência de contato
                    <select
                      id="contact_preference"
                      value={form.contact_preference}
                      onChange={handleChange("contact_preference")}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">E-mail</option>
                    </select>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={form.reminders_enabled}
                      onChange={handleChange("reminders_enabled")}
                    />
                    Receber lembretes de consultas
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
                  <label className={styles.field} htmlFor="emergency_name">
                    Contato de emergência
                    <input
                      id="emergency_name"
                      type="text"
                      value={form.emergency_name}
                      onChange={handleChange("emergency_name")}
                      placeholder="Nome do responsável"
                    />
                  </label>
                  <label className={styles.field} htmlFor="emergency_phone">
                    Telefone do contato
                    <input
                      id="emergency_phone"
                      type="tel"
                      value={form.emergency_phone}
                      onChange={handleChange("emergency_phone")}
                      placeholder="(00) 00000-0000"
                    />
                  </label>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                {status && <p className={styles.success}>{status}</p>}
              </motion.section>

              <motion.section
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.badge}>Aparência</p>
                    <h2 className={styles.cardTitle}>Preferências de exibição</h2>
                    <p className={styles.muted}>Personalize a aparência do sistema.</p>
                  </div>
                </div>
                <div className={styles.themeSection}>
                  <div className={styles.themeOption}>
                    <div>
                      <p className={styles.themeTitle}>Modo escuro</p>
                      <p className={styles.themeDesc}>
                        {darkMode ? "Tema escuro ativado" : "Tema claro ativado"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`${styles.themeToggle} ${darkMode ? styles.active : ""}`}
                      onClick={handleThemeChange}
                      aria-label="Alternar tema"
                    >
                      <span className={styles.toggleTrack}>
                        <span className={styles.toggleThumb}></span>
                      </span>
                    </button>
                  </div>
                </div>
              </motion.section>

              <motion.section
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
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
              </motion.section>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
