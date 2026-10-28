const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/mobile/config - Returns mobile app configuration, theme, and features
router.get('/config', (req, res) => {
    db.all("SELECT key, value FROM system_settings WHERE key IN ('site_title', 'primary_color', 'secondary_color', 'currency_symbol', 'logo_light', 'maintenance_mode_enabled', 'maintenance_message', 'geotag_enabled', 'geotag_default_radius')", [], (err, rows) => {
        const settings = {};
        (rows || []).forEach(r => {
            settings[r.key] = r.value;
        });

        res.json({
            appName: settings.site_title || 'JobConnect',
            appVersion: '1.0.0',
            buildNumber: 100,
            theme: {
                primaryColor: '#0ea5e9', // Skyblue
                primaryDark: '#0284c7',
                primaryLight: '#38bdf8',
                accentColor: '#06b6d4',
                backgroundColor: '#f8fafc',
                surfaceColor: '#ffffff',
                textColor: '#0f172a'
            },
            currencySymbol: settings.currency_symbol || '₹',
            maintenanceMode: settings.maintenance_mode_enabled === 'true',
            maintenanceMessage: settings.maintenance_message || 'System maintenance in progress.',
            geoTaggingEnabled: settings.geotag_enabled !== 'false',
            defaultRadiusKm: parseInt(settings.geotag_default_radius || '25', 10),
            supportedRoles: ['jobseeker', 'company']
        });
    });
});

// GET /api/mobile/banners - Promotional banners for mobile home screen carousel
router.get('/banners', (req, res) => {
    res.json([
        {
            id: 'b1',
            title: 'AI Career Matchmaker 🚀',
            subtitle: 'Get instant job recommendations matching your skills',
            gradient: ['#0ea5e9', '#0284c7'],
            actionText: 'Explore Now',
            target: 'recommended'
        },
        {
            id: 'b2',
            title: 'Verified Companies 🏢',
            subtitle: 'Apply directly to 2,800+ hiring tech startups',
            gradient: ['#06b6d4', '#0891b2'],
            actionText: 'Browse Companies',
            target: 'companies'
        },
        {
            id: 'b3',
            title: 'Nearby Jobs Finder 📍',
            subtitle: 'Find hiring opportunities within 10 km of your location',
            gradient: ['#3b82f6', '#1d4ed8'],
            actionText: 'View Map',
            target: 'nearby'
        }
    ]);
});

// GET /api/mobile/categories - Popular job categories with icon representations
router.get('/categories', (req, res) => {
    const categories = [
        { id: 'cat_tech', name: 'Software & Tech', icon: 'code', count: '4,200+' },
        { id: 'cat_design', name: 'Design & UI/UX', icon: 'palette', count: '1,500+' },
        { id: 'cat_mktg', name: 'Digital Marketing', icon: 'trending_up', count: '2,100+' },
        { id: 'cat_sales', name: 'Sales & Business', icon: 'storefront', count: '3,800+' },
        { id: 'cat_fin', name: 'Finance & Accounting', icon: 'account_balance', count: '1,200+' },
        { id: 'cat_hr', name: 'HR & Operations', icon: 'people', count: '950+' },
        { id: 'cat_data', name: 'Data Science & AI', icon: 'psychology', count: '1,800+' },
        { id: 'cat_support', name: 'Customer Support', icon: 'headset_mic', count: '2,400+' }
    ];

    res.json(categories);
});

module.exports = router;
