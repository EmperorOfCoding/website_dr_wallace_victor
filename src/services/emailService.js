const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    }
  });
}

async function sendPasswordResetEmail(email, token) {
  const transporter = createTransporter();
  const resetLink = `${process.env.PASSWORD_RESET_URL || 'https://seudominio.com/reset-password'}?token=${token}`;
  const from = process.env.MAIL_FROM || 'no-reply@example.com';

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
    `
  });
}

module.exports = {
  sendPasswordResetEmail
};
