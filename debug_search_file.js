require('dotenv').config();
const pool = require('./src/config/db');
const path = require('path');
const fs = require('fs');

async function searchFile() {
    try {
        const [rows] = await pool.execute(`SELECT * FROM patient_documents WHERE id = 4`);
        if (rows.length === 0) {
            console.log('Document 4 not found in DB.');
            process.exit(0);
        }
        const doc = rows[0];
        console.log('Looking for:', doc.filename);

        const potentialDirs = [
            path.join(__dirname, 'uploads', 'documents'),
            path.join(__dirname, 'frontend', 'uploads', 'documents'),
            path.join(__dirname, 'src', 'uploads', 'documents'),
            path.join(__dirname, '..', 'uploads', 'documents'),
        ];

        let found = false;
        for (const dir of potentialDirs) {
            const fullPath = path.join(dir, doc.filename);
            console.log(`Checking: ${fullPath}`);
            if (fs.existsSync(fullPath)) {
                console.log(`FOUND at: ${fullPath}`);
                found = true;
                // Optional: Copy it to the correct place?
                // For now just report.
            }
        }

        if (!found) {
            console.log('File not found in any common location.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

searchFile();
