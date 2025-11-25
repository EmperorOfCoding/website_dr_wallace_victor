const appointmentService = require('../services/appointmentService');

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function isWithinWorkingHours(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours >= 8 && hours < 18 && minutes === 0;
}

async function createAppointment(req, res) {
  try {
    const {
      patient_id: patientId,
      date,
      time,
      type_id: typeId,
      doctor_id: doctorId = 1,
      status = 'scheduled',
    } = req.body || {};

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

    const isAvailable = await appointmentService.isSlotAvailable(date, time, doctorId);
    if (!isAvailable) {
      return res.status(409).json({ status: 'error', message: 'Horário indisponível.' });
    }

    const appointmentId = await appointmentService.createAppointment({ patientId, date, time, typeId, doctorId, status });
    return res.status(201).json({
      status: 'success',
      appointment_id: appointmentId,
      message: 'Consulta agendada com sucesso.',
    });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message === 'INVALID_TYPE') {
      return res.status(400).json({ status: 'error', message: 'Paciente ou tipo de consulta inválido.' });
    }
    if (error.message === 'INVALID_DOCTOR') {
      return res.status(400).json({ status: 'error', message: 'Médico inválido.' });
    }
    if (error.message === 'TYPE_NOT_ALLOWED') {
      return res.status(400).json({ status: 'error', message: 'Tipo de consulta não disponível para o médico escolhido.' });
    }
    if (error.message === 'CONFLICT') {
      return res.status(409).json({ status: 'error', message: 'Horário indisponível.' });
    }

    return res.status(500).json({ status: 'error', message: 'Erro ao agendar consulta.' });
  }
}

async function listAppointments(req, res) {
  try {
    const { patient_id: patientId } = req.query || {};

    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'Paciente é obrigatório.' });
    }

    const appointments = await appointmentService.listAppointmentsByPatient(patientId);
    return res.status(200).json({ status: 'success', appointments });
  } catch (error) {
    console.error("Erro em listAppointments: ", error);
    return res.status(500).json({ status: 'error', message: 'Erro ao consultar agendamentos.' });
  }
}

async function getAvailableAppointments(req, res) {
  try {
    const { date, doctor_id: doctorId = 1 } = req.query || {};

    if (!date || !isValidDate(date)) {
      return res.status(400).json({ status: 'error', message: 'Data inválida ou anterior a hoje.' });
    }

    const requestedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(requestedDate.getTime())) {
      return res.status(400).json({ status: 'error', message: 'Data inválida ou anterior a hoje.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return res.status(400).json({ status: 'error', message: 'Data inválida ou anterior a hoje.' });
    }

    const availableTimes = await appointmentService.getAvailableTimes(date, Number(doctorId));
    return res.status(200).json({ date, available_times: availableTimes });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao consultar horários disponíveis.' });
  }
}

async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { date, time, type_id: typeId } = req.body || {};

    if (!id || !date || !time) {
      return res.status(400).json({ status: 'error', message: 'Campos obrigatórios ausentes.' });
    }

    if (!isValidDate(date) || !isValidTime(time) || !isWithinWorkingHours(time)) {
      return res.status(400).json({ status: 'error', message: 'Data ou horário inválido.' });
    }

    const appointment = await appointmentService.checkAppointmentExists(id);
    if (!appointment) {
      return res.status(404).json({ status: 'error', message: 'Agendamento não encontrado.' });
    }

    const newDateTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(newDateTime.getTime()) || newDateTime <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Não é possível mover para um horário passado.' });
    }

    const originalDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (originalDateTime <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Não é possível editar um agendamento já encerrado.' });
    }

    const available = await appointmentService.isTimeAvailable(date, time, id, appointment.doctor_id);
    if (!available) {
      return res.status(409).json({ status: 'error', message: 'Horário indisponível.' });
    }

    const nextTypeId = typeId ?? appointment.type_id;
    await appointmentService.updateAppointment(id, { date, time, typeId: nextTypeId });

    return res.status(200).json({ status: 'success', message: 'Agendamento atualizado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao atualizar agendamento.' });
  }
}

async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;

    const appointment = await appointmentService.checkAppointmentExists(id);
    if (!appointment) {
      return res.status(404).json({ status: 'error', message: 'Agendamento não encontrado.' });
    }

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Não é possível cancelar um agendamento passado.' });
    }

    await appointmentService.deleteAppointment(id);
    return res.status(200).json({ status: 'success', message: 'Agendamento cancelado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao cancelar agendamento.' });
  }
}

module.exports = {
  createAppointment,
  listAppointments,
  getAvailableAppointments,
  updateAppointment,
  cancelAppointment,
};
