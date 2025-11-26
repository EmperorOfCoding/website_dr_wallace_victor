const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';

async function run() {
    try {
        // 1. Login as Doctor
        console.log('Logging in...');
        const loginResp = await axios.post(`${BASE_URL}/admin/login`, {
            email: 'wallace@clinica.com',
            password: '112818WallaceVictor'
        });
        const token = loginResp.data.token;
        console.log('Login successful. Token obtained.');

        // 2. Upload Document
        console.log('Uploading document...');
        const form = new FormData();
        form.append('file', Buffer.from('dummy content'), { filename: 'test_doc.pdf', contentType: 'application/pdf' });
        form.append('patient_id', '1');
        form.append('description', 'Test upload via script');

        const uploadResp = await axios.post(`${BASE_URL}/documents/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Upload response:', uploadResp.data);

        // 3. List Documents
        console.log('Listing documents...');
        const listResp = await axios.get(`${BASE_URL}/documents?patient_id=1`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Documents list:', listResp.data);

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

run();
