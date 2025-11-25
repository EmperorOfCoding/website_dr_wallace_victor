const express = require('express');
const doctorController = require('../controllers/doctorController');

const router = express.Router();

router.get('/api/doctors', doctorController.listDoctors);

module.exports = router;
