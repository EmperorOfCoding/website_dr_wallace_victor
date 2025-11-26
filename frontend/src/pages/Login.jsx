import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    const endpoint = isAdminMode ? "/api/admin/login" : "/api/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Falha ao autenticar.");
      }

      const userPayload = data.patient || data.admin || data.user;
      login({ token: data.token, patient: userPayload });
      setStatus("Login realizado com sucesso.");
      if (isAdminMode) {
        onNavigate("admin");
      } else {
        onNavigate("dashboard");
      }
    } catch (err) {
      setError(err.message || "Erro ao autenticar.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Informe o e-mail para recuperar a senha.");
      return;
    }
    setError("");
    setStatus("");
    setRecovering(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
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
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Acessar minha conta</h1>
          <label className={styles.switchLabel}>
            <input
              type="checkbox"
              checked={isAdminMode}
              onChange={(e) => setIsAdminMode(e.target.checked)}
            />
            <span>Sou administrador</span>
          </label>
        </div>
        <p className={styles.subtitle}>
          {isAdminMode
            ? "Acesse para gerenciar agenda e pacientes."
            : "Agende consultas e acompanhe seus horários."}
        </p>
        <form onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="email">
            E-mail
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </label>
          <label className={styles.label} htmlFor="password">
            Senha
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          {status && <p className={styles.status}>{status}</p>}
          <button className={styles.button} type="submit">
            Entrar
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
              onClick={() => onNavigate("cadastro")}
            >
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
