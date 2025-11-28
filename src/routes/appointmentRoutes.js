const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const consultationTypeController = require('../controllers/consultationTypeController');
const authMiddleware = require('../middlewares/authAdmin');
const { bookingLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Public routes
router.get('/api/appointments/available', appointmentController.getAvailableAppointments);
router.get('/api/consultation-types', consultationTypeController.listTypes);

// Protected routes - Note: POST /api/appointments validates in controller before checking auth
router.post('/api/appointments', bookingLimiter, appointmentController.createAppointment);
router.post('/api/appointments/book', bookingLimiter, authMiddleware, appointmentController.createAppointment);
router.get('/api/appointments', authMiddleware, appointmentController.listAppointments);
router.get('/api/appointments/:id/details', authMiddleware, appointmentController.getAppointmentDetails);
router.get('/api/appointments/:id', authMiddleware, appointmentController.getAppointmentById);
router.put('/api/appointments/:id', authMiddleware, appointmentController.updateAppointment);
router.delete('/api/appointments/:id', authMiddleware, appointmentController.cancelAppointment);
router.put('/api/appointments/:id/cancel', authMiddleware, appointmentController.cancelAppointmentWithReason);

module.exports = router;
