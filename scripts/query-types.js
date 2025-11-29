const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../src/config/db');

async function main() {
    try {
        const [rows] = await pool.execute(
            'SELECT id, name, duration_minutes, description FROM appointment_types ORDER BY created_at DESC'
        );

        console.log(JSON.stringify(rows, null, 2));
        console.log('\nTotal:', rows.length, 'tipos de consulta');
    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        pool.end();
    }
}

main();
