import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { 
    FiSettings, FiUserCheck, FiImage, FiCpu, FiBell, FiDollarSign,
    FiGlobe, FiLayout, FiFileText, FiShare2, FiGrid, FiClock,
    FiAlertOctagon, FiShield, FiCode, FiMap, FiTerminal, FiSave,
    FiRefreshCw, FiCheck, FiInfo, FiCopy, FiExternalLink, FiUploadCloud,
    FiEye, FiSearch, FiHelpCircle, FiChevronRight, FiSliders,
    FiCheckCircle, FiXCircle, FiPlay, FiPlus, FiTrash2, FiEdit3, FiMapPin, FiNavigation
} from 'react-icons/fi';

export default function AdminSettings() {
    const { token } = useAuth();
    const { addToast } = useToast();
    const { language, setLanguage, t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const activeTab = searchParams.get('tab') || 'general';
    const [tabFilterSearch, setTabFilterSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [testEmailAddress, setTestEmailAddress] = useState('admin@jobportal.com');
    const [cronExecuting, setCronExecuting] = useState({});
    const [policyActiveSubTab, setPolicyActiveSubTab] = useState('privacy');

    // Live preview states
    const [previewSERP, setPreviewSERP] = useState(false);
    const [newPageModal, setNewPageModal] = useState(false);
    const [newPageForm, setNewPageForm] = useState({ title: '', slug: '', status: 'published' });

    // Simulator states for Geo-tag testing
    const [simCity, setSimCity] = useState('Bangalore');
    const [simRadius, setSimRadius] = useState('25');
    const [simJobsFound, setSimJobsFound] = useState([]);
    const [simLoading, setSimLoading] = useState(false);

    // Master Settings State
    const [settings, setSettings] = useState({
        // 1. General setting
        site_title: 'JobConnect Pro',
        site_tagline: 'Connect Talented Jobseekers with Premier Employers',
        site_email: 'support@jobconnect.com',
        site_phone: '+91 98765 43210',
        currency_symbol: '₹',
        currency_code: 'INR',
        timezone: 'Asia/Kolkata',
        date_format: 'DD/MM/YYYY',
        primary_color: '#2563eb',
        secondary_color: '#7c3aed',
        address: 'Cyber City Tech Hub, Bangalore, Karnataka - 560103',
        working_hours: 'Mon - Sat: 9:00 AM - 7:00 PM IST',
        default_user_role: 'jobseeker',

        // 2. Profile update setting
        allow_candidate_name_edit: 'true',
        allow_candidate_headline_edit: 'true',
        allow_employer_company_edit: 'true',
        min_profile_completion_for_apply: '60',
        require_resume_to_apply: 'true',
        require_phone_verify_apply: 'false',
        require_email_verify_post: 'true',
        auto_approve_candidate_profile: 'true',
        max_resume_updates_per_month: '10',

        // 3. Logo and favicon
        logo_light: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        logo_dark: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        logo_admin: '',
        favicon_url: 'https://cdn-icons-png.flaticon.com/512/3850/3850285.png',
        watermark_url: '',
        email_logo_url: '',

        // 4. System configuration
        free_employer_job_limit: '3',
        require_candidate_consent: 'true',
        mask_contact_info_default: 'false',
        job_expiry_days: '30',
        max_upload_size_mb: '10',
        allowed_file_types: '.pdf,.doc,.docx,.png,.jpg',
        force_https: 'true',
        debug_mode: 'false',
        log_retention_days: '90',

        // 5. Notification setting
        mail_driver: 'smtp',
        mail_host: 'smtp.gmail.com',
        mail_port: '587',
        mail_username: 'notifications@jobconnect.com',
        mail_password: '••••••••••••••••',
        mail_encryption: 'tls',
        mail_from_address: 'no-reply@jobconnect.com',
        mail_from_name: 'JobConnect Portal',
        sms_gateway: 'twilio',
        sms_sender_id: 'JOBCON',
        sms_api_key: 'tw_live_99a8b7c6d5e4',
        notify_new_job: 'true',
        notify_new_applicant: 'true',
        notify_payment_success: 'true',
        notify_subscription_expiry: 'true',

        // 6. Payment gateways
        razorpay_enabled: 'true',
        razorpay_key_id: 'rzp_test_1DP5mmOlF5G5ag',
        razorpay_key_secret: 'rzp_secret_key_mock_123',
        razorpay_mode: 'sandbox',
        stripe_enabled: 'true',
        stripe_publishable_key: 'pk_test_51MzMockStripeKey12345',
        stripe_secret_key: 'sk_test_51MzMockStripeSecret12345',
        paypal_enabled: 'false',
        paypal_client_id: 'paypal_client_id_mock',
        bank_transfer_enabled: 'true',
        bank_name: 'HDFC Bank Ltd.',
        bank_account_name: 'JobConnect Global Tech Pvt Ltd',
        bank_account_number: '50200088991122',
        bank_ifsc: 'HDFC0001234',
        bank_instructions: 'Please include your Order ID or registered email in payment remarks.',

        // 7. SEO Configuration
        meta_title: "JobConnect | India's #1 AI-Powered Job & Talent Portal",
        meta_description: 'Find verified high-paying jobs in IT, Marketing, Finance & AI. Recruit vetted talent effortlessly with smart matchmaking.',
        meta_keywords: 'jobs in india, tech jobs, remote work, ai career analyzer, hiring portal, recruiter software',
        og_title: 'JobConnect - Discover Your Dream Career',
        og_description: 'Empowering 50,000+ candidates and top tech enterprises with real-time job matching and career roadmaps.',
        og_image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
        twitter_card_type: 'summary_large_image',
        google_analytics_id: 'G-8X9Y7Z6W5V',
        google_search_console_code: 'googlesearchverificationtoken_abc123',
        facebook_pixel_id: 'fb_px_9876543210',

        // 8. Manage frontend
        hero_badge_text: '🔥 #1 Job Portal in 2026',
        hero_title: 'Find Your Next Dream Career with AI Matching',
        hero_subtitle: 'Over 10,000+ active job openings from top tier companies and unicorn startups.',
        hero_cta_primary: 'Explore Jobs',
        hero_cta_secondary: 'Post a Job (Free)',
        stat_jobs_count: '15,400+',
        stat_companies_count: '2,800+',
        stat_candidates_count: '95,000+',
        stat_hired_rate: '98.4%',
        show_featured_companies: 'true',
        show_testimonials: 'true',
        footer_copyright: '© 2026 JobConnect Portal Inc. All rights reserved.',

        // 9. Manage pages
        pages_json: JSON.stringify([
            { id: 1, title: 'About Us', slug: 'about-us', status: 'published', updated_at: '2026-08-15' },
            { id: 2, title: 'Contact Us', slug: 'contact-us', status: 'published', updated_at: '2026-08-14' },
            { id: 3, title: 'Pricing & Plans', slug: 'pricing', status: 'published', updated_at: '2026-08-18' },
            { id: 4, title: 'FAQ & Help Center', slug: 'faq', status: 'published', updated_at: '2026-08-10' },
            { id: 5, title: 'Career Advice & Blog', slug: 'blog', status: 'published', updated_at: '2026-08-19' }
        ]),

        // 10. Social login setting
        google_login_enabled: 'true',
        google_client_id: '1082736451234-mockapps.googleusercontent.com',
        google_client_secret: 'GOCSPX-mocksecret12345',
        linkedin_login_enabled: 'true',
        linkedin_client_id: '78mocklinkedinapp',
        linkedin_client_secret: 'mocklinkedinsecret',
        github_login_enabled: 'false',
        github_client_id: '',
        github_client_secret: '',
        facebook_login_enabled: 'false',

        // 11. Language
        default_language: 'en',
        enable_multilingual: 'true',
        rtl_support: 'false',
        available_languages: JSON.stringify([
            { code: 'en', name: 'English (US)', flag: '🇺🇸', status: 'active', is_default: true },
            { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳', status: 'active', is_default: false },
            { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', status: 'active', is_default: false },
            { code: 'fr', name: 'French (Français)', flag: '🇫🇷', status: 'inactive', is_default: false },
            { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪', status: 'inactive', is_default: false },
            { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦', status: 'inactive', is_default: false }
        ]),
        translations_json: JSON.stringify({
            find_job: 'Find Jobs',
            post_job: 'Post a Job',
            login: 'Sign In',
            register: 'Sign Up',
            dashboard: 'Dashboard'
        }),

        // 12. Extensions
        recaptcha_enabled: 'true',
        recaptcha_site_key: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
        recaptcha_secret_key: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
        tawkto_enabled: 'false',
        tawkto_property_id: '',
        tawkto_widget_id: '',
        openai_resume_parser_enabled: 'true',
        openai_api_key: 'sk-proj-mockopenaiapikey12345',
        zoom_meeting_enabled: 'true',
        zoom_api_key: 'zoom_jwt_key_sample',
        zoom_api_secret: 'zoom_jwt_secret_sample',

        // 13. Cron job setting
        cron_job_expiry_schedule: '0 0 * * *',
        cron_job_expiry_enabled: 'true',
        cron_job_expiry_last_run: '2026-08-19 00:00:15',
        cron_subscription_reminder_schedule: '0 8 * * *',
        cron_subscription_reminder_enabled: 'true',
        cron_subscription_reminder_last_run: '2026-08-19 08:00:02',
        cron_candidate_alerts_schedule: '0 9 * * *',
        cron_candidate_alerts_enabled: 'true',
        cron_candidate_alerts_last_run: '2026-08-19 09:00:10',
        cron_backup_schedule: '0 2 * * 0',
        cron_backup_enabled: 'true',
        cron_backup_last_run: '2026-08-17 02:00:00',

        // 14. Policy pages
        privacy_policy_content: `# Privacy Policy\n\n**Effective Date:** August 15, 2026\n\nJobConnect is dedicated to protecting your privacy. This policy outlines our practices concerning data collection, candidate profile confidentiality, employer vetting, and data export agreements.`,
        terms_conditions_content: `# Terms and Conditions\n\n**Last Updated:** August 15, 2026\n\nBy accessing or using the JobConnect platform, employers and jobseekers agree to be bound by these Terms of Service.`,
        refund_policy_content: `# Refund & Cancellation Policy\n\nAll premium subscription purchases on JobConnect carry a 7-day conditional refund window if candidate unlocks or job posting limits have not been actively utilized.`,
        posting_guidelines_content: `# Employer Job Posting Guidelines\n\n1. All job listings must represent genuine, active employment opportunities.\n2. No discriminatory language or upfront fee requests to jobseekers.`,
        policy_last_updated: 'August 15, 2026',

        // 15. Maintenance mode
        maintenance_mode_enabled: 'false',
        maintenance_title: 'Under Scheduled System Maintenance',
        maintenance_message: 'We are currently undergoing scheduled upgrades to bring you even faster job matching and enhanced AI tools. We will be back online shortly.',
        maintenance_estimated_time: '2026-08-19 14:00 IST',
        maintenance_allowed_ips: '127.0.0.1, 192.168.1.1',
        maintenance_bypass_token: 'superadmin_bypass_2026',

        // 16. GDPR cookie
        gdpr_cookie_enabled: 'true',
        gdpr_banner_position: 'bottom',
        gdpr_banner_text: 'We use cookies to improve your browsing experience, personalize job recommendations, and analyze our traffic. By clicking Accept All, you consent to our use of cookies.',
        gdpr_accept_button_text: 'Accept All',
        gdpr_reject_button_text: 'Decline Optional',
        gdpr_privacy_url: '/privacy-policy',
        gdpr_cookie_expiry_days: '365',
        gdpr_allow_marketing_toggle: 'true',

        // 17. Custom CSS
        custom_header_css: `/* Custom Portal Global Overrides */\n.btn-primary:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);\n}`,
        custom_footer_js: `// Custom Analytics or Chat Init\nconsole.log('JobConnect Custom Portal Scripts Active');`,
        custom_header_meta: `<!-- Custom Verification Tags -->\n<meta name="portal-verification" content="jobconnect-verified-2026" />`,

        // 18. Sitemap XML
        sitemap_enabled: 'true',
        sitemap_include_jobs: 'true',
        sitemap_include_companies: 'true',
        sitemap_include_blogs: 'true',
        sitemap_frequency: 'daily',
        sitemap_priority: '0.8',
        sitemap_custom_urls: 'https://jobconnect.com/career-tips\nhttps://jobconnect.com/salary-guide',
        sitemap_last_generated: '2026-08-19 04:30:00',

        // 19. Robots txt
        robots_txt_content: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /company/messages/\nDisallow: /jobseeker/messages/\n\nSitemap: http://localhost:5000/sitemap.xml`,

        // 20. Geo-Tag & Location-Based Access Setting
        geotag_enabled: 'true',
        geotag_candidate_access: 'true',
        geotag_employer_access: 'true',
        geotag_default_radius: '25',
        geotag_max_radius: '100',
        geotag_map_provider: 'openstreetmap',
        geotag_google_maps_api_key: '',
        geotag_auto_detect_location: 'true',
        geotag_show_distance_badge: 'true',
        geotag_allow_geofencing: 'true',
        geotag_require_precise_gps: 'false'
    });

    // 19 System Settings Menu Definition with categories & icons
    const SETTINGS_SECTIONS = [
        {
            category: 'General & Branding',
            items: [
                { id: 'general', num: 1, label: 'General Setting', icon: FiSettings, desc: 'Platform title, currency, timezone & contact' },
                { id: 'profile_update', num: 2, label: 'Profile Update Setting', icon: FiUserCheck, desc: 'Profile completion limits, validation & locks' },
                { id: 'logo_favicon', num: 3, label: 'Logo & Favicon', icon: FiImage, desc: 'Header logo, dark mode, favicon & watermark' },
                { id: 'frontend', num: 8, label: 'Manage Frontend', icon: FiLayout, desc: 'Hero section, stats cards & testimonial switches' },
                { id: 'pages', num: 9, label: 'Manage Pages', icon: FiGrid, desc: 'Manage static, info, and custom landing pages' },
                { id: 'policy_pages', num: 14, label: 'Policy Pages', icon: FiFileText, desc: 'Privacy, Terms, Refund & Posting guidelines' }
            ]
        },
        {
            category: 'System & Security',
            items: [
                { id: 'system_config', num: 4, label: 'System Configuration', icon: FiCpu, desc: 'Free job quotas, consent rules, uploads & SSL' },
                { id: 'geotag_location', num: 20, label: 'Geo-Tag & Location Access', icon: FiMapPin, desc: 'GPS radius, map pins, candidate & employer access permissions' },
                { id: 'maintenance_mode', num: 15, label: 'Maintenance Mode', icon: FiAlertOctagon, desc: 'Offline banner, bypass tokens & IP whitelist' },
                { id: 'gdpr_cookie', num: 16, label: 'GDPR Cookie Consent', icon: FiShield, desc: 'Compliance popup, expiration & user preferences' },
                { id: 'custom_css', num: 17, label: 'Custom CSS & JS', icon: FiCode, desc: 'Inject custom header CSS, script tags & meta' }
            ]
        },
        {
            category: 'Integrations & Gateways',
            items: [
                { id: 'notifications', num: 5, label: 'Notification Setting', icon: FiBell, desc: 'SMTP host, credentials, SMS gateway & triggers' },
                { id: 'payment_gateways', num: 6, label: 'Payment Gateways', icon: FiDollarSign, desc: 'Razorpay, Stripe, PayPal & Direct Bank info' },
                { id: 'social_login', num: 10, label: 'Social Login Setting', icon: FiShare2, desc: 'Google, LinkedIn, GitHub & Facebook OAuth' },
                { id: 'extensions', num: 12, label: 'Extensions & Plugins', icon: FiSliders, desc: 'reCAPTCHA, Tawk.to, OpenAI AI Parser & Zoom' },
                { id: 'cron_jobs', num: 13, label: 'Cron Job Setting', icon: FiClock, desc: 'Automated expiry, renewal & candidate digests' }
            ]
        },
        {
            category: 'Localization & SEO',
            items: [
                { id: 'language', num: 11, label: 'Language & Localization', icon: FiGlobe, desc: 'Default language, RTL switcher & dictionary' },
                { id: 'seo_config', num: 7, label: 'SEO Configuration', icon: FiSearch, desc: 'Meta tags, OG tags, GA4 & Search Console' },
                { id: 'sitemap_xml', num: 18, label: 'Sitemap XML', icon: FiMap, desc: 'Auto-generation, crawler frequency & index routes' },
                { id: 'robots_txt', num: 19, label: 'Robots.txt', icon: FiTerminal, desc: 'Crawler directives, blockpaths & bot rules' }
            ]
        }
    ];

    // Load settings from backend API
    useEffect(() => {
        fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5000/api/settings/all', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                if (data.settings) {
                    setSettings(prev => ({ ...prev, ...data.settings }));
                }
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: typeof value === 'boolean' ? String(value) : value
        }));
    };

    const handleSaveAll = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/settings/all', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                addToast('All system settings updated and saved successfully!', 'success');
            } else {
                const errData = await res.json();
                addToast(errData.message || 'Failed to save settings', 'error');
            }
        } catch (err) {
            addToast('Network error while saving settings: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmailAddress) {
            return addToast('Please enter an email address for testing', 'error');
        }
        setTestingEmail(true);
        try {
            const res = await fetch('http://localhost:5000/api/settings/test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    testEmail: testEmailAddress,
                    host: settings.mail_host,
                    port: settings.mail_port,
                    username: settings.mail_username,
                    fromAddress: settings.mail_from_address
                })
            });
            const data = await res.json();
            if (res.ok) {
                addToast(data.message, 'success');
            } else {
                addToast(data.message || 'Test email failed', 'error');
            }
        } catch (err) {
            addToast('Error sending test email: ' + err.message, 'error');
        } finally {
            setTestingEmail(false);
        }
    };

    const handleTriggerCron = async (cronKey, cronName) => {
        setCronExecuting(prev => ({ ...prev, [cronKey]: true }));
        try {
            const res = await fetch('http://localhost:5000/api/settings/trigger-cron', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ cronKey, cronName })
            });
            const data = await res.json();
            if (res.ok) {
                addToast(data.message, 'success');
                if (data.executedAt) {
                    handleSettingChange(`${cronKey}_last_run`, data.executedAt);
                }
            } else {
                addToast(data.message || 'Failed to trigger cron', 'error');
            }
        } catch (err) {
            addToast('Cron execution error: ' + err.message, 'error');
        } finally {
            setCronExecuting(prev => ({ ...prev, [cronKey]: false }));
        }
    };

    const handleAddCustomPage = () => {
        if (!newPageForm.title || !newPageForm.slug) {
            return addToast('Please enter page title and slug', 'error');
        }
        let pages = [];
        try {
            pages = JSON.parse(settings.pages_json || '[]');
        } catch (e) {
            pages = [];
        }
        const newPage = {
            id: Date.now(),
            title: newPageForm.title,
            slug: newPageForm.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
            status: newPageForm.status,
            updated_at: new Date().toISOString().split('T')[0]
        };
        pages.push(newPage);
        handleSettingChange('pages_json', JSON.stringify(pages));
        setNewPageForm({ title: '', slug: '', status: 'published' });
        setNewPageModal(false);
        addToast(`Page "${newPage.title}" added to directory`, 'success');
    };

    const handleDeletePage = (id) => {
        let pages = [];
        try {
            pages = JSON.parse(settings.pages_json || '[]');
        } catch (e) {
            pages = [];
        }
        const filtered = pages.filter(p => p.id !== id);
        handleSettingChange('pages_json', JSON.stringify(filtered));
        addToast('Page removed from directory', 'info');
    };

    // Filter items based on tab search
    const allFlatItems = SETTINGS_SECTIONS.flatMap(c => c.items);
    const filteredSections = SETTINGS_SECTIONS.map(sec => ({
        ...sec,
        items: sec.items.filter(item => 
            !tabFilterSearch || 
            item.label.toLowerCase().includes(tabFilterSearch.toLowerCase()) || 
            item.desc.toLowerCase().includes(tabFilterSearch.toLowerCase()) ||
            String(item.num) === tabFilterSearch.trim()
        )
    })).filter(sec => sec.items.length > 0);

    const currentItemInfo = allFlatItems.find(i => i.id === activeTab) || allFlatItems[0];

    // Helper Toggle Switch Component
    const renderToggle = (key, label, description = '', badge = '') => {
        const isChecked = settings[key] === 'true' || settings[key] === true;
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '12px',
                gap: '16px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>{label}</span>
                        {badge && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb' }}>
                                {badge}
                            </span>
                        )}
                    </div>
                    {description && (
                        <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{description}</p>
                    )}
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => handleSettingChange(key, e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: isChecked ? '#2563eb' : '#cbd5e1',
                        borderRadius: '26px',
                        transition: '0.2s ease',
                        boxShadow: isChecked ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none'
                    }}>
                        <span style={{
                            position: 'absolute',
                            height: '20px',
                            width: '20px',
                            left: isChecked ? '25px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: '0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                    </span>
                </label>
            </div>
        );
    };

    // Helper Input Field Component
    const renderInput = (key, label, type = 'text', placeholder = '', help = '', prefix = '') => (
        <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                {label}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {prefix && (
                    <span style={{
                        padding: '10px 14px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRight: 'none',
                        borderRadius: '10px 0 0 10px',
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.88rem'
                    }}>
                        {prefix}
                    </span>
                )}
                <input 
                    type={type}
                    value={settings[key] || ''}
                    onChange={e => handleSettingChange(key, e.target.value)}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: prefix ? '0 10px 10px 0' : '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        color: '#0f172a',
                        outline: 'none',
                        transition: 'border 0.2s',
                        background: '#ffffff'
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
            </div>
            {help && <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>{help}</p>}
        </div>
    );

    return (
        <div style={{ padding: '28px 36px 80px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* Page Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '26px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}>
                            Global Settings Engine
                        </span>
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>• 19 Configurable Modules</span>
                    </div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        System Settings Hub
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '4px 0 0' }}>
                        Configure enterprise parameters, payment gateways, SEO, frontend branding, cron schedules, and security policies.
                    </p>
                </div>

                {/* Header Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={fetchSettings}
                        style={{
                            background: '#ffffff',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiRefreshCw size={15} className={loading ? 'spin' : ''} />
                        <span>Reload</span>
                    </button>

                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        style={{
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                            transition: 'all 0.2s',
                            opacity: saving ? 0.8 : 1
                        }}
                    >
                        <FiSave size={16} />
                        <span>{saving ? 'Saving Changes...' : 'Save All Changes'}</span>
                    </button>
                </div>
            </div>

            {/* Quick 19-Tab Navigation Card Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '26px', alignItems: 'start' }}>
                
                {/* Left Navigation Sidebar (19 Options) */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    padding: '18px 14px',
                    position: 'sticky',
                    top: '20px',
                    maxHeight: 'calc(100vh - 60px)',
                    overflowY: 'auto'
                }}>
                    {/* Search box for 19 options */}
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text"
                            placeholder="Filter 19 settings..."
                            value={tabFilterSearch}
                            onChange={e => setTabFilterSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 34px',
                                borderRadius: '9px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.84rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Grouped Category Navigation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredSections.map(group => (
                            <div key={group.category}>
                                <div style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.6px',
                                    padding: '4px 10px',
                                    marginBottom: '4px'
                                }}>
                                    {group.category}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {group.items.map(item => {
                                        const Icon = item.icon;
                                        const isSelected = activeTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setSearchParams({ tab: item.id })}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '9px 12px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: isSelected ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                                                    color: isSelected ? '#ffffff' : '#334155',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    width: '100%',
                                                    transition: 'all 0.15s ease',
                                                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.background = '#eff6ff';
                                                        e.currentTarget.style.color = '#1d4ed8';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.color = '#334155';
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '6px',
                                                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 800,
                                                        color: isSelected ? '#ffffff' : '#64748b'
                                                    }}>
                                                        {item.num}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 600 }}>
                                                            {item.label}
                                                        </div>
                                                    </div>
                                                </div>
                                                <FiChevronRight size={14} style={{ opacity: isSelected ? 1 : 0.4 }} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Content Editor Card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 25px rgba(0,0,0,0.03)',
                    padding: '30px 36px'
                }}>
                    {/* Header for Current Active Tab */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '26px',
                        paddingBottom: '18px',
                        borderBottom: '1px solid #f1f5f9'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2563eb',
                                fontSize: '1.25rem',
                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
                            }}>
                                {React.createElement(currentItemInfo.icon, { size: 22 })}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '6px' }}>
                                        OPTION #{currentItemInfo.num}
                                    </span>
                                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                        {currentItemInfo.label}
                                    </h2>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.86rem', margin: '3px 0 0' }}>
                                    {currentItemInfo.desc}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            style={{
                                background: '#f8fafc',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                padding: '8px 18px',
                                borderRadius: '9px',
                                fontWeight: 700,
                                fontSize: '0.84rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            <FiCheck size={14} /> Quick Save
                        </button>
                    </div>

                    {/* ========================================================================= */}
                    {/* TAB 1: GENERAL SETTING */}
                    {/* ========================================================================= */}
                    {activeTab === 'general' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                                {renderInput('site_title', 'Platform Title / Name *', 'text', 'e.g. JobConnect Pro')}
                                {renderInput('site_tagline', 'Site Tagline / Slogan', 'text', 'e.g. Find Your Dream Job with AI')}
                                {renderInput('site_email', 'Official Support Email', 'email', 'support@jobconnect.com')}
                                {renderInput('site_phone', 'Support Phone / Helpline', 'text', '+91 98765 43210')}
                                {renderInput('currency_symbol', 'Currency Symbol', 'text', '₹ or $')}
                                {renderInput('currency_code', 'Currency ISO Code', 'text', 'INR or USD')}
                                
                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Default Timezone
                                    </label>
                                    <select
                                        value={settings.timezone}
                                        onChange={e => handleSettingChange('timezone', e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                                        <option value="America/New_York">America/New_York (EST -5:00)</option>
                                        <option value="Europe/London">Europe/London (GMT 0:00)</option>
                                        <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                                        <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Date Display Format
                                    </label>
                                    <select
                                        value={settings.date_format}
                                        onChange={e => handleSettingChange('date_format', e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 19/08/2026)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/19/2026)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-19)</option>
                                        <option value="DD MMM YYYY">DD MMM YYYY (e.g. 19 Aug 2026)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginTop: '10px' }}>
                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Primary Theme Color
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input 
                                            type="color"
                                            value={settings.primary_color || '#2563eb'}
                                            onChange={e => handleSettingChange('primary_color', e.target.value)}
                                            style={{ width: '48px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '2px' }}
                                        />
                                        <input 
                                            type="text"
                                            value={settings.primary_color || '#2563eb'}
                                            onChange={e => handleSettingChange('primary_color', e.target.value)}
                                            style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Secondary Theme Color
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input 
                                            type="color"
                                            value={settings.secondary_color || '#7c3aed'}
                                            onChange={e => handleSettingChange('secondary_color', e.target.value)}
                                            style={{ width: '48px', height: '42px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '2px' }}
                                        />
                                        <input 
                                            type="text"
                                            value={settings.secondary_color || '#7c3aed'}
                                            onChange={e => handleSettingChange('secondary_color', e.target.value)}
                                            style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {renderInput('address', 'Physical Headquarters Address', 'text', 'e.g. Cyber City Tech Hub, Bangalore')}
                            {renderInput('working_hours', 'Operating / Support Hours', 'text', 'e.g. Mon - Sat: 9:00 AM - 7:00 PM IST')}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 2: PROFILE UPDATE SETTING */}
                    {/* ========================================================================= */}
                    {activeTab === 'profile_update' && (
                        <div>
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', marginBottom: '22px', display: 'flex', gap: '12px' }}>
                                <FiInfo size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong style={{ color: '#1e40af', fontSize: '0.9rem' }}>Candidate & Recruiter Profile Control</strong>
                                    <p style={{ color: '#1e3a8a', fontSize: '0.83rem', margin: '4px 0 0' }}>
                                        Control permissions for editing personal credentials, enforce verification barriers before applying, and set profile completion thresholds.
                                    </p>
                                </div>
                            </div>

                            {renderToggle('allow_candidate_name_edit', 'Allow Candidate Name & Email Edits', 'When disabled, candidate names are locked once identity is verified')}
                            {renderToggle('allow_candidate_headline_edit', 'Allow Job Title & Headline Modifications', 'Permit jobseekers to refresh their targeted designation')}
                            {renderToggle('allow_employer_company_edit', 'Allow Employer Company Name & GST Updates', 'Require admin review if employer attempts to alter registered company legal name')}
                            {renderToggle('require_resume_to_apply', 'Mandatory Resume Upload for Job Applications', 'Disallow 1-click apply unless a parsed CV or PDF is attached', 'Enforced')}
                            {renderToggle('require_phone_verify_apply', 'Require Mobile OTP Verification Before Applying', 'Send instant SMS OTP verification on first application', 'Security')}
                            {renderToggle('require_email_verify_post', 'Require Verified Email for Employer Job Postings', 'Blocks spam companies from publishing listings without verified corporate domain')}
                            {renderToggle('auto_approve_candidate_profile', 'Auto-Approve Candidate Profile Edits', 'Immediately sync candidate updates without queuing for admin moderation')}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Minimum Profile Completion % to Apply ({settings.min_profile_completion_for_apply}%)
                                    </label>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={settings.min_profile_completion_for_apply || '60'}
                                        onChange={e => handleSettingChange('min_profile_completion_for_apply', e.target.value)}
                                        style={{ width: '100%', accentColor: '#2563eb' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                                        <span>0% (No restriction)</span>
                                        <span style={{ fontWeight: 800, color: '#2563eb' }}>{settings.min_profile_completion_for_apply}% required</span>
                                        <span>100% (Strict)</span>
                                    </div>
                                </div>

                                {renderInput('max_resume_updates_per_month', 'Max Resume Replacements Allowed Per Month', 'number', '10')}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 3: LOGO AND FAVICON */}
                    {/* ========================================================================= */}
                    {activeTab === 'logo_favicon' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                                {/* Main Light Logo */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', background: '#ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Primary Header Logo (Light Theme)</h4>
                                        <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', color: '#64748b' }}>Rec: 220x60 PNG</span>
                                    </div>
                                    <div style={{
                                        height: '100px',
                                        background: '#f8fafc',
                                        borderRadius: '12px',
                                        border: '2px dashed #cbd5e1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '14px',
                                        overflow: 'hidden'
                                    }}>
                                        {settings.logo_light ? (
                                            <img src={settings.logo_light} alt="Logo Light Preview" style={{ maxHeight: '60px', maxWidth: '80%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No logo selected</span>
                                        )}
                                    </div>
                                    {renderInput('logo_light', 'Logo URL / Asset Path', 'text', 'https://.../logo.png')}
                                </div>

                                {/* Dark Mode Logo */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', background: '#ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Dark Mode Logo</h4>
                                        <span style={{ fontSize: '0.72rem', background: '#0f172a', padding: '2px 8px', borderRadius: '6px', color: '#ffffff' }}>Dark Navbar</span>
                                    </div>
                                    <div style={{
                                        height: '100px',
                                        background: '#0f172a',
                                        borderRadius: '12px',
                                        border: '2px dashed #334155',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '14px',
                                        overflow: 'hidden'
                                    }}>
                                        {settings.logo_dark ? (
                                            <img src={settings.logo_dark} alt="Logo Dark Preview" style={{ maxHeight: '60px', maxWidth: '80%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Dark logo preview</span>
                                        )}
                                    </div>
                                    {renderInput('logo_dark', 'Dark Logo URL / Asset Path', 'text', 'https://.../logo-white.png')}
                                </div>

                                {/* Favicon Icon */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', background: '#ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Browser Favicon Icon</h4>
                                        <span style={{ fontSize: '0.72rem', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', color: '#2563eb' }}>32x32 .ico/.png</span>
                                    </div>
                                    <div style={{
                                        height: '100px',
                                        background: '#f8fafc',
                                        borderRadius: '12px',
                                        border: '2px dashed #cbd5e1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '14px'
                                    }}>
                                        {settings.favicon_url ? (
                                            <img src={settings.favicon_url} alt="Favicon Preview" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Favicon preview</span>
                                        )}
                                    </div>
                                    {renderInput('favicon_url', 'Favicon Image URL', 'text', 'https://.../favicon.png')}
                                </div>

                                {/* Watermark & Email Logo */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', background: '#ffffff' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Email & Document Watermark</h4>
                                    {renderInput('watermark_url', 'Resume Export Watermark URL', 'text', 'https://.../watermark.png')}
                                    {renderInput('email_logo_url', 'Transactional Email Header Logo', 'text', 'https://.../email-logo.png')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 4: SYSTEM CONFIGURATION */}
                    {/* ========================================================================= */}
                    {activeTab === 'system_config' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                                {renderInput('free_employer_job_limit', 'Default Free Job Postings Per Employer', 'number', '3', 'Free listings before requiring a subscription')}
                                {renderInput('job_expiry_days', 'Job Listing Validity Period (Days)', 'number', '30', 'After which jobs automatically expire')}
                                {renderInput('max_upload_size_mb', 'Max Upload File Size (MB)', 'number', '10', 'Applies to resumes, portfolios and company docs')}
                                {renderInput('allowed_file_types', 'Allowed File Extensions', 'text', '.pdf,.doc,.docx,.png,.jpg')}
                                {renderInput('log_retention_days', 'Audit & Security Log Retention (Days)', 'number', '90')}
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                {renderToggle('require_candidate_consent', 'Require Candidate Consent for Recruiter Contact Reveal', 'Ensures GDPR/DPDP privacy compliance when employers export contact info')}
                                {renderToggle('mask_contact_info_default', 'Mask Phone & Email by Default in Candidate Search', 'Only reveal verified contact details to premium employers')}
                                {renderToggle('force_https', 'Enforce HTTPS / Secure SSL Communication', 'Automatically redirect HTTP visitors to HTTPS')}
                                {renderToggle('debug_mode', 'System Debug & Verbose Error Diagnostics Mode', 'Keep disabled in production for optimal security')}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 5: NOTIFICATION SETTING */}
                    {/* ========================================================================= */}
                    {activeTab === 'notifications' && (
                        <div>
                            <div style={{ marginBottom: '22px' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>
                                    1. SMTP Email Server Configuration
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                    {renderInput('mail_host', 'SMTP Host', 'text', 'smtp.gmail.com')}
                                    {renderInput('mail_port', 'SMTP Port', 'text', '587 or 465')}
                                    {renderInput('mail_username', 'SMTP Username / Email', 'text', 'notifications@jobconnect.com')}
                                    {renderInput('mail_password', 'SMTP Password / App Key', 'password', '••••••••••••••••')}
                                    {renderInput('mail_from_address', 'Sender "From" Email Address', 'email', 'no-reply@jobconnect.com')}
                                    {renderInput('mail_from_name', 'Sender "From" Display Name', 'text', 'JobConnect Notifications')}
                                </div>

                                <div style={{
                                    background: '#f8fafc',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    padding: '16px',
                                    marginTop: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flexWrap: 'wrap'
                                }}>
                                    <input 
                                        type="email"
                                        value={testEmailAddress}
                                        onChange={e => setTestEmailAddress(e.target.value)}
                                        placeholder="Send test email to..."
                                        style={{ flex: 1, minWidth: '240px', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                                    />
                                    <button
                                        onClick={handleTestEmail}
                                        disabled={testingEmail}
                                        style={{
                                            background: '#7c3aed',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '9px 18px',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {testingEmail ? 'Sending Test...' : 'Send Test Email'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '22px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>
                                    2. SMS & OTP Gateway
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            SMS Gateway Provider
                                        </label>
                                        <select
                                            value={settings.sms_gateway}
                                            onChange={e => handleSettingChange('sms_gateway', e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        >
                                            <option value="twilio">Twilio Programmable SMS</option>
                                            <option value="msg91">MSG91 Enterprise SMS</option>
                                            <option value="fast2sms">Fast2SMS India Route</option>
                                        </select>
                                    </div>
                                    {renderInput('sms_sender_id', 'SMS Sender Header / ID', 'text', 'JOBCON (6 chars)')}
                                    {renderInput('sms_api_key', 'SMS Gateway API Key / Auth Token', 'password', 'tw_live_••••••••')}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>
                                    3. Automated System Event Triggers
                                </h3>
                                {renderToggle('notify_new_job', 'Notify Admins when a new job posting is created')}
                                {renderToggle('notify_new_applicant', 'Notify Employer via Email when a candidate applies')}
                                {renderToggle('notify_payment_success', 'Send Instant Invoice PDF when payment succeeds')}
                                {renderToggle('notify_subscription_expiry', 'Send Renewal Reminder 3 days before plan expiration')}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 6: PAYMENT GATEWAYS */}
                    {/* ========================================================================= */}
                    {activeTab === 'payment_gateways' && (
                        <div>
                            {/* Razorpay Gateway */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', marginBottom: '22px', background: '#ffffff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0c2340', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3395ff', fontWeight: 900, fontSize: '0.9rem' }}>
                                            R
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Razorpay Payment Gateway</h4>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>UPI, Credit/Debit Cards, NetBanking, Wallets (India Preferred)</span>
                                        </div>
                                    </div>
                                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, background: settings.razorpay_enabled === 'true' ? '#f0fdf4' : '#f1f5f9', color: settings.razorpay_enabled === 'true' ? '#166534' : '#64748b' }}>
                                        {settings.razorpay_enabled === 'true' ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                                {renderToggle('razorpay_enabled', 'Enable Razorpay Gateway')}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                    {renderInput('razorpay_key_id', 'Razorpay Key ID', 'text', 'rzp_live_... or rzp_test_...')}
                                    {renderInput('razorpay_key_secret', 'Razorpay Key Secret', 'password', '••••••••••••••••')}
                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Gateway Environment
                                        </label>
                                        <select
                                            value={settings.razorpay_mode}
                                            onChange={e => handleSettingChange('razorpay_mode', e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        >
                                            <option value="sandbox">Test / Sandbox Mode</option>
                                            <option value="live">Live Production Mode</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Stripe Gateway */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', marginBottom: '22px', background: '#ffffff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#635bff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: '0.9rem' }}>
                                            S
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Stripe International Gateway</h4>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Global credit cards, USD/EUR/GBP currencies</span>
                                        </div>
                                    </div>
                                </div>
                                {renderToggle('stripe_enabled', 'Enable Stripe Checkout')}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                    {renderInput('stripe_publishable_key', 'Stripe Publishable Key', 'text', 'pk_live_... or pk_test_...')}
                                    {renderInput('stripe_secret_key', 'Stripe Secret Key', 'password', 'sk_live_... or sk_test_...')}
                                </div>
                            </div>

                            {/* Offline Bank Transfer */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', background: '#ffffff' }}>
                                <h4 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Manual Direct Bank Wire Transfer / NEFT / IMPS</h4>
                                {renderToggle('bank_transfer_enabled', 'Enable Offline Bank Transfer')}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                    {renderInput('bank_name', 'Bank Name', 'text', 'e.g. HDFC Bank Ltd.')}
                                    {renderInput('bank_account_name', 'Beneficiary Account Name', 'text', 'e.g. JobConnect Global Tech Pvt Ltd')}
                                    {renderInput('bank_account_number', 'Account Number', 'text', '50200088991122')}
                                    {renderInput('bank_ifsc', 'IFSC / SWIFT Code', 'text', 'HDFC0001234')}
                                </div>
                                {renderInput('bank_instructions', 'Payment Instructions for Customer', 'text', 'e.g. Mention Invoice ID in remarks and upload receipt')}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 7: SEO CONFIGURATION */}
                    {/* ========================================================================= */}
                    {activeTab === 'seo_config' && (
                        <div>
                            {/* Live Google Search Snippet Preview */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FiGlobe color="#2563eb" />
                                        <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>Google SERP Search Preview Simulator</strong>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Live Simulation</span>
                                </div>
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', maxWidth: '650px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#202124', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ color: '#202124', fontWeight: 600 }}>jobconnect.com</span>
                                        <span style={{ color: '#5f6368' }}>› jobs › portal</span>
                                    </div>
                                    <div style={{ fontSize: '1.25rem', color: '#1a0dab', fontWeight: 500, marginBottom: '4px', cursor: 'pointer', lineHeight: 1.3 }}>
                                        {settings.meta_title || 'JobConnect | AI-Powered Job Portal'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#4d5156', lineHeight: 1.4 }}>
                                        {settings.meta_description || 'Search thousands of active jobs from verified companies. Get hired faster with AI career analyzer.'}
                                    </div>
                                </div>
                            </div>

                            {renderInput('meta_title', 'Meta Title (Recommended 50-60 characters)', 'text', 'JobConnect | India\'s #1 Job Portal')}
                            {renderInput('meta_description', 'Meta Description (Recommended 150-160 characters)', 'text', 'Find verified high-paying jobs in IT, Marketing...')}
                            {renderInput('meta_keywords', 'Meta Keywords (Comma separated)', 'text', 'jobs, tech careers, hiring, resume builder, recruiters')}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginTop: '10px' }}>
                                {renderInput('og_title', 'Open Graph (OG) Title for Social Sharing', 'text', 'JobConnect - Discover Dream Careers')}
                                {renderInput('og_image', 'OG Share Image URL (1200x630)', 'text', 'https://.../og-banner.jpg')}
                                {renderInput('google_analytics_id', 'Google Analytics (GA4) Tracking ID', 'text', 'G-8X9Y7Z6W5V')}
                                {renderInput('google_search_console_code', 'Google Search Console Verification Token', 'text', 'googlesearchverificationtoken...')}
                                {renderInput('facebook_pixel_id', 'Facebook Pixel ID', 'text', 'fb_px_123456789')}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 8: MANAGE FRONTEND */}
                    {/* ========================================================================= */}
                    {activeTab === 'frontend' && (
                        <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Hero Section Customization</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                                {renderInput('hero_badge_text', 'Hero Badge Ribbon Text', 'text', '🔥 #1 Job Portal in 2026')}
                                {renderInput('hero_title', 'Hero Main Heading Title', 'text', 'Find Your Next Dream Career with AI Matching')}
                                {renderInput('hero_cta_primary', 'Primary Button Label', 'text', 'Explore Jobs')}
                                {renderInput('hero_cta_secondary', 'Secondary Button Label', 'text', 'Post a Job (Free)')}
                            </div>
                            {renderInput('hero_subtitle', 'Hero Subtitle Description', 'text', 'Over 10,000+ active job openings from top tier companies.')}

                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '24px 0 16px' }}>Impact Stats Counters</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                {renderInput('stat_jobs_count', 'Active Jobs Count', 'text', '15,400+')}
                                {renderInput('stat_companies_count', 'Verified Companies', 'text', '2,800+')}
                                {renderInput('stat_candidates_count', 'Talented Jobseekers', 'text', '95,000+')}
                                {renderInput('stat_hired_rate', 'Candidate Placement Rate', 'text', '98.4%')}
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                {renderToggle('show_featured_companies', 'Display "Top Hiring Companies" Carousel on Homepage')}
                                {renderToggle('show_testimonials', 'Display "Jobseeker Reviews & Testimonials" on Homepage')}
                                {renderInput('footer_copyright', 'Footer Copyright Line', 'text', '© 2026 JobConnect Portal Inc. All rights reserved.')}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 9: MANAGE PAGES */}
                    {/* ========================================================================= */}
                    {activeTab === 'pages' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Platform Pages Directory</h3>
                                    <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Manage dynamic content, navigation routes, and custom landing pages.</p>
                                </div>
                                <button
                                    onClick={() => setNewPageModal(true)}
                                    style={{
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '9px 16px',
                                        borderRadius: '10px',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <FiPlus size={16} /> Create Custom Page
                                </button>
                            </div>

                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Page Title</th>
                                            <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Route URL / Slug</th>
                                            <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Status</th>
                                            <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700 }}>Last Updated</th>
                                            <th style={{ padding: '12px 18px', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            try {
                                                const pages = JSON.parse(settings.pages_json || '[]');
                                                return pages.map(p => (
                                                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>{p.title}</td>
                                                        <td style={{ padding: '14px 18px', color: '#2563eb', fontFamily: 'monospace' }}>/{p.slug}</td>
                                                        <td style={{ padding: '14px 18px' }}>
                                                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: p.status === 'published' ? '#f0fdf4' : '#fffbeb', color: p.status === 'published' ? '#166534' : '#b45309' }}>
                                                                {p.status?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.82rem' }}>{p.updated_at || '2026-08-19'}</td>
                                                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => handleDeletePage(p.id)}
                                                                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ));
                                            } catch (e) {
                                                return <tr><td colSpan="5" style={{ padding: '18px', textAlign: 'center' }}>No custom pages defined</td></tr>;
                                            }
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            {/* Create Page Modal */}
                            {newPageModal && (
                                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '26px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Add New Page</h3>
                                        <div style={{ marginBottom: '14px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Page Title *</label>
                                            <input 
                                                type="text" 
                                                value={newPageForm.title} 
                                                onChange={e => setNewPageForm({ ...newPageForm, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })}
                                                placeholder="e.g. Enterprise Solutions"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '14px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Page URL Slug *</label>
                                            <input 
                                                type="text" 
                                                value={newPageForm.slug} 
                                                onChange={e => setNewPageForm({ ...newPageForm, slug: e.target.value })}
                                                placeholder="e.g. enterprise-solutions"
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                            <button onClick={() => setNewPageModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                            <button onClick={handleAddCustomPage} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Save Page</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 10: SOCIAL LOGIN SETTING */}
                    {/* ========================================================================= */}
                    {activeTab === 'social_login' && (
                        <div>
                            {/* Google Login */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '20px', background: '#ffffff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ea4335', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>G</div>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Google 1-Click OAuth Sign-In</h4>
                                    </div>
                                </div>
                                {renderToggle('google_login_enabled', 'Enable Google OAuth Login')}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {renderInput('google_client_id', 'Google Client ID', 'text', '1082...apps.googleusercontent.com')}
                                    {renderInput('google_client_secret', 'Google Client Secret', 'password', 'GOCSPX-...')}
                                </div>
                                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Authorized Redirect URI: <strong>http://localhost:5000/api/auth/google/callback</strong></span>
                                    <button onClick={() => { navigator.clipboard.writeText('http://localhost:5000/api/auth/google/callback'); addToast('Callback URL copied', 'info'); }} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Copy</button>
                                </div>
                            </div>

                            {/* LinkedIn Login */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '20px', background: '#ffffff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0a66c2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>in</div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>LinkedIn OpenID Connect</h4>
                                </div>
                                {renderToggle('linkedin_login_enabled', 'Enable LinkedIn Recruiter / Candidate Login')}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {renderInput('linkedin_client_id', 'LinkedIn Client ID', 'text', '78mock...')}
                                    {renderInput('linkedin_client_secret', 'LinkedIn Client Secret', 'password', '••••••••••••••••')}
                                </div>
                            </div>

                            {/* GitHub & Facebook */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800 }}>GitHub Developer Login</h4>
                                    {renderToggle('github_login_enabled', 'Enable GitHub Login')}
                                    {renderInput('github_client_id', 'GitHub Client ID', 'text', '')}
                                </div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 800 }}>Facebook Login</h4>
                                    {renderToggle('facebook_login_enabled', 'Enable Facebook Login')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 11: LANGUAGE & LOCALIZATION */}
                    {/* ========================================================================= */}
                    {activeTab === 'language' && (
                        <div>
                            {/* Live Language Status Banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                color: '#ffffff',
                                borderRadius: '16px',
                                padding: '20px 24px',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '14px',
                                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginBottom: '6px' }}>
                                        Active Website Language
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                                        {language === 'ta' ? 'தமிழ் (Tamil)' : (language === 'hi' ? 'हिंदी (Hindi)' : (language === 'te' ? 'తెలుగు (Telugu)' : 'English (Global)'))}
                                    </h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem', opacity: 0.95 }}>
                                        {language === 'ta' 
                                            ? 'முழு இணையதளமும் இப்போது தமிழில் காட்சியளிக்கிறது.' 
                                            : (language === 'hi' 
                                                ? 'संपूर्ण वेबसाइट अब हिंदी में प्रदर्शित हो रही है।' 
                                                : (language === 'te'
                                                    ? 'మొత్తం వెబ్‌సైట్ ఇప్పుడు తెలుగులో ప్రదర్శించబడుతోంది.'
                                                    : 'The entire website and dashboards are currently rendered in English.'))}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSettingChange('default_language', 'ta');
                                            setLanguage('ta');
                                            addToast('success', 'இணையதள மொழி தமிழுக்கு மாற்றப்பட்டது! (Switched to Tamil)');
                                        }}
                                        style={{
                                            background: language === 'ta' ? '#ffffff' : 'rgba(255,255,255,0.2)',
                                            color: language === 'ta' ? '#0284c7' : '#ffffff',
                                            border: 'none',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.84rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🇮🇳 தமிழ் (Tamil)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSettingChange('default_language', 'te');
                                            setLanguage('te');
                                            addToast('success', 'వెబ్‌సైట్ భాష తెలుగుకు మార్చబడింది! (Switched to Telugu)');
                                        }}
                                        style={{
                                            background: language === 'te' ? '#ffffff' : 'rgba(255,255,255,0.2)',
                                            color: language === 'te' ? '#0284c7' : '#ffffff',
                                            border: 'none',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.84rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🇮🇳 తెలుగు (Telugu)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSettingChange('default_language', 'hi');
                                            setLanguage('hi');
                                            addToast('success', 'वेबसाइट भाषा हिंदी में बदल दी गई है! (Switched to Hindi)');
                                        }}
                                        style={{
                                            background: language === 'hi' ? '#ffffff' : 'rgba(255,255,255,0.2)',
                                            color: language === 'hi' ? '#0284c7' : '#ffffff',
                                            border: 'none',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.84rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🇮🇳 हिंदी (Hindi)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSettingChange('default_language', 'en');
                                            setLanguage('en');
                                            addToast('success', 'Website language switched to English!');
                                        }}
                                        style={{
                                            background: language === 'en' ? '#ffffff' : 'rgba(255,255,255,0.2)',
                                            color: language === 'en' ? '#0284c7' : '#ffffff',
                                            border: 'none',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.84rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🇬🇧 English
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Default System Language Preference *
                                    </label>
                                    <select
                                        value={settings.default_language || language}
                                        onChange={e => {
                                            const newLang = e.target.value;
                                            handleSettingChange('default_language', newLang);
                                            setLanguage(newLang);
                                            const langNames = { en: 'English', ta: 'Tamil (தமிழ்)', hi: 'Hindi (हिंदी)', te: 'Telugu (తెలుగు)' };
                                            addToast('success', `Website language switched to ${langNames[newLang] || newLang}`);
                                        }}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #0ea5e9', fontSize: '0.92rem', fontWeight: 700, background: '#f0f9ff' }}
                                    >
                                        <option value="en">🇬🇧 English (Global Default)</option>
                                        <option value="ta">🇮🇳 Tamil (தமிழ் - இந்தியா)</option>
                                        <option value="te">🇮🇳 Telugu (తెలుగు - ఆంధ్ర & తెలంగాణ)</option>
                                        <option value="hi">🇮🇳 Hindi (हिंदी - भारत)</option>
                                    </select>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                        Selecting Tamil, Telugu, Hindi, or English will dynamically translate the whole portal and header navigation.
                                    </span>
                                </div>
                            </div>

                            {renderToggle('enable_multilingual', 'Enable Multi-Language Switcher on Header Navbar')}
                            {renderToggle('rtl_support', 'Enable Right-to-Left (RTL) Layout Mode for Arabic/Hebrew')}

                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '26px 0 16px' }}>
                                Supported Language Packages (Tamil, Telugu, Hindi & English)
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                {[
                                    {
                                        code: 'ta',
                                        name: 'Tamil (தமிழ்)',
                                        nativeTitle: 'தமிழ் மொழி',
                                        flag: '🇮🇳',
                                        desc: 'முழு இணையதளமும் (வேலை தேடல், சுயவிவரம், டாஷ்போர்டு) தமிழில் காட்சியளிக்கும்.',
                                        active: true
                                    },
                                    {
                                        code: 'te',
                                        name: 'Telugu (తెలుగు)',
                                        nativeTitle: 'తెలుగు భాష',
                                        flag: '🇮🇳',
                                        desc: 'మొత్తం వెబ్‌సైట్ (ఉద్యోగ శోధన, ప్రొఫైల్ మరియు డ్యాష్‌బోర్డ్) తెలుగులో ప్రదర్శించబడుతుంది.',
                                        active: true
                                    },
                                    {
                                        code: 'en',
                                        name: 'English',
                                        nativeTitle: 'English (US / Global)',
                                        flag: '🇬🇧',
                                        desc: 'Standard international language across all candidate and employer workflows.',
                                        active: true
                                    },
                                    {
                                        code: 'hi',
                                        name: 'Hindi (हिंदी)',
                                        nativeTitle: 'हिंदी भाषा',
                                        flag: '🇮🇳',
                                        desc: 'संपूर्ण वेबसाइट (जॉब सर्च, प्रोफाइल और डैशबोर्ड) हिंदी में अनुवादित होगी।',
                                        active: true
                                    }
                                ].map(l => {
                                    const isCurrent = (settings.default_language || language) === l.code;
                                    return (
                                        <div
                                            key={l.code}
                                            style={{
                                                padding: '20px',
                                                borderRadius: '16px',
                                                border: isCurrent ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                                                background: isCurrent ? '#f0f9ff' : '#ffffff',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px',
                                                boxShadow: isCurrent ? '0 4px 14px rgba(14, 165, 233, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '1.8rem' }}>{l.flag}</span>
                                                    <div>
                                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{l.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.nativeTitle} · Code: <strong>{l.code}</strong></div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 800,
                                                    padding: '3px 9px',
                                                    borderRadius: '12px',
                                                    background: isCurrent ? '#dcfce7' : '#f1f5f9',
                                                    color: isCurrent ? '#15803d' : '#64748b',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {isCurrent ? 'Active' : 'Available'}
                                                </span>
                                            </div>

                                            <p style={{ margin: 0, fontSize: '0.84rem', color: '#475569', lineHeight: 1.4 }}>
                                                {l.desc}
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleSettingChange('default_language', l.code);
                                                    setLanguage(l.code);
                                                    addToast('success', `Language switched to ${l.name}`);
                                                }}
                                                style={{
                                                    marginTop: 'auto',
                                                    padding: '8px 14px',
                                                    borderRadius: '10px',
                                                    border: isCurrent ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                                                    background: isCurrent ? '#0ea5e9' : '#ffffff',
                                                    color: isCurrent ? '#ffffff' : '#334155',
                                                    fontWeight: 700,
                                                    fontSize: '0.84rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                {isCurrent ? <><FiCheck /> Selected Active Language</> : `Switch to ${l.name}`}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 12: EXTENSIONS & PLUGINS */}
                    {/* ========================================================================= */}
                    {activeTab === 'extensions' && (
                        <div>
                            {/* Google reCAPTCHA */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800 }}>Google reCAPTCHA v2 / v3 Bot Protection</h4>
                                {renderToggle('recaptcha_enabled', 'Enable reCAPTCHA on Login & Registration Forms')}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {renderInput('recaptcha_site_key', 'reCAPTCHA Site Key', 'text', '6LeIx...')}
                                    {renderInput('recaptcha_secret_key', 'reCAPTCHA Secret Key', 'password', '6LeIx...')}
                                </div>
                            </div>

                            {/* OpenAI AI Resume Parser */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800 }}>AI Resume Parser & Career Matchmaker Engine</h4>
                                {renderToggle('openai_resume_parser_enabled', 'Enable OpenAI GPT-4o Resume Deep Extraction')}
                                {renderInput('openai_api_key', 'OpenAI API Secret Key', 'password', 'sk-proj-...')}
                            </div>

                            {/* Tawk.to Live Chat */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800 }}>Tawk.to Customer Live Chat Widget</h4>
                                {renderToggle('tawkto_enabled', 'Enable Live Chat Widget on Public Portal')}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {renderInput('tawkto_property_id', 'Tawk.to Property ID', 'text', '')}
                                    {renderInput('tawkto_widget_id', 'Tawk.to Widget ID', 'text', '')}
                                </div>
                            </div>

                            {/* Zoom Interviews */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800 }}>Zoom Video Interview Scheduler Integration</h4>
                                {renderToggle('zoom_meeting_enabled', 'Auto-Generate Zoom Meeting Links for Scheduled Interviews')}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {renderInput('zoom_api_key', 'Zoom JWT / SDK API Key', 'text', 'zoom_key_...')}
                                    {renderInput('zoom_api_secret', 'Zoom API Secret', 'password', '••••••••••••••••')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 13: CRON JOB SETTING */}
                    {/* ========================================================================= */}
                    {activeTab === 'cron_jobs' && (
                        <div>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>System Server Cron Daemon</h4>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                                    Automated scheduled jobs run in the background to enforce expiry, send daily job matching digests, and perform database maintenance.
                                </p>
                            </div>

                            {[
                                { key: 'cron_job_expiry', name: 'Auto Job Expiry Daemon', scheduleKey: 'cron_job_expiry_schedule', desc: 'Checks and archives jobs past their expiration deadline (e.g. 30 days)' },
                                { key: 'cron_subscription_reminder', name: 'Subscription Renewal Alert Cron', scheduleKey: 'cron_subscription_reminder_schedule', desc: 'Dispatches email reminders to employers whose plans expire within 72 hours' },
                                { key: 'cron_candidate_alerts', name: 'Daily Candidate Job Alerts Digest', scheduleKey: 'cron_candidate_alerts_schedule', desc: 'Matches newly posted active jobs with candidate career preferences and sends digest' },
                                { key: 'cron_backup', name: 'Database Maintenance & Log Rotation', scheduleKey: 'cron_backup_schedule', desc: 'Cleans orphaned session logs and generates an integrity backup' }
                            ].map(cron => (
                                <div key={cron.key} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', marginBottom: '16px', background: '#ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FiClock color="#2563eb" />
                                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{cron.name}</h4>
                                            </div>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>{cron.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => handleTriggerCron(cron.key, cron.name)}
                                            disabled={cronExecuting[cron.key]}
                                            style={{
                                                background: '#eff6ff',
                                                color: '#2563eb',
                                                border: '1px solid #bfdbfe',
                                                padding: '8px 14px',
                                                borderRadius: '8px',
                                                fontSize: '0.82rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <FiPlay size={13} />
                                            {cronExecuting[cron.key] ? 'Executing...' : 'Run Manually Now'}
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
                                        {renderInput(cron.scheduleKey, 'Cron Expression', 'text', '0 0 * * *')}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Last Executed At</label>
                                            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                                                {settings[`${cron.key}_last_run`] || '2026-08-19 00:00:15'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 14: POLICY PAGES */}
                    {/* ========================================================================= */}
                    {activeTab === 'policy_pages' && (
                        <div>
                            {/* Sub-tabs for each policy */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                                {[
                                    { id: 'privacy', label: 'Privacy Policy' },
                                    { id: 'terms', label: 'Terms & Conditions' },
                                    { id: 'refund', label: 'Refund Policy' },
                                    { id: 'posting', label: 'Employer Posting Guidelines' }
                                ].map(st => (
                                    <button
                                        key={st.id}
                                        onClick={() => setPolicyActiveSubTab(st.id)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: policyActiveSubTab === st.id ? '#2563eb' : '#f1f5f9',
                                            color: policyActiveSubTab === st.id ? '#ffffff' : '#475569',
                                            fontWeight: 700,
                                            fontSize: '0.84rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                    Policy Content (Markdown & HTML Supported)
                                </label>
                                {renderInput('policy_last_updated', 'Last Updated Display Stamp', 'text', 'August 15, 2026')}
                            </div>

                            {policyActiveSubTab === 'privacy' && (
                                <textarea
                                    rows="14"
                                    value={settings.privacy_policy_content || ''}
                                    onChange={e => handleSettingChange('privacy_policy_content', e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.5, boxSizing: 'border-box' }}
                                />
                            )}
                            {policyActiveSubTab === 'terms' && (
                                <textarea
                                    rows="14"
                                    value={settings.terms_conditions_content || ''}
                                    onChange={e => handleSettingChange('terms_conditions_content', e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.5, boxSizing: 'border-box' }}
                                />
                            )}
                            {policyActiveSubTab === 'refund' && (
                                <textarea
                                    rows="14"
                                    value={settings.refund_policy_content || ''}
                                    onChange={e => handleSettingChange('refund_policy_content', e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.5, boxSizing: 'border-box' }}
                                />
                            )}
                            {policyActiveSubTab === 'posting' && (
                                <textarea
                                    rows="14"
                                    value={settings.posting_guidelines_content || ''}
                                    onChange={e => handleSettingChange('posting_guidelines_content', e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.5, boxSizing: 'border-box' }}
                                />
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 15: MAINTENANCE MODE */}
                    {/* ========================================================================= */}
                    {activeTab === 'maintenance_mode' && (
                        <div>
                            <div style={{
                                background: settings.maintenance_mode_enabled === 'true' ? '#fef2f2' : '#f8fafc',
                                border: `1px solid ${settings.maintenance_mode_enabled === 'true' ? '#fecaca' : '#e2e8f0'}`,
                                borderRadius: '16px',
                                padding: '22px',
                                marginBottom: '22px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                    <FiAlertOctagon size={24} color={settings.maintenance_mode_enabled === 'true' ? '#dc2626' : '#64748b'} />
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: settings.maintenance_mode_enabled === 'true' ? '#991b1b' : '#0f172a' }}>
                                            {settings.maintenance_mode_enabled === 'true' ? 'MAINTENANCE MODE IS CURRENTLY ACTIVE' : 'Maintenance Mode is Inactive (Live)'}
                                        </h3>
                                        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                                            When enabled, public visitors will see a splash screen while administrators can still access via token or whitelisted IP.
                                        </p>
                                    </div>
                                </div>
                                {renderToggle('maintenance_mode_enabled', 'Activate System Maintenance Lockdown Mode')}
                            </div>

                            {renderInput('maintenance_title', 'Maintenance Splash Screen Heading', 'text', 'Under Scheduled System Maintenance')}
                            {renderInput('maintenance_message', 'Maintenance Message to Visitors', 'text', 'We are currently undergoing scheduled upgrades...')}
                            {renderInput('maintenance_estimated_time', 'Estimated Completion Date/Time', 'text', '2026-08-19 14:00 IST')}
                            {renderInput('maintenance_allowed_ips', 'Whitelisted Admin IP Addresses (Comma separated)', 'text', '127.0.0.1, 192.168.1.1')}
                            {renderInput('maintenance_bypass_token', 'Secret Emergency Access Bypass Token', 'text', 'superadmin_bypass_2026')}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 16: GDPR COOKIE */}
                    {/* ========================================================================= */}
                    {activeTab === 'gdpr_cookie' && (
                        <div>
                            {/* Live Cookie Banner Preview */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>Live Cookie Banner Preview</strong>
                                    <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>Preview</span>
                                </div>
                                <div style={{
                                    background: '#0f172a',
                                    color: 'white',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '20px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ fontSize: '0.84rem', color: '#cbd5e1', flex: 1 }}>
                                        {settings.gdpr_banner_text || 'We use cookies to enhance your experience...'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #475569', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {settings.gdpr_reject_button_text || 'Decline'}
                                        </button>
                                        <button style={{ background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                            {settings.gdpr_accept_button_text || 'Accept All'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {renderToggle('gdpr_cookie_enabled', 'Enable GDPR / ePrivacy Cookie Consent Banner')}
                            {renderInput('gdpr_banner_text', 'Consent Banner Notification Text', 'text', 'We use cookies to improve your browsing experience...')}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {renderInput('gdpr_accept_button_text', 'Accept Button Text', 'text', 'Accept All')}
                                {renderInput('gdpr_reject_button_text', 'Reject Button Text', 'text', 'Decline Optional')}
                                {renderInput('gdpr_privacy_url', 'Privacy Policy Page Link', 'text', '/privacy-policy')}
                                {renderInput('gdpr_cookie_expiry_days', 'Consent Validity Lifetime (Days)', 'number', '365')}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 17: CUSTOM CSS & JS */}
                    {/* ========================================================================= */}
                    {activeTab === 'custom_css' && (
                        <div>
                            <div style={{ marginBottom: '22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                        1. Custom Global Header CSS (Injected into &lt;head&gt;)
                                    </label>
                                    <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', color: '#64748b' }}>CSS Syntax</span>
                                </div>
                                <textarea
                                    rows="7"
                                    value={settings.custom_header_css || ''}
                                    onChange={e => handleSettingChange('custom_header_css', e.target.value)}
                                    placeholder="/* .my-custom-class { color: #2563eb; } */"
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.86rem', background: '#0f172a', color: '#38bdf8', lineHeight: 1.4, boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ marginBottom: '22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                        2. Custom Footer JavaScript (Injected before &lt;/body&gt;)
                                    </label>
                                    <span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', color: '#64748b' }}>JavaScript</span>
                                </div>
                                <textarea
                                    rows="7"
                                    value={settings.custom_footer_js || ''}
                                    onChange={e => handleSettingChange('custom_footer_js', e.target.value)}
                                    placeholder="// console.log('Custom script executed');"
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.86rem', background: '#0f172a', color: '#4ade80', lineHeight: 1.4, boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                                    3. Custom &lt;head&gt; Meta Verification Tags / External Script Links
                                </label>
                                <textarea
                                    rows="4"
                                    value={settings.custom_header_meta || ''}
                                    onChange={e => handleSettingChange('custom_header_meta', e.target.value)}
                                    placeholder="<meta name='custom-verification' content='...' />"
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.86rem', background: '#f8fafc', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 18: SITEMAP XML */}
                    {/* ========================================================================= */}
                    {activeTab === 'sitemap_xml' && (
                        <div>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FiMap color="#2563eb" />
                                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Live XML Sitemap Public Endpoint</strong>
                                    </div>
                                    <a 
                                        href="http://localhost:5000/sitemap.xml" 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            color: '#2563eb',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <FiExternalLink /> View sitemap.xml
                                    </a>
                                </div>
                                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                                    Automatically crawls registered jobs, active companies, and static pages to submit to Google Search Console and Bing.
                                </p>
                            </div>

                            {renderToggle('sitemap_enabled', 'Enable Automatic Dynamic XML Sitemap Generation')}
                            {renderToggle('sitemap_include_jobs', 'Include Active Job Listings in Sitemap Index', 'Daily updated')}
                            {renderToggle('sitemap_include_companies', 'Include Verified Employer Profiles in Sitemap')}
                            {renderToggle('sitemap_include_blogs', 'Include Career Blog & Advice Articles in Sitemap')}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Change Frequency Directive
                                    </label>
                                    <select
                                        value={settings.sitemap_frequency}
                                        onChange={e => handleSettingChange('sitemap_frequency', e.target.value)}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="hourly">Hourly</option>
                                        <option value="daily">Daily (Recommended)</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                {renderInput('sitemap_priority', 'Crawler Priority Level (0.1 to 1.0)', 'text', '0.8')}
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Additional Custom Landing URLs to Index (One URL per line)
                                </label>
                                <textarea
                                    rows="4"
                                    value={settings.sitemap_custom_urls || ''}
                                    onChange={e => handleSettingChange('sitemap_custom_urls', e.target.value)}
                                    placeholder="https://jobconnect.com/career-tips&#10;https://jobconnect.com/salary-guide"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.86rem', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 19: ROBOTS TXT */}
                    {/* ========================================================================= */}
                    {activeTab === 'robots_txt' && (
                        <div>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FiTerminal color="#2563eb" />
                                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Live Robots.txt Public Directive</strong>
                                    </div>
                                    <a 
                                        href="http://localhost:5000/robots.txt" 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            color: '#2563eb',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <FiExternalLink /> View robots.txt
                                    </a>
                                </div>
                                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                                    Control search engine crawler behavior (Googlebot, Bingbot, etc.) and restrict sensitive private admin or API endpoints.
                                </p>
                            </div>

                            {/* Preset Templates */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Quick Presets:</span>
                                <button
                                    onClick={() => handleSettingChange('robots_txt_content', 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /company/messages/\nDisallow: /jobseeker/messages/\n\nSitemap: http://localhost:5000/sitemap.xml')}
                                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Standard Job Portal
                                </button>
                                <button
                                    onClick={() => handleSettingChange('robots_txt_content', 'User-agent: *\nAllow: /\n\nSitemap: http://localhost:5000/sitemap.xml')}
                                    style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Allow All
                                </button>
                                <button
                                    onClick={() => handleSettingChange('robots_txt_content', 'User-agent: *\nDisallow: /')}
                                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Block All Crawlers
                                </button>
                            </div>

                            <textarea
                                rows="12"
                                value={settings.robots_txt_content || ''}
                                onChange={e => handleSettingChange('robots_txt_content', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid #cbd5e1',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    background: '#0f172a',
                                    color: '#f8fafc',
                                    lineHeight: 1.5,
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 20: GEO-TAG & LOCATION-BASED JOBS ACCESS CONTROL */}
                    {/* ========================================================================= */}
                    {activeTab === 'geotag_location' && (
                        <div>
                            {/* Master Switch Alert */}
                            <div style={{
                                background: settings.geotag_enabled === 'true' ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : '#f8fafc',
                                border: `1px solid ${settings.geotag_enabled === 'true' ? '#bbf7d0' : '#e2e8f0'}`,
                                borderRadius: '16px',
                                padding: '20px',
                                marginBottom: '22px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: settings.geotag_enabled === 'true' ? '#16a34a' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                            <FiMapPin />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: settings.geotag_enabled === 'true' ? '#14532d' : '#0f172a' }}>
                                                {settings.geotag_enabled === 'true' ? 'Geo-Tag Location Engine is ACTIVE' : 'Geo-Tag Location Services Disabled'}
                                            </h3>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#475569' }}>
                                                Manage granular permissions for Candidate GPS proximity matching and Employer pinpoint job tagging.
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, background: settings.geotag_enabled === 'true' ? '#dcfce7' : '#f1f5f9', color: settings.geotag_enabled === 'true' ? '#15803d' : '#64748b' }}>
                                        {settings.geotag_enabled === 'true' ? 'Live System Active' : 'Offline'}
                                    </span>
                                </div>
                            </div>

                            {renderToggle('geotag_enabled', 'Master Geo-Tagging & Location Services Engine', 'Enables coordinate indexing and distance calculation across the portal')}

                            {/* Section 1: Candidate Access Permissions */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', marginBottom: '22px', background: '#ffffff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FiUserCheck size={16} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>1. Candidate / Jobseeker Access Permissions</h4>
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Control what location discovery features are accessible to candidates</span>
                                    </div>
                                </div>

                                {renderToggle('geotag_candidate_access', 'Grant Candidate Access to Location-Based Jobs ("Jobs Near Me")', 'Permits jobseekers to browse and filter jobs by distance radius from their current location', 'Core Access')}
                                {renderToggle('geotag_auto_detect_location', 'Allow 1-Click GPS Browser Location Auto-Detection', 'Prompts candidate browser for instant geolocation coordinates on search')}
                                {renderToggle('geotag_show_distance_badge', 'Display Distance Badges (e.g. "📍 4.2 km away") on Job Cards', 'Shows exact calculated distance from candidate location to job site')}
                            </div>

                            {/* Section 2: Employer Access Permissions */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', marginBottom: '22px', background: '#ffffff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FiBriefcase size={16} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>2. Employer / Recruiter Access Permissions</h4>
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Control job geo-tagging and location-based applicant filtering</span>
                                    </div>
                                </div>

                                {renderToggle('geotag_employer_access', 'Grant Employer Access to Geo-Tag Job Openings', 'Allows companies to pinpoint exact latitude and longitude on map during job creation', 'Core Access')}
                                {renderToggle('geotag_allow_geofencing', 'Enable Employer Geofencing Applicant Radius Filter', 'Allows recruiters to specify preferred applicant distance radius (e.g. within 25 km of office)')}
                                {renderToggle('geotag_require_precise_gps', 'Require Exact Coordinates for Physical Office On-Site Roles', 'Enforces GPS coordinates when posting non-remote vacancies')}
                            </div>

                            {/* Section 3: Radius & Provider Configuration */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', marginBottom: '22px', background: '#ffffff' }}>
                                <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>3. Radius Limits & Map Provider Configuration</h4>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Default Candidate Search Radius (km)
                                        </label>
                                        <select
                                            value={settings.geotag_default_radius || '25'}
                                            onChange={e => handleSettingChange('geotag_default_radius', e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        >
                                            <option value="5">5 Kilometers (Hyper-local)</option>
                                            <option value="10">10 Kilometers (City Core)</option>
                                            <option value="25">25 Kilometers (Metro Area - Recommended)</option>
                                            <option value="50">50 Kilometers (Greater Region)</option>
                                            <option value="100">100 Kilometers (State/Commute Zone)</option>
                                        </select>
                                    </div>

                                    {renderInput('geotag_max_radius', 'Maximum Allowed Search Radius (km)', 'number', '100')}

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Map & Geocoding Provider
                                        </label>
                                        <select
                                            value={settings.geotag_map_provider || 'openstreetmap'}
                                            onChange={e => handleSettingChange('geotag_map_provider', e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        >
                                            <option value="openstreetmap">OpenStreetMap & Leaflet (Free / Built-in)</option>
                                            <option value="google_maps">Google Maps Platform (API Key Required)</option>
                                            <option value="mapbox">Mapbox GL (Vector Maps)</option>
                                        </select>
                                    </div>

                                    {settings.geotag_map_provider === 'google_maps' && renderInput('geotag_google_maps_api_key', 'Google Maps Javascript API Key', 'password', 'AIzaSy...')}
                                </div>
                            </div>

                            {/* Section 4: Live Interactive Geo-Location & Distance Simulator */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                            📍 Live Admin Geo-Location & Distance Match Simulator
                                        </h4>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                            Test real-time Haversine distance calculations and check matching jobs within radius.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {['Bangalore', 'Mumbai', 'Chennai', 'Delhi', 'Hyderabad'].map(c => (
                                            <button
                                                key={c}
                                                onClick={async () => {
                                                    setSimCity(c);
                                                    setSimLoading(true);
                                                    const coords = {
                                                        'Bangalore': { lat: 12.9716, lng: 77.5946 },
                                                        'Mumbai': { lat: 19.0760, lng: 72.8777 },
                                                        'Chennai': { lat: 13.0827, lng: 80.2707 },
                                                        'Delhi': { lat: 28.6139, lng: 77.2090 },
                                                        'Hyderabad': { lat: 17.3850, lng: 78.4867 }
                                                    }[c];
                                                    try {
                                                        const res = await fetch(`http://localhost:5000/api/jobs/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=${simRadius}`);
                                                        const data = await res.json();
                                                        setSimJobsFound(data.jobs || []);
                                                    } catch (e) {
                                                        console.error(e);
                                                    } finally {
                                                        setSimLoading(false);
                                                    }
                                                }}
                                                style={{
                                                    background: simCity === c ? '#2563eb' : '#ffffff',
                                                    color: simCity === c ? '#ffffff' : '#334155',
                                                    border: '1px solid #cbd5e1',
                                                    padding: '5px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                                            Simulated Center: <strong>{simCity}</strong> (Radius: {simRadius} km)
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 800 }}>
                                            {simJobsFound.length} Jobs in Vicinity
                                        </span>
                                    </div>

                                    {simLoading ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Calculating GPS coordinates...</div>
                                    ) : simJobsFound.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {simJobsFound.map(j => (
                                                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.84rem' }}>
                                                    <div>
                                                        <strong style={{ color: '#0f172a' }}>{j.title || j.job_title}</strong>
                                                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{j.company_name || 'Tech Company'} • {j.job_location || j.location}</div>
                                                    </div>
                                                    <span style={{ padding: '3px 9px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '0.78rem' }}>
                                                        📍 {j.distance_km} km away
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '14px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                                            Click any city preset above to test real-time distance calculations to active jobs.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Save Bar */}
                    <div style={{
                        marginTop: '32px',
                        paddingTop: '20px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.82rem' }}>
                            <FiInfo size={16} />
                            <span>Changes apply globally across candidate, employer, and admin interfaces.</span>
                        </div>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            style={{
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '12px 28px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.92rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <FiSave size={16} />
                            <span>{saving ? 'Saving System Changes...' : 'Save Settings'}</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
