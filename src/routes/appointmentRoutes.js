const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const consultationTypeController = require('../controllers/consultationTypeController');

const router = express.Router();

router.post('/api/appointments', appointmentController.createAppointment);
router.get('/api/appointments', appointmentController.listAppointments);
router.get('/api/appointments/available', appointmentController.getAvailableAppointments);
router.put('/api/appointments/:id', appointmentController.updateAppointment);
router.delete('/api/appointments/:id', appointmentController.cancelAppointment);
router.post('/api/appointments/book', appointmentController.createAppointment);
router.get('/api/consultation-types', consultationTypeController.listTypes);

module.exports = router;
