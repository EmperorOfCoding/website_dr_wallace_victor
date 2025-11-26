require('dotenv').config();
const pool = require('./src/config/db');

async function checkColumn() {
    try {
        const [rows] = await pool.execute("SHOW COLUMNS FROM appointments LIKE 'modality'");
        console.log('Column check:', rows);
        if (rows.length > 0) {
            console.log("Modality column exists!");
        } else {
            console.log("Modality column MISSING!");
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking column:', error);
        process.exit(1);
    }
}

checkColumn();
