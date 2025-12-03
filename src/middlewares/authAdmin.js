const jwt = require('jsonwebtoken');
const adminService = require('../services/adminService');
const { ensureJwtSecret } = require('../utils/securityUtils');
const { getAuthToken } = require('../utils/cookieUtils');

// Validate JWT secret on module load
ensureJwtSecret();

async function authAdmin(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Acesso não autorizado.' });
    }

    let payload;
    try {
      // No fallback - will use validated JWT_SECRET from env
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Don't leak token validation errors
      return res.status(401).json({ status: 'error', message: 'Acesso não autorizado.' });
    }

    const userId = payload.patient_id;
    let doctorId = payload.doctor_id;

    // Recupera doctor_id se não veio no token, mas APENAS se não for paciente
    if (!doctorId && payload.role !== 'patient') {
      const admin = await adminService.findAdminById(userId);
      doctorId = admin?.doctor_id || null;
    }

    // A partir de agora, qualquer token válido (médico/admin) passa
    req.user = { ...payload, doctor_id: doctorId };
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Erro de autorização.' });
  }
}

module.exports = authAdmin;
