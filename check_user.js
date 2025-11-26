require('dotenv').config();
const pool = require('./src/config/db');

async function checkUser() {
    try {
        console.log("Attempting to connect with dotenv config...");
        console.log("DB_USER:", process.env.DB_USER); // Debug print (be careful with logs, but user is local)

        const [rows] = await pool.execute('SELECT id, name, email FROM patients WHERE email = ?', ['alice@example.com']);
        console.log('User found:', rows);
        process.exit(0);
    } catch (error) {
        console.error('Error checking user:', error);
        process.exit(1);
    }
}

checkUser();
