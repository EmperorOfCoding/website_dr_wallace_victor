require('dotenv').config();
const pool = require('./src/config/db');

async function fixVerify() {
    try {
        console.log('Updating document 24...');
        const [updateResult] = await pool.execute(`
      UPDATE patient_documents 
      SET patient_id = 2 
      WHERE id = 24
    `);
        console.log('Update result:', updateResult);

        console.log('Verifying document 24...');
        const [rows] = await pool.execute(`SELECT * FROM patient_documents WHERE id = 24`);
        console.log('Document 24:', rows[0]);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixVerify();
