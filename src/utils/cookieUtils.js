/**
 * Cookie Utilities
 * Helper functions for managing authentication cookies
 */

const JWT_COOKIE_NAME = 'auth_token';

/**
 * Get cookie configuration based on environment
 */
function getCookieConfig() {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true, // Inaccessível via JavaScript (proteção XSS)
        secure: isProduction, // HTTPS only em produção
        sameSite: isProduction ? 'none' : 'lax', // 'none' permite cross-origin (Vercel -> Railway)
        maxAge: 24 * 60 * 60 * 1000, // 24 horas em milliseconds
        path: '/', // Disponível em todas as rotas
    };
}

/**
 * Set authentication cookie
 * @param {Response} res - Express response object
 * @param {string} token - JWT token to store
 */
function setAuthCookie(res, token) {
    const config = getCookieConfig();
    res.cookie(JWT_COOKIE_NAME, token, config);
}

/**
 * Clear authentication cookie
 * @param {Response} res - Express response object
 */
function clearAuthCookie(res) {
    res.clearCookie(JWT_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    });
}

/**
 * Get token from cookie or Authorization header
 * Prioritizes cookie over header for better security
 * @param {Request} req - Express request object
 * @returns {string|null} JWT token or null
 */
function getAuthToken(req) {
    // Priority 1: Cookie (mais seguro)
    if (req.cookies && req.cookies[JWT_COOKIE_NAME]) {
        return req.cookies[JWT_COOKIE_NAME];
    }

    // Priority 2: Authorization header (fallback para compatibilidade)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
}

module.exports = {
    JWT_COOKIE_NAME,
    getCookieConfig,
    setAuthCookie,
    clearAuthCookie,
    getAuthToken,
};
