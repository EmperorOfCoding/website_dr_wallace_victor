const pool = require('../config/db');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

async function getDocumentById(documentId) {
  const [rows] = await pool.execute(
    `SELECT * FROM patient_documents WHERE id = ?`,
    [documentId]
  );
  return rows[0] || null;
}

async function getDocumentsByPatientId(patientId, limit = 100) {
  const [rows] = await pool.execute(
    `SELECT * FROM patient_documents 
     WHERE patient_id = ?
     ORDER BY uploaded_at DESC
     LIMIT ${parseInt(limit)}`,
    [parseInt(patientId)]
  );
  return rows;
}

async function getDocumentsByAppointmentId(appointmentId) {
  const [rows] = await pool.execute(
    `SELECT * FROM patient_documents 
     WHERE appointment_id = ?
     ORDER BY uploaded_at DESC`,
    [appointmentId]
  );
  return rows;
}

async function saveDocument(patientId, file, appointmentId = null, description = null, examRequestId = null, type = 'document') {
  await ensureUploadDir();

  // Generate unique filename
  const ext = path.extname(file.originalname);
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Save file to disk
  await fs.writeFile(filepath, file.buffer);

  // Save record to database
  const [result] = await pool.execute(
    `INSERT INTO patient_documents 
     (patient_id, appointment_id, filename, original_name, mimetype, size_bytes, description, exam_request_id, type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patientId,
      appointmentId,
      filename,
      file.originalname,
      file.mimetype,
      file.size,
      description,
      examRequestId,
      type
    ]
  );

  // Fetch the complete document record including uploaded_at
  const document = await getDocumentById(result.insertId);

  return document || {
    id: result.insertId,
    patient_id: patientId,
    appointment_id: appointmentId,
    filename,
    original_name: file.originalname,
    mimetype: file.mimetype,
    size_bytes: file.size,
    description,
    exam_request_id: examRequestId,
    type,
    uploaded_at: new Date().toISOString(),
  };
}

async function deleteDocument(documentId, patientId) {
  // Get document info
  const document = await getDocumentById(documentId);
  if (!document) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  // Verify ownership - compare as numbers to avoid type mismatch issues
  // If patientId is null (admin/doctor), skip check
  if (patientId !== null && Number(document.patient_id) !== Number(patientId)) {
    throw new Error('UNAUTHORIZED');
  }

  // Delete file from disk
  const filepath = path.join(UPLOAD_DIR, document.filename);
  try {
    await fs.unlink(filepath);
  } catch (error) {
    // File might not exist, continue with DB deletion
  }

  // Delete record from database
  await pool.execute(
    `DELETE FROM patient_documents WHERE id = ?`,
    [documentId]
  );

  return true;
}

async function getDocumentPath(documentId) {
  const document = await getDocumentById(documentId);
  if (!document) {
    return null;
  }
  return path.join(UPLOAD_DIR, document.filename);
}

module.exports = {
  getDocumentById,
  getDocumentsByPatientId,
  getDocumentsByAppointmentId,
  saveDocument,
  deleteDocument,
  getDocumentPath,
};


