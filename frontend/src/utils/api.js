// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get the full API URL for a given endpoint
 * @param {string} endpoint - The API endpoint (e.g., '/api/auth/login')
 * @returns {string} The full URL
 */
export const getApiUrl = (endpoint) => {
    // If endpoint already starts with http, return as is (for absolute URLs)
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
    }

    // If we have a base URL configured, use it
    if (API_BASE_URL) {
        // Remove trailing slash from base URL and leading slash from endpoint if present
        const baseUrl = API_BASE_URL.replace(/\/$/, '');
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${baseUrl}${path}`;
    }

    // Otherwise, use relative URL (for development with Vite proxy)
    return endpoint;
};

/**
 * Fetch wrapper that automatically uses the correct API URL
 * @param {string} endpoint - The API endpoint
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiFetch = (endpoint, options = {}) => {
    return fetch(getApiUrl(endpoint), options);
};

export default {
    getApiUrl,
    apiFetch
};
