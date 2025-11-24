const express = require('express');
const authAdmin = require('../middlewares/authAdmin');
const patientController = require('../controllers/patientController');
const adminAppointmentController = require('../controllers/adminAppointmentController');
const adminBlockedTimeController = require('../controllers/adminBlockedTimeController');
const consultationTypeController = require('../controllers/consultationTypeController');

const router = express.Router();

router.get('/api/admin/patients', authAdmin, patientController.listPatients);
router.get('/api/admin/appointments', authAdmin, adminAppointmentController.listAppointments);
router.put('/api/admin/appointments/:id', authAdmin, adminAppointmentController.updateAppointment);
router.delete('/api/admin/appointments/:id', authAdmin, adminAppointmentController.deleteAppointment);
router.post('/api/admin/blocked-times', authAdmin, adminBlockedTimeController.createBlockedTime);
router.get('/api/admin/blocked-times', authAdmin, adminBlockedTimeController.listBlockedTimes);
router.delete('/api/admin/blocked-times/:id', authAdmin, adminBlockedTimeController.deleteBlockedTime);
router.post('/api/admin/consultation-types', authAdmin, consultationTypeController.createType);
router.get('/api/admin/consultation-types', authAdmin, consultationTypeController.listTypes);
router.put('/api/admin/consultation-types/:id', authAdmin, consultationTypeController.updateType);
router.delete('/api/admin/consultation-types/:id', authAdmin, consultationTypeController.deleteType);

module.exports = router;
