const doctorService = require('../services/doctorService');

async function listDoctors(req, res) {
  try {
    const doctors = await doctorService.listDoctors();
    return res.status(200).json({ status: 'success', doctors });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao listar médicos.' });
  }
}

module.exports = { listDoctors };
