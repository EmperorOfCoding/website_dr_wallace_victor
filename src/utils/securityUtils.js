/**
 * Security Utilities
 * Provides validation, sanitization, and security helper functions
 */

const validator = require('validator');

/**
 * Password validation rules
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * Validates password complexity
 * @param {string} password - Password to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
    const errors = [];

    if (!password || typeof password !== 'string') {
        errors.push('Senha é obrigatória.');
        return { valid: false, errors };
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        errors.push(`Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`);
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra minúscula.');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra maiúscula.');
    }

    if (!/\d/.test(password)) {
        errors.push('Senha deve conter pelo menos um número.');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return validator.isEmail(email);
}

/**
 * Validates phone number format (Brazilian)
 * @param {string} phone - Phone to validate
 * @returns {boolean}
 */
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    // Brazilian phone: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
    const phoneRegex = /^\(?(\d{2})\)?\s?(\d{4,5})-?(\d{4})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validates date format (YYYY-MM-DD)
 * @param {string} date - Date to validate
 * @returns {boolean}
 */
function validateDate(date) {
    if (!date || typeof date !== 'string') {
        return false;
    }
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
}

/**
 * Validates time format (HH:MM)
 * @param {string} time - Time to validate
 * @returns {boolean}
 */
function validateTime(time) {
    if (!time || typeof time !== 'string') {
        return false;
    }
    return /^\d{2}:\d{2}$/.test(time);
}

/**
 * Sanitizes string input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
function sanitizeString(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    return validator.escape(input.trim());
}

/**
 * Validates and sanitizes name
 * @param {string} name - Name to validate
 * @returns {Object} - { valid: boolean, sanitized: string, error: string }
 */
function validateName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, sanitized: '', error: 'Nome é obrigatório.' };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
        return { valid: false, sanitized: '', error: 'Nome deve ter no mínimo 2 caracteres.' };
    }

    if (trimmed.length > 100) {
        return { valid: false, sanitized: '', error: 'Nome deve ter no máximo 100 caracteres.' };
    }

    // Allow only letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed)) {
        return { valid: false, sanitized: '', error: 'Nome contém caracteres inválidos.' };
    }

    return { valid: true, sanitized: sanitizeString(trimmed), error: null };
}

/**
 * Checks if JWT_SECRET is configured
 * @throws {Error} If JWT_SECRET is not set
 */
function ensureJwtSecret() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default_jwt_secret') {
        throw new Error(
            'SECURITY ERROR: JWT_SECRET not configured. ' +
            'Set a strong JWT_SECRET in environment variables before starting the server.'
        );
    }

    // Ensure minimum length
    if (process.env.JWT_SECRET.length < 32) {
        throw new Error(
            'SECURITY ERROR: JWT_SECRET must be at least 32 characters long.'
        );
    }
}

/**
 * Validates UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean}
 */
function validateUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    return validator.isUUID(uuid);
}

/**
 * Validates integer within range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean}
 */
function validateInteger(value, min = -Infinity, max = Infinity) {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= min && num <= max && num === parseFloat(value);
}

/**
 * Rate limit key generator for IP-based limiting
 * @param {Object} req - Express request object
 * @returns {string}
 */
function getRateLimitKey(req) {
    // Get IP from X-Forwarded-For header (if behind proxy) or direct IP
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Checks if request is from localhost
 * @param {string} ip - IP address
 * @returns {boolean}
 */
function isLocalhost(ip) {
    return ip === '::1' ||
        ip === '127.0.0.1' ||
        ip === '::ffff:127.0.0.1' ||
        ip === 'localhost' ||
        ip.startsWith('127.') ||
        ip.startsWith('::ffff:127.');
}

module.exports = {
    validatePassword,
    validateEmail,
    validatePhone,
    validateDate,
    validateTime,
    validateName,
    sanitizeString,
    ensureJwtSecret,
    validateUUID,
    validateInteger,
    getRateLimitKey,
    isLocalhost,
    PASSWORD_MIN_LENGTH,
};
