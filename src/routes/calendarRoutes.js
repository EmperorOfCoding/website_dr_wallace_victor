const express = require('express');
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middlewares/authAdmin');

const router = express.Router();

// Calendar export routes
router.get('/api/appointments/:id/ical', authMiddleware, calendarController.downloadAppointmentIcal);
router.get('/api/appointments/:id/google-calendar', authMiddleware, calendarController.getGoogleCalendarUrl);
router.get('/api/calendar/export', authMiddleware, calendarController.downloadAllAppointmentsIcal);

module.exports = router;


