const pool = require('../config/db');

async function isAdmin(userId) {
  const [rows] = await pool.execute('SELECT id FROM admins WHERE id = ? AND role = ?', [userId, 'admin']);
  return rows.length > 0;
}

async function getPatients(page = 1, limit = 10, search = '', doctorId) {
  const safePage = Number.isNaN(Number(page)) ? 1 : Math.max(1, Number(page));
  const safeLimit = Number.isNaN(Number(limit)) ? 10 : Math.max(1, Math.min(100, Number(limit)));
  const offset = (safePage - 1) * safeLimit;

  const params = [];
  let whereClause = '';
  let joinClause = '';

  if (doctorId) {
    joinClause = 'JOIN doctor_patients dp ON dp.patient_id = p.id';
    whereClause = 'WHERE dp.doctor_id = ?';
    params.push(doctorId);
  }

  if (search) {
    const like = `%${search}%`;
    if (whereClause) {
      whereClause = `${whereClause} AND (p.name LIKE ? OR p.email LIKE ? OR p.phone LIKE ?)`;
    } else {
      whereClause = 'WHERE p.name LIKE ? OR p.email LIKE ? OR p.phone LIKE ?';
    }
    params.push(like, like, like);
  }

  const selectQuery = `
    SELECT p.id, p.name, p.email, p.phone, p.created_at
    FROM patients p
    ${joinClause}
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM patients p
    ${joinClause}
    ${whereClause}
  `;

  const [rows] = await pool.execute(selectQuery, [...params, safeLimit, offset]);
  const [countRows] = await pool.execute(countQuery, params);

  const total = countRows[0]?.total || 0;
  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;

  return {
    patients: rows,
    total,
    totalPages,
    page: safePage,
    limit: safeLimit
  };
}

module.exports = {
  isAdmin,
  getPatients
};
