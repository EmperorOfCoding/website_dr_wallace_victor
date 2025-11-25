const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../src/config/db');

async function main() {
  try {
    const [rows] = await pool.execute('SELECT 1 AS ok');
    // eslint-disable-next-line no-console
    console.log('Conexão OK:', rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Falha na conexão:', err.message);
  } finally {
    pool.end();
  }
}

main();
