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

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 10000 : 200, // Very generous limits in dev
    message: {
        status: 'error',
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDevelopment && isLocalhost(req.ip), // Skip for localhost in dev
});

// Stricter limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 1000 : 10, // Limit each IP to 10 login attempts per hour (1000 in dev)
    message: {
        status: 'error',
        message: 'Muitas tentativas de login. Tente novamente em 1 hora.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDevelopment && isLocalhost(req.ip),
});

// Limiter for appointment booking
const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 1000 : 20, // Limit each IP to 20 bookings per hour (1000 in dev)
    message: {
        status: 'error',
        message: 'Muitos agendamentos. Tente novamente mais tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDevelopment && isLocalhost(req.ip),
});

// Limiter for file uploads
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 1000 : 30, // Limit each IP to 30 uploads per hour (1000 in dev)
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


