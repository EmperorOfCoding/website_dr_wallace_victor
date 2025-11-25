const pool = require('../config/db');

function getDateRange(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
}

async function getMetrics(doctorId, period = 'month') {
  const { startDate, endDate } = getDateRange(period);
  
  // Build doctor filter - if null, get metrics for all doctors (admin view)
  const doctorCondition = doctorId ? 'AND doctor_id = ?' : '';
  const doctorParams = doctorId ? [doctorId] : [];

  // Total appointments
  const [totalRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM appointments 
     WHERE date BETWEEN ? AND ? ${doctorCondition}`,
    [startDate, endDate, ...doctorParams]
  );
  const totalAppointments = Number(totalRows[0].total) || 0;

  // Unique patients
  const [patientRows] = await pool.execute(
    `SELECT COUNT(DISTINCT patient_id) as total FROM appointments 
     WHERE date BETWEEN ? AND ? ${doctorCondition}`,
    [startDate, endDate, ...doctorParams]
  );
  const totalPatients = Number(patientRows[0].total) || 0;

  // Completed appointments
  const [completedRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM appointments 
     WHERE date BETWEEN ? AND ? AND status = 'completed' ${doctorCondition}`,
    [startDate, endDate, ...doctorParams]
  );
  const completedAppointments = Number(completedRows[0].total) || 0;

  // Cancelled appointments
  const [cancelledRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM appointments 
     WHERE date BETWEEN ? AND ? AND status = 'cancelled' ${doctorCondition}`,
    [startDate, endDate, ...doctorParams]
  );
  const cancelledAppointments = Number(cancelledRows[0].total) || 0;

  // Average rating - ensure it's a number
  const ratingQuery = doctorId
    ? `SELECT AVG(r.rating) as average FROM appointment_reviews r
       JOIN appointments a ON r.appointment_id = a.id
       WHERE a.date BETWEEN ? AND ? AND a.doctor_id = ?`
    : `SELECT AVG(r.rating) as average FROM appointment_reviews r
       JOIN appointments a ON r.appointment_id = a.id
       WHERE a.date BETWEEN ? AND ?`;
  const [ratingRows] = await pool.execute(
    ratingQuery,
    doctorId ? [startDate, endDate, doctorId] : [startDate, endDate]
  );
  // Parse as float and ensure it's a valid number (not NaN)
  const rawRating = parseFloat(ratingRows[0]?.average);
  const averageRating = isNaN(rawRating) ? 0 : rawRating;

  // Appointments by month
  const [monthlyRows] = await pool.execute(
    `SELECT DATE_FORMAT(date, '%Y-%m') as month, COUNT(*) as total 
     FROM appointments 
     WHERE date BETWEEN ? AND ? ${doctorCondition}
     GROUP BY month
     ORDER BY month`,
    [startDate, endDate, ...doctorParams]
  );
  const appointmentsByMonth = monthlyRows.map((row) => ({
    name: formatMonth(row.month),
    total: Number(row.total) || 0,
  }));

  // Appointments by type
  const [typeRows] = await pool.execute(
    `SELECT at.name, COUNT(*) as count 
     FROM appointments a
     JOIN appointment_types at ON a.type_id = at.id
     WHERE a.date BETWEEN ? AND ? ${doctorCondition.replace('doctor_id', 'a.doctor_id')}
     GROUP BY at.id, at.name`,
    [startDate, endDate, ...doctorParams]
  );
  const appointmentsByType = typeRows.map((row) => ({
    name: row.name,
    value: Number(row.count) || 0,
  }));

  // Appointments by status
  const [statusRows] = await pool.execute(
    `SELECT status, COUNT(*) as count 
     FROM appointments 
     WHERE date BETWEEN ? AND ? ${doctorCondition}
     GROUP BY status`,
    [startDate, endDate, ...doctorParams]
  );
  const appointmentsByStatus = statusRows.map((row) => ({
    name: formatStatus(row.status),
    value: Number(row.count) || 0,
  }));

  // Appointments by hour
  const [hourRows] = await pool.execute(
    `SELECT HOUR(time) as hour, COUNT(*) as count 
     FROM appointments 
     WHERE date BETWEEN ? AND ? ${doctorCondition}
     GROUP BY hour
     ORDER BY hour`,
    [startDate, endDate, ...doctorParams]
  );
  const appointmentsByHour = hourRows.map((row) => ({
    hour: `${String(row.hour).padStart(2, '0')}:00`,
    count: Number(row.count) || 0,
  }));

  // Top patients
  const [topPatientsRows] = await pool.execute(
    `SELECT p.id, p.name, p.email, COUNT(*) as appointment_count,
            MAX(a.date) as last_visit
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     WHERE a.date BETWEEN ? AND ? ${doctorCondition.replace('doctor_id', 'a.doctor_id')}
     GROUP BY p.id, p.name, p.email
     ORDER BY appointment_count DESC
     LIMIT 10`,
    [startDate, endDate, ...doctorParams]
  );
  const topPatients = topPatientsRows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    appointmentCount: Number(row.appointment_count) || 0,
    lastVisit: row.last_visit,
  }));

  return {
    totalAppointments,
    totalPatients,
    completedAppointments,
    cancelledAppointments,
    averageRating,
    appointmentsByMonth,
    appointmentsByType,
    appointmentsByStatus,
    appointmentsByHour,
    topPatients,
  };
}

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}

function formatStatus(status) {
  const statusMap = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
  };
  return statusMap[status] || status;
}

module.exports = {
  getMetrics,
};


