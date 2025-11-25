const patientService = require('../services/patientService');

async function listPatients(req, res) {
  try {
    const { page = 1, limit = 10, search = '', doctor_id: doctorId } = req.query || {};
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
    return res.status(500).json({ status: 'error', message: 'Erro ao listar pacientes.' });
  }
}

module.exports = {
  listPatients
};
