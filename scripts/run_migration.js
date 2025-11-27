const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dr_wallace_db',
        multipleStatements: true
    });

    try {
        console.log('Connected to database.');

        const sqlStatements = [
            `CREATE TABLE IF NOT EXISTS exam_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                appointment_id INT,
                exam_name VARCHAR(255) NOT NULL,
                status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id),
                FOREIGN KEY (doctor_id) REFERENCES doctors(id),
                FOREIGN KEY (appointment_id) REFERENCES appointments(id)
            );`,
            `ALTER TABLE appointments ADD COLUMN modality ENUM('presencial', 'online') DEFAULT 'presencial';`
        ];

        for (const sql of sqlStatements) {
            try {
                await connection.query(sql);
                console.log('Executed SQL statement successfully.');
            } catch (err) {
                // Ignore "Duplicate column name" error for ALTER TABLE
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else {
                    throw err;
                }
            }
        }

        console.log('Migration completed.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

runMigration();
