const rateLimit = require('express-rate-limit');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Helper function to check if IP is localhost
const isLocalhost = (ip) => {
    return ip === '::1' ||
        ip === '127.0.0.1' ||
        ip === '::ffff:127.0.0.1' ||
        ip === 'localhost' ||
        ip.startsWith('127.') ||
        ip.startsWith('::ffff:127.');
};

// General API rate limiter - REDUCED from 200 to 100
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 10000 : 100, // Reduced from 200 for better security
    message: {
        status: 'error',
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDevelopment && isLocalhost(req.ip),
    // Add delay after rate limit exceeded
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
});

// Stricter limiter for authentication routes - REDUCED from 10 to 5
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 1000 : 5, // REDUCED: Limit each IP to 5 login attempts per hour
    message: {
        status: 'error',
        message: 'Muitas tentativas de login. Tente novamente em 1 hora.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDevelopment && isLocalhost(req.ip),
    // Make subsequent requests slower
    skipFailedRequests: false,
});

// Limiter for appointment booking - REDUCED from 20 to 15
const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 1000 : 15, // REDUCED: Limit each IP to 15 bookings per hour
    message: {
        status: 'error',
        message: 'Muitos agendamentos. Tente novamente mais tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDevelopment && isLocalhost(req.ip),
});

// Limiter for file uploads - REDUCED from 30 to 20
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 1000 : 20, // REDUCED: Limit each IP to 20 uploads per hour
    message: {
        status: 'error',
        message: 'Muitos uploads. Tente novamente mais tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDevelopment && isLocalhost(req.ip),
});

module.exports = {
    apiLimiter,
    authLimiter,
    bookingLimiter,
    uploadLimiter,
};


