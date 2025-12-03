const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

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

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
}));

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS configuration - NO WILDCARD!
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000']; // Development defaults

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

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
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Rota não encontrada.' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor.'
    : error.message;

  res.status(error.status || 500).json({
    status: 'error',
    message
  });
});

module.exports = app;
