require('dotenv').config();
const fs = require('fs').promises;
const pool = require('./src/config/db');

async function applyChanges() {
    try {
        const sql = await fs.readFile('create_exam_tables.sql', 'utf8');
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await pool.query(statement);
                    console.log('Executed:', statement.substring(0, 50) + '...');
                } catch (err) {
                    // Ignore "Duplicate column name" errors (code 1060)
                    if (err.errno === 1060) {
                        console.log('Column already exists, skipping.');
                    } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log('Table already exists, skipping.');
                    } else {
                        console.error('Error executing statement:', err);
                        // Don't exit, try next statement (e.g. table might exist but columns not)
                    }
                }
            }
        }
        console.log('Database changes applied.');
        process.exit(0);
    } catch (error) {
        console.error('Error applying changes:', error);
        process.exit(1);
    }
}

applyChanges();
