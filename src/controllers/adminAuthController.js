const adminService = require('../services/adminService');
const { setAuthCookie, clearAuthCookie } = require('../utils/cookieUtils');

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Campos obrigatórios ausentes.' });
    }

    const admin = await adminService.authenticate(email, password);
    if (admin === null) {
      return res.status(404).json({ status: 'error', message: 'E-mail não encontrado.' });
    }
    if (admin === false) {
      return res.status(401).json({ status: 'error', message: 'Senha inválida.' });
    }
    if (!admin.doctor_id) {
      return res.status(400).json({ status: 'error', message: 'Administrador sem médico vinculado.' });
    }

    const token = adminService.generateToken(admin);

    // Set httpOnly cookie (primary method)
    setAuthCookie(res, token);

    // ALSO return token in response for mobile browsers that block third-party cookies
    // Backend supports both: cookie (preferred) and Authorization header (fallback)
    return res.status(200).json({
      status: 'success',
      token, // Include token for Authorization header fallback
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role || 'admin',
        doctor_id: admin.doctor_id,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao autenticar administrador.' });
  }
}

async function logout(req, res) {
  try {
    clearAuthCookie(res);
    return res.status(200).json({
      status: 'success',
      message: 'Logout realizado com sucesso.'
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao realizar logout.' });
  }
}

module.exports = { login, logout };
