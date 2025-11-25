const jwt = require('jsonwebtoken');
const adminService = require('../services/adminService');

async function authAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Acesso não autorizado.' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    } catch (error) {
      return res.status(401).json({ status: 'error', message: 'Acesso não autorizado.' });
    }

    const userId = payload.patient_id;
    let doctorId = payload.doctor_id;

    // Recupera doctor_id se não veio no token
    if (!doctorId) {
      const admin = await adminService.findAdminById(userId);
      doctorId = admin?.doctor_id || null;
    }

    // A partir de agora, qualquer token válido (médico/admin) passa
    req.user = { ...payload, doctor_id: doctorId };
    return next();
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro de autorização.' });
  }
}

module.exports = authAdmin;
