// Central API configuration for Frontend
// In local development, defaults to http://localhost:5000
// In production (Vercel), uses VITE_API_BASE_URL environment variable

const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

export default API_BASE_URL;

