const jwt = require('jsonwebtoken');
const patientService = require('../services/patientService');

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
    const tokenRole = payload.role;

    if (tokenRole === 'admin') {
      req.user = { ...payload };
      return next();
    }

    const isAdmin = await patientService.isAdmin(userId);
    if (!isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Acesso não autorizado.' });
    }

    req.user = { ...payload, role: 'admin' };
    return next();
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro de autorização.' });
  }
}

module.exports = authAdmin;
