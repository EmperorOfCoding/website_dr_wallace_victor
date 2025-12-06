/**
 * API Fetch Utility
 * Wraps fetch with automatic cookie handling for authentication
 * Supports both cookie-based auth (preferred) and Authorization header (mobile fallback)
 */

import { API_BASE_URL } from '../config';

/**
 * Make an authenticated API request with cookies
 * @param {string} endpoint - API endpoint (e.g., '/api/appointments')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {string} token - Optional JWT token for Authorization header (mobile fallback)
 * @returns {Promise<Response>} Fetch response
 */
export async function apiFetch(endpoint, options = {}, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions = {
        credentials: 'include', // Always send cookies
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    // If token provided, add Authorization header (for mobile browsers blocking cookies)
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    return fetch(url, mergedOptions);
}

/**
 * Make an authenticated POST request with JSON body
 */
export async function apiPost(endpoint, data, token = null) {
    return apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    }, token);
}

/**
 * Make an authenticated GET request
 */
export async function apiGet(endpoint, token = null) {
    return apiFetch(endpoint, {
        method: 'GET',
    }, token);
}

/**
 * Make an authenticated PUT request with JSON body
 */
export async function apiPut(endpoint, data, token = null) {
    return apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    }, token);
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete(endpoint, token = null) {
    return apiFetch(endpoint, {
        method: 'DELETE',
    }, token);
}
