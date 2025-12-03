const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('./emailService');
const { ensureJwtSecret } = require('../utils/securityUtils');

// Validate JWT secret on module load
ensureJwtSecret();

async function findPatientByEmail(email) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, password_hash FROM patients WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error in findPatientByEmail:', error);
    return null;
  }
}

async function hashPassword(password) {
  const saltRounds = 12; // Increased from 10 for better security
  return bcrypt.hash(password, saltRounds);
}

async function createPatient({ name, email, phone, passwordHash }) {
  const [result] = await pool.execute(
    'INSERT INTO patients (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
    [name, email, phone, passwordHash]
  );

  return result.insertId;
}

async function authenticate(email, password) {
  try {
    const patient = await findPatientByEmail(email);
    if (!patient) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, patient.password_hash);
    if (!isValidPassword) {
      return null;
    }

    return patient;
  } catch (error) {
    console.error('Error in authenticate:', error);
    return null;
  }
}

function generateToken(patient) {
  const payload = {
    patient_id: patient.id,
    name: patient.name,
    email: patient.email,
    role: patient.role || 'patient'
  };

  // No fallback - will throw if JWT_SECRET not configured
  const secret = process.env.JWT_SECRET;

  return jwt.sign(payload, secret, { expiresIn: '2h' });
}

async function createPasswordResetRequest(patientId) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const expiresAtFormatted = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

  await pool.execute(
    'INSERT INTO password_resets (patient_id, token, expires_at) VALUES (?, ?, ?)',
    [patientId, token, expiresAtFormatted]
  );

  return token;
}

async function validatePasswordResetToken(token) {
  const [rows] = await pool.execute(
    'SELECT pr.id, pr.patient_id, pr.expires_at, p.email FROM password_resets pr JOIN patients p ON pr.patient_id = p.id WHERE pr.token = ?',
    [token]
  );

  if (!rows[0]) {
    return null;
  }

  const reset = rows[0];
  const now = new Date();
  if (new Date(reset.expires_at) < now) {
    await pool.execute('DELETE FROM password_resets WHERE id = ?', [reset.id]);
    return null;
  }

  return reset;
}

async function resetPassword(patientId, newPassword, resetId) {
  const passwordHash = await hashPassword(newPassword);
  await pool.execute('UPDATE patients SET password_hash = ? WHERE id = ?', [passwordHash, patientId]);
  if (resetId) {
    await pool.execute('DELETE FROM password_resets WHERE id = ?', [resetId]);
  } else {
    await pool.execute('DELETE FROM password_resets WHERE patient_id = ?', [patientId]);
  }
}

module.exports = {
  findPatientByEmail,
  hashPassword,
  createPatient,
  authenticate,
  generateToken,
  createPasswordResetRequest,
  validatePasswordResetToken,
  resetPassword,
  sendResetEmail: sendPasswordResetEmail
};
