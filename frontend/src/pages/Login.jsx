import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Entrando...");
    setError("");

    try {
      const endpoint = isAdminMode ? "/api/admin/login" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Falha no login.");
      }

      let userPayload = null;
      if (data.token) {
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          userPayload = payload;
        } catch (e) {
          console.error("Error decoding token", e);
        }
      }

      // Use patient data from response if available, otherwise fallback to token payload
      const patientData = data.patient || userPayload;
      
      login({ token: data.token, patient: patientData });
      setStatus("Login realizado com sucesso.");
      if (isAdminMode) {
        onNavigate("painel-medico");
      } else {
        onNavigate("dashboard");
      }
    } catch (err) {
      setError(err.message || "Erro ao conectar com o servidor.");
      setStatus("");
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
      const response = await fetch("/api/auth/recover-password", {
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
        <h1 className={styles.title}>
          {recovering ? "Recuperar Senha" : "Bem-vindo de volta"}
        </h1>
        
        <div className={styles.toggleContainer}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={isAdminMode}
              onChange={(e) => setIsAdminMode(e.target.checked)}
            />
            <span>Sou médico</span>
          </label>
        </div>
        <p className={styles.subtitle}>
          {isAdminMode
            ? "Acesse para gerenciar agenda e pacientes."
            : "Agende consultas e acompanhe seus horários."}
        </p>
        <form onSubmit={recovering ? handleRecover : handleSubmit}>
          <label className={styles.label} htmlFor="email">
            E-mail
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {!recovering && (
            <label className={styles.label} htmlFor="password">
              Senha
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          )}

          {error && <p className={styles.error}>{error}</p>}
          {status && <p className={styles.status}>{status}</p>}

          <button type="submit" className={styles.button}>
            {recovering ? "Enviar Link" : "Entrar"}
          </button>
        </form>

        <div className={styles.links}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              setRecovering(!recovering);
              setError("");
              setStatus("");
            }}
          >
            {recovering ? "Voltar para Login" : "Esqueci minha senha"}
          </button>
          
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
