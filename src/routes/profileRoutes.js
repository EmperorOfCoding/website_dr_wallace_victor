const express = require('express');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authAdmin');

const router = express.Router();

// Patient profile routes
router.get('/api/profile', authMiddleware, profileController.getProfile);
router.put('/api/profile', authMiddleware, profileController.updateProfile);
router.put('/api/profile/theme', authMiddleware, profileController.updateTheme);

module.exports = router;


