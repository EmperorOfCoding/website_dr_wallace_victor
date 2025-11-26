require('dotenv').config();
const pool = require('./src/config/db');

async function checkDocuments() {
    try {
        const [rows] = await pool.execute(`
      SELECT id, patient_id, appointment_id, original_name, uploaded_at 
      FROM patient_documents 
      ORDER BY id DESC 
      LIMIT 10
    `);
        console.log('Recent documents:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDocuments();
