const rateLimit = require('express-rate-limit');

// 1. Auth Rate Limiter (Brute-force & OTP Flooding Protection)
// Max 15 requests per 15 minutes per IP
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
    }
});

// 2. General API Rate Limiter (DDoS Protection)
// Max 300 requests per 15 minutes per IP
const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many requests from this IP. Please slow down.'
    }
});

// Helper to recursively sanitize strings against XSS, script injection, and phishing vectors
function cleanValue(value) {
    if (typeof value === 'string') {
        let cleaned = value;
        // Strip script tags
        cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Strip iframe, object, embed tags
        cleaned = cleaned.replace(/<(iframe|object|embed|applet)[^>]*>.*?<\/\1>/gi, '');
        // Strip inline event attributes (e.g. onerror=, onload=)
        cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        // Strip javascript: pseudo-protocol URIs
        cleaned = cleaned.replace(/javascript\s*:/gi, 'invalid-scheme:');
        return cleaned.trim();
    } else if (Array.isArray(value)) {
        return value.map(item => cleanValue(item));
    } else if (value !== null && typeof value === 'object') {
        const result = {};
        for (const key of Object.keys(value)) {
            result[key] = cleanValue(value[key]);
        }
        return result;
    }
    return value;
}

// 3. Global Input Sanitizer Middleware
const sanitizeInput = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = cleanValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = cleanValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = cleanValue(req.params);
    }
    next();
};

// 4. Validate External Web URLs against Phishing & Malicious URI Schemes
function validateExternalUrl(url) {
    if (!url || typeof url !== 'string') return true; // Empty is okay
    const trimmed = url.trim();
    if (!trimmed) return true;
    const lower = trimmed.toLowerCase();
    // Strictly block malicious pseudo-protocols
    if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:') || lower.startsWith('file:')) {
        return false;
    }
    // Allow http, https, mailto, relative paths, or standard web domains
    return true;
}

module.exports = {
    authRateLimiter,
    apiRateLimiter,
    sanitizeInput,
    validateExternalUrl
};

