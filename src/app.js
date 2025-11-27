const express = require('express');
const path = require('path');
const cors = require('cors');

// Routes
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const documentRoutes = require('./routes/documentRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const examRoutes = require('./routes/examRoutes');
const doctorProfileRoutes = require('./routes/doctorProfileRoutes');

// Middlewares
const { apiLimiter } = require('./middlewares/rateLimiter');
const { requestLogger } = require('./middlewares/logger');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting for API routes
app.use('/api', apiLimiter);

// Static files (for uploaded documents in production)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use(appointmentRoutes);
app.use(authRoutes);
app.use(adminRoutes);
app.use(doctorRoutes);
app.use(profileRoutes);
app.use(reviewRoutes);
app.use(documentRoutes);
app.use(metricsRoutes);
app.use(calendarRoutes);
app.use(examRoutes);
app.use(doctorProfileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Rota não encontrada.' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ status: 'error', message: 'Erro interno do servidor.' });
});

module.exports = app;
