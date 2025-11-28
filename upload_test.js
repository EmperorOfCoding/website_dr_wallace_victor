const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function debugUpload() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginResp = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'teste@exemplo.com',
            password: 'password123'
        }).catch(async (err) => {
            if (err.response?.status === 401 || err.response?.status === 404) {
                // Try registering
                console.log('Login failed, trying to register...');
                return await axios.post('http://localhost:3000/api/auth/register', {
                    name: 'Test User',
                    email: 'teste@exemplo.com',
                    phone: '11999999999',
                    password: 'password123'
                });
            }
            throw err;
        });

        let token;
        if (loginResp.data.token) {
            token = loginResp.data.token;
        } else {
            // If we just registered, we need to login
            const loginAfterRegister = await axios.post('http://localhost:3000/api/auth/login', {
                email: 'teste@exemplo.com',
                password: 'password123'
            });
            token = loginAfterRegister.data.token;
        }

        console.log('Got token:', token);

        // 2. Create a dummy file
        const filePath = path.join(__dirname, 'test_image.png');
        fs.writeFileSync(filePath, 'fake image content');

        // 3. Upload
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        // form.append('type', 'document');

        console.log('Uploading file...');
        const uploadResp = await axios.post('http://localhost:3000/api/documents/upload', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Upload success:', uploadResp.data);

    } catch (error) {
        console.error('Upload failed status:', error.response?.status);
        console.error('Upload failed data:', error.response?.data);
    }
}

debugUpload();
