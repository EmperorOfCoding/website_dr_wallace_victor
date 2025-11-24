const pool = require('../config/db');

function parseDuration(duration) {
  const num = Number(duration);
  if (Number.isNaN(num) || num <= 0) {
    return null;
  }
  return num;
}

async function findByName(name) {
  const [rows] = await pool.execute('SELECT id FROM appointment_types WHERE name = ?', [name]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, duration_minutes AS duration, description, created_at FROM appointment_types WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function createConsultationType({ name, duration, description }) {
  const durationMinutes = parseDuration(duration);
  if (!durationMinutes) {
    const error = new Error('INVALID_DURATION');
    throw error;
  }

  const exists = await findByName(name);
  if (exists) {
    const error = new Error('DUPLICATE_NAME');
    throw error;
  }

  const [result] = await pool.execute(
    'INSERT INTO appointment_types (name, duration_minutes, description) VALUES (?, ?, ?)',
    [name, durationMinutes, description || null]
  );

  return result.insertId;
}

async function listConsultationTypes() {
  const [rows] = await pool.execute(
    'SELECT id, name, duration_minutes AS duration, description, created_at FROM appointment_types ORDER BY created_at DESC'
  );
  return rows;
}

async function updateConsultationType(id, { name, duration, description }) {
  const existing = await findById(id);
  if (!existing) {
    const error = new Error('NOT_FOUND');
    throw error;
  }

  if (name && name !== existing.name) {
    const duplicate = await findByName(name);
    if (duplicate) {
      const error = new Error('DUPLICATE_NAME');
      throw error;
    }
  }

  let durationMinutes = existing.duration;
  if (duration !== undefined) {
    const parsed = parseDuration(duration);
    if (!parsed) {
      const error = new Error('INVALID_DURATION');
      throw error;
    }
    durationMinutes = parsed;
  }

  const nextName = name || existing.name;
  const nextDescription = description !== undefined ? description : existing.description;

  await pool.execute(
    'UPDATE appointment_types SET name = ?, duration_minutes = ?, description = ? WHERE id = ?',
    [nextName, durationMinutes, nextDescription, id]
  );
}

async function existsAppointmentsUsingType(typeId) {
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM appointments WHERE type_id = ?', [typeId]);
  return rows[0]?.total > 0;
}

async function deleteConsultationType(id) {
  await pool.execute('DELETE FROM appointment_types WHERE id = ?', [id]);
}

module.exports = {
  createConsultationType,
  listConsultationTypes,
  updateConsultationType,
  deleteConsultationType,
  existsAppointmentsUsingType,
  findById
};
