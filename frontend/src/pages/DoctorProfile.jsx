import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "../App";
import ProtectedPage from "../components/ProtectedPage";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import styles from "./Perfil.module.css";

export default function DoctorProfile({ onNavigate }) {
  const { patient, token } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDoctorProfile();
  }, [patient?.id, token]);

  const loadDoctorProfile = async () => {
    if (!patient?.id || !token) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/doctors/profile`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.doctor) {
        setForm({
          name: data.doctor.name || "",
          email: data.doctor.email || "",
          phone: data.doctor.phone || "",
          specialty: data.doctor.specialty || "",
          bio: data.doctor.bio || "",
        });
      } else {
        // Fallback to patient data (which is actually doctor data in admin context)
        setForm({
          name: patient?.name || "",
          email: patient?.email || "",
          phone: patient?.phone || "",
          specialty: "",
          bio: "",
        });
      }
    } catch (err) {
      console.error("Error loading doctor profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
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
      const resp = await fetch(`${API_BASE_URL}/api/doctors/profile`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: form.phone,
          specialty: form.specialty,
          bio: form.bio,
        }),
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
    const newDarkMode = !darkMode;
    toggleTheme();
    
    try {
      await fetch(`${API_BASE_URL}/api/profile/theme`, {
        method: "PUT",
        credentials: 'include',
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
              <p className={styles.badge}>Perfil Médico</p>
              <h1 className={styles.title}>Dr(a). {form.name || "Médico"}</h1>
              <p className={styles.lead}>
                Gerencie suas informações profissionais, especialidade e biografia que serão exibidas aos pacientes.
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={() => onNavigate("painel-medico")}>
                  Painel administrativo
                </button>
                <button type="button" className={styles.secondary} onClick={() => onNavigate("painel-medico-agenda")}>
                  Ver agenda
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
                  <p className={styles.summaryValue}>{form.email || "Não informado"}</p>
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
                  <p className={styles.summaryLabel}>Especialidade</p>
                  <p className={styles.summaryValue}>{form.specialty || "Não informada"}</p>
                </div>
              </div>
              <p className={styles.muted}>Seus dados profissionais são visíveis aos pacientes.</p>
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
                    <p className={styles.badge}>Informações Profissionais</p>
                    <h2 className={styles.cardTitle}>Dados do médico</h2>
                    <p className={styles.muted}>Atualize suas informações profissionais e de contato.</p>
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
                  <label className={styles.field} htmlFor="specialty">
                    Especialidade
                    <input
                      id="specialty"
                      type="text"
                      value={form.specialty}
                      onChange={handleChange("specialty")}
                      placeholder="Ex: Cardiologia, Pediatria, Clínico Geral"
                    />
                  </label>
                </div>
                <div className={styles.formGrid}>
                  <label className={styles.field} htmlFor="bio">
                    Biografia Profissional
                    <textarea
                      id="bio"
                      rows={5}
                      value={form.bio}
                      onChange={handleChange("bio")}
                      placeholder="Descreva sua formação, experiência e áreas de atuação. Esta informação será exibida aos pacientes."
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
                    <p className={styles.badge}>Conta</p>
                    <h2 className={styles.cardTitle}>Informações da conta</h2>
                    <p className={styles.muted}>Dados de acesso e identificação.</p>
                  </div>
                </div>
                <div className={styles.accountInfo}>
                  <div>
                    <p className={styles.summaryLabel}>Nome completo</p>
                    <p className={styles.summaryValue}>{form.name || "Não informado"}</p>
                  </div>
                  <div>
                    <p className={styles.summaryLabel}>E-mail</p>
                    <p className={styles.summaryValue}>{form.email || "Não informado"}</p>
                  </div>
                  <div>
                    <p className={styles.summaryLabel}>ID do médico</p>
                    <p className={styles.summaryValue}>{patient?.id ?? "--"}</p>
                  </div>
                </div>
                <div className={styles.actionsRow}>
                  <button type="button" className={styles.secondary} onClick={() => onNavigate("painel-medico-agenda")}>
                    Gerenciar agenda
                  </button>
                  <button type="button" className={styles.secondary} onClick={() => onNavigate("painel-medico-pacientes")}>
                    Ver pacientes
                  </button>
                </div>
                <p className={styles.muted}>
                  Para alterar e-mail ou senha, entre em contato com o suporte técnico.
                </p>
              </motion.section>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
