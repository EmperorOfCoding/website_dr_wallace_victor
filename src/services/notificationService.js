const pool = require('../config/db');
const cron = require('node-cron');
const { sendAppointmentConfirmation, sendAppointmentReminder, sendCancellationEmail } = require('./emailService');
const { logger } = require('../middlewares/logger');

// Schedule notifications for a new appointment
async function scheduleNotifications(appointmentId, patientId, date, time) {
  const appointmentDateTime = new Date(`${date}T${time}`);

  // Schedule 24h reminder
  const reminder24h = new Date(appointmentDateTime);
  reminder24h.setHours(reminder24h.getHours() - 24);

  if (reminder24h > new Date()) {
    await pool.execute(
      `INSERT INTO notification_queue 
       (appointment_id, patient_id, notification_type, scheduled_for, status)
       VALUES (?, ?, '24h_before', ?, 'pending')`,
      [appointmentId, patientId, reminder24h]
    );
  }

  // Schedule 1h reminder
  const reminder1h = new Date(appointmentDateTime);
  reminder1h.setHours(reminder1h.getHours() - 1);

  if (reminder1h > new Date()) {
    await pool.execute(
      `INSERT INTO notification_queue 
       (appointment_id, patient_id, notification_type, scheduled_for, status)
       VALUES (?, ?, '1h_before', ?, 'pending')`,
      [appointmentId, patientId, reminder1h]
    );
  }
}

// Cancel pending notifications for an appointment
async function cancelNotifications(appointmentId) {
  await pool.execute(
    `UPDATE notification_queue 
     SET status = 'cancelled' 
     WHERE appointment_id = ? AND status = 'pending'`,
    [appointmentId]
  );
}

// Process pending notifications
async function processPendingNotifications() {
  try {
    // Get notifications that should be sent now
    let notifications;
    try {
      [notifications] = await pool.execute(
        `SELECT nq.*, p.email as patient_email, p.name as patient_name,
                a.date, a.time, d.name as doctor_name, at.name as type_name
         FROM notification_queue nq
         JOIN patients p ON nq.patient_id = p.id
         JOIN appointments a ON nq.appointment_id = a.id
         JOIN doctors d ON a.doctor_id = d.id
         JOIN appointment_types at ON a.type_id = at.id
         WHERE nq.status = 'pending' 
           AND nq.scheduled_for <= NOW()
           AND a.status NOT IN ('cancelled', 'completed')
         LIMIT 50`
      );
    } catch (dbError) {
      // Se erro de conexão, retorna array vazio para não travar
      if (dbError.code === 'ETIMEDOUT' || dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        logger.warn('Database connection unavailable, skipping notification processing');
        return;
      }
      throw dbError;
    }

    for (const notification of notifications) {
      try {
        await sendAppointmentReminder(
          notification.patient_email,
          notification.patient_name,
          notification.doctor_name,
          notification.type_name,
          notification.date,
          notification.time,
          notification.notification_type
        );

        // Mark as sent
        await pool.execute(
          `UPDATE notification_queue SET status = 'sent' WHERE id = ?`,
          [notification.id]
        );

        // Update appointment reminder flag
        await pool.execute(
          `UPDATE appointments SET reminder_sent = TRUE WHERE id = ?`,
          [notification.appointment_id]
        );

        logger.info(`Notification sent: ${notification.notification_type} for appointment ${notification.appointment_id}`);
      } catch (error) {
        logger.error(`Failed to send notification ${notification.id}:`, error);
        await pool.execute(
          `UPDATE notification_queue SET status = 'failed' WHERE id = ?`,
          [notification.id]
        );
      }
    }
  } catch (error) {
    logger.error('Error processing notifications:', error);
  }
}

// Send confirmation email for new booking
async function sendBookingConfirmation(appointmentId) {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, p.email as patient_email, p.name as patient_name,
              d.name as doctor_name, at.name as type_name, at.duration_minutes
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN appointment_types at ON a.type_id = at.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    if (rows.length === 0) return;

    const appointment = rows[0];
    await sendAppointmentConfirmation(
      appointment.patient_email,
      appointment.patient_name,
      appointment.doctor_name,
      appointment.type_name,
      appointment.date,
      appointment.time,
      appointment.duration_minutes
    );

    // Update confirmation flag
    await pool.execute(
      `UPDATE appointments SET confirmation_sent = TRUE WHERE id = ?`,
      [appointmentId]
    );

    logger.info(`Confirmation email sent for appointment ${appointmentId}`);
  } catch (error) {
    logger.error(`Failed to send confirmation for appointment ${appointmentId}:`, error);
  }
}

// Send cancellation notification
async function sendCancellationNotification(appointmentId, reason) {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, p.email as patient_email, p.name as patient_name,
              d.name as doctor_name, at.name as type_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN appointment_types at ON a.type_id = at.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    if (rows.length === 0) return;

    const appointment = rows[0];
    await sendCancellationEmail(
      appointment.patient_email,
      appointment.patient_name,
      appointment.doctor_name,
      appointment.type_name,
      appointment.date,
      appointment.time,
      reason
    );

    logger.info(`Cancellation email sent for appointment ${appointmentId}`);
  } catch (error) {
    logger.error(`Failed to send cancellation for appointment ${appointmentId}:`, error);
  }
}

// Start the notification scheduler (runs every minute)
function startNotificationScheduler() {
  // Verificar conexão antes de iniciar
  pool.getConnection()
    .then(connection => {
      connection.release();
      cron.schedule('* * * * *', () => {
        processPendingNotifications();
      });
      logger.info('Notification scheduler started');
    })
    .catch(err => {
      logger.warn('Notification scheduler not started - database connection unavailable');
      logger.warn('Scheduler will be retried on next server restart');
    });
}

module.exports = {
  scheduleNotifications,
  cancelNotifications,
  processPendingNotifications,
  sendBookingConfirmation,
  sendCancellationNotification,
  startNotificationScheduler,
};


