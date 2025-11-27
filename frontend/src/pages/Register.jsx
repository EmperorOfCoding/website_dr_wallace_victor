import { useState } from "react";
import styles from "./Register.module.css";

export default function Register({ onNavigate }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [recoverMessage, setRecoverMessage] = useState("");
  const [recovering, setRecovering] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError("");
    setStatus("");
    setRecoverMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setRecoverMessage("");

    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("Preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setTimeout(() => onNavigate("login"), 1200);
    } catch (err) {
      setError(err.message || "Erro ao cadastrar.");
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
      const response = await fetch("/api/auth/forgot-password", {
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

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cadastro do Paciente</h1>
        <p className={styles.subtitle}>Crie sua conta para agendar consultas e acompanhar sua agenda.</p>
        <form onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="name">
            Nome completo
            <input
              id="name"
              className={styles.input}
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Seu nome"
            />
          </label>
          <label className={styles.label} htmlFor="email">
            E-mail
            <input
              id="email"
              className={styles.input}
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="email@exemplo.com"
            />
          </label>
          <label className={styles.label} htmlFor="phone">
            Telefone
            <input
              id="phone"
              className={styles.input}
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="(00) 00000-0000"
            />
          </label>
          <label className={styles.label} htmlFor="password">
            Senha
            <input
              id="password"
              className={styles.input}
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="Crie uma senha"
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          {status && <p className={styles.status}>{status}</p>}
          {recoverMessage && <p className={styles.status}>{recoverMessage}</p>}
          <button className={styles.button} type="submit">
            Cadastrar
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
