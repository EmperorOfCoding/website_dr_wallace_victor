const authService = require('../services/authService');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body || {};

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ status: 'error', message: 'Campos obrigatórios ausentes.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'E-mail inválido.' });
    }

    const existing = await authService.findPatientByEmail(email);
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'E-mail já cadastrado.' });
    }

    const passwordHash = await authService.hashPassword(password);
    const patientId = await authService.createPatient({ name, email, phone, passwordHash });

    return res.status(201).json({
      status: 'success',
      message: 'Conta criada com sucesso.',
      patient_id: patientId
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao criar conta.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Campos obrigatórios ausentes.' });
    }

    const patient = await authService.authenticate(email, password);

    if (patient === null) {
      return res.status(404).json({ status: 'error', message: 'E-mail não encontrado.' });
    }

    if (patient === false) {
      return res.status(401).json({ status: 'error', message: 'Senha inválida.' });
    }

    const token = authService.generateToken(patient);

    return res.status(200).json({
      status: 'success',
      token,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao realizar login.' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'E-mail é obrigatório.' });
    }

    const patient = await authService.findPatientByEmail(email);

    if (patient) {
      const token = await authService.createPasswordResetRequest(patient.id);
      await authService.sendResetEmail(email, token);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Se o e-mail existir, enviaremos instruções para redefinir a senha.'
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao solicitar recuperação de senha.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, new_password: newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Token e nova senha são obrigatórios.' });
    }

    const resetData = await authService.validatePasswordResetToken(token);
    if (!resetData) {
      return res.status(400).json({ status: 'error', message: 'Token inválido ou expirado.' });
    }

    await authService.resetPassword(resetData.patient_id, newPassword, resetData.id);

    return res.status(200).json({ status: 'success', message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao redefinir senha.' });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
