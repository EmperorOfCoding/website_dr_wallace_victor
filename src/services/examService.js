const pool = require('../config/db');

async function createExamRequest({ patient_id, doctor_id, appointment_id, exam_name }) {
    const [result] = await pool.execute(
        'INSERT INTO exam_requests (patient_id, doctor_id, appointment_id, exam_name, status) VALUES (?, ?, ?, ?, ?)',
        [patient_id, doctor_id, appointment_id, exam_name, 'requested']
    );
    return result.insertId;
}

async function getExamRequestsByPatient(patientId) {
    const [rows] = await pool.execute(
        `SELECT er.*, d.name as doctor_name, pd.id as document_id, pd.filename, pd.original_name
     FROM exam_requests er
     JOIN doctors d ON er.doctor_id = d.id
     LEFT JOIN patient_documents pd ON pd.exam_request_id = er.id
     WHERE er.patient_id = ?
     ORDER BY er.created_at DESC`,
        [patientId]
    );
    return rows;
}

async function getExamRequestsByDoctor(doctorId) {
    // This might be useful for the doctor to see all exams they requested
    const [rows] = await pool.execute(
        `SELECT er.*, p.name as patient_name
       FROM exam_requests er
       JOIN patients p ON er.patient_id = p.id
       WHERE er.doctor_id = ?
       ORDER BY er.created_at DESC`,
        [doctorId]
    );
    return rows;
}

async function updateExamRequestStatus(id, status) {
    await pool.execute(
        'UPDATE exam_requests SET status = ? WHERE id = ?',
        [status, id]
    );
}

module.exports = {
    createExamRequest,
    getExamRequestsByPatient,
    getExamRequestsByDoctor,
    updateExamRequestStatus
};
