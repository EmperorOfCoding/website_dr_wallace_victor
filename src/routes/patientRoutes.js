const express = require('express');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.get('/api/admin/patients', patientController.listPatients);

module.exports = router;
