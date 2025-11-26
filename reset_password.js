require('dotenv').config();
const authService = require('./src/services/authService');
const pool = require('./src/config/db');

async function resetPass() {
    try {
        console.log("Resetting password for alice@example.com...");
        // Find Alice
        const [rows] = await pool.execute('SELECT id FROM patients WHERE email = ?', ['alice@example.com']);
        if (rows.length === 0) {
            console.error("Alice not found!");
            process.exit(1);
        }
        const aliceId = rows[0].id;

        // Hash "senha123"
        const newHash = await authService.hashPassword('senha123');

        // Update DB
        await pool.execute('UPDATE patients SET password_hash = ? WHERE id = ?', [newHash, aliceId]);

        console.log("Password reset successfully to 'senha123'");
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPass();
