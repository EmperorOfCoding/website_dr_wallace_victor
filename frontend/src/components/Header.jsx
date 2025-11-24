import React from 'react';
import styles from './Header.module.css';

export default function Header({ currentPage, onNavigate }) {
  const links = [
    { key: 'home', label: 'Home' },
    { key: 'sobre', label: 'Sobre' },
    { key: 'servicos', label: 'Serviços' },
    { key: 'contato', label: 'Contato' },
    { key: 'cadastro', label: 'Cadastro' }
  ];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>Dr. Wallace Victor</div>
        <nav className={styles.nav}>
          {links.map((link) => (
            <button
              key={link.key}
              type="button"
              className={`${styles.link} ${currentPage === link.key ? styles.active : ''}`}
              onClick={() => onNavigate(link.key)}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
