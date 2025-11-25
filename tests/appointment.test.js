const request = require('supertest');
const app = require('../src/app');

describe('Appointment API', () => {
    describe('GET /api/appointments/available', () => {
        it('should return 400 for invalid date', async () => {
            const response = await request(app)
                .get('/api/appointments/available')
                .query({ date: 'invalid-date' });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        it('should return 400 for past date', async () => {
            const response = await request(app)
                .get('/api/appointments/available')
                .query({ date: '2020-01-01' });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        it('should return available times for valid future date', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const dateStr = futureDate.toISOString().split('T')[0];

            const response = await request(app)
                .get('/api/appointments/available')
                .query({ date: dateStr, doctor_id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('available_times');
            expect(Array.isArray(response.body.available_times)).toBe(true);
        });
    });

    describe('GET /api/consultation-types', () => {
        it('should return list of consultation types', async () => {
            const response = await request(app)
                .get('/api/consultation-types')
                .query({ doctor_id: 1 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('types');
            expect(Array.isArray(response.body.types)).toBe(true);
        });
    });

    describe('POST /api/appointments', () => {
        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/api/appointments')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        it('should return 400 for invalid date format', async () => {
            const response = await request(app)
                .post('/api/appointments')
                .send({
                    patient_id: 1,
                    date: 'invalid',
                    time: '10:00',
                    type_id: 1,
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        it('should return 400 for past date', async () => {
            const response = await request(app)
                .post('/api/appointments')
                .send({
                    patient_id: 1,
                    date: '2020-01-01',
                    time: '10:00',
                    type_id: 1,
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });
    });

    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('GET /api/doctors', () => {
        it('should return list of doctors', async () => {
            const response = await request(app).get('/api/doctors');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('doctors');
            expect(Array.isArray(response.body.doctors)).toBe(true);
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await request(app).get('/api/unknown-route');

            expect(response.status).toBe(404);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toBe('Rota não encontrada.');
        });
    });
});


