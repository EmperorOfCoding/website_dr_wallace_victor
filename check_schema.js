require('dotenv').config();
const pool = require('./src/config/db');

async function checkSchema() {
    try {
        const [rows] = await pool.execute("DESCRIBE patient_documents");
        console.log('Schema:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
