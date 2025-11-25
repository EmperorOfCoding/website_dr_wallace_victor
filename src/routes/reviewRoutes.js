const express = require('express');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authAdmin');

const router = express.Router();

// Patient review routes
router.get('/api/appointments/:appointmentId/review', authMiddleware, reviewController.getReview);
router.post('/api/appointments/:appointmentId/review', authMiddleware, reviewController.createReview);
router.put('/api/appointments/:appointmentId/review', authMiddleware, reviewController.updateReview);
router.get('/api/reviews', authMiddleware, reviewController.getMyReviews);

// Admin review routes
router.get('/api/admin/reviews', authMiddleware, reviewController.getDoctorReviews);

module.exports = router;


