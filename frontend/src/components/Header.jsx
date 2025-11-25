import React from "react";
import styles from "./Header.module.css";

export default function Header({ currentPage, onNavigate, isAuthenticated, isAdmin, onLogout }) {
  const links = isAdmin
    ? [
        { key: "admin", label: "Painel" },
        { key: "admin-agenda", label: "Agenda" },
        { key: "admin-pacientes", label: "Pacientes" },
      ]
    : [
        { key: "home", label: "Home" },
        { key: "sobre", label: "Sobre" },
        { key: "servicos", label: "Serviços" },
        { key: "contato", label: "Contato" },
      ];

  const authLinks =
    !isAdmin && isAuthenticated
      ? [
          { key: "dashboard", label: "Dashboard" },
          { key: "agendar", label: "Agendar" },
          { key: "minha-agenda", label: "Minha Agenda" },
          { key: "perfil", label: "Perfil" },
        ]
      : !isAuthenticated
      ? [
          { key: "cadastro", label: "Cadastro" },
          { key: "login", label: "Entrar" },
        ]
      : [];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button type="button" className={styles.brand} onClick={() => onNavigate("home")}>
          <img src="/logo_wallace_victor.png" alt="Logo Dr. Wallace Victor" />
        </button>
        <nav className={styles.nav}>
          {links.map((link) => (
            <button
              key={link.key}
              type="button"
              className={`${styles.link} ${currentPage === link.key ? styles.active : ""}`}
              onClick={() => onNavigate(link.key)}
            >
              {link.label}
            </button>
          ))}
          {authLinks.map((link) => (
            <button
              key={link.key}
              type="button"
              className={`${styles.link} ${currentPage === link.key ? styles.active : ""}`}
              onClick={() => onNavigate(link.key)}
            >
              {link.label}
            </button>
          ))}
          {isAuthenticated && (
            <button type="button" className={styles.link} onClick={onLogout}>
              Sair
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
