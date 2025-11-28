const pool = require('../config/db');

function normalizePagination(page = 1, limit = 10) {
  const safePage = Number.isNaN(Number(page)) ? 1 : Math.max(1, Number(page));
  const safeLimit = Number.isNaN(Number(limit)) ? 10 : Math.max(1, Math.min(100, Number(limit)));
  const offset = (safePage - 1) * safeLimit;
  return { safePage, safeLimit, offset };
}

async function getAppointments({ date, page = 1, limit = 10, search = '', doctorId }) {
  const { safePage, safeLimit, offset } = normalizePagination(page, limit);

  const params = [];
  const where = [];

  if (doctorId) {
    where.push('a.doctor_id = ?');
    params.push(doctorId);
  }

  if (date) {
    where.push('a.date = ?');
    params.push(date);
  }

  if (search) {
    const like = `%${search}%`;
    where.push('(p.name LIKE ? OR p.email LIKE ?)');
    params.push(like, like);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const limitClause = `LIMIT ${safeLimit} OFFSET ${offset}`;

  const selectQuery = `
    SELECT
      a.id AS appointment_id,
      a.patient_id,
      a.date,
      a.time,
      a.time,
      a.modality,
      a.type_id,
      a.doctor_id,
      p.name AS patient_name,
      p.email AS patient_email,
      t.name AS type_name,
      a.notes
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    LEFT JOIN appointment_types t ON t.id = a.type_id
    ${whereClause}
    ORDER BY a.date, a.time
    ${limitClause}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    ${whereClause}
  `;

  const [rows] = await pool.execute(selectQuery, params);
  const [countRows] = await pool.execute(countQuery, params);

  const total = countRows[0]?.total || 0;
  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;

  return {
    appointments: rows,
    total,
    totalPages,
    page: safePage
  };
}

async function checkAppointmentConflict(date, time, ignoreId) {
  const params = [date, time];
  let query = 'SELECT id FROM appointments WHERE date = ? AND time = ?';

  if (ignoreId) {
    query += ' AND id <> ?';
    params.push(ignoreId);
  }

  const [rows] = await pool.execute(query, params);
  return rows.length > 0;
}

async function updateAppointmentAdmin(id, { date, time, typeId }) {
  await pool.execute('UPDATE appointments SET date = ?, time = ?, type_id = ? WHERE id = ?', [
    date,
    time,
    typeId,
    id
  ]);
}

async function deleteAppointmentAdmin(id) {
  await pool.execute('DELETE FROM appointments WHERE id = ?', [id]);
}

module.exports = {
  getAppointments,
  checkAppointmentConflict,
  updateAppointmentAdmin,
  deleteAppointmentAdmin
};
