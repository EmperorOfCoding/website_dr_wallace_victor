const calendarService = require('../services/calendarService');
const pool = require('../config/db');

async function downloadAppointmentIcal(req, res) {
  try {
    const { id } = req.params;
    const patientId = req.user?.patient_id;

    // Verify ownership
    const [rows] = await pool.execute(
      'SELECT patient_id FROM appointments WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Consulta não encontrada.' });
    }

    const isAdmin = req.user?.doctor_id;
    if (!isAdmin && rows[0].patient_id !== patientId) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
    }

    const icalContent = await calendarService.generateICalForAppointment(id);
    if (!icalContent) {
      return res.status(404).json({ status: 'error', message: 'Consulta não encontrada.' });
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="consulta-${id}.ics"`);
    return res.send(icalContent);
  } catch (error) {
    console.error('Error generating iCal:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao gerar arquivo.' });
  }
}

async function downloadAllAppointmentsIcal(req, res) {
  try {
    const patientId = req.user?.patient_id;
    
    if (!patientId) {
      return res.status(401).json({ status: 'error', message: 'Não autorizado.' });
    }

    const icalContent = await calendarService.generateICalForPatient(patientId);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="minhas-consultas.ics"');
    return res.send(icalContent);
  } catch (error) {
    console.error('Error generating iCal:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao gerar arquivo.' });
  }
}

async function getGoogleCalendarUrl(req, res) {
  try {
    const { id } = req.params;
    const patientId = req.user?.patient_id;

    const [rows] = await pool.execute(
      `SELECT a.*, 
              d.name as doctorName,
              at.name as typeName, at.duration_minutes as durationMinutes
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN appointment_types at ON a.type_id = at.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Consulta não encontrada.' });
    }

    const appointment = rows[0];
    const isAdmin = req.user?.doctor_id;
    
    if (!isAdmin && appointment.patient_id !== patientId) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado.' });
    }

    const url = calendarService.generateGoogleCalendarUrl(appointment);
    return res.status(200).json({ status: 'success', url });
  } catch (error) {
    console.error('Error generating Google Calendar URL:', error);
    return res.status(500).json({ status: 'error', message: 'Erro ao gerar link.' });
  }
}

module.exports = {
  downloadAppointmentIcal,
  downloadAllAppointmentsIcal,
  getGoogleCalendarUrl,
};


