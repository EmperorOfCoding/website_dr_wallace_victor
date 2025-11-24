const appointmentService = require('../services/appointmentService');

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

async function createAppointment(req, res) {
  try {
    const { patient_id: patientId, date, time, type_id: typeId } = req.body || {};

    if (!patientId || !date || !time || !typeId) {
      return res.status(400).json({ status: 'error', message: 'Campos obrigatórios ausentes.' });
    }

    if (!isValidDate(date) || !isValidTime(time)) {
      return res.status(400).json({ status: 'error', message: 'Formato de data ou horário inválido.' });
    }

    const appointmentDateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({ status: 'error', message: 'Data ou horário inválido.' });
    }

    const now = new Date();
    if (appointmentDateTime <= now) {
      return res.status(400).json({ status: 'error', message: 'Não é possível agendar no passado.' });
    }

    const isAvailable = await appointmentService.isSlotAvailable(date, time);
    if (!isAvailable) {
      return res.status(409).json({ status: 'error', message: 'Horário indisponível.' });
    }

    const appointmentId = await appointmentService.createAppointment({ patientId, date, time, typeId });
    return res.status(201).json({
      status: 'success',
      appointment_id: appointmentId,
      message: 'Consulta agendada com sucesso.'
    });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ status: 'error', message: 'Paciente ou tipo de consulta inválido.' });
    }

    if (error.message === 'CONFLICT') {
      return res.status(409).json({ status: 'error', message: 'Horário indisponível.' });
    }

    return res.status(500).json({ status: 'error', message: 'Erro ao agendar consulta.' });
  }
}

module.exports = {
  createAppointment
};
