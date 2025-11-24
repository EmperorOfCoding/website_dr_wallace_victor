import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <strong>Clínica Dr. Wallace Victor</strong>
          <div className={styles.copy}>Cuidado humano, baseado em evidências.</div>
        </div>
        <div className={styles.info}>
          <span>Telefone: (00) 00000-0000</span>
          <span>WhatsApp: (00) 00000-0000</span>
          <span>E-mail: contato@drwallace.com</span>
          <span>Endereço: Rua Exemplo, 123 – Salvador/BA</span>
        </div>
      </div>
      <div className={styles.copy}>© {new Date().getFullYear()} Dr. Wallace Victor. Todos os direitos reservados.</div>
    </footer>
  );
}
