// API Configuration
// In production (Vercel), use VITE_API_URL environment variable
// In development, use empty string to leverage Vite's proxy configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
