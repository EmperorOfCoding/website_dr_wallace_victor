require('dotenv').config();
const pool = require('./src/config/db');

async function fixByAppt() {
    try {
        console.log('Fixing documents for appointment 19...');
        const [result] = await pool.execute(`
      UPDATE patient_documents 
      SET patient_id = 2 
      WHERE appointment_id = 19
    `);
        console.log('Update result:', result);

        const [rows] = await pool.execute(`SELECT * FROM patient_documents WHERE appointment_id = 19`);
        console.log('Documents for Appt 19:', rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixByAppt();
