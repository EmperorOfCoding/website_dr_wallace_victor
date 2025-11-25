import React from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./Home.module.css";

const consultPhotos = [
  {
    title: "Consulta de rotina",
    description: "Escuta ativa e orientação preventiva em família.",
    tone: "rgba(59,91,253,0.22)",
  },
  {
    title: "Acompanhamento infantil",
    description: "Cuidado próximo para crianças e responsáveis.",
    tone: "rgba(16,185,129,0.22)",
  },
  {
    title: "Atendimento de urgência",
    description: "Suporte rápido e seguro para situações inesperadas.",
    tone: "rgba(245,158,11,0.22)",
  },
];

export default function Home({ onNavigate }) {
  const { isAuthenticated } = useAuth();

  const handleAgendar = () => {
    if (isAuthenticated) {
      onNavigate("agendar");
    } else {
      onNavigate("login");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.badge}>Dr. Wallace Victor • CRM 123456</p>
            <h1 className={styles.heroTitle}>Cuidado médico confiável e próximo de você</h1>
            <p className={styles.heroText}>
              Clínica geral, medicina da família e atendimento de urgência com foco em prevenção, acolhimento e
              segurança em cada consulta.
            </p>
            <div className={styles.ctaRow}>
              <button type="button" className={styles.cta} onClick={() => onNavigate("servicos")}>
                Ver serviços
              </button>
              <button type="button" className={`${styles.cta} ${styles.secondary}`} onClick={handleAgendar}>
                Agendar consulta
              </button>
              <button type="button" className={`${styles.cta} ${styles.secondary}`} onClick={() => onNavigate("sobre")}>
                Conhecer o médico
              </button>
            </div>
            <div className={styles.pillRow}>
              <span className={styles.pill}>Clínica Geral</span>
              <span className={styles.pill}>Medicina da Família</span>
              <span className={styles.pill}>Urgência e Emergência</span>
            </div>
          </div>
          <figure className={styles.heroMedia}>
            <img src="/wallace.jpg" alt="Foto do Dr. Wallace Victor sorrindo no consultório" />
            <figcaption>
              Presença humanizada, consultas focadas em prevenção e bem-estar contínuo.
            </figcaption>
          </figure>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Por que escolher a clínica</h3>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>❤️</div>
              <div>
                <h4>Acompanhamento integral</h4>
                <p>Cuidado contínuo para você e sua família, com planos de prevenção e monitoramento personalizado.</p>
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🗓️</div>
              <div>
                <h4>Agenda organizada</h4>
                <p>Horários claros e agendamento online para facilitar a sua rotina.</p>
              </div>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🩺</div>
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
        </section>

        <section className={styles.gallery}>
          <div className={styles.galleryHeader}>
            <div>
              <p className={styles.badge}>No consultório</p>
              <h3 className={styles.sectionTitle}>Veja o cuidado na prática</h3>
              <p className={styles.heroText}>
                Momentos com pacientes, mostrando a proximidade, a escuta atenta e o foco em prevenção.
              </p>
            </div>
            <button type="button" className={styles.cta} onClick={handleAgendar}>
              Agendar consulta
            </button>
          </div>
          <div className={styles.galleryGrid}>
            {consultPhotos.map((photo) => (
              <article
                key={photo.title}
                className={styles.photoCard}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${photo.tone}, rgba(15,23,42,0.2)), url(/dr-wallace-placeholder.svg)`,
                }}
              >
                <div className={styles.photoOverlay}>
                  <h4>{photo.title}</h4>
                  <p>{photo.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
