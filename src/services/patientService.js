const pool = require('../config/db');

async function isAdmin(userId) {
  const [rows] = await pool.execute('SELECT id FROM admins WHERE id = ? AND role = ?', [userId, 'admin']);
  return rows.length > 0;
}

async function getPatients(page = 1, limit = 10, search = '') {
  const safePage = Number.isNaN(Number(page)) ? 1 : Math.max(1, Number(page));
  const safeLimit = Number.isNaN(Number(limit)) ? 10 : Math.max(1, Math.min(100, Number(limit)));
  const offset = (safePage - 1) * safeLimit;

  const params = [];
  let whereClause = '';

  if (search) {
    const like = `%${search}%`;
    whereClause = 'WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
    params.push(like, like, like);
  }

  const selectQuery = `
    SELECT id, name, email, phone, created_at
    FROM patients
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM patients
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
