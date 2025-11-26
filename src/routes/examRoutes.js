const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middlewares/authAdmin');

router.post('/api/exams', authMiddleware, examController.createRequest);
router.get('/api/exams', authMiddleware, examController.listRequests);

module.exports = router;
