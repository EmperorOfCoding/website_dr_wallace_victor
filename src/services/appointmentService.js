const pool = require('../config/db');
const blockedTimeService = require('./blockedTimeService');
const doctorService = require('./doctorService');
const consultationTypeService = require('./consultationTypeService');
const doctorPatientService = require('./doctorPatientService');

const START_HOUR = 8;
const END_HOUR = 18;

function buildDailySlots() {
  const slots = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
    const hourStr = hour.toString().padStart(2, '0');
    slots.push(`${hourStr}:00`);
  }
  return slots;
}

async function isSlotAvailable(date, time, doctorId = 1, excludeAppointmentId = null) {
  const blocked = await blockedTimeService.isBlocked(date, time);
  if (blocked) return false;

  const params = [date, time, doctorId];
  let query = 'SELECT id FROM appointments WHERE date = ? AND time = ? AND doctor_id = ?';

  // Exclude the original appointment when rescheduling
  if (excludeAppointmentId) {
    query += ' AND id != ?';
    params.push(excludeAppointmentId);
  }

  const [rows] = await pool.execute(query, params);
  return rows.length === 0;
}

async function checkAppointmentExists(id) {
  const [rows] = await pool.execute(
    'SELECT id, patient_id, type_id, date, time FROM appointments WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function isTimeAvailable(date, time, appointmentIdToIgnore, doctorId) {
  const blocked = await blockedTimeService.isBlocked(date, time);
  if (blocked) return false;

  const params = [date, time];
  let query = 'SELECT id FROM appointments WHERE date = ? AND time = ?';
  if (doctorId) {
    query += ' AND doctor_id = ?';
    params.push(doctorId);
  }

  if (appointmentIdToIgnore) {
    query += ' AND id <> ?';
    params.push(appointmentIdToIgnore);
  }

  const [rows] = await pool.execute(query, params);
  return rows.length === 0;
}

async function updateAppointment(id, { date, time, typeId }) {
  await pool.execute(
    'UPDATE appointments SET date = ?, time = ?, type_id = ? WHERE id = ?',
    [date, time, typeId, id]
  );
}

async function deleteAppointment(id) {
  await pool.execute('DELETE FROM appointments WHERE id = ?', [id]);
}

async function getAvailableTimes(date, doctorId = 1) {
  try {
    const [rows] = await pool.execute('SELECT time FROM appointments WHERE date = ? AND doctor_id = ?', [date, doctorId]);
    const [blockedRows] = await pool.execute('SELECT time FROM blocked_times WHERE date = ?', [date]);
    const occupied = new Set(rows.map((row) => row.time.slice(0, 5)));
    blockedRows.forEach((row) => occupied.add(row.time.slice(0, 5)));

    const slots = buildDailySlots();
    return slots.filter((slot) => !occupied.has(slot));
  } catch (error) {
    console.error('Error in getAvailableTimes:', error);
    return [];
  }
}

async function createAppointment({ patientId, date, time, typeId, doctorId = 1, status = 'scheduled', rescheduledFrom = null, notes = null, modality = 'presencial' }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const doctor = await doctorService.findDoctorById(doctorId);
    if (!doctor) {
      throw new Error('INVALID_DOCTOR');
    }

    // When rescheduling, exclude the original appointment from the conflict check
    const conflictCheckQuery = rescheduledFrom
      ? 'SELECT id FROM appointments WHERE date = ? AND time = ? AND doctor_id = ? AND id != ? FOR UPDATE'
      : 'SELECT id FROM appointments WHERE date = ? AND time = ? AND doctor_id = ? FOR UPDATE';
    const conflictCheckParams = rescheduledFrom
      ? [date, time, doctorId, rescheduledFrom]
      : [date, time, doctorId];

    const [existing] = await connection.execute(conflictCheckQuery, conflictCheckParams);

    if (existing.length > 0) {
      throw new Error('CONFLICT');
    }

    const [typeRows] = await connection.execute('SELECT id FROM appointment_types WHERE id = ?', [typeId]);
    if (typeRows.length === 0) {
      throw new Error('INVALID_TYPE');
    }

    const doctorTypes = await consultationTypeService.listConsultationTypesForDoctor(doctorId).catch(() => []);
    if (doctorTypes.length > 0) {
      const allowed = doctorTypes.some((t) => t.id === Number(typeId));
      if (!allowed) {
        throw new Error('TYPE_NOT_ALLOWED');
      }
    }

    // If rescheduling, cancel the original appointment
    if (rescheduledFrom) {
      await connection.execute(
        'UPDATE appointments SET status = ?, cancelled_at = NOW() WHERE id = ?',
        ['cancelled', rescheduledFrom]
      );
    }

    const [result] = await connection.execute(
      'INSERT INTO appointments (patient_id, doctor_id, date, time, type_id, status, rescheduled_from, notes, modality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [patientId, doctorId, date, time, typeId, status, rescheduledFrom, notes, modality]
    );

    // vincula paciente ao médico
    await doctorPatientService.linkDoctorPatient(doctorId, patientId, connection);

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listAppointmentsByPatient(patientId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  // Get total count for pagination
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as total FROM appointments WHERE patient_id = ?',
    [patientId]
  );
  const total = countRows[0].total;

  // Get appointments with review status
  const [rows] = await pool.execute(
    `
      SELECT 
        a.id,
        a.date,
        a.time,
        a.status,
        a.status,
        a.modality,
        a.type_id AS typeId,
        t.name AS typeName,
        t.duration_minutes AS durationMinutes,
        r.id AS reviewId,
        r.rating AS reviewRating
      FROM appointments a
      LEFT JOIN appointment_types t ON a.type_id = t.id
      LEFT JOIN appointment_reviews r ON a.id = r.appointment_id
      WHERE a.patient_id = ?
      ORDER BY a.date DESC, a.time DESC
      LIMIT ? OFFSET ?
    `,
    [patientId, limit.toString(), offset.toString()]
  );

  return {
    appointments: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
}

async function listAppointmentsByDoctor(doctorId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  // Get total count for pagination
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ?',
    [doctorId]
  );
  const total = countRows[0].total;

  // Get appointments with patient info and review status
  const [rows] = await pool.execute(
    `
      SELECT 
        a.id,
        a.date,
        a.time,
        a.status,
        a.modality,
        a.notes,
        a.cancellation_reason AS cancellationReason,
        a.type_id AS typeId,
        t.name AS typeName,
        t.duration_minutes AS durationMinutes,
        p.id AS patientId,
        p.name AS patientName,
        p.email AS patientEmail,
        p.phone AS patientPhone,
        r.id AS reviewId,
        r.rating AS reviewRating
      FROM appointments a
      LEFT JOIN appointment_types t ON a.type_id = t.id
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN appointment_reviews r ON a.id = r.appointment_id
      WHERE a.doctor_id = ?
      ORDER BY a.date DESC, a.time DESC
      LIMIT ? OFFSET ?
    `,
    [doctorId, limit.toString(), offset.toString()]
  );

  return {
    appointments: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  isSlotAvailable,
  checkAppointmentExists,
  isTimeAvailable,
  updateAppointment,
  deleteAppointment,
  getAvailableTimes,
  createAppointment,
  listAppointmentsByPatient,
  listAppointmentsByDoctor
};
