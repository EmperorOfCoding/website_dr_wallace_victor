const profileService = require('../services/profileService');

async function getProfile(req, res) {
  try {
    const patientId = req.user?.patient_id;
    if (!patientId) {
      return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
    }

    const profile = await profileService.getProfileByPatientId(patientId);
    return res.status(200).json({ status: 'success', profile: profile || {} });
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao buscar perfil.' });
  }
}

async function updateProfile(req, res) {
  try {
    const patientId = req.user?.patient_id;
    if (!patientId) {
      return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
    }

    const profileData = {
      phone: req.body.phone,
      birthdate: req.body.birthdate,
      emergency_name: req.body.emergency_name,
      emergency_phone: req.body.emergency_phone,
      allergies: req.body.allergies,
      notes: req.body.notes,
      contact_preference: req.body.contact_preference,
      reminders_enabled: req.body.reminders_enabled,
      dark_mode: req.body.dark_mode,
    };

    const profile = await profileService.createOrUpdateProfile(patientId, profileData);
    return res.status(200).json({ status: 'success', profile, message: 'Perfil atualizado com sucesso.' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao atualizar perfil.' });
  }
}

async function updateTheme(req, res) {
  try {
    const patientId = req.user?.patient_id;
    if (!patientId) {
      return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
    }

    const { dark_mode } = req.body;
    await profileService.updateDarkMode(patientId, dark_mode === true);
    return res.status(200).json({ status: 'success', message: 'Tema atualizado.' });
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao atualizar tema.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  updateTheme,
};


