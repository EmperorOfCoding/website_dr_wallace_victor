const authService = require('../services/authService');
const { validatePassword, validateEmail, validateName, validatePhone } = require('../utils/securityUtils');
const { setAuthCookie, clearAuthCookie } = require('../utils/cookieUtils');

async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body || {};

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ status: 'error', message: 'Campos obrigatórios ausentes.' });
    }

    // Validate and sanitize name
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ status: 'error', message: nameValidation.error });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'E-mail inválido.' });
    }

    // Validate phone
    if (!validatePhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone inválido. Use o formato: (XX) XXXXX-XXXX' });
    }

    // Validate password complexity
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Senha não atende aos requisitos de segurança.',
        errors: passwordValidation.errors
      });
    }

    const existing = await authService.findPatientByEmail(email);
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'E-mail já cadastrado.' });
    }

    const passwordHash = await authService.hashPassword(password);
    const patientId = await authService.createPatient({
      name: nameValidation.sanitized,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash
    });

    return res.status(201).json({
      status: 'success',
      message: 'Conta criada com sucesso.',
      patient_id: patientId
    });
  } catch (error) {
    console.error('Error in register:', error.message);
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

    if (!patient) {
      return res.status(401).json({ status: 'error', message: 'E-mail ou senha inválidos.' });
    }

    const token = authService.generateToken(patient);

    // Set httpOnly cookie (primary method)
    setAuthCookie(res, token);

    // ALSO return token in response for mobile browsers that block third-party cookies
    // Backend supports both: cookie (preferred) and Authorization header (fallback)
    return res.status(200).json({
      status: 'success',
      token, // Include token for Authorization header fallback
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

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'E-mail é obrigatório.' });
    }

    const patient = await authService.findPatientByEmail(email);

    if (patient) {
      try {
        const token = await authService.createPasswordResetRequest(patient.id);
        await authService.sendResetEmail(email, token);
      } catch (emailError) {
        console.error('Error sending reset email:', emailError);
        // Don't fail the request if email fails, for security reasons
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Se o e-mail existir, enviaremos instruções para redefinir a senha.'
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
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
  logout,
  forgotPassword,
  resetPassword
};
