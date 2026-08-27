const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT,
                isPremium INTEGER DEFAULT 0,
                applicationCount INTEGER DEFAULT 0,
                phone TEXT,
                address TEXT,
                companyName TEXT,
                hrName TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, async (err) => {
            if (err) {
                console.error('Error creating table', err.message);
                return;
            }
            console.log('Users table ready.');

            // Migration: Add columns if they don't exist (SQLite doesn't support ADD COLUMN IF NOT EXISTS easily)
            const addColumn = (col, type, def = '') => {
                db.run(`ALTER TABLE users ADD COLUMN ${col} ${type} ${def}`, (err) => {
                    if (!err) console.log(`Added column ${col}`);
                });
            };
            addColumn('isPremium', 'INTEGER', 'DEFAULT 0');
            addColumn('applicationCount', 'INTEGER', 'DEFAULT 0');
            addColumn('phone', 'TEXT');
            addColumn('address', 'TEXT');
            addColumn('companyName', 'TEXT');
            addColumn('hrName', 'TEXT');
            addColumn('approved_access', 'INTEGER', 'DEFAULT 0');

            // Create Applications Table
            db.run(`
                CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    jobId INTEGER,
                    applicantId INTEGER,
                    companyId INTEGER,
                    status TEXT DEFAULT 'pending',
                    appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (jobId) REFERENCES jobs (id),
                    FOREIGN KEY (applicantId) REFERENCES users (id)
                )
            `, (err) => {
                if (!err) console.log('Applications table ready.');
            });

            // Create Jobs Table (if missing)
            db.run(`
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT,
                    employer_id TEXT,
                    company_id TEXT,
                    companyId INTEGER,
                    title TEXT,
                    job_title TEXT,
                    description TEXT,
                    job_description TEXT,
                    location TEXT,
                    job_location TEXT,
                    location_type TEXT,
                    number_of_openings INTEGER DEFAULT 1,
                    experience_type TEXT,
                    minimum_experience TEXT,
                    maximum_experience TEXT,
                    experience TEXT,
                    education TEXT,
                    skills TEXT,
                    required_skills TEXT,
                    preferred_skills TEXT,
                    gender_preference TEXT,
                    minimum_age TEXT,
                    maximum_age TEXT,
                    salary TEXT,
                    minimum_salary TEXT,
                    maximum_salary TEXT,
                    salary_type TEXT,
                    salary_negotiable INTEGER DEFAULT 0,
                    responsibilities TEXT,
                    working_days TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    shift_type TEXT,
                    working_hours TEXT,
                    company_name TEXT,
                    company_logo TEXT,
                    contact_person_name TEXT,
                    company_phone TEXT,
                    company_email TEXT,
                    company_website TEXT,
                    about_company TEXT,
                    hiring_timeline TEXT,
                    hiring_frequency TEXT,
                    hiring_priority TEXT,
                    building_name TEXT,
                    door_number TEXT,
                    street TEXT,
                    area TEXT,
                    city TEXT,
                    district TEXT,
                    state TEXT,
                    country TEXT,
                    pincode TEXT,
                    benefits TEXT,
                    notice_period TEXT,
                    joining_date TEXT,
                    application_method TEXT,
                    application_url TEXT,
                    application_email TEXT,
                    application_deadline TEXT,
                    jobType TEXT,
                    googleFormLink TEXT,
                    cgpa TEXT,
                    status TEXT DEFAULT 'active',
                    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) {
                    console.log('Jobs table ready.');
                    // Migration for jobs table columns
                    const addJobCol = (col, type, def = '') => {
                        db.run(`ALTER TABLE jobs ADD COLUMN ${col} ${type} ${def}`, (err) => {});
                    };
                    [
                        'job_id', 'employer_id', 'company_id', 'job_title', 'job_description',
                        'job_location', 'location_type', 'number_of_openings', 'experience_type',
                        'minimum_experience', 'maximum_experience', 'education', 'required_skills',
                        'preferred_skills', 'gender_preference', 'minimum_age', 'maximum_age',
                        'minimum_salary', 'maximum_salary', 'salary_type', 'salary_negotiable',
                        'responsibilities', 'working_days', 'start_time', 'end_time', 'shift_type',
                        'working_hours', 'company_name', 'company_logo', 'contact_person_name',
                        'company_phone', 'company_email', 'company_website', 'about_company',
                        'hiring_timeline', 'hiring_frequency', 'hiring_priority', 'building_name',
                        'door_number', 'street', 'area', 'city', 'district', 'state', 'country',
                        'pincode', 'benefits', 'notice_period', 'joining_date', 'application_method',
                        'application_url', 'application_email', 'application_deadline', 'posted_at', 'updated_at',
                        'latitude', 'longitude', 'geo_address', 'geo_radius'
                    ].forEach(col => addJobCol(col, 'TEXT'));

                    // Seed default coordinates for jobs that have city/location but no latitude
                    db.run(`UPDATE jobs SET latitude = '12.9716', longitude = '77.5946', geo_address = 'Bangalore, Karnataka' WHERE (latitude IS NULL OR latitude = '') AND (city LIKE '%Bangalore%' OR location LIKE '%Bangalore%' OR job_location LIKE '%Bangalore%')`, () => {});
                    db.run(`UPDATE jobs SET latitude = '19.0760', longitude = '72.8777', geo_address = 'Mumbai, Maharashtra' WHERE (latitude IS NULL OR latitude = '') AND (city LIKE '%Mumbai%' OR location LIKE '%Mumbai%' OR job_location LIKE '%Mumbai%')`, () => {});
                    db.run(`UPDATE jobs SET latitude = '28.6139', longitude = '77.2090', geo_address = 'New Delhi, NCR' WHERE (latitude IS NULL OR latitude = '') AND (city LIKE '%Delhi%' OR location LIKE '%Delhi%' OR job_location LIKE '%Delhi%')`, () => {});
                    db.run(`UPDATE jobs SET latitude = '13.0827', longitude = '80.2707', geo_address = 'Chennai, Tamil Nadu' WHERE (latitude IS NULL OR latitude = '') AND (city LIKE '%Chennai%' OR location LIKE '%Chennai%' OR job_location LIKE '%Chennai%')`, () => {});
                    db.run(`UPDATE jobs SET latitude = '17.3850', longitude = '78.4867', geo_address = 'Hyderabad, Telangana' WHERE (latitude IS NULL OR latitude = '') AND (city LIKE '%Hyderabad%' OR location LIKE '%Hyderabad%' OR job_location LIKE '%Hyderabad%')`, () => {});
                    db.run(`UPDATE jobs SET latitude = '18.5204', longitude = '73.8567', geo_address = 'Pune, Maharashtra' WHERE (latitude IS NULL OR latitude = '') AND (city LIKE '%Pune%' OR location LIKE '%Pune%' OR job_location LIKE '%Pune%')`, () => {});
                }
            });


            // Create Assessments Table
            db.run(`
                CREATE TABLE IF NOT EXISTS assessments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    companyId INTEGER,
                    title TEXT,
                    type TEXT,
                    timer INTEGER,
                    passingMarks INTEGER,
                    status TEXT DEFAULT 'active',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (companyId) REFERENCES users (id)
                )
            `, (err) => {
                if (!err) console.log('Assessments table ready.');
            });

            // Create Assessment Questions Table
            db.run(`
                CREATE TABLE IF NOT EXISTS assessment_questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    assessmentId INTEGER,
                    questionData TEXT,
                    answer TEXT,
                    language TEXT,
                    FOREIGN KEY (assessmentId) REFERENCES assessments (id)
                )
            `, (err) => {
                if (!err) console.log('Assessment questions table ready.');
            });

            // Create Assessment Attempts Table
            db.run(`
                CREATE TABLE IF NOT EXISTS assessment_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    assessmentId INTEGER,
                    candidateId INTEGER,
                    score REAL,
                    details TEXT,
                    status TEXT DEFAULT 'completed',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (assessmentId) REFERENCES assessments (id),
                    FOREIGN KEY (candidateId) REFERENCES users (id)
                )
            `, (err) => {
                if (!err) console.log('Assessment attempts table ready.');
            });

            // Create Subscription Plans Table
            db.run(`
                CREATE TABLE IF NOT EXISTS subscription_plans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    target_role TEXT DEFAULT 'employer',
                    plan_type TEXT DEFAULT 'common',
                    company_id TEXT,
                    company_name TEXT,
                    price REAL DEFAULT 0,
                    billing_type TEXT DEFAULT 'monthly',
                    duration_months INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'active',
                    badge_text TEXT DEFAULT '',
                    discount_percent INTEGER DEFAULT 0,
                    is_popular INTEGER DEFAULT 0,
                    priority_level INTEGER DEFAULT 1,
                    job_limit INTEGER DEFAULT 20,
                    contact_views INTEGER DEFAULT -1,
                    resume_downloads INTEGER DEFAULT -1,
                    candidate_search_limit INTEGER DEFAULT -1,
                    data_request_limit INTEGER DEFAULT 0,
                    data_export_limit INTEGER DEFAULT 0,
                    active_job_limit INTEGER DEFAULT -1,
                    interview_limit INTEGER DEFAULT -1,
                    message_limit INTEGER DEFAULT -1,
                    application_limit INTEGER DEFAULT -1,
                    resume_upload_limit INTEGER DEFAULT 1,
                    resume_analysis_limit INTEGER DEFAULT 0,
                    featured_profile INTEGER DEFAULT 0,
                    skill_test_access INTEGER DEFAULT 1,
                    mock_interview_access INTEGER DEFAULT 0,
                    job_alert_access INTEGER DEFAULT 1,
                    recruiter_contact_access INTEGER DEFAULT 0,
                    premium_job_access INTEGER DEFAULT 1,
                    allowed_data_fields TEXT DEFAULT '["name","skills","experience","location","education","resume"]',
                    features TEXT,
                    role TEXT DEFAULT 'company',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) {
                    console.log('Subscription plans table ready.');

                    // Migrations for subscription_plans
                    const addPlanCol = (col, type, def = '') => {
                        db.run(`ALTER TABLE subscription_plans ADD COLUMN ${col} ${type} ${def}`, () => {});
                    };
                    addPlanCol('target_role', 'TEXT', "DEFAULT 'employer'");
                    addPlanCol('plan_type', 'TEXT', "DEFAULT 'common'");
                    addPlanCol('company_id', 'TEXT', "DEFAULT ''");
                    addPlanCol('company_name', 'TEXT', "DEFAULT ''");
                    addPlanCol('billing_type', 'TEXT', "DEFAULT 'monthly'");
                    addPlanCol('duration_months', 'INTEGER', 'DEFAULT 1');
                    addPlanCol('contact_views', 'INTEGER', 'DEFAULT -1');
                    addPlanCol('resume_downloads', 'INTEGER', 'DEFAULT -1');
                    addPlanCol('status', 'TEXT', "DEFAULT 'active'");
                    addPlanCol('priority_level', 'INTEGER', 'DEFAULT 1');
                    addPlanCol('job_limit', 'INTEGER', 'DEFAULT 20');
                    addPlanCol('badge_text', 'TEXT', "DEFAULT ''");
                    addPlanCol('discount_percent', 'INTEGER', 'DEFAULT 0');
                    addPlanCol('is_popular', 'INTEGER', 'DEFAULT 0');
                    addPlanCol('candidate_search_limit', 'INTEGER', 'DEFAULT -1');
                    addPlanCol('data_request_limit', 'INTEGER', 'DEFAULT 0');
                    addPlanCol('data_export_limit', 'INTEGER', 'DEFAULT 0');
                    addPlanCol('active_job_limit', 'INTEGER', 'DEFAULT -1');
                    addPlanCol('interview_limit', 'INTEGER', 'DEFAULT -1');
                    addPlanCol('message_limit', 'INTEGER', 'DEFAULT -1');
                    addPlanCol('application_limit', 'INTEGER', 'DEFAULT -1');
                    addPlanCol('resume_upload_limit', 'INTEGER', 'DEFAULT 1');
                    addPlanCol('resume_analysis_limit', 'INTEGER', 'DEFAULT 0');
                    addPlanCol('featured_profile', 'INTEGER', 'DEFAULT 0');
                    addPlanCol('skill_test_access', 'INTEGER', 'DEFAULT 1');
                    addPlanCol('mock_interview_access', 'INTEGER', 'DEFAULT 0');
                    addPlanCol('job_alert_access', 'INTEGER', 'DEFAULT 1');
                    addPlanCol('recruiter_contact_access', 'INTEGER', 'DEFAULT 0');
                    addPlanCol('premium_job_access', 'INTEGER', 'DEFAULT 1');
                    addPlanCol('allowed_data_fields', 'TEXT', "DEFAULT '[\"name\",\"skills\",\"experience\",\"location\",\"education\",\"resume\"]'");
                    addPlanCol('updatedAt', 'DATETIME', 'DEFAULT CURRENT_TIMESTAMP');

                    // Seed default plans ONLY ONCE on initial database creation
                    db.get("SELECT value FROM system_settings WHERE key = 'default_plans_seeded'", [], (setErr, setRow) => {
                        if (!setRow) {
                            db.get('SELECT COUNT(*) as count FROM subscription_plans', [], (countErr, row) => {
                                if (!countErr && (!row || row.count === 0)) {
                                    console.log('Seeding default subscription plans (Employer + Candidate) on first run...');
                                    const defaultSeeds = [
                                        {
                                            name: 'Starter Employer', target_role: 'employer', plan_type: 'common', price: 0,
                                            billing_type: 'monthly', duration_months: 1, status: 'active', is_popular: 0,
                                            job_limit: 3, contact_views: 10, resume_downloads: 5, data_request_limit: 0,
                                            features: 'Post up to 3 Active Jobs\nView 10 Candidate Profiles\n5 Resume Downloads\nStandard Email Support'
                                        },
                                        {
                                            name: 'Growth Recruiter', target_role: 'employer', plan_type: 'common', price: 4999,
                                            billing_type: 'monthly', duration_months: 1, status: 'active', is_popular: 1, badge_text: 'Most Popular',
                                            job_limit: 25, contact_views: 100, resume_downloads: 100, data_request_limit: 50,
                                            features: 'Post up to 25 Active Jobs\n100 Contact Views & Resumes\n50 Candidate Data Exports\nAutomated Screening Questions\nPriority SLA Support'
                                        },
                                        {
                                            name: 'Enterprise Scale', target_role: 'employer', plan_type: 'common', price: 19999,
                                            billing_type: 'monthly', duration_months: 1, status: 'active', is_popular: 0, badge_text: 'Enterprise',
                                            job_limit: 100, contact_views: 500, resume_downloads: 500, data_request_limit: 250,
                                            features: 'Post up to 100 Active Jobs\n500 Resume Downloads\n250 Candidate Data Exports\nDedicated Account Manager\nCustom Hiring Pipeline'
                                        }
                                    ];

                                    defaultSeeds.forEach(p => {
                                        db.run(`
                                            INSERT INTO subscription_plans (
                                                name, target_role, plan_type, price, billing_type, duration_months,
                                                status, is_popular, badge_text, job_limit, contact_views, resume_downloads,
                                                data_request_limit, application_limit, featured_profile, skill_test_access,
                                                mock_interview_access, recruiter_contact_access, premium_job_access, features, role
                                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                        `, [
                                            p.name, p.target_role, p.plan_type, p.price, p.billing_type, p.duration_months,
                                            p.status, p.is_popular || 0, p.badge_text || '', p.job_limit || 20, p.contact_views || -1,
                                            p.resume_downloads || -1, p.data_request_limit || 0, p.application_limit || -1,
                                            p.featured_profile || 0, p.skill_test_access !== undefined ? p.skill_test_access : 1,
                                            p.mock_interview_access || 0, p.recruiter_contact_access || 0,
                                            p.premium_job_access !== undefined ? p.premium_job_access : 1,
                                            p.features, p.target_role === 'employer' ? 'company' : 'jobseeker'
                                        ]);
                                    });
                                }
                                db.run("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('default_plans_seeded', '1')");
                            });
                        }
                    });
                }
            });

            // Create System Settings Table (Admin configurable limits)
            db.run(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    description TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) {
                    console.log('System settings table ready.');
                    db.run(`INSERT OR IGNORE INTO system_settings (key, value, description) VALUES ('free_employer_job_limit', '3', 'Default maximum free job postings allowed per employer')`);
                    db.run(`INSERT OR IGNORE INTO system_settings (key, value, description) VALUES ('require_candidate_consent', 'true', 'Require candidate consent for contact info export')`);
                    db.run(`INSERT OR IGNORE INTO system_settings (key, value, description) VALUES ('mask_contact_info_default', 'false', 'Mask phone and email by default on preview')`);
                }
            });

            // Create Subscriptions Table
            db.run(`
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER,
                    companyId TEXT,
                    companyName TEXT,
                    employerName TEXT,
                    userEmail TEXT,
                    planId INTEGER,
                    target_role TEXT DEFAULT 'employer',
                    plan_type TEXT DEFAULT 'common',
                    amount REAL DEFAULT 0,
                    payment_status TEXT DEFAULT 'paid',
                    status TEXT DEFAULT 'active',
                    startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expiryDate DATETIME,
                    contactsViewed INTEGER DEFAULT 0,
                    resumeDownloads INTEGER DEFAULT 0,
                    jobsUsed INTEGER DEFAULT 0,
                    dataRequestsUsed INTEGER DEFAULT 0,
                    candidateDataExported INTEGER DEFAULT 0,
                    admin_override TEXT,
                    internal_notes TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userId) REFERENCES users (id),
                    FOREIGN KEY (planId) REFERENCES subscription_plans (id)
                )
            `, (err) => {
                if (!err) {
                    console.log('Subscriptions table ready.');
                    const addSubCol = (col, type, def = '') => {
                        db.run(`ALTER TABLE subscriptions ADD COLUMN ${col} ${type} ${def}`, () => {});
                    };
                    addSubCol('companyId', 'TEXT');
                    addSubCol('companyName', 'TEXT');
                    addSubCol('employerName', 'TEXT');
                    addSubCol('userEmail', 'TEXT');
                    addSubCol('target_role', 'TEXT', "DEFAULT 'employer'");
                    addSubCol('plan_type', 'TEXT', "DEFAULT 'common'");
                    addSubCol('amount', 'REAL', 'DEFAULT 0');
                    addSubCol('payment_status', 'TEXT', "DEFAULT 'paid'");
                    addSubCol('jobsUsed', 'INTEGER', 'DEFAULT 0');
                    addSubCol('dataRequestsUsed', 'INTEGER', 'DEFAULT 0');
                    addSubCol('candidateDataExported', 'INTEGER', 'DEFAULT 0');
                    addSubCol('admin_override', 'TEXT');
                    addSubCol('internal_notes', 'TEXT');
                    addSubCol('updatedAt', 'DATETIME', 'DEFAULT CURRENT_TIMESTAMP');
                }
            });

            // Create Plan Usage Table
            db.run(`
                CREATE TABLE IF NOT EXISTS plan_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subscriptionId INTEGER,
                    userId INTEGER,
                    companyId TEXT,
                    feature TEXT,
                    allowed_limit INTEGER DEFAULT 0,
                    used_limit INTEGER DEFAULT 0,
                    remaining_limit INTEGER DEFAULT 0,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (subscriptionId) REFERENCES subscriptions (id)
                )
            `, (err) => {
                if (!err) console.log('Plan usage table ready.');
            });

            // Create Candidate Data Requests Table
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_data_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    request_code TEXT UNIQUE,
                    employer_id TEXT,
                    company_id TEXT,
                    company_name TEXT,
                    employer_name TEXT,
                    employer_email TEXT,
                    employer_phone TEXT,
                    plan_id INTEGER,
                    plan_name TEXT,
                    requested_role TEXT,
                    location TEXT,
                    experience_min TEXT,
                    experience_max TEXT,
                    skills TEXT,
                    education TEXT,
                    candidate_status TEXT DEFAULT 'available',
                    requested_count INTEGER DEFAULT 100,
                    approved_count INTEGER DEFAULT 0,
                    available_count INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    admin_notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME
                )
            `, (err) => {
                if (!err) console.log('Candidate Data Requests table ready.');
            });

            // Create Candidate Data Exports Table
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_data_exports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    request_id INTEGER,
                    employer_id TEXT,
                    company_id TEXT,
                    company_name TEXT,
                    export_type TEXT DEFAULT 'csv',
                    candidate_count INTEGER DEFAULT 0,
                    candidate_ids TEXT,
                    file_name TEXT,
                    file_path TEXT,
                    delivery_method TEXT DEFAULT 'download',
                    delivery_status TEXT DEFAULT 'delivered',
                    recipient_email TEXT,
                    recipient_phone TEXT,
                    admin_id TEXT,
                    admin_name TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) console.log('Candidate Data Exports table ready.');
            });

            // Create Audit Logs Table
            db.run(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    admin_id TEXT,
                    admin_name TEXT,
                    admin_email TEXT,
                    action TEXT,
                    target_type TEXT,
                    target_id TEXT,
                    target_name TEXT,
                    description TEXT,
                    details_json TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) console.log('Audit logs table ready.');
            });

            // Create Payments Table
            db.run(`
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER,
                    planId INTEGER,
                    razorpayOrderId TEXT,
                    razorpayPaymentId TEXT,
                    amount REAL,
                    status TEXT DEFAULT 'pending',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userId) REFERENCES users (id),
                    FOREIGN KEY (planId) REFERENCES subscription_plans (id)
                )
            `, (err) => {
                if (!err) console.log('Payments table ready.');
            });

            // Create Unlocked Candidates Table
            db.run(`
                CREATE TABLE IF NOT EXISTS unlocked_candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employerId INTEGER,
                    candidateId INTEGER,
                    unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (employerId) REFERENCES users (id),
                    FOREIGN KEY (candidateId) REFERENCES users (id)
                )
            `, (err) => {
                if (!err) console.log('Unlocked candidates table ready.');
            });

            // Create Candidate Notes Table
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employerId INTEGER,
                    candidateId INTEGER,
                    jobId INTEGER,
                    note TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (employerId) REFERENCES users (id),
                    FOREIGN KEY (candidateId) REFERENCES users (id),
                    FOREIGN KEY (jobId) REFERENCES jobs (id)
                )
            `, (err) => {
                if (!err) console.log('Candidate notes table ready.');
            });

            // Create Bookmarked Candidates Table
            db.run(`
                CREATE TABLE IF NOT EXISTS bookmarked_candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employerId INTEGER,
                    candidateId INTEGER,
                    bookmarkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (employerId) REFERENCES users (id),
                    FOREIGN KEY (candidateId) REFERENCES users (id),
                    UNIQUE(employerId, candidateId)
                )
            `, (err) => {
                if (!err) console.log('Bookmarked candidates table ready.');
            });

            // Create Interviews Table
            db.run(`
                CREATE TABLE IF NOT EXISTS interviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    appId INTEGER,
                    employerId INTEGER,
                    candidateId INTEGER,
                    jobId INTEGER,
                    interviewDate TEXT,
                    interviewTime TEXT,
                    status TEXT DEFAULT 'scheduled',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (appId) REFERENCES applications (id),
                    FOREIGN KEY (employerId) REFERENCES users (id),
                    FOREIGN KEY (candidateId) REFERENCES users (id),
                    FOREIGN KEY (jobId) REFERENCES jobs (id)
                )
            `, (err) => {
                if (!err) console.log('Interviews table ready.');
            });

            // Create Employers Table
            db.run(`
                CREATE TABLE IF NOT EXISTS employers (
                    employer_id TEXT PRIMARY KEY,
                    mobile_number TEXT UNIQUE,
                    mobile_verified INTEGER DEFAULT 0,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    google_account_id TEXT,
                    company_id TEXT,
                    profile_completed INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) console.log('Employers table ready.');
            });

            // Create Companies Table
            db.run(`
                CREATE TABLE IF NOT EXISTS companies (
                    company_id TEXT PRIMARY KEY,
                    employer_id TEXT,
                    company_name TEXT,
                    company_logo TEXT,
                    website TEXT,
                    company_email TEXT,
                    company_phone TEXT,
                    industry TEXT,
                    company_type TEXT,
                    company_size TEXT,
                    year_established TEXT,
                    registration_number TEXT,
                    gst_number TEXT,
                    description TEXT,
                    address TEXT,
                    city TEXT,
                    state TEXT,
                    country TEXT,
                    pincode TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (employer_id) REFERENCES employers (employer_id)
                )
            `, (err) => {
                if (!err) {
                    console.log('Companies table ready.');
                    db.run(`ALTER TABLE companies ADD COLUMN approved_access INTEGER DEFAULT 0`, (colErr) => {});
                }
            });

            // Create Company Contacts Table
            db.run(`
                CREATE TABLE IF NOT EXISTS company_contacts (
                    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_id TEXT,
                    contact_person_name TEXT,
                    designation TEXT,
                    email TEXT,
                    phone TEXT,
                    alternate_phone TEXT,
                    FOREIGN KEY (company_id) REFERENCES companies (company_id)
                )
            `, (err) => {
                if (!err) console.log('Company contacts table ready.');
            });

            // Create OTPs Table
            db.run(`
                CREATE TABLE IF NOT EXISTS otps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mobile_number TEXT,
                    otp_code TEXT,
                    expires_at DATETIME,
                    verified INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) console.log('OTPs table ready.');
            });

            // Create Candidates Table (Requirement 27)
            db.run(`
                CREATE TABLE IF NOT EXISTS candidates (
                    candidate_id TEXT PRIMARY KEY,
                    mobile_number TEXT UNIQUE,
                    mobile_verified INTEGER DEFAULT 0,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    google_account_id TEXT,
                    full_name TEXT,
                    profile_photo TEXT,
                    date_of_birth TEXT,
                    gender TEXT,
                    city TEXT,
                    state TEXT,
                    country TEXT,
                    pincode TEXT,
                    address TEXT,
                    professional_headline TEXT,
                    current_job_title TEXT,
                    current_company TEXT,
                    total_experience TEXT,
                    experience_type TEXT,
                    about_me TEXT,
                    resume_url TEXT,
                    resume_name TEXT,
                    resume_updated_at TEXT,
                    profile_completed INTEGER DEFAULT 0,
                    profile_completion_percentage INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) console.log('Candidates table ready.');
            });

            // Create Candidate Education Table
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_education (
                    education_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id TEXT,
                    qualification TEXT,
                    degree TEXT,
                    specialization TEXT,
                    institution TEXT,
                    university TEXT,
                    start_year TEXT,
                    end_year TEXT,
                    percentage TEXT,
                    cgpa TEXT,
                    FOREIGN KEY (candidate_id) REFERENCES candidates (candidate_id)
                )
            `, (err) => {
                if (!err) console.log('Candidate Education table ready.');
            });

            // Create Candidate Experience Table
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_experience (
                    experience_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id TEXT,
                    company_name TEXT,
                    job_title TEXT,
                    employment_type TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    currently_working INTEGER DEFAULT 0,
                    location TEXT,
                    description TEXT,
                    FOREIGN KEY (candidate_id) REFERENCES candidates (candidate_id)
                )
            `, (err) => {
                if (!err) console.log('Candidate Experience table ready.');
            });

            // Create Candidate Skills Table
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_skills (
                    skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id TEXT,
                    skill_name TEXT,
                    skill_category TEXT,
                    FOREIGN KEY (candidate_id) REFERENCES candidates (candidate_id)
                )
            `, (err) => {
                if (!err) console.log('Candidate Skills table ready.');
            });

            // Create Career Preferences Table
            db.run(`
                CREATE TABLE IF NOT EXISTS career_preferences (
                    preference_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id TEXT,
                    preferred_job_types TEXT,
                    preferred_locations TEXT,
                    preferred_work_modes TEXT,
                    minimum_salary TEXT,
                    maximum_salary TEXT,
                    notice_period TEXT,
                    preferred_roles TEXT,
                    FOREIGN KEY (candidate_id) REFERENCES candidates (candidate_id)
                )
            `, (err) => {
                if (!err) console.log('Career Preferences table ready.');
            });

            // Create Saved Jobs Table (Requirement 24 & 27)
            db.run(`
                CREATE TABLE IF NOT EXISTS saved_jobs (
                    saved_job_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id TEXT,
                    job_id TEXT,
                    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(candidate_id, job_id)
                )
            `, (err) => {
                if (!err) console.log('Saved Jobs table ready.');
            });

            // Create Candidate Notifications Table (Requirement 26)
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_notifications (
                    notif_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id TEXT,
                    type TEXT,
                    message TEXT,
                    is_read INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) console.log('Candidate Notifications table ready.');
            });

            // Create Admin Broadcast Notifications Table
            db.run(`
                CREATE TABLE IF NOT EXISTS admin_notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    target_group TEXT NOT NULL DEFAULT 'all',
                    target_user_id INTEGER,
                    target_user_email TEXT,
                    notification_type TEXT DEFAULT 'announcement',
                    channels TEXT DEFAULT 'in_app',
                    action_url TEXT,
                    priority TEXT DEFAULT 'normal',
                    sender_name TEXT DEFAULT 'System Admin',
                    sent_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) console.log('Admin Broadcast Notifications table ready.');
            });

            // Migrations for jobs and applications tables

            db.run('ALTER TABLE jobs ADD COLUMN employer_id TEXT', () => {});
            db.run('ALTER TABLE jobs ADD COLUMN company_id TEXT', () => {});
            db.run('ALTER TABLE jobs ADD COLUMN application_questions TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN application_id TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN employer_id TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN candidate_id INTEGER', () => {});
            db.run('ALTER TABLE applications ADD COLUMN resume_url TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN applied_date DATETIME DEFAULT CURRENT_TIMESTAMP', () => {});
            db.run('ALTER TABLE applications ADD COLUMN application_questions TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN application_answers TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN joining_availability TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN interview_availability TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN candidate_name TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN education TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN skills TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN experience TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN profile_photo TEXT', () => {});
            db.run('ALTER TABLE applications ADD COLUMN cover_letter TEXT', () => {});

            // Create Candidate Plans Table
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_plans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plan_name TEXT NOT NULL,
                    price REAL NOT NULL DEFAULT 0,
                    application_limit INTEGER NOT NULL DEFAULT 10,
                    duration_type TEXT DEFAULT 'monthly',
                    duration_days INTEGER DEFAULT 30,
                    dedicated_support INTEGER DEFAULT 0,
                    support_duration TEXT DEFAULT '30 Days',
                    mentor_guidance INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    is_popular INTEGER DEFAULT 0,
                    badge_text TEXT,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) {
                    console.log('Candidate Plans table ready.');
                    // Seed standard default candidate plans if empty
                    db.get('SELECT COUNT(*) as count FROM candidate_plans', [], (cErr, cRow) => {
                        if (cRow && cRow.count === 0) {
                            db.run(`
                                INSERT INTO candidate_plans (id, plan_name, price, application_limit, duration_type, duration_days, dedicated_support, support_duration, mentor_guidance, status, is_popular, badge_text, description)
                                VALUES 
                                (1, 'Free Plan', 0, 10, 'monthly', 30, 0, 'None', 0, 'active', 0, 'Basic', 'Standard entry-level plan with 10 job applications.'),
                                (2, 'Basic Premium', 299, 20, 'monthly', 30, 0, '15 Days', 0, 'active', 1, 'Best Value', '20 job applications with verified profile spotlight.'),
                                (3, 'Premium', 699, 30, 'monthly', 30, 1, '30 Days', 1, 'active', 0, 'Dedicated Mentor', '30 job applications, 1-on-1 dedicated mentor support & career guidance.')
                            `);
                        }
                    });
                }
            });

            // Create Unified Dynamic Plans Table
            db.run(`
                CREATE TABLE IF NOT EXISTS plans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    plan_type TEXT NOT NULL DEFAULT 'employer',
                    plan_name TEXT NOT NULL,
                    description TEXT,
                    original_price REAL DEFAULT 0,
                    offer_price REAL DEFAULT 0,
                    discount_percentage REAL DEFAULT 0,
                    duration TEXT DEFAULT '30 Days',
                    duration_days INTEGER DEFAULT 30,
                    posting_limit INTEGER DEFAULT 1,
                    popular INTEGER DEFAULT 0,
                    recommended INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'active',
                    badge_text TEXT DEFAULT '',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) {
                    console.log('Unified Plans table ready.');
                    
                    // Create Plan Features Table (Dynamic 1-to-many)
                    db.run(`
                        CREATE TABLE IF NOT EXISTS plan_features (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            plan_id INTEGER NOT NULL,
                            feature_name TEXT NOT NULL,
                            included INTEGER DEFAULT 1,
                            feature_value TEXT DEFAULT '',
                            display_order INTEGER DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
                        )
                    `, (pfErr) => {
                        if (!pfErr) {
                            console.log('Plan Features table ready.');

                            // Seed default dynamic plans if empty
                            db.get("SELECT value FROM system_settings WHERE key = 'dynamic_plans_seeded'", [], (sErr, sRow) => {
                                if (!sRow) {
                                    db.get('SELECT COUNT(*) as count FROM plans', [], (pCountErr, pCountRow) => {
                                        if (!pCountErr && (!pCountRow || pCountRow.count === 0)) {
                                            console.log('Seeding initial dynamic plans and features...');
                                            
                                            // 1. Employer Plans Seed
                                            const employerPlansSeed = [
                                                {
                                                    plan_type: 'employer', plan_name: 'Basic', original_price: 2299, offer_price: 1899,
                                                    discount_percentage: 17, duration: '30 Days', duration_days: 30, posting_limit: 1,
                                                    popular: 0, recommended: 0, badge_text: 'Starter Pack',
                                                    description: 'Ideal for individual hiring requirements and single urgent openings.',
                                                    features: [
                                                        { name: 'Unlimited Candidate Applications', included: 1, value: 'Unlimited' },
                                                        { name: '30 Day Job Validity', included: 1, value: '30 Days' },
                                                        { name: 'Email Job Notifications', included: 1, value: 'Instant' },
                                                        { name: 'Job Featured on Top', included: 0, value: '' },
                                                        { name: 'Screened Leads', included: 0, value: '' },
                                                        { name: 'Database Access', included: 0, value: '' },
                                                        { name: 'WhatsApp Boosting Alerts', included: 0, value: '' },
                                                        { name: 'AI Profile Recommendation', included: 0, value: '' }
                                                    ]
                                                },
                                                {
                                                    plan_type: 'employer', plan_name: 'Silver', original_price: 2799, offer_price: 2299,
                                                    discount_percentage: 18, duration: '30 Days', duration_days: 30, posting_limit: 2,
                                                    popular: 1, recommended: 0, badge_text: 'MOST POPULAR',
                                                    description: 'Best value for growing teams and startups hiring across key positions.',
                                                    features: [
                                                        { name: 'Unlimited Candidate Applications', included: 1, value: 'Unlimited' },
                                                        { name: '30 Day Job Validity', included: 1, value: '30 Days' },
                                                        { name: 'Job Featured on Top', included: 1, value: '7 Days' },
                                                        { name: 'Screened Leads', included: 1, value: '15 Leads' },
                                                        { name: 'Candidate Database Access', included: 1, value: '50 Views' },
                                                        { name: 'WhatsApp Boosting Alerts', included: 1, value: '3 Alerts' },
                                                        { name: 'AI Candidate Recommendations', included: 1, value: 'Enabled' },
                                                        { name: 'Dedicated Account Manager', included: 0, value: '' }
                                                    ]
                                                },
                                                {
                                                    plan_type: 'employer', plan_name: 'Gold', original_price: 4999, offer_price: 3999,
                                                    discount_percentage: 20, duration: '60 Days', duration_days: 60, posting_limit: 5,
                                                    popular: 0, recommended: 1, badge_text: 'RECOMMENDED',
                                                    description: 'Comprehensive hiring solution for multiple urgent requirements.',
                                                    features: [
                                                        { name: '5 Active Job Postings', included: 1, value: '5 Jobs' },
                                                        { name: '60 Day Extended Validity', included: 1, value: '60 Days' },
                                                        { name: 'Job Featured on Top', included: 1, value: '30 Days' },
                                                        { name: 'Screened Candidate Leads', included: 1, value: '50 Leads' },
                                                        { name: 'Candidate Database Access', included: 1, value: '250 Views' },
                                                        { name: 'WhatsApp Boosting Alerts', included: 1, value: '10 Alerts' },
                                                        { name: 'AI Candidate Recommendations', included: 1, value: 'Priority' },
                                                        { name: 'Resume Downloads & Excel Export', included: 1, value: '250 Resumes' }
                                                    ]
                                                }
                                            ];

                                            // 2. Candidate Plans Seed
                                            const candidatePlansSeed = [
                                                {
                                                    plan_type: 'candidate', plan_name: 'Basic Free', original_price: 0, offer_price: 0,
                                                    discount_percentage: 0, duration: '30 Days', duration_days: 30, posting_limit: 10,
                                                    popular: 0, recommended: 0, badge_text: 'Free Forever',
                                                    description: 'Standard package for candidates beginning their job search.',
                                                    features: [
                                                        { name: '10 Monthly Job Applications', included: 1, value: '10 Apps' },
                                                        { name: 'Basic Job Alerts', included: 1, value: 'Email' },
                                                        { name: 'Standard Profile Search Visibility', included: 1, value: 'Active' },
                                                        { name: 'Featured Candidate Spotlight', included: 0, value: '' },
                                                        { name: 'AI Resume Score & Optimization', included: 0, value: '' },
                                                        { name: 'Direct Recruiter Messaging', included: 0, value: '' },
                                                        { name: 'Dedicated Career Mentor', included: 0, value: '' }
                                                    ]
                                                },
                                                {
                                                    plan_type: 'candidate', plan_name: 'Pro Career Accelerator', original_price: 499, offer_price: 299,
                                                    discount_percentage: 40, duration: '30 Days', duration_days: 30, posting_limit: 50,
                                                    popular: 1, recommended: 0, badge_text: 'MOST POPULAR',
                                                    description: 'Fast-track your interview calls with highlighted profile and AI resume scoring.',
                                                    features: [
                                                        { name: '50 Job Applications / Month', included: 1, value: '50 Apps' },
                                                        { name: 'Featured Profile Spotlight', included: 1, value: 'Top 5%' },
                                                        { name: 'AI Resume Score & Review', included: 1, value: 'Unlimited' },
                                                        { name: 'WhatsApp Instant Job Alerts', included: 1, value: 'Instant' },
                                                        { name: 'Direct Recruiter Contact', included: 1, value: '20 Contacts' },
                                                        { name: 'Skill Assessment Practice Tests', included: 1, value: 'All Tests' },
                                                        { name: '1-on-1 Dedicated Mentor Guidance', included: 0, value: '' }
                                                    ]
                                                },
                                                {
                                                    plan_type: 'candidate', plan_name: 'VIP Placement Pack', original_price: 999, offer_price: 699,
                                                    discount_percentage: 30, duration: '90 Days', duration_days: 90, posting_limit: -1,
                                                    popular: 0, recommended: 1, badge_text: 'RECOMMENDED',
                                                    description: 'Complete 1-on-1 mentorship, live interview prep, and unlimited job applications.',
                                                    features: [
                                                        { name: 'Unlimited Job Applications', included: 1, value: 'Unlimited' },
                                                        { name: 'Top Tier Recruiter Spotlight', included: 1, value: 'Guaranteed' },
                                                        { name: '1-on-1 Dedicated Mentor Guidance', included: 1, value: '30 Days' },
                                                        { name: 'Live Mock Interview & Feedback', included: 1, value: '2 Sessions' },
                                                        { name: 'Direct Recruiter Messaging & Intro', included: 1, value: 'Unlimited' },
                                                        { name: 'AI Resume & LinkedIn Optimization', included: 1, value: 'Full Review' },
                                                        { name: 'Priority 24/7 SLA Support', included: 1, value: 'Priority' }
                                                    ]
                                                }
                                            ];

                                            const allSeeds = [...employerPlansSeed, ...candidatePlansSeed];

                                            allSeeds.forEach(p => {
                                                db.run(`
                                                    INSERT INTO plans (
                                                        plan_type, plan_name, description, original_price, offer_price,
                                                        discount_percentage, duration, duration_days, posting_limit,
                                                        popular, recommended, status, badge_text
                                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                `, [
                                                    p.plan_type, p.plan_name, p.description, p.original_price, p.offer_price,
                                                    p.discount_percentage, p.duration, p.duration_days, p.posting_limit,
                                                    p.popular, p.recommended, 'active', p.badge_text
                                                ], function (insErr) {
                                                    if (!insErr && this.lastID) {
                                                        const newPlanId = this.lastID;
                                                        (p.features || []).forEach((feat, idx) => {
                                                            db.run(`
                                                                INSERT INTO plan_features (plan_id, feature_name, included, feature_value, display_order)
                                                                VALUES (?, ?, ?, ?, ?)
                                                            `, [newPlanId, feat.name, feat.included, feat.value || '', idx]);
                                                        });
                                                    }
                                                });
                                            });

                                            db.run("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('dynamic_plans_seeded', '1')");
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });

            // Create Candidate Subscriptions Table
            db.run(`
                CREATE TABLE IF NOT EXISTS candidate_subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id INTEGER NOT NULL,
                    candidate_email TEXT,
                    candidate_name TEXT,
                    plan_id INTEGER NOT NULL,
                    plan_name TEXT NOT NULL,
                    offer_id INTEGER,
                    amount_paid REAL DEFAULT 0,
                    application_limit INTEGER NOT NULL,
                    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    end_date DATETIME NOT NULL,
                    payment_status TEXT DEFAULT 'completed',
                    status TEXT DEFAULT 'active'
                )
            `, (err) => {
                if (!err) console.log('Candidate Subscriptions table ready.');
            });

            // Create Independent Offers Table
            db.run(`
                CREATE TABLE IF NOT EXISTS offers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    offer_name TEXT NOT NULL,
                    plan_id INTEGER NOT NULL,
                    offer_type TEXT DEFAULT 'festival',
                    original_price REAL NOT NULL,
                    offer_price REAL NOT NULL,
                    discount_value TEXT,
                    extra_applications INTEGER DEFAULT 0,
                    extra_features TEXT,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    priority INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'active',
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) {
                    console.log('Offers table ready.');
                    db.get('SELECT COUNT(*) as count FROM offers', [], (oErr, oRow) => {
                        if (oRow && oRow.count === 0) {
                            const now = new Date();
                            const future = new Date();
                            future.setDate(future.getDate() + 45);
                            db.run(`
                                INSERT INTO offers (offer_name, plan_id, offer_type, original_price, offer_price, discount_value, extra_applications, extra_features, start_date, end_date, priority, status, description)
                                VALUES ('Pongal Special Offer', 3, 'festival', 699, 499, '28% OFF', 5, 'Dedicated Mentor Support, Priority Resume Review', '${now.toISOString().slice(0, 10)}', '${future.toISOString().slice(0, 10)}', 1, 'active', 'Special festival discount on Premium Plan with 1-on-1 mentor guidance.')
                            `);
                        }
                    });
                }
            });

            // Create Mentors Table
            db.run(`
                CREATE TABLE IF NOT EXISTS mentors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT,
                    mobile TEXT,
                    profile_photo TEXT,
                    expertise TEXT NOT NULL,
                    experience TEXT NOT NULL,
                    availability TEXT DEFAULT 'Weekdays & Weekends',
                    status TEXT DEFAULT 'active',
                    bio TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (!err) {
                    console.log('Mentors table ready.');
                    db.get('SELECT COUNT(*) as count FROM mentors', [], (mErr, mRow) => {
                        if (mRow && mRow.count === 0) {
                            db.run(`
                                INSERT INTO mentors (name, email, mobile, expertise, experience, availability, status, bio)
                                VALUES 
                                ('Dr. Arvind Swaminathan', 'arvind.mentor@jobconnect.com', '+91 98401 55667', 'Tech Leadership & System Design', '12+ Years at FAANG', 'Weekdays (6 PM - 9 PM)', 'active', 'Senior Tech Architect & Interview Coach helping engineers crack Tier-1 roles.'),
                                ('Pooja Ramachandran', 'pooja.mentor@jobconnect.com', '+91 98221 44332', 'Career Transition & Resume Optimization', '9+ Years in HR & Talent Acquisition', 'Sat & Sun (10 AM - 4 PM)', 'active', 'Former Head of Recruitment guiding candidates through impactful resume building and HR interviews.')
                            `);
                        }
                    });
                }
            });

            // Create Mentor Requests Table
            db.run(`
                CREATE TABLE IF NOT EXISTS mentor_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    candidate_id INTEGER NOT NULL,
                    candidate_name TEXT,
                    candidate_email TEXT,
                    mentor_id INTEGER,
                    mentor_name TEXT,
                    topic TEXT NOT NULL,
                    notes TEXT,
                    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    session_date DATETIME,
                    status TEXT DEFAULT 'pending'
                )
            `, (err) => {
                if (!err) console.log('Mentor Requests table ready.');
            });

            // Seed demo accounts
            const demoAccounts = [
                { email: 'admin@jobportal.com', password: 'admin123', role: 'admin' },
                { email: 'candidate@test.com',  password: 'password',  role: 'jobseeker' },
                { email: 'company@test.com',    password: 'password',  role: 'company' },
            ];

            for (const account of demoAccounts) {
                db.get('SELECT id FROM users WHERE email = ?', [account.email], async (err, row) => {
                    if (!row) {
                        const hashed = await bcrypt.hash(account.password, 10);
                        db.run(
                            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
                            [account.email, hashed, account.role],
                            (err) => {
                                if (!err) console.log(`Seeded demo account: ${account.email} (${account.role})`);
                            }
                        );
                    }
                });
            }
        });
    }
});

module.exports = db;

