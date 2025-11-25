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

function getFromAddress() {
  return process.env.MAIL_FROM || 'Dr. Wallace Victor <no-reply@drwallacevictor.com>';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatTime(timeStr) {
  return timeStr?.slice(0, 5) || timeStr;
}

// Password reset email
async function sendPasswordResetEmail(email, token) {
  const resetLink = `${process.env.PASSWORD_RESET_URL || 'https://seudominio.com/reset-password'}?token=${token}`;

  if (!hasMailConfig()) {
    console.warn('[mail] Configuração SMTP ausente. Link de recuperação:', resetLink);
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: 'Recuperação de senha - Dr. Wallace Victor',
    text: `Olá,\n\nRecebemos um pedido para redefinir sua senha. Utilize o link abaixo:\n\n${resetLink}\n\nSe você não solicitou, ignore este e-mail.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b5bfd;">Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Recebemos um pedido para redefinir sua senha. Clique no botão abaixo:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #3b5bfd, #5b7cfd); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Redefinir Senha
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Se você não solicitou esta alteração, ignore este e-mail.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">Dr. Wallace Victor - Clínica Médica</p>
      </div>
    `,
  });
}

// Appointment confirmation email
async function sendAppointmentConfirmation(email, patientName, doctorName, typeName, date, time, duration) {
  if (!hasMailConfig()) {
    console.warn(`[mail] Confirmação de agendamento para ${email} (SMTP não configurado)`);
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Consulta Confirmada - ${formatDate(date)} às ${formatTime(time)}`,
    text: `Olá ${patientName},\n\nSua consulta foi agendada com sucesso!\n\nDetalhes:\n- Médico: ${doctorName}\n- Tipo: ${typeName}\n- Data: ${formatDate(date)}\n- Horário: ${formatTime(time)}\n- Duração: ${duration} minutos\n\nAté breve!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✓ Consulta Confirmada</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px;">Olá <strong>${patientName}</strong>,</p>
          <p>Sua consulta foi agendada com sucesso! Confira os detalhes abaixo:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b5bfd;">
            <p style="margin: 8px 0;"><strong>👨‍⚕️ Médico:</strong> ${doctorName}</p>
            <p style="margin: 8px 0;"><strong>🏥 Tipo:</strong> ${typeName}</p>
            <p style="margin: 8px 0;"><strong>📅 Data:</strong> ${formatDate(date)}</p>
            <p style="margin: 8px 0;"><strong>⏰ Horário:</strong> ${formatTime(time)}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duração:</strong> ${duration} minutos</p>
          </div>
          
          <p style="color: #64748b;">Lembre-se de chegar com 10 minutos de antecedência.</p>
          <p style="color: #64748b;">Caso precise cancelar ou reagendar, acesse sua área do paciente.</p>
          
          <p style="margin-top: 30px;">Até breve!</p>
          <p><strong>Equipe Dr. Wallace Victor</strong></p>
        </div>
      </div>
    `,
  });
}

// Appointment reminder email
async function sendAppointmentReminder(email, patientName, doctorName, typeName, date, time, reminderType) {
  if (!hasMailConfig()) {
    console.warn(`[mail] Lembrete para ${email} (SMTP não configurado)`);
    return;
  }

  const transporter = createTransporter();
  const timeLabel = reminderType === '24h_before' ? 'amanhã' : 'em 1 hora';

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Lembrete: Sua consulta é ${timeLabel}! - ${formatDate(date)}`,
    text: `Olá ${patientName},\n\nEste é um lembrete da sua consulta:\n\n- Médico: ${doctorName}\n- Tipo: ${typeName}\n- Data: ${formatDate(date)}\n- Horário: ${formatTime(time)}\n\nNão se esqueça!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Lembrete de Consulta</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px;">Olá <strong>${patientName}</strong>,</p>
          <p>Sua consulta é <strong>${timeLabel}</strong>! Não esqueça:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 8px 0;"><strong>👨‍⚕️ Médico:</strong> ${doctorName}</p>
            <p style="margin: 8px 0;"><strong>🏥 Tipo:</strong> ${typeName}</p>
            <p style="margin: 8px 0;"><strong>📅 Data:</strong> ${formatDate(date)}</p>
            <p style="margin: 8px 0;"><strong>⏰ Horário:</strong> ${formatTime(time)}</p>
          </div>
          
          <p style="color: #64748b;">Chegue com 10 minutos de antecedência.</p>
          
          <p style="margin-top: 30px;">Até logo!</p>
          <p><strong>Equipe Dr. Wallace Victor</strong></p>
        </div>
      </div>
    `,
  });
}

// Cancellation email
async function sendCancellationEmail(email, patientName, doctorName, typeName, date, time, reason) {
  if (!hasMailConfig()) {
    console.warn(`[mail] Cancelamento para ${email} (SMTP não configurado)`);
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Consulta Cancelada - ${formatDate(date)}`,
    text: `Olá ${patientName},\n\nSua consulta foi cancelada:\n\n- Médico: ${doctorName}\n- Tipo: ${typeName}\n- Data: ${formatDate(date)}\n- Horário: ${formatTime(time)}\n${reason ? `\nMotivo: ${reason}` : ''}\n\nPara agendar uma nova consulta, acesse sua área do paciente.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444, #f87171); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Consulta Cancelada</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px;">Olá <strong>${patientName}</strong>,</p>
          <p>Sua consulta foi cancelada. Veja os detalhes abaixo:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 8px 0;"><strong>👨‍⚕️ Médico:</strong> ${doctorName}</p>
            <p style="margin: 8px 0;"><strong>🏥 Tipo:</strong> ${typeName}</p>
            <p style="margin: 8px 0;"><strong>📅 Data:</strong> ${formatDate(date)}</p>
            <p style="margin: 8px 0;"><strong>⏰ Horário:</strong> ${formatTime(time)}</p>
            ${reason ? `<p style="margin: 8px 0;"><strong>📝 Motivo:</strong> ${reason}</p>` : ''}
          </div>
          
          <p style="color: #64748b;">Para agendar uma nova consulta, acesse sua área do paciente.</p>
          
          <p style="margin-top: 30px;">Atenciosamente,</p>
          <p><strong>Equipe Dr. Wallace Victor</strong></p>
        </div>
      </div>
    `,
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendCancellationEmail,
};
