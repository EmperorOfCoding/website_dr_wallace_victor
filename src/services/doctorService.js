const pool = require('../config/db');

async function listDoctors() {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, specialty, bio, created_at FROM doctors ORDER BY created_at DESC'
  );
  return rows;
}

async function findDoctorById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, specialty, bio FROM doctors WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function listTypesForDoctor(doctorId) {
  const [rows] = await pool.execute(
    `SELECT t.id, t.name, t.duration_minutes AS duration, t.description
     FROM doctor_consultation_types dct
     JOIN appointment_types t ON dct.type_id = t.id
     WHERE dct.doctor_id = ?
     ORDER BY t.name`,
    [doctorId]
  );
  return rows;
}

module.exports = {
  listDoctors,
  findDoctorById,
  listTypesForDoctor,
};
