import React from 'react';
import styles from './Home.module.css';

export default function Home({ onNavigate }) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>Cuidado médico confiável e próximo de você</h1>
            <p className={styles.heroText}>
              Dr. Wallace Victor oferece acompanhamento em clínica geral, medicina da família e atendimento de urgência,
              com foco em prevenção, acolhimento e segurança em cada consulta.
            </p>
            <div className={styles.ctaRow}>
              <button type="button" className={styles.cta} onClick={() => onNavigate('servicos')}>
                Ver serviços
              </button>
              <button type="button" className={`${styles.cta} ${styles.secondary}`} onClick={() => onNavigate('contato')}>
                Falar com a clínica
              </button>
            </div>
            <div className={styles.pillRow}>
              <span className={styles.pill}>Clínica Geral</span>
              <span className={styles.pill}>Medicina da Família</span>
              <span className={styles.pill}>Urgência e Emergência</span>
            </div>
          </div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Por que escolher a clínica</h3>
            <div className={styles.features}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🩺</div>
                <div>
                  <h4>Acompanhamento integral</h4>
                  <p>Cuidado contínuo para você e sua família, com planos de prevenção e monitoramento personalizado.</p>
                </div>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>⏱</div>
                <div>
                  <h4>Agenda organizada</h4>
                  <p>Horários claros e agendamento online para facilitar a sua rotina.</p>
                </div>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>💬</div>
                <div>
                  <h4>Escuta ativa</h4>
                  <p>Consulta humanizada, com atenção às suas necessidades clínicas e emocionais.</p>
                </div>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🔒</div>
                <div>
                  <h4>Segurança e confidencialidade</h4>
                  <p>Processos e tecnologia para manter seus dados e seu cuidado em segurança.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
