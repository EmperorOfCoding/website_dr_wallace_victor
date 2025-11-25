const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/api/auth/register', authController.register);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/forgot-password', authController.forgotPassword);
router.post('/api/auth/reset-password', authController.resetPassword);

module.exports = router;
