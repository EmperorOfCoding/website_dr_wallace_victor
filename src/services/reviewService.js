const pool = require('../config/db');

async function getReviewByAppointmentId(appointmentId) {
  const [rows] = await pool.execute(
    `SELECT * FROM appointment_reviews WHERE appointment_id = ?`,
    [appointmentId]
  );
  return rows[0] || null;
}

async function getReviewsByDoctorId(doctorId, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT r.*, p.name as patient_name 
     FROM appointment_reviews r
     JOIN patients p ON r.patient_id = p.id
     WHERE r.doctor_id = ?
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [doctorId, limit]
  );
  return rows;
}

async function getReviewsByPatientId(patientId) {
  const [rows] = await pool.execute(
    `SELECT r.*, d.name as doctor_name, a.date, a.time
     FROM appointment_reviews r
     JOIN doctors d ON r.doctor_id = d.id
     JOIN appointments a ON r.appointment_id = a.id
     WHERE r.patient_id = ?
     ORDER BY r.created_at DESC`,
    [patientId]
  );
  return rows;
}

async function createReview(appointmentId, patientId, doctorId, rating, comment) {
  // Check if review already exists
  const existing = await getReviewByAppointmentId(appointmentId);
  if (existing) {
    throw new Error('REVIEW_EXISTS');
  }

  // Validate appointment belongs to patient
  const [apptRows] = await pool.execute(
    `SELECT * FROM appointments WHERE id = ? AND patient_id = ?`,
    [appointmentId, patientId]
  );
  if (apptRows.length === 0) {
    throw new Error('APPOINTMENT_NOT_FOUND');
  }

  // Validate appointment is completed/past
  const appointment = apptRows[0];
  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
  if (appointmentDate > new Date()) {
    throw new Error('APPOINTMENT_NOT_COMPLETED');
  }

  const [result] = await pool.execute(
    `INSERT INTO appointment_reviews (appointment_id, patient_id, doctor_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [appointmentId, patientId, doctorId, rating, comment || null]
  );

  return { id: result.insertId, appointment_id: appointmentId, rating, comment };
}

async function updateReview(appointmentId, patientId, rating, comment) {
  const [result] = await pool.execute(
    `UPDATE appointment_reviews 
     SET rating = ?, comment = ?
     WHERE appointment_id = ? AND patient_id = ?`,
    [rating, comment || null, appointmentId, patientId]
  );

  if (result.affectedRows === 0) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  return { appointment_id: appointmentId, rating, comment };
}

async function getAverageRatingByDoctorId(doctorId) {
  const [rows] = await pool.execute(
    `SELECT AVG(rating) as average, COUNT(*) as count 
     FROM appointment_reviews 
     WHERE doctor_id = ?`,
    [doctorId]
  );
  return rows[0] || { average: null, count: 0 };
}

module.exports = {
  getReviewByAppointmentId,
  getReviewsByDoctorId,
  getReviewsByPatientId,
  createReview,
  updateReview,
  getAverageRatingByDoctorId,
};


