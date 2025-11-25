import React, { useState } from 'react';
import styles from './Contato.module.css';

const initialState = { nome: '', email: '', mensagem: '' };

export default function Contato() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const validate = () => {
    const nextErrors = {};
    if (!form.nome.trim()) nextErrors.nome = 'Nome é obrigatório.';
    if (!form.email.trim()) {
      nextErrors.email = 'E-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'E-mail inválido.';
    }
    if (!form.mensagem.trim()) nextErrors.mensagem = 'Mensagem é obrigatória.';
    return nextErrors;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      setSuccess('');
      return;
    }
    setSuccess('Sua mensagem foi enviada!');
    setForm(initialState);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Entre em contato</h1>
          <p className={styles.subtitle}>
            Estamos aqui para ajudar. Entre em contato para tirar dúvidas, solicitar informações ou marcar uma consulta.
          </p>
        </header>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.icon}>☎</div>
                <div>
                  <p className={styles.infoTitle}>Telefone</p>
                  <p className={styles.infoText}>(00) 00000-0000</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.icon}>💬</div>
                <div>
                  <p className={styles.infoTitle}>WhatsApp</p>
                  <p className={styles.infoText}>Fale direto com a clínica</p>
                  <a
                    className={styles.whatsappBtn}
                    href="https://wa.me/550000000000"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir WhatsApp
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.icon}>✉</div>
                <div>
                  <p className={styles.infoTitle}>E-mail</p>
                  <p className={styles.infoText}>contato@drwallace.com</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.icon}>📍</div>
                <div>
                  <p className={styles.infoTitle}>Endereço</p>
                  <p className={styles.infoText}>Rua Exemplo, 123 – Centro, Salvador – BA</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.label} htmlFor="nome">
                Nome
                <input
                  id="nome"
                  className={styles.input}
                  type="text"
                  value={form.nome}
                  onChange={handleChange('nome')}
                  placeholder="Seu nome"
                />
                {errors.nome && <p className={styles.error}>{errors.nome}</p>}
              </label>

              <label className={styles.label} htmlFor="email">
                E-mail
                <input
                  id="email"
                  className={styles.input}
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="contato@exemplo.com"
                />
                {errors.email && <p className={styles.error}>{errors.email}</p>}
              </label>

              <label className={styles.label} htmlFor="mensagem">
                Mensagem
                <textarea
                  id="mensagem"
                  className={styles.textarea}
                  value={form.mensagem}
                  onChange={handleChange('mensagem')}
                  placeholder="Escreva sua mensagem"
                />
                {errors.mensagem && <p className={styles.error}>{errors.mensagem}</p>}
              </label>

              <button type="submit" className={styles.submit}>
                Enviar mensagem
              </button>
              {success && <p className={styles.success}>{success}</p>}
            </form>
          </section>
        </div>

        <div className={styles.mapWrapper}>
          <iframe
            title="Mapa da clínica"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3838.0245937398725!2d-38.501!3d-12.9718!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sClinica%20Exemplo!5e0!3m2!1spt-BR!2sbr!4v0000000000"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
