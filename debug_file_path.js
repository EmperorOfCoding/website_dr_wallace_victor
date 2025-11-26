require('dotenv').config();
const pool = require('./src/config/db');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');

async function checkFile() {
    try {
        console.log('Searching for document "Hemograma_Completo_Alice.pdf"...');
        const [rows] = await pool.execute(`
      SELECT * FROM patient_documents 
      WHERE original_name LIKE '%Hemograma_Completo_Alice.pdf%'
      ORDER BY id DESC 
      LIMIT 1
    `);

        if (rows.length === 0) {
            console.log('Document record not found in database.');
        } else {
            const doc = rows[0];
            console.log('Document found in DB:', doc);

            const expectedPath = path.join(UPLOAD_DIR, doc.filename);
            console.log('Expected path:', expectedPath);

            if (fs.existsSync(expectedPath)) {
                console.log('File EXISTS at expected path.');
            } else {
                console.log('File does NOT exist at expected path.');

                // List directory contents to see what's there
                if (fs.existsSync(UPLOAD_DIR)) {
                    console.log('Contents of uploads/documents:');
                    const files = fs.readdirSync(UPLOAD_DIR);
                    console.log(files);
                } else {
                    console.log('Upload directory does not exist:', UPLOAD_DIR);
                }
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkFile();
