require('dotenv').config();
const pool = require('./src/config/db');

async function checkAppt1() {
    try {
        const [rows] = await pool.execute(`
      SELECT id, patient_id, date, time, status 
      FROM appointments 
      WHERE id = 1
    `);
        console.log('Appointment 1:', rows[0]);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAppt1();
