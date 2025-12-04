const express = require('express');
const authController = require('../controllers/authController');
const { loginLimiter, registerLimiter, authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Auth routes with specific rate limiting
router.post('/api/auth/register', registerLimiter, authController.register); // 50/hour
router.post('/api/auth/login', loginLimiter, authController.login); // 10/hour
router.post('/api/auth/logout', authController.logout);
router.post('/api/auth/forgot-password', authLimiter, authController.forgotPassword);
router.post('/api/auth/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
