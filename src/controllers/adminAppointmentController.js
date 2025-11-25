const adminAppointmentService = require('../services/adminAppointmentService');
const appointmentService = require('../services/appointmentService');
const blockedTimeService = require('../services/blockedTimeService');

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

async function listAppointments(req, res) {
  try {
    const { date, page = 1, limit = 10, patient: search = '' } = req.query || {};
    const doctorId = req.user?.doctor_id;

    if (date && !isValidDate(date)) {
      return res.status(400).json({ status: 'error', message: 'Data inválida.' });
    }

    const result = await adminAppointmentService.getAppointments({ date, page, limit, search, doctorId });

    const appointments = result.appointments.map((item) => ({
      appointment_id: item.appointment_id,
      date: item.date,
      time: item.time,
      type_id: item.type_id,
      patient_name: item.patient_name,
      patient_email: item.patient_email,
      doctor_id: item.doctor_id
    }));

    return res.status(200).json({
      status: 'success',
      appointments,
      page: result.page,
      totalPages: result.totalPages,
      total: result.total
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao listar agendamentos.' });
  }
}

async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { date, time, type_id: typeId } = req.body || {};

    if (!date || !time || !typeId) {
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

    const conflict = await adminAppointmentService.checkAppointmentConflict(date, time, id);
    if (conflict) {
      return res.status(409).json({ status: 'error', message: 'Horário indisponível.' });
    }

    const isBlocked = await blockedTimeService.isBlocked(date, time);
    if (isBlocked) {
      return res.status(409).json({ status: 'error', message: 'Horário indisponível.' });
    }

    await adminAppointmentService.updateAppointmentAdmin(id, { date, time, typeId });

    return res.status(200).json({ status: 'success', message: 'Agendamento atualizado.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao atualizar agendamento.' });
  }
}

async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;

    const appointment = await appointmentService.checkAppointmentExists(id);
    if (!appointment) {
      return res.status(404).json({ status: 'error', message: 'Agendamento não encontrado.' });
    }

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Não é possível remover agendamentos passados.' });
    }

    await adminAppointmentService.deleteAppointmentAdmin(id);
    return res.status(200).json({ status: 'success', message: 'Agendamento removido.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao remover agendamento.' });
  }
}

module.exports = {
  listAppointments,
  updateAppointment,
  deleteAppointment
};
