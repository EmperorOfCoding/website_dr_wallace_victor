const pool = require('../config/db');

async function linkDoctorPatient(doctorId, patientId, externalConnection) {
  const conn = externalConnection || (await pool.getConnection());
  const shouldRelease = !externalConnection;
  try {
    await conn.execute(
      'INSERT IGNORE INTO doctor_patients (doctor_id, patient_id) VALUES (?, ?)',
      [doctorId, patientId]
    );
  } finally {
    if (shouldRelease) {
      conn.release();
    }
  }
}

module.exports = { linkDoctorPatient };
