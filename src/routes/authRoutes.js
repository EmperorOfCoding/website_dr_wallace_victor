const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// All auth routes have strict rate limiting to prevent brute force
router.post('/api/auth/register', authLimiter, authController.register);
router.post('/api/auth/login', authLimiter, authController.login);
router.post('/api/auth/logout', authController.logout);
router.post('/api/auth/forgot-password', authLimiter, authController.forgotPassword);
router.post('/api/auth/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
