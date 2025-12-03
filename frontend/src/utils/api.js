/**
 * API Fetch Utility
 * Wraps fetch with automatic cookie handling for authentication
 */

import { API_BASE_URL } from '../config';

/**
 * Make an authenticated API request with cookies
 * @param {string} endpoint - API endpoint (e.g., '/api/appointments')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} Fetch response
 */
export async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions = {
        credentials: 'include', // Always send cookies
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

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
export async function apiPost(endpoint, data) {
    return apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Make an authenticated GET request
 */
export async function apiGet(endpoint) {
    return apiFetch(endpoint, {
        method: 'GET',
    });
}

/**
 * Make an authenticated PUT request with JSON body
 */
export async function apiPut(endpoint, data) {
    return apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete(endpoint) {
    return apiFetch(endpoint, {
        method: 'DELETE',
    });
}
