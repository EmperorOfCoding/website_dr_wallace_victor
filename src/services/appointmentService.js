const pool = require('../config/db');
const blockedTimeService = require('./blockedTimeService');

const START_HOUR = 8;
const END_HOUR = 18;

function buildDailySlots() {
  const slots = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
    const hourStr = hour.toString().padStart(2, '0');
    slots.push(`${hourStr}:00`);
  }
  return slots;
}

async function isSlotAvailable(date, time) {
  const blocked = await blockedTimeService.isBlocked(date, time);
  if (blocked) return false;

  const [rows] = await pool.execute('SELECT id FROM appointments WHERE date = ? AND time = ?', [date, time]);
  return rows.length === 0;
}

async function checkAppointmentExists(id) {
  const [rows] = await pool.execute(
    'SELECT id, patient_id, type_id, date, time FROM appointments WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function isTimeAvailable(date, time, appointmentIdToIgnore) {
  const blocked = await blockedTimeService.isBlocked(date, time);
  if (blocked) return false;

  const params = [date, time];
  let query = 'SELECT id FROM appointments WHERE date = ? AND time = ?';

  if (appointmentIdToIgnore) {
    query += ' AND id <> ?';
    params.push(appointmentIdToIgnore);
  }

  const [rows] = await pool.execute(query, params);
  return rows.length === 0;
}

async function updateAppointment(id, { date, time, typeId }) {
  await pool.execute(
    'UPDATE appointments SET date = ?, time = ?, type_id = ? WHERE id = ?',
    [date, time, typeId, id]
  );
}

async function deleteAppointment(id) {
  await pool.execute('DELETE FROM appointments WHERE id = ?', [id]);
}

async function getAvailableTimes(date) {
  const [rows] = await pool.execute('SELECT time FROM appointments WHERE date = ?', [date]);
  const [blockedRows] = await pool.execute('SELECT time FROM blocked_times WHERE date = ?', [date]);
  const occupied = new Set(rows.map((row) => row.time.slice(0, 5)));
  blockedRows.forEach((row) => occupied.add(row.time.slice(0, 5)));

  const slots = buildDailySlots();
  return slots.filter((slot) => !occupied.has(slot));
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
  checkAppointmentExists,
  isTimeAvailable,
  updateAppointment,
  deleteAppointment,
  getAvailableTimes,
  createAppointment
};
