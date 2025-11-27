const consultationTypeService = require('../services/consultationTypeService');

async function createType(req, res) {
  try {
    const { name, duration, description } = req.body || {};

    if (!name || duration === undefined) {
      return res.status(400).json({ status: 'error', message: 'Nome e duração são obrigatórios.' });
    }

    try {
      const id = await consultationTypeService.createConsultationType({ name, duration, description });
      return res.status(201).json({
        status: 'success',
        message: 'Tipo de consulta criado com sucesso.',
        id
      });
    } catch (error) {
      if (error.message === 'DUPLICATE_NAME') {
        return res.status(409).json({ status: 'error', message: 'Já existe um tipo com esse nome.' });
      }
      if (error.message === 'INVALID_DURATION') {
        return res.status(400).json({ status: 'error', message: 'Duração inválida.' });
      }
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao criar tipo de consulta.' });
  }
}

async function listTypes(req, res) {
  try {
    const { doctor_id: doctorId } = req.query || {};
    const types = doctorId
      ? await consultationTypeService.listConsultationTypesForDoctor(doctorId)
      : await consultationTypeService.listConsultationTypes();
    return res.status(200).json({ status: 'success', types });
  } catch (error) {
    console.error('Error in listTypes:', error);
    if (error.message === 'DOCTOR_NOT_FOUND') {
      return res.status(404).json({ status: 'error', message: 'Médico não encontrado.' });
    }
    return res.status(500).json({ status: 'error', message: 'Erro ao listar tipos de consulta.' });
  }
}

async function updateType(req, res) {
  try {
    const { id } = req.params;
    const { name, duration, description } = req.body || {};

    try {
      await consultationTypeService.updateConsultationType(id, { name, duration, description });
      return res.status(200).json({ status: 'success', message: 'Tipo de consulta atualizado.' });
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ status: 'error', message: 'Tipo de consulta não encontrado.' });
      }
      if (error.message === 'DUPLICATE_NAME') {
        return res.status(409).json({ status: 'error', message: 'Já existe um tipo com esse nome.' });
      }
      if (error.message === 'INVALID_DURATION') {
        return res.status(400).json({ status: 'error', message: 'Duração inválida.' });
      }
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao atualizar tipo de consulta.' });
  }
}

async function deleteType(req, res) {
  try {
    const { id } = req.params;

    const existing = await consultationTypeService.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Tipo de consulta não encontrado.' });
    }

    const used = await consultationTypeService.existsAppointmentsUsingType(id);
    if (used) {
      return res.status(400).json({ status: 'error', message: 'Não é possível remover tipos em uso em agendamentos.' });
    }

    await consultationTypeService.deleteConsultationType(id);
    return res.status(200).json({ status: 'success', message: 'Tipo de consulta removido.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao remover tipo de consulta.' });
  }
}

module.exports = {
  createType,
  listTypes,
  updateType,
  deleteType
};
