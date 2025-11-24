const pool = require('../config/db');

async function isSlotAvailable(date, time) {
  const [rows] = await pool.execute('SELECT id FROM appointments WHERE date = ? AND time = ?', [date, time]);
  return rows.length === 0;
}

async function createAppointment({ patientId, date, time, typeId }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      'SELECT id FROM appointments WHERE date = ? AND time = ? FOR UPDATE',
      [date, time]
    );

    if (existing.length > 0) {
      throw new Error('CONFLICT');
    }

    const [result] = await connection.execute(
      'INSERT INTO appointments (patient_id, date, time, type_id) VALUES (?, ?, ?, ?)',
      [patientId, date, time, typeId]
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  isSlotAvailable,
  createAppointment
};
