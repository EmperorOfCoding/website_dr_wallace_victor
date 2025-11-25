const adminService = require('../services/adminService');

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

    const token = adminService.generateToken(admin);
    return res.status(200).json({
      status: 'success',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role || 'admin',
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao autenticar administrador.' });
  }
}

module.exports = { login };
