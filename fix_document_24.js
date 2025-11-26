require('dotenv').config();
const pool = require('./src/config/db');

async function fixDocument() {
    try {
        console.log('Fixing document 24...');
        // We know from debug_appt19.js that appointment 19 belongs to patient 2
        const [result] = await pool.execute(`
      UPDATE patient_documents 
      SET patient_id = 2 
      WHERE id = 24 AND patient_id = 0
    `);
        console.log('Update result:', result);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixDocument();
