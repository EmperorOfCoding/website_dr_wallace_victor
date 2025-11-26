require('dotenv').config();
const pool = require('./src/config/db');
const path = require('path');
const fs = require('fs');

// Simulate the path logic in documentService.js
// We assume this script is in the root, so we need to adjust to match src/services
const SERVICE_DIR = path.join(__dirname, 'src', 'services');
const UPLOAD_DIR_SERVICE = path.join(SERVICE_DIR, '../../uploads/documents');

const UPLOAD_DIR_ROOT = path.join(__dirname, 'uploads', 'documents');

async function checkDoc4() {
    try {
        console.log('Root Dir:', __dirname);
        console.log('Service Dir (Simulated):', SERVICE_DIR);
        console.log('Upload Dir (Service Logic):', UPLOAD_DIR_SERVICE);
        console.log('Upload Dir (Root Logic):', UPLOAD_DIR_ROOT);

        const [rows] = await pool.execute(`SELECT * FROM patient_documents WHERE id = 4`);

        if (rows.length === 0) {
            console.log('Document 4 not found in DB.');
            process.exit(0);
        }

        const doc = rows[0];
        console.log('Document 4:', doc);

        const pathService = path.join(UPLOAD_DIR_SERVICE, doc.filename);
        const pathRoot = path.join(UPLOAD_DIR_ROOT, doc.filename);

        console.log('Checking path (Service):', pathService);
        console.log('Exists?', fs.existsSync(pathService));

        console.log('Checking path (Root):', pathRoot);
        console.log('Exists?', fs.existsSync(pathRoot));

        if (fs.existsSync(UPLOAD_DIR_ROOT)) {
            console.log('Listing uploads/documents:');
            const files = fs.readdirSync(UPLOAD_DIR_ROOT);
            console.log(files);

            const match = files.find(f => f === doc.filename);
            console.log('File found in directory?', !!match);
        } else {
            console.log('uploads/documents directory does not exist.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDoc4();
