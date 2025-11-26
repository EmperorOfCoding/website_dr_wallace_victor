require('dotenv').config();
const pool = require('./src/config/db');

async function checkAppointments() {
    try {
        const [rows] = await pool.execute(`
      SELECT id, patient_id, date, time, notes 
      FROM appointments 
      ORDER BY id DESC 
      LIMIT 5
    `);
        console.log('Recent appointments:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAppointments();
