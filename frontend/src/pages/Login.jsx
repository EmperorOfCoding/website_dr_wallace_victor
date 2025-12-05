import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setStatus("");
    setError("");

    try {
      const endpoint = isAdminMode ? "/api/admin/login" : "/api/auth/login";
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: Send cookies automatically
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Falha no login.");
      }

      console.log('[Login] Login successful, response data:', {
        isAdminMode,
        hasAdmin: !!data.admin,
        hasPatient: !!data.patient,
        adminRole: data.admin?.role,
        responseStatus: response.status
      });

      // Verify we have user data before login and pass correct structure to AuthContext
      if (isAdminMode && data.admin) {
        // Admin login: pass admin data as 'admin' property
        console.log('[Login] Calling login() for admin with data:', {
          id: data.admin.id,
          name: data.admin.name,
          role: data.admin.role,
          doctor_id: data.admin.doctor_id
        });

        login({ 
          admin: data.admin,
        });
      } else if (!isAdminMode && data.patient) {
        // Patient login: pass patient data as 'patient' property
        console.log('[Login] Calling login() for patient with data:', {
          id: data.patient.id,
          name: data.patient.name
        });

        login({ 
          patient: data.patient,
        });
      } else {
        throw new Error("Erro: dados do usuário não encontrados na resposta.");
      }
      
      setStatus("Login realizado com sucesso.");
      
      console.log('[Login] Waiting before navigation...', {
        isAdminMode,
        targetRoute: isAdminMode ? 'painel-medico' : 'dashboard',
        timestamp: new Date().toISOString()
      });

      // Increased delay for mobile browsers to ensure state updates complete
      setTimeout(() => {
        console.log('[Login] Navigating to:', isAdminMode ? 'painel-medico' : 'dashboard');
        if (isAdminMode) {
          onNavigate("painel-medico");
        } else {
          onNavigate("dashboard");
        }
      }, 200);
    } catch (err) {
      setError(err.message || "Erro ao conectar com o servidor.");
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRecover(e) {
    e.preventDefault();
    if (!email) {
      setError("Digite seu e-mail para recuperar a senha.");
      return;
    }
    setStatus("Enviando...");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/recover-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível enviar o e-mail.");
      }

      setStatus("Enviamos um link de recuperação para o seu e-mail.");
    } catch (err) {
      setError(err.message || "Não foi possível enviar o e-mail.");
    } finally {
      setRecovering(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>
            {recovering ? "Recuperar Senha" : "Bem-vindo de volta"}
          </h1>
          <p className={styles.subtitle}>
            {recovering 
              ? "Digite seu e-mail para receber o link de recuperação"
              : isAdminMode
              ? "Acesse para gerenciar agenda e pacientes."
              : "Agende consultas e acompanhe seus horários."}
          </p>
        </div>
        
        {!recovering && (
          <div className={styles.toggleContainer}>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={isAdminMode}
                onChange={(e) => setIsAdminMode(e.target.checked)}
                aria-label="Alternar modo médico"
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleText}>Sou médico</span>
            </label>
          </div>
        )}

        <form onSubmit={recovering ? handleRecover : handleSubmit} className={styles.form}>
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
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {!recovering && (
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
                  type={showPassword ? "text" : "password"}
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
            </div>
          )}

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

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className={styles.spinner} viewBox="0 0 24 24">
                  <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{recovering ? "Enviando..." : "Entrando..."}</span>
              </>
            ) : (
              <span>{recovering ? "Enviar Link" : "Entrar"}</span>
            )}
          </button>
        </form>

        <div className={styles.links}>
          {!recovering && (
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setRecovering(true);
                setError("");
                setStatus("");
              }}
            >
              Esqueci minha senha
            </button>
          )}
          
          {recovering && (
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setRecovering(false);
                setError("");
                setStatus("");
              }}
            >
              ← Voltar para Login
            </button>
          )}
          
          {!recovering && !isAdminMode && (
            <p className={styles.registerText}>
              Ainda não tem conta?{" "}
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => onNavigate("cadastro")}
              >
                Cadastre-se
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
