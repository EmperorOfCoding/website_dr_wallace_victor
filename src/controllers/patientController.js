const patientService = require('../services/patientService');

async function listPatients(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query || {};
    const doctorId = req.user?.doctor_id || req.query?.doctor_id;
    const result = await patientService.getPatients(page, limit, search, doctorId);

    const patients = result.patients.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      created_at: p.created_at
    }));

    return res.status(200).json({
      status: 'success',
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
      patients
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listPatients error', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao listar pacientes.' });
  }
}

async function getPatientDetails(req, res) {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientById(id);

    if (!patient) {
      return res.status(404).json({ status: 'error', message: 'Paciente não encontrado.' });
    }

    return res.status(200).json({ status: 'success', patient });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getPatientDetails error', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao buscar detalhes do paciente.' });
  }
}

module.exports = {
  listPatients,
  getPatientDetails
};
