require('dotenv').config();
const express = require('express');
const cors = require('cors');

const helmet = require('helmet');
const { authRateLimiter, apiRateLimiter, sanitizeInput } = require('./middleware/securityMiddleware');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const planRoutes = require('./routes/planRoutes');
const employerRoutes = require('./routes/employerRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const dataRequestRoutes = require('./routes/dataRequestRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const mobileRoutes = require('./routes/mobileRoutes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Protection Middleware
app.use(helmet({
    frameguard: { action: 'deny' }, // Anti-clickjacking & anti-phishing iframe embed protection
    xContentTypeOptions: true,     // Prevent MIME-sniffing
    xssFilter: true,               // Enable XSS filter headers
    hsts: { maxAge: 31536000, includeSubDomains: true } // Enforce HTTPS in production
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput); // Global XSS & script sanitizer
app.use('/api/', apiRateLimiter); // General DDoS protection

// Sensitive Auth Rate Limiting Hooks
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/auth/send-otp', authRateLimiter);
app.use('/api/auth/verify-otp', authRateLimiter);
app.use('/api/candidate/send-otp', authRateLimiter);
app.use('/api/candidate/verify-otp', authRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/data-requests', dataRequestRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/mobile', mobileRoutes);

// Public direct endpoints for SEO crawlers
app.get('/robots.txt', (req, res, next) => settingsRoutes(req, res, next));
app.get('/sitemap.xml', (req, res, next) => settingsRoutes(req, res, next));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Job Portal API is running',
        activeEngine: db.activeEngine,
        lastError: db.lastError,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlMasked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : null
    });
});

// Start server (local dev only)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;

