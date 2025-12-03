const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ensureJwtSecret } = require('../utils/securityUtils');

// Validate JWT secret on module load
ensureJwtSecret();

async function findAdminByEmail(email) {
  // agora doctors são as contas admin
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash, specialty, bio FROM doctors WHERE email = ?',
    [email]
  );
  if (!rows[0]) return null;
  return { ...rows[0], role: 'admin', doctor_id: rows[0].id };
}

async function findAdminById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash, specialty, bio FROM doctors WHERE id = ?',
    [id]
  );
  if (!rows[0]) return null;
  return { ...rows[0], role: 'admin', doctor_id: rows[0].id };
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
    role: 'admin',
    doctor_id: admin.doctor_id,
  };

  // No fallback - will throw if JWT_SECRET not configured
  const secret = process.env.JWT_SECRET;

  return jwt.sign(payload, secret, { expiresIn: '4h' });
}

module.exports = {
  findAdminByEmail,
  findAdminById,
  authenticate,
  generateToken,
};
