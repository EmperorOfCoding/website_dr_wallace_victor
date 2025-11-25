const icalGenerator = require('ical-generator');
const pool = require('../config/db');

async function generateICalForAppointment(appointmentId) {
    const [rows] = await pool.execute(
        `SELECT a.*, 
            p.name as patient_name, p.email as patient_email,
            d.name as doctor_name, d.email as doctor_email,
            at.name as type_name, at.duration_minutes
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN appointment_types at ON a.type_id = at.id
     WHERE a.id = ?`,
        [appointmentId]
    );

    if (rows.length === 0) {
        return null;
    }

    const appointment = rows[0];
    const startDate = new Date(`${appointment.date}T${appointment.time}`);
    const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 30) * 60000);

    const calendar = icalGenerator({
        name: 'Dr. Wallace Victor - Consultas',
        prodId: '//Dr. Wallace Victor//Agendamento//PT',
    });

    calendar.createEvent({
        start: startDate,
        end: endDate,
        summary: `Consulta - ${appointment.type_name}`,
        description: `Consulta médica com ${appointment.doctor_name}\nTipo: ${appointment.type_name}\nPaciente: ${appointment.patient_name}`,
        location: 'Consultório Dr. Wallace Victor',
        organizer: {
            name: appointment.doctor_name,
            email: appointment.doctor_email || 'contato@drwallacevictor.com',
        },
        attendees: [
            {
                name: appointment.patient_name,
                email: appointment.patient_email,
                rsvp: true,
            },
        ],
        alarms: [
            { type: 'display', trigger: 24 * 60 * 60 }, // 24 hours before
            { type: 'display', trigger: 60 * 60 }, // 1 hour before
        ],
    });

    return calendar.toString();
}

async function generateICalForPatient(patientId) {
    const [rows] = await pool.execute(
        `SELECT a.*, 
            d.name as doctor_name, d.email as doctor_email,
            at.name as type_name, at.duration_minutes
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     JOIN appointment_types at ON a.type_id = at.id
     WHERE a.patient_id = ? AND a.status != 'cancelled'
     ORDER BY a.date, a.time`,
        [patientId]
    );

    const calendar = icalGenerator({
        name: 'Minhas Consultas - Dr. Wallace Victor',
        prodId: '//Dr. Wallace Victor//Agendamento//PT',
    });

    rows.forEach((appointment) => {
        const startDate = new Date(`${appointment.date}T${appointment.time}`);
        const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 30) * 60000);

        calendar.createEvent({
            uid: `appointment-${appointment.id}@drwallacevictor.com`,
            start: startDate,
            end: endDate,
            summary: `Consulta - ${appointment.type_name}`,
            description: `Consulta médica com ${appointment.doctor_name}\nTipo: ${appointment.type_name}`,
            location: 'Consultório Dr. Wallace Victor',
            status: appointment.status === 'scheduled' ? 'CONFIRMED' : 'TENTATIVE',
            alarms: [
                { type: 'display', trigger: 24 * 60 * 60 },
                { type: 'display', trigger: 60 * 60 },
            ],
        });
    });

    return calendar.toString();
}

function generateGoogleCalendarUrl(appointment) {
    const startDate = new Date(`${appointment.date}T${appointment.time}`);
    const endDate = new Date(startDate.getTime() + (appointment.durationMinutes || 30) * 60000);

    const formatDateTime = (date) => {
        return date.toISOString().replace(/-|:|\.\d{3}/g, '');
    };

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `Consulta - ${appointment.typeName}`,
        dates: `${formatDateTime(startDate)}/${formatDateTime(endDate)}`,
        details: `Consulta médica com ${appointment.doctorName}\nTipo: ${appointment.typeName}`,
        location: 'Consultório Dr. Wallace Victor',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

module.exports = {
    generateICalForAppointment,
    generateICalForPatient,
    generateGoogleCalendarUrl,
};


