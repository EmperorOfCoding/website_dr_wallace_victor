import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao autenticar.');
      }

      const data = await response.json();
      login({ token: data.token, patient: data.patient });
      setStatus('Login realizado com sucesso.');
      onNavigate('home');
    } catch (err) {
      setError(err.message || 'Erro ao autenticar.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Acessar minha conta</h1>
        <p className={styles.subtitle}>Agende consultas e acompanhe seus horários.</p>
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
        </form>
      </div>
    </div>
  );
}
