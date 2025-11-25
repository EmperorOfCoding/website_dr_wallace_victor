const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function findAdminByEmail(email) {
  const [rows] = await pool.execute('SELECT id, name, email, password_hash, role FROM admins WHERE email = ?', [email]);
  return rows[0] || null;
}

async function authenticate(email, password) {
  const admin = await findAdminByEmail(email);
  if (!admin) return null;
  const isValid = await bcrypt.compare(password, admin.password_hash);
  if (!isValid) return false;
  return admin;
}

function generateToken(admin) {
  const payload = {
    patient_id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role || 'admin',
  };
  const secret = process.env.JWT_SECRET || 'default_jwt_secret';
  return jwt.sign(payload, secret, { expiresIn: '4h' });
}

module.exports = {
  findAdminByEmail,
  authenticate,
  generateToken,
};
