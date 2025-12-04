/**
 * Patient Authentication Middleware
 * Validates JWT tokens for patient-specific routes
 */

const jwt = require('jsonwebtoken');
const { ensureJwtSecret } = require('../utils/securityUtils');
const { getAuthToken } = require('../utils/cookieUtils');

// Validate JWT secret on module load
ensureJwtSecret();

async function authPatient(req, res, next) {
    try {
        // Get token from cookie or Authorization header
        const token = getAuthToken(req);

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Autenticação necessária.'
            });
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            // Don't leak token validation errors
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido ou expirado.'
            });
        }

        // Ensure this is a patient account (not admin)
        if (payload.role && payload.role !== 'patient') {
            return res.status(403).json({
                status: 'error',
                message: 'Acesso restrito a pacientes.'
            });
        }

        // Attach user info to request
        req.user = {
            patient_id: payload.patient_id,
            name: payload.name,
            email: payload.email,
            role: 'patient'
        };

        return next();
    } catch (error) {
        console.error('Patient auth middleware error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: 'Erro de autenticação.'
        });
    }
}

module.exports = authPatient;
