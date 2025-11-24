import React from 'react';
import styles from './Sobre.module.css';

const formacao = [
  'Residência em Medicina de Família e Comunidade (USP) – enfoque em cuidado integral',
  'Especialização em Clínica Médica – protocolos atualizados e medicina baseada em evidências',
  'Certificação em Atendimento de Urgência e Emergência',
  'Atualizações contínuas em telemedicina e saúde digital'
];

const experiencias = [
  {
    titulo: 'Clínica Geral e Preventiva',
    texto: 'Acompanhamento longitudinal de adultos e idosos, com foco em prevenção, controle de doenças crônicas e promoção de qualidade de vida.'
  },
  {
    titulo: 'Medicina da Família',
    texto: 'Atendimento centrado na pessoa e na família, integrando aspectos clínicos, sociais e emocionais em planos de cuidado compartilhados.'
  },
  {
    titulo: 'Urgência e Emergência',
    texto: 'Experiência em pronto atendimento e estabilização clínica, garantindo segurança e agilidade em situações críticas.'
  }
];

export default function Sobre() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.photoCard}>
            <img src="/wallace.jpg" alt="Foto do Dr. Wallace Victor" />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Sobre o Médico</span>
            <h1 className={styles.title}>Dr. Wallace Victor</h1>
            <p className={styles.subtitle}>Clínica Geral • Medicina da Família • Urgência e Emergência</p>
            <p className={styles.bio}>
              Médico dedicado a oferecer cuidado humanizado e baseado em evidências, com atuação em clínica geral,
              medicina da família e atendimento de urgência. Integra tecnologia, escuta ativa e acompanhamento próximo
              para construir planos de cuidado personalizados para cada paciente.
            </p>
          </div>
        </section>

        <section className={styles.infoGrid}>
          <article className={styles.card}>
            <h3>Formação Acadêmica</h3>
            <ul className={styles.list}>
              {formacao.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className={styles.card}>
            <h3>Experiência Clínica</h3>
            <div className={styles.experienceGrid}>
              {experiencias.map((exp) => (
                <div key={exp.titulo} className={styles.experienceItem}>
                  <h4>{exp.titulo}</h4>
                  <p>{exp.texto}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <div className={styles.ctaWrapper}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => {
              window.location.href = '/agendar';
            }}
          >
            Agendar consulta
          </button>
        </div>
      </div>
    </div>
  );
}
