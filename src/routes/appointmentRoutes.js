const express = require('express');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.post('/api/appointments', appointmentController.createAppointment);
router.get('/api/appointments/available', appointmentController.getAvailableAppointments);
router.put('/api/appointments/:id', appointmentController.updateAppointment);
router.delete('/api/appointments/:id', appointmentController.cancelAppointment);

module.exports = router;
