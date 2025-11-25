const nodemailer = require('nodemailer');

function hasMailConfig() {
  return Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASSWORD);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetLink = `${process.env.PASSWORD_RESET_URL || 'https://seudominio.com/reset-password'}?token=${token}`;
  const from = process.env.MAIL_FROM || 'no-reply@example.com';

  // Fallback seguro: se SMTP não estiver configurado, loga o link e retorna sucesso.
  if (!hasMailConfig()) {
    console.warn('[mail] Configuração SMTP ausente. Link de recuperação:', resetLink);
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Recuperação de senha - Dr. Wallace Victor',
    text: `Olá,\n\nRecebemos um pedido para redefinir sua senha. Utilize o link abaixo:\n\n${resetLink}\n\nSe você não solicitou, ignore este e-mail.`,
    html: `
      <p>Olá,</p>
      <p>Recebemos um pedido para redefinir sua senha. Utilize o link abaixo:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Se você não solicitou, ignore este e-mail.</p>
    `,
  });
}

module.exports = {
  sendPasswordResetEmail,
};
