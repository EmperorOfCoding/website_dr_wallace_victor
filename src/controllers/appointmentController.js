const appointmentService = require('../services/appointmentService');
const reviewService = require('../services/reviewService');
const { scheduleNotifications, cancelNotifications, sendBookingConfirmation, sendCancellationNotification } = require('../services/notificationService');
const pool = require('../config/db');
const AppointmentDTO = require('../dto/appointmentDTO');
const { isAdmin, canAccess } = require('../utils/dtoUtils');

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
      rescheduled_from: rescheduledFrom,
      notes,
      modality = 'presencial',
    } = req.body || {};

    // Debug logging
    console.log('📋 Booking request body:', {
      patientId,
      date,
      time,
      typeId,
      doctorId,
      modality,
      notes,
      rescheduledFrom
    });

    if (!patientId || !date || !time || !typeId) {
      console.error('❌ Missing fields:', {
        hasPatientId: !!patientId,
        hasDate: !!date,
        hasTime: !!time,
        hasTypeId: !!typeId
      });
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

    const isAvailable = await appointmentService.isSlotAvailable(date, time, doctorId, rescheduledFrom);
    if (!isAvailable) {
      return res.status(409).json({ status: 'error', message: 'Horário indisponível.' });
    }

    const appointmentId = await appointmentService.createAppointment({
      patientId,
      date,
      time,
      typeId,
      doctorId,
      status,
      rescheduledFrom: rescheduledFrom ? parseInt(rescheduledFrom) : null,
      notes,
      modality,
    });

    // Schedule notifications and send confirmation
    try {
      await scheduleNotifications(appointmentId, patientId, date, time);
      await sendBookingConfirmation(appointmentId);
    } catch (notifError) {
      console.error('Error scheduling notifications:', notifError);
      // Don't fail the request if notifications fail
    }

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
    const { patient_id: requestedPatientId, page = 1, limit = 10 } = req.query || {};
    const userIsAdmin = isAdmin(req.user);

    // Determine which patient_id to use
    let patientId;
    if (requestedPatientId) {
      // Validate that user can access this patient's data
      if (!canAccess(req.user, requestedPatientId)) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
      }
      patientId = requestedPatientId;
    } else {
      // Use authenticated user's patient_id
      patientId = req.user?.patient_id;
    }

    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'Paciente é obrigatório.' });
    }

    const { appointments, pagination } = await appointmentService.listAppointmentsByPatient(
      patientId,
      Number(page),
      Number(limit)
    );

    // Apply DTOs based on user role
    const formattedAppointments = appointments.map(appt => {
      const dto = AppointmentDTO.toListDTO(appt, userIsAdmin);
      // Add hasReview flag for frontend compatibility
      return {
        ...dto,
        hasReview: !!appt.reviewId,
      };
    });

    return res.status(200).json({
      status: 'success',
      appointments: formattedAppointments,
      pagination
    });
  } catch (error) {
    console.error("Erro em listAppointments: ", error);
    return res.status(500).json({ status: 'error', message: 'Erro ao consultar agendamentos.' });
  }
}

async function getAppointmentById(req, res) {
  try {
    const { id } = req.params;
    const patientId = req.user?.patient_id;

    const [rows] = await pool.execute(
      `SELECT a.*, 
              at.name as typeName, at.duration_minutes as durationMinutes,
              d.name as doctorName,
              p.name as patientName, p.email as patientEmail, p.phone as patientPhone
       FROM appointments a
       LEFT JOIN appointment_types at ON a.type_id = at.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Consulta não encontrada.' });
    }

    const appointment = rows[0];

    // Check ownership (patient can only see their own, admin can see all)
    const userIsAdmin = isAdmin(req.user);
    if (!canAccess(req.user, appointment.patient_id)) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
    }

    // Get review if exists
    const review = await reviewService.getReviewByAppointmentId(id);

    // Apply DTO based on user role
    const appointmentDTO = userIsAdmin
      ? AppointmentDTO.toAdminDTO(appointment)
      : AppointmentDTO.toPatientDTO(appointment);

    return res.status(200).json({
      status: 'success',
      appointment: appointmentDTO,
      review,
    });
  } catch (error) {
    console.error("Erro em getAppointmentById: ", error);
    return res.status(500).json({ status: 'error', message: 'Erro ao buscar consulta.' });
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

    // Validate ownership
    if (!canAccess(req.user, appointment.patient_id)) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
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

    // Reschedule notifications
    try {
      await cancelNotifications(id);
      await scheduleNotifications(id, appointment.patient_id, date, time);
    } catch (notifError) {
      console.error('Error rescheduling notifications:', notifError);
    }

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

    // Validate ownership
    if (!canAccess(req.user, appointment.patient_id)) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
    }

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Não é possível cancelar um agendamento passado.' });
    }

    await appointmentService.deleteAppointment(id);

    // Cancel notifications
    try {
      await cancelNotifications(id);
    } catch (notifError) {
      console.error('Error canceling notifications:', notifError);
    }

    return res.status(200).json({ status: 'success', message: 'Agendamento cancelado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Erro ao cancelar agendamento.' });
  }
}

async function cancelAppointmentWithReason(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const appointment = await appointmentService.checkAppointmentExists(id);
    if (!appointment) {
      return res.status(404).json({ status: 'error', message: 'Agendamento não encontrado.' });
    }

    // Validate ownership
    if (!canAccess(req.user, appointment.patient_id)) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
    }

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({ status: 'error', message: 'Não é possível cancelar um agendamento passado.' });
    }

    // Update status to cancelled with reason
    await pool.execute(
      `UPDATE appointments 
       SET status = 'cancelled', 
           cancellation_reason = ?, 
           cancelled_at = NOW()
       WHERE id = ?`,
      [reason || null, id]
    );

    // Cancel notifications and send cancellation email
    try {
      await cancelNotifications(id);
      await sendCancellationNotification(id, reason);
    } catch (notifError) {
      console.error('Error handling cancellation notifications:', notifError);
    }

    return res.status(200).json({ status: 'success', message: 'Agendamento cancelado com sucesso.' });
  } catch (error) {
    console.error('Error canceling appointment:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao cancelar agendamento.' });
  }
}

module.exports = {
  createAppointment,
  listAppointments,
  getAppointmentById,
  getAvailableAppointments,
  updateAppointment,
  cancelAppointment,
  cancelAppointmentWithReason,
};
