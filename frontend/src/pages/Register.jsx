import { useState } from "react";
import { API_BASE_URL } from "../config";
import styles from "./Register.module.css";

export default function Register({ onNavigate }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [recoverMessage, setRecoverMessage] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);


  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    
    // Update password strength if password field changed
    if (field === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    setError("");
    setStatus("");
    setRecoverMessage("");
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setRecoverMessage("");
    setIsLoading(true);

    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("Preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Send cookies
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível cadastrar.");
      }


      setStatus("Cadastro realizado com sucesso! Faça login para acessar sua conta.");
      setForm({ name: "", email: "", phone: "", password: "" });
      setPasswordStrength(0);
      setIsLoading(false);
      setTimeout(() => onNavigate("login"), 1200);
    } catch (err) {
      setError(err.message || "Erro ao cadastrar.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      setError("Informe o e-mail para recuperar a senha.");
      return;
    }
    setError("");
    setRecoverMessage("");
    setRecovering(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível enviar o e-mail.");
      }

      setRecoverMessage("Enviamos um link de recuperação para o seu e-mail.");
    } catch (err) {
      setError(err.message || "Não foi possível enviar o e-mail.");
    } finally {
      setRecovering(false);
    }
  };


  // Get password strength color and label
  const getPasswordStrengthInfo = () => {
    if (passwordStrength === 0) return { color: "transparent", label: "" };
    if (passwordStrength < 40) return { color: "#ef4444", label: "Fraca" };
    if (passwordStrength < 70) return { color: "#f59e0b", label: "Média" };
    return { color: "#10b981", label: "Forte" };
  };

  const strengthInfo = getPasswordStrengthInfo();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Criar Conta</h1>
          <p className={styles.subtitle}>
            Cadastre-se para agendar consultas e acompanhar sua agenda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">
              Nome completo
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <input
                id="name"
                className={styles.input}
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Seu nome completo"
                autoComplete="name"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">
              E-mail
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="phone">
              Telefone
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <input
                id="phone"
                className={styles.input}
                type="tel"
                value={form.phone}
                onChange={handleChange("phone")}
                placeholder="(00) 00000-0000"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              Senha
            </label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <input
                id="password"
                className={styles.input}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange("password")}
                placeholder="Crie uma senha forte"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {form.password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${passwordStrength}%`,
                      backgroundColor: strengthInfo.color,
                    }}
                  />
                </div>
                {strengthInfo.label && (
                  <span className={styles.strengthLabel} style={{ color: strengthInfo.color }}>
                    {strengthInfo.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className={styles.alert} role="alert">
              <svg className={styles.alertIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className={styles.error}>{error}</p>
            </div>
          )}

          {status && (
            <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
              <svg className={styles.alertIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className={styles.status}>{status}</p>
            </div>
          )}

          {recoverMessage && (
            <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
              <svg className={styles.alertIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className={styles.status}>{recoverMessage}</p>
            </div>
          )}

          <button className={styles.button} type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className={styles.spinner} viewBox="0 0 24 24">
                  <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Cadastrando...</span>
              </>
            ) : (
              <span>Cadastrar</span>
            )}
          </button>

          <div className={styles.helperRow}>
            <button
              className={styles.link}
              type="button"
              onClick={handleForgotPassword}
              disabled={recovering}
            >
              {recovering ? "Enviando..." : "Esqueceu a senha?"}
            </button>
            <button
              className={styles.link}
              type="button"
              onClick={() => onNavigate("login")}
            >
              Já tenho conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
