require('dotenv').config();
const pool = require('./src/config/db');

async function checkAppt19() {
    try {
        const [rows] = await pool.execute(`
      SELECT id, patient_id, date, time 
      FROM appointments 
      WHERE id = 19
    `);
        console.log('Appointment 19:', rows[0]);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAppt19();
