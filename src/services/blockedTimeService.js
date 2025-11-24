const pool = require('../config/db');

function normalizePagination(page = 1, limit = 10) {
  const safePage = Number.isNaN(Number(page)) ? 1 : Math.max(1, Number(page));
  const safeLimit = Number.isNaN(Number(limit)) ? 10 : Math.max(1, Math.min(100, Number(limit)));
  const offset = (safePage - 1) * safeLimit;
  return { safePage, safeLimit, offset };
}

async function isBlocked(date, time) {
  const [rows] = await pool.execute('SELECT id FROM blocked_times WHERE date = ? AND time = ?', [date, time]);
  return rows.length > 0;
}

async function createBlockedTime({ date, time, reason }) {
  const [existingBlocked] = await pool.execute(
    'SELECT id FROM blocked_times WHERE date = ? AND time = ?',
    [date, time]
  );
  if (existingBlocked.length > 0) {
    const error = new Error('BLOCKED_EXISTS');
    throw error;
  }

  const [existingAppointment] = await pool.execute(
    'SELECT id FROM appointments WHERE date = ? AND time = ?',
    [date, time]
  );
  if (existingAppointment.length > 0) {
    const error = new Error('APPOINTMENT_CONFLICT');
    throw error;
  }

  await pool.execute('INSERT INTO blocked_times (date, time, reason) VALUES (?, ?, ?)', [date, time, reason || null]);
}

async function listBlockedTimes({ date, page = 1, limit = 10 }) {
  const { safePage, safeLimit, offset } = normalizePagination(page, limit);

  const params = [];
  let whereClause = '';
  if (date) {
    whereClause = 'WHERE date = ?';
    params.push(date);
  }

  const selectQuery = `
    SELECT id, date, time, reason, created_at
    FROM blocked_times
    ${whereClause}
    ORDER BY date, time
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM blocked_times
    ${whereClause}
  `;

  const [rows] = await pool.execute(selectQuery, [...params, safeLimit, offset]);
  const [countRows] = await pool.execute(countQuery, params);

  const total = countRows[0]?.total || 0;
  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;

  return {
    blockedTimes: rows,
    total,
    totalPages,
    page: safePage
  };
}

async function deleteBlockedTime(id) {
  await pool.execute('DELETE FROM blocked_times WHERE id = ?', [id]);
}

async function findBlockedById(id) {
  const [rows] = await pool.execute('SELECT id, date, time, reason FROM blocked_times WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = {
  isBlocked,
  createBlockedTime,
  listBlockedTimes,
  deleteBlockedTime,
  findBlockedById
};
