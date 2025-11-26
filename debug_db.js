require('dotenv').config();
const pool = require('./src/config/db');

async function checkDocuments() {
    try {
        const [rows] = await pool.execute('SELECT * FROM patient_documents ORDER BY uploaded_at DESC LIMIT 5');
        console.log('Recent Documents:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDocuments();
