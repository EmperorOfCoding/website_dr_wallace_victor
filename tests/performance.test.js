const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const appointmentService = require('../src/services/appointmentService');

// Mock authentication middleware to bypass login
jest.mock('../src/middlewares/authAdmin', () => {
    return (req, res, next) => {
        req.user = { id: 1, patient_id: 1, email: 'test@example.com' };
        next();
    };
});

// Mock database pool to track queries
const originalExecute = pool.execute;
const queryLog = [];

pool.execute = async function (...args) {
    queryLog.push(args[0]);
    return originalExecute.apply(this, args);
};

describe('Performance Tests', () => {
    beforeEach(() => {
        queryLog.length = 0; // Clear query log
    });

    afterAll(async () => {
        pool.execute = originalExecute; // Restore original execute
        await pool.end();
    });

    it('should not have N+1 queries when listing appointments', async () => {
        // 1. Setup: Ensure there are multiple appointments for patient 1
        // We'll mock the service response instead of inserting into DB to keep it fast and isolated
        // But wait, the controller calls the service, and we want to test the controller -> service -> db flow
        // So we should probably mock the service methods if we want to test just the controller logic,
        // OR we rely on the fact that we are mocking the DB execute.

        // Let's rely on mocking the DB response for listAppointmentsByPatient and getReviewByAppointmentId
        // actually, the N+1 happens in the controller:
        // const appointments = await appointmentService.listAppointmentsByPatient(patientId);
        // appointments.map(async (appt) => { const review = await reviewService.getReviewByAppointmentId(appt.id); ... })

        // So we need to see how many times `SELECT ... FROM reviews` is called.

        // Mock appointmentService.listAppointmentsByPatient to return 5 appointments
        const mockAppointments = Array(5).fill(null).map((_, i) => ({
            id: i + 1,
            date: '2024-01-01',
            time: '10:00',
            status: 'completed',
            typeId: 1,
            typeName: 'General',
            durationMinutes: 30
        }));

        jest.spyOn(appointmentService, 'listAppointmentsByPatient').mockResolvedValue({
            appointments: mockAppointments,
            pagination: { total: 5, page: 1, limit: 10, pages: 1 }
        });

        // We don't mock reviewService because we want to see the queries it generates.
        // However, reviewService uses the pool, which we have spied on.

        const res = await request(app).get('/api/appointments?patient_id=1');

        expect(res.status).toBe(200);
        expect(res.body.appointments).toHaveLength(5);

        // Count review queries
        const reviewQueries = queryLog.filter(q => q.includes('reviews') || q.includes('SELECT * FROM reviews'));

        // If N+1 exists, we expect 5 review queries (one per appointment)
        // If fixed, we expect 1 query (or 0 if done via JOIN in the first query)

        console.log(`Number of review queries: ${reviewQueries.length}`);

        // We expect this to FAIL initially if N+1 is present
        expect(reviewQueries.length).toBeLessThanOrEqual(1);
    });
});
