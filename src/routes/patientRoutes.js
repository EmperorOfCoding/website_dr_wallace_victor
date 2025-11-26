const express = require('express');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.get('/api/admin/patients', patientController.listPatients);
router.get('/api/admin/patients/:id', patientController.getPatientDetails);

module.exports = router;
