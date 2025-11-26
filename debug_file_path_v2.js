require('dotenv').config();
const pool = require('./src/config/db');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents');

async function checkFile() {
    try {
        console.log('CWD:', process.cwd());
        console.log('UPLOAD_DIR:', UPLOAD_DIR);

        const [rows] = await pool.execute(`
      SELECT * FROM patient_documents 
      WHERE original_name LIKE '%Hemograma_Completo_Alice.pdf%'
      ORDER BY id DESC 
      LIMIT 1
    `);

        if (rows.length === 0) {
            console.log('Document record not found.');
            process.exit(0);
        }

        const doc = rows[0];
        console.log('DB Filename:', JSON.stringify(doc.filename));

        const expectedPath = path.join(UPLOAD_DIR, doc.filename);
        console.log('Expected Path:', JSON.stringify(expectedPath));

        const exists = fs.existsSync(expectedPath);
        console.log('fs.existsSync(expectedPath):', exists);

        if (fs.existsSync(UPLOAD_DIR)) {
            const files = fs.readdirSync(UPLOAD_DIR);
            console.log('Directory files:', files);

            const found = files.find(f => f === doc.filename);
            console.log('Found in directory via string match:', !!found);

            if (found) {
                console.log('File in dir:', JSON.stringify(found));
                console.log('Match?', found === doc.filename);
            }
        } else {
            console.log('Upload dir does not exist.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkFile();
