import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import styles from "./Header.module.css";
import ThemeToggle from "./ThemeToggle";

export default function Header({ currentPage, onNavigate, isAuthenticated, isAdmin, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = isAdmin
    ? [
        { key: "painel-medico", label: "Painel", icon: "📊" },
        { key: "painel-medico-agenda", label: "Agenda Clínica", icon: "📅" },
        { key: "painel-medico-calendario", label: "Calendario", icon: "🗓️" },
        { key: "painel-medico-metricas", label: "Metricas", icon: "📈" },
        { key: "painel-medico-pacientes", label: "Pacientes", icon: "👥" },
      ]
    : isAuthenticated
    ? [] // No public links for authenticated patients
    : [
        { key: "home", label: "Home", icon: "🏠" },
        { key: "sobre", label: "Sobre", icon: "👨‍⚕️" },
        { key: "servicos", label: "Servicos", icon: "🩺" },
        { key: "contato", label: "Contato", icon: "📞" },
      ];

  const authLinks =
    !isAdmin && isAuthenticated
      ? [
          { key: "dashboard", label: "Inicio", icon: "🏠" },
          { key: "agendar", label: "Agendar", icon: "➕" },
          { key: "minha-agenda", label: "Minha Agenda", icon: "📋" },
          { key: "exames", label: "Exames", icon: "🧪" },
          { key: "perfil", label: "Perfil", icon: "👤" },
        ]
      : !isAuthenticated
      ? [
          { key: "cadastro", label: "Cadastro", icon: "📝" },
          { key: "login", label: "Entrar", icon: "🔑" },
        ]
      : [];

  const allLinks = [...links, ...authLinks];

  const handleNavigate = (key) => {
    onNavigate(key);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setMobileMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button type="button" className={styles.brand} onClick={() => handleNavigate("home")}>
          <img src="/logo_wallace_victor.png" alt="Logo Dr. Wallace Victor" />
        </button>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          {links.map((link) => (
            <button
              key={link.key}
              type="button"
              className={`${styles.link} ${currentPage === link.key ? styles.active : ""}`}
              onClick={() => handleNavigate(link.key)}
            >
              {link.label}
            </button>
          ))}
          {authLinks.map((link) => (
            <button
              key={link.key}
              type="button"
              className={`${styles.link} ${currentPage === link.key ? styles.active : ""}`}
              onClick={() => handleNavigate(link.key)}
            >
              {link.label}
            </button>
          ))}
          {isAuthenticated && (
            <button type="button" className={`${styles.link} ${styles.logoutBtn}`} onClick={handleLogout}>
              Sair
            </button>
          )}
        </nav>

        {/* Theme Toggle & Mobile Menu Button */}
        <div className={styles.actions}>
          <ThemeToggle />
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`${styles.hamburger} ${mobileMenuOpen ? styles.open : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            className={styles.mobileNav}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {allLinks.map((link, index) => (
              <motion.button
                key={link.key}
                type="button"
                className={`${styles.mobileLink} ${currentPage === link.key ? styles.active : ""}`}
                onClick={() => handleNavigate(link.key)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className={styles.mobileIcon}>{link.icon}</span>
                {link.label}
              </motion.button>
            ))}
            {isAuthenticated && (
              <motion.button
                type="button"
                className={`${styles.mobileLink} ${styles.logoutBtn}`}
                onClick={handleLogout}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: allLinks.length * 0.05 }}
              >
                <span className={styles.mobileIcon}>🚪</span>
                Sair
              </motion.button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
