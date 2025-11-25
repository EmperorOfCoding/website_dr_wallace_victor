const express = require('express');
const metricsController = require('../controllers/metricsController');
const authMiddleware = require('../middlewares/authAdmin');

const router = express.Router();

// Admin metrics routes
router.get('/api/admin/metrics', authMiddleware, metricsController.getMetrics);

module.exports = router;


