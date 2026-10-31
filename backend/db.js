const mysql = require('mysql2');
const { Pool } = require('pg');
let sqlite3 = null;
try {
    sqlite3 = require('sqlite3').verbose();
} catch (e) {
    // sqlite3 binary might not match macOS architecture, will only be needed if MySQL is offline
}
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const hasSupabase = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.com') && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]');

let activeEngine = hasSupabase ? 'supabase' : 'sqlite'; // 'supabase' | 'mysql' | 'sqlite'
let sqliteDb = null;
let mysqlPool = null;
let lastError = null;
let pgPool = hasSupabase ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
}) : null;

function normalizePgRow(row) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    for (const key of Object.keys(row)) {
        const val = row[key];
        const lower = key.toLowerCase();
        if (lower === 'postedcount') {
            row.postedCount = Number(val);
        } else if (lower === 'planname') {
            row.planName = val;
        } else if (lower === 'jobsused') {
            row.jobsUsed = Number(val);
        } else if (lower === 'expirydate') {
            row.expiryDate = val;
        } else if (lower === 'startdate') {
            row.startDate = val;
        } else if (lower === 'contactsviewed') {
            row.contactsViewed = Number(val);
        } else if (lower === 'createdat') {
            row.createdAt = val;
        } else if (lower === 'companyname') {
            row.companyName = val;
        } else if (lower === 'hrname') {
            row.hrName = val;
        } else if (lower === 'userid') {
            row.userId = val;
        } else if (lower === 'companyid') {
            row.companyId = val;
        } else if (lower === 'jobid') {
            row.jobId = val;
        } else if (lower === 'jobtype') {
            row.jobType = val;
        } else if (lower === 'planid') {
            row.planId = val;
        } else if (lower === 'employername') {
            row.employerName = val;
        } else if (lower === 'useremail') {
            row.userEmail = val;
        }
    }
    return new Proxy(row, {
        get(target, prop, receiver) {
            if (typeof prop === 'string') {
                if (target[prop] !== undefined && target[prop] !== null) return target[prop];
                const lower = prop.toLowerCase();
                if (target[lower] !== undefined && target[lower] !== null) return target[lower];
                if (prop in target) return target[prop];
            }
            return Reflect.get(target, prop, receiver);
        }
    });
}

function translateSql(sql, engine) {
    if (!sql) return sql;
    if (engine === 'supabase' || engine === 'postgres') {
        let pgSql = sql
            .replace(/`([^`]+)`/g, '"$1"')
            .replace(/ENGINE=InnoDB\s*(DEFAULT\s+CHARSET=[a-zA-Z0-9_]+)?/gi, '')
            .replace(/DEFAULT\s+CHARSET=[a-zA-Z0-9_]+/gi, '')
            .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'SERIAL PRIMARY KEY')
            .replace(/INTEGER AUTO_INCREMENT PRIMARY KEY/gi, 'SERIAL PRIMARY KEY')
            .replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'SERIAL PRIMARY KEY')
            .replace(/INTEGER\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'SERIAL PRIMARY KEY')
            .replace(/PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
            .replace(/AUTOINCREMENT/gi, '')
            .replace(/DATETIME/gi, 'TIMESTAMPTZ')
            .replace(/DOUBLE/gi, 'DOUBLE PRECISION')
            .replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT INTO')
            .replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO')
            .replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'INSERT INTO')
            .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
            .replace(/\bcreatedAt\b/g, 'createdat');

        let idx = 1;
        pgSql = pgSql.replace(/\?/g, () => `$${idx++}`);
        return pgSql;
    } else if (engine === 'mysql') {
        return sql
            .replace(/INSERT OR IGNORE INTO/gi, 'INSERT IGNORE INTO')
            .replace(/INSERT OR REPLACE INTO/gi, 'REPLACE INTO')
            .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
            .replace(/PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
            .replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT')
            .replace(/AS TEXT/gi, 'AS CHAR')
            .replace(/datetime\('now'\)/gi, 'NOW()');
    } else {
        return sql
            .replace(/ENGINE=InnoDB\s*(DEFAULT\s+CHARSET=[a-zA-Z0-9_]+)?/gi, '')
            .replace(/DEFAULT\s+CHARSET=[a-zA-Z0-9_]+/gi, '')
            .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace(/INTEGER\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace(/PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'PRIMARY KEY AUTOINCREMENT')
            .replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT OR IGNORE INTO')
            .replace(/UNIQUE KEY\s+[a-zA-Z0-9_]+\s*\(([^)]+)\)/gi, 'UNIQUE($1)')
            .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');
    }
}

// Check MySQL connection and initialize
const candidatePool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'job-portal-v2',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    multipleStatements: true,
    dateStrings: true,
    connectTimeout: 10000
});

const db = {
    get activeEngine() {
        return activeEngine;
    },
    get lastError() {
        return lastError;
    },
    get pool() {
        return activeEngine === 'supabase' ? pgPool : mysqlPool;
    },
    query: (sql, params, cb) => {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        if (activeEngine === 'supabase' && pgPool) {
            const cleanedSql = translateSql(sql, 'supabase');
            pgPool.query(cleanedSql, params || [], (err, results) => {
                if (err) return cb ? cb(err) : null;
                const rows = results ? results.rows.map(normalizePgRow) : [];
                rows.insertId = rows[0]?.id || null;
                rows.affectedRows = results ? results.rowCount : 0;
                if (cb) cb(null, rows, results);
            });
        } else if (activeEngine === 'mysql' && mysqlPool) {
            const cleanedSql = translateSql(sql, 'mysql');
            mysqlPool.query(cleanedSql, params || [], (err, results, fields) => {
                if (cb) cb(err, results, fields);
            });
        } else if (sqliteDb) {
            const cleanedSql = translateSql(sql, 'sqlite');
            const isSelect = /^\s*(SELECT|PRAGMA|SHOW|EXPLAIN)/i.test(cleanedSql);
            if (isSelect) {
                sqliteDb.all(cleanedSql, params || [], (err, rows) => {
                    if (cb) cb(err, rows || [], []);
                });
            } else {
                sqliteDb.run(cleanedSql, params || [], function (err) {
                    if (cb) cb(err, { insertId: this ? this.lastID : null, affectedRows: this ? this.changes : 0 }, []);
                });
            }
        } else {
            if (cb) cb(new Error('Database not initialized'));
        }
    },
    get: (sql, params, cb) => {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        if (activeEngine === 'supabase' && pgPool) {
            const cleanedSql = translateSql(sql, 'supabase');
            pgPool.query(cleanedSql, params || [], (err, results) => {
                if (err) return cb ? cb(err) : null;
                const row = (results && Array.isArray(results.rows) && results.rows.length > 0) ? normalizePgRow(results.rows[0]) : null;
                if (cb) cb(null, row);
            });
        } else if (activeEngine === 'mysql' && mysqlPool) {
            const cleanedSql = translateSql(sql, 'mysql');
            mysqlPool.query(cleanedSql, params || [], (err, results) => {
                if (err) return cb ? cb(err) : null;
                const row = (Array.isArray(results) && results.length > 0) ? results[0] : null;
                if (cb) cb(null, row);
            });
        } else if (sqliteDb) {
            const cleanedSql = translateSql(sql, 'sqlite');
            sqliteDb.get(cleanedSql, params || [], (err, row) => {
                if (cb) cb(err, row || null);
            });
        } else {
            if (cb) cb(new Error('Database not initialized'));
        }
    },
    all: (sql, params, cb) => {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        if (activeEngine === 'supabase' && pgPool) {
            const cleanedSql = translateSql(sql, 'supabase');
            pgPool.query(cleanedSql, params || [], (err, results) => {
                if (err) return cb ? cb(err) : null;
                const rows = results ? results.rows.map(normalizePgRow) : [];
                if (cb) cb(null, rows);
            });
        } else if (activeEngine === 'mysql' && mysqlPool) {
            const cleanedSql = translateSql(sql, 'mysql');
            mysqlPool.query(cleanedSql, params || [], (err, results) => {
                if (err) return cb ? cb(err) : null;
                const rows = Array.isArray(results) ? results : [];
                if (cb) cb(null, rows);
            });
        } else if (sqliteDb) {
            const cleanedSql = translateSql(sql, 'sqlite');
            sqliteDb.all(cleanedSql, params || [], (err, rows) => {
                if (cb) cb(err, rows || []);
            });
        } else {
            if (cb) cb(new Error('Database not initialized'));
        }
    },
    run: (sql, params, cb) => {
        if (typeof params === 'function') {
            cb = params;
            params = [];
        }
        if (activeEngine === 'supabase' && pgPool) {
            let cleanedSql = translateSql(sql, 'supabase');
            if (/^\s*INSERT\s+INTO/i.test(cleanedSql) && !/RETURNING/i.test(cleanedSql)) {
                cleanedSql += ' RETURNING id';
            }
            pgPool.query(cleanedSql, params || [], function (err, results) {
                if (err) return cb ? cb(err) : null;
                const context = {
                    lastID: results && results.rows && results.rows[0] ? results.rows[0].id : null,
                    changes: results ? results.rowCount : 0
                };
                if (cb) cb.call(context, null, context);
            });
        } else if (activeEngine === 'mysql' && mysqlPool) {
            const cleanedSql = translateSql(sql, 'mysql');
            mysqlPool.query(cleanedSql, params || [], function (err, results) {
                if (err) return cb ? cb(err) : null;
                const context = {
                    lastID: results ? results.insertId : null,
                    changes: results ? results.affectedRows : 0
                };
                if (cb) cb.call(context, null, context);
            });
        } else if (sqliteDb) {
            const cleanedSql = translateSql(sql, 'sqlite');
            sqliteDb.run(cleanedSql, params || [], function (err) {
                const context = {
                    lastID: this ? this.lastID : null,
                    changes: this ? this.changes : 0
                };
                if (cb) cb.call(context, err, context);
            });
        } else {
            if (cb) cb(new Error('Database not initialized'));
        }
    },
    exec: (sql, cb) => {
        if (activeEngine === 'supabase' && pgPool) {
            const cleanedSql = translateSql(sql, 'supabase');
            pgPool.query(cleanedSql, (err, results) => {
                if (cb) cb(err, results);
            });
        } else if (activeEngine === 'mysql' && mysqlPool) {
            const cleanedSql = translateSql(sql, 'mysql');
            mysqlPool.query(cleanedSql, (err, results) => {
                if (cb) cb(err, results);
            });
        } else if (sqliteDb) {
            const cleanedSql = translateSql(sql, 'sqlite');
            sqliteDb.exec(cleanedSql, (err) => {
                if (cb) cb(err);
            });
        } else {
            if (cb) cb(new Error('Database not initialized'));
        }
    }
};

function initSchemaAndSeeds() {
    console.log(`[DB] Initializing tables and demo seeds on ${activeEngine.toUpperCase()} database...`);

    // 1. Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            password VARCHAR(255),
            role VARCHAR(50),
            isPremium INT DEFAULT 0,
            applicationCount INT DEFAULT 0,
            phone VARCHAR(50),
            address TEXT,
            companyName VARCHAR(255),
            hrName VARCHAR(255),
            approved_access INT DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Users table ready.');
    });

    // 2. Applications Table
    db.run(`
        CREATE TABLE IF NOT EXISTS applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            application_id VARCHAR(100),
            jobId VARCHAR(100),
            applicantId VARCHAR(100),
            candidate_id VARCHAR(100),
            candidate_email VARCHAR(255),
            applicant_email VARCHAR(255),
            companyId VARCHAR(100),
            employer_id VARCHAR(100),
            company_name VARCHAR(255),
            job_title VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            resume_url TEXT,
            application_questions TEXT,
            application_answers TEXT,
            joining_availability VARCHAR(255),
            interview_availability VARCHAR(255),
            candidate_name VARCHAR(255),
            education TEXT,
            skills TEXT,
            experience TEXT,
            profile_photo TEXT,
            cover_letter TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) {
            console.log('Applications table ready.');
            // Run schema migrations for existing tables
            if (activeEngine === 'mysql') {
                const alterStatements = [
                    "ALTER TABLE applications MODIFY jobId VARCHAR(100)",
                    "ALTER TABLE applications MODIFY applicantId VARCHAR(100)",
                    "ALTER TABLE applications MODIFY candidate_id VARCHAR(100)",
                    "ALTER TABLE applications MODIFY companyId VARCHAR(100)",
                    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_email VARCHAR(255)",
                    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS applicant_email VARCHAR(255)",
                    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)",
                    "ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_title VARCHAR(255)",
                    // Clean up corrupted zero-jobId rows
                    "DELETE FROM applications WHERE jobId = '0' OR jobId = 0"
                ];
                alterStatements.forEach(sql => {
                    db.query(sql, () => {});
                });
            }
        }
    });

    // 3. Jobs Table
    db.run(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id VARCHAR(100),
            employer_id VARCHAR(100),
            company_id VARCHAR(100),
            companyId INT,
            title VARCHAR(255),
            job_title VARCHAR(255),
            description TEXT,
            job_description TEXT,
            location VARCHAR(255),
            job_location VARCHAR(255),
            location_type VARCHAR(100),
            number_of_openings INT DEFAULT 1,
            experience_type VARCHAR(100),
            minimum_experience VARCHAR(100),
            maximum_experience VARCHAR(100),
            experience VARCHAR(100),
            education TEXT,
            skills TEXT,
            required_skills TEXT,
            preferred_skills TEXT,
            gender_preference VARCHAR(50),
            minimum_age VARCHAR(50),
            maximum_age VARCHAR(50),
            salary VARCHAR(100),
            minimum_salary VARCHAR(100),
            maximum_salary VARCHAR(100),
            salary_type VARCHAR(50),
            salary_negotiable INT DEFAULT 0,
            responsibilities TEXT,
            working_days VARCHAR(255),
            start_time VARCHAR(50),
            end_time VARCHAR(50),
            shift_type VARCHAR(100),
            working_hours VARCHAR(100),
            company_name VARCHAR(255),
            company_logo TEXT,
            contact_person_name VARCHAR(255),
            company_phone VARCHAR(50),
            company_email VARCHAR(255),
            company_website VARCHAR(255),
            about_company TEXT,
            hiring_timeline VARCHAR(100),
            hiring_frequency VARCHAR(100),
            hiring_priority VARCHAR(100),
            building_name VARCHAR(255),
            door_number VARCHAR(100),
            street VARCHAR(255),
            area VARCHAR(255),
            city VARCHAR(255),
            district VARCHAR(255),
            state VARCHAR(255),
            country VARCHAR(255),
            pincode VARCHAR(50),
            benefits TEXT,
            notice_period VARCHAR(100),
            joining_date VARCHAR(100),
            application_method VARCHAR(100),
            application_url TEXT,
            application_email VARCHAR(255),
            application_deadline VARCHAR(100),
            jobType VARCHAR(100),
            googleFormLink TEXT,
            cgpa VARCHAR(50),
            status VARCHAR(50) DEFAULT 'active',
            posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            latitude VARCHAR(100),
            longitude VARCHAR(100),
            geo_address TEXT,
            geo_radius VARCHAR(50),
            application_questions TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Jobs table ready.');
    });

    // 4. Assessments Table
    db.run(`
        CREATE TABLE IF NOT EXISTS assessments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            companyId INT,
            title VARCHAR(255),
            type VARCHAR(100),
            timer INT,
            passingMarks INT,
            status VARCHAR(50) DEFAULT 'active',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Assessments table ready.');
    });

    // 5. Assessment Questions Table
    db.run(`
        CREATE TABLE IF NOT EXISTS assessment_questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            assessmentId INT,
            questionData TEXT,
            answer TEXT,
            language VARCHAR(100)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Assessment questions table ready.');
    });

    // 6. Assessment Attempts Table
    db.run(`
        CREATE TABLE IF NOT EXISTS assessment_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            assessmentId INT,
            candidateId INT,
            score DOUBLE,
            details TEXT,
            status VARCHAR(50) DEFAULT 'completed',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Assessment attempts table ready.');
    });

    // 7. Subscription Plans Table
    db.run(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            target_role VARCHAR(100) DEFAULT 'employer',
            plan_type VARCHAR(100) DEFAULT 'common',
            company_id VARCHAR(100) DEFAULT '',
            company_name VARCHAR(255) DEFAULT '',
            price DOUBLE DEFAULT 0,
            billing_type VARCHAR(50) DEFAULT 'monthly',
            duration_months INT DEFAULT 1,
            status VARCHAR(50) DEFAULT 'active',
            badge_text VARCHAR(100) DEFAULT '',
            discount_percent INT DEFAULT 0,
            is_popular INT DEFAULT 0,
            priority_level INT DEFAULT 1,
            job_limit INT DEFAULT 20,
            contact_views INT DEFAULT -1,
            resume_downloads INT DEFAULT -1,
            candidate_search_limit INT DEFAULT -1,
            data_request_limit INT DEFAULT 0,
            data_export_limit INT DEFAULT 0,
            active_job_limit INT DEFAULT -1,
            interview_limit INT DEFAULT -1,
            message_limit INT DEFAULT -1,
            application_limit INT DEFAULT -1,
            resume_upload_limit INT DEFAULT 1,
            resume_analysis_limit INT DEFAULT 0,
            featured_profile INT DEFAULT 0,
            skill_test_access INT DEFAULT 1,
            mock_interview_access INT DEFAULT 0,
            job_alert_access INT DEFAULT 1,
            recruiter_contact_access INT DEFAULT 0,
            premium_job_access INT DEFAULT 1,
            allowed_data_fields TEXT,
            features TEXT,
            role VARCHAR(50) DEFAULT 'company',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Subscription plans table ready.');
    });

    // 8. System Settings Table
    db.run(`
        CREATE TABLE IF NOT EXISTS system_settings (
            \`key\` VARCHAR(255) PRIMARY KEY,
            \`value\` TEXT,
            description TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) {
            console.log('System settings table ready.');
            db.run(`INSERT IGNORE INTO system_settings (\`key\`, \`value\`, description) VALUES ('free_employer_job_limit', '3', 'Default maximum free job postings allowed per employer')`);
            db.run(`INSERT IGNORE INTO system_settings (\`key\`, \`value\`, description) VALUES ('require_candidate_consent', 'true', 'Require candidate consent for contact info export')`);
            db.run(`INSERT IGNORE INTO system_settings (\`key\`, \`value\`, description) VALUES ('mask_contact_info_default', 'false', 'Mask phone and email by default on preview')`);
        }
    });

    // 9. Subscriptions Table
    db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT,
            companyId VARCHAR(100),
            companyName VARCHAR(255),
            employerName VARCHAR(255),
            userEmail VARCHAR(255),
            planId INT,
            target_role VARCHAR(100) DEFAULT 'employer',
            plan_type VARCHAR(100) DEFAULT 'common',
            amount DOUBLE DEFAULT 0,
            payment_status VARCHAR(50) DEFAULT 'paid',
            status VARCHAR(50) DEFAULT 'active',
            startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            expiryDate DATETIME,
            contactsViewed INT DEFAULT 0,
            resumeDownloads INT DEFAULT 0,
            jobsUsed INT DEFAULT 0,
            dataRequestsUsed INT DEFAULT 0,
            candidateDataExported INT DEFAULT 0,
            admin_override TEXT,
            internal_notes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Subscriptions table ready.');
    });

    // 10. Plan Usage Table
    db.run(`
        CREATE TABLE IF NOT EXISTS plan_usage (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subscriptionId INT,
            userId INT,
            companyId VARCHAR(100),
            feature VARCHAR(100),
            allowed_limit INT DEFAULT 0,
            used_limit INT DEFAULT 0,
            remaining_limit INT DEFAULT 0,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Plan usage table ready.');
    });

    // 11. Candidate Data Requests Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_data_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            request_code VARCHAR(100) UNIQUE,
            employer_id VARCHAR(100),
            company_id VARCHAR(100),
            company_name VARCHAR(255),
            employer_name VARCHAR(255),
            employer_email VARCHAR(255),
            employer_phone VARCHAR(50),
            plan_id INT,
            plan_name VARCHAR(255),
            requested_role VARCHAR(255),
            location VARCHAR(255),
            experience_min VARCHAR(50),
            experience_max VARCHAR(50),
            skills TEXT,
            education TEXT,
            candidate_status VARCHAR(100) DEFAULT 'available',
            requested_count INT DEFAULT 100,
            approved_count INT DEFAULT 0,
            available_count INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'pending',
            admin_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidate Data Requests table ready.');
    });

    // 12. Candidate Data Exports Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_data_exports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            request_id INT,
            employer_id VARCHAR(100),
            company_id VARCHAR(100),
            company_name VARCHAR(255),
            export_type VARCHAR(50) DEFAULT 'csv',
            candidate_count INT DEFAULT 0,
            candidate_ids TEXT,
            file_name VARCHAR(255),
            file_path TEXT,
            delivery_method VARCHAR(100) DEFAULT 'download',
            delivery_status VARCHAR(100) DEFAULT 'delivered',
            recipient_email VARCHAR(255),
            recipient_phone VARCHAR(50),
            admin_id VARCHAR(100),
            admin_name VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidate Data Exports table ready.');
    });

    // 13. Audit Logs Table
    db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id VARCHAR(100),
            admin_name VARCHAR(255),
            admin_email VARCHAR(255),
            action VARCHAR(255),
            target_type VARCHAR(100),
            target_id VARCHAR(100),
            target_name VARCHAR(255),
            description TEXT,
            details_json LONGTEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Audit logs table ready.');
    });

    // 14. Payments Table
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT,
            planId INT,
            razorpayOrderId VARCHAR(255),
            razorpayPaymentId VARCHAR(255),
            amount DOUBLE,
            status VARCHAR(50) DEFAULT 'pending',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Payments table ready.');
    });

    // 15. Unlocked Candidates Table
    db.run(`
        CREATE TABLE IF NOT EXISTS unlocked_candidates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employerId VARCHAR(100),
            candidateId VARCHAR(100),
            unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) {
            console.log('Unlocked candidates table ready.');
            if (activeEngine === 'mysql') {
                db.query("ALTER TABLE unlocked_candidates MODIFY employerId VARCHAR(100)", () => {});
                db.query("ALTER TABLE unlocked_candidates MODIFY candidateId VARCHAR(100)", () => {});
            }
        }
    });

    // 16. Candidate Notes Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employerId INT,
            candidateId INT,
            jobId INT,
            note TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidate notes table ready.');
    });

    // 17. Bookmarked Candidates Table
    db.run(`
        CREATE TABLE IF NOT EXISTS bookmarked_candidates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employerId INT,
            candidateId INT,
            bookmarkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY employer_candidate (employerId, candidateId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Bookmarked candidates table ready.');
    });

    // 18. Interviews Table
    db.run(`
        CREATE TABLE IF NOT EXISTS interviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appId INT,
            employerId INT,
            candidateId INT,
            jobId INT,
            interviewDate VARCHAR(50),
            interviewTime VARCHAR(50),
            status VARCHAR(50) DEFAULT 'scheduled',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Interviews table ready.');
    });

    // 19. Employers Table
    db.run(`
        CREATE TABLE IF NOT EXISTS employers (
            employer_id VARCHAR(100) PRIMARY KEY,
            mobile_number VARCHAR(50) UNIQUE,
            mobile_verified INT DEFAULT 0,
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255),
            google_account_id VARCHAR(255),
            company_id VARCHAR(100),
            profile_completed INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Employers table ready.');
    });

    // 20. Companies Table
    db.run(`
        CREATE TABLE IF NOT EXISTS companies (
            company_id VARCHAR(100) PRIMARY KEY,
            employer_id VARCHAR(100),
            company_name VARCHAR(255),
            company_logo LONGTEXT,
            website VARCHAR(255),
            company_email VARCHAR(255),
            company_phone VARCHAR(50),
            industry VARCHAR(100),
            company_type VARCHAR(100),
            company_size VARCHAR(100),
            year_established VARCHAR(50),
            registration_number VARCHAR(100),
            gst_number VARCHAR(100),
            description TEXT,
            address TEXT,
            city VARCHAR(255),
            state VARCHAR(255),
            country VARCHAR(255),
            pincode VARCHAR(50),
            approved_access INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Companies table ready.');
    });

    // 21. Company Contacts Table
    db.run(`
        CREATE TABLE IF NOT EXISTS company_contacts (
            contact_id INT AUTO_INCREMENT PRIMARY KEY,
            company_id VARCHAR(100),
            contact_person_name VARCHAR(255),
            designation VARCHAR(100),
            email VARCHAR(255),
            phone VARCHAR(50),
            alternate_phone VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Company contacts table ready.');
    });

    // 22. OTPs Table
    db.run(`
        CREATE TABLE IF NOT EXISTS otps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mobile_number VARCHAR(50),
            otp_code VARCHAR(20),
            expires_at DATETIME,
            verified INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('OTPs table ready.');
    });

    // 23. Candidates Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidates (
            candidate_id VARCHAR(100) PRIMARY KEY,
            mobile_number VARCHAR(50) UNIQUE,
            mobile_verified INT DEFAULT 0,
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255),
            google_account_id VARCHAR(255),
            full_name VARCHAR(255),
            profile_photo LONGTEXT,
            date_of_birth VARCHAR(50),
            gender VARCHAR(50),
            city VARCHAR(255),
            state VARCHAR(255),
            country VARCHAR(255),
            pincode VARCHAR(50),
            address TEXT,
            professional_headline VARCHAR(255),
            current_job_title VARCHAR(255),
            current_company VARCHAR(255),
            total_experience VARCHAR(100),
            experience_type VARCHAR(100),
            about_me TEXT,
            resume_url LONGTEXT,
            resume_name VARCHAR(255),
            resume_updated_at VARCHAR(100),
            profile_completed INT DEFAULT 0,
            profile_completion_percentage INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidates table ready.');
    });

    // 24. Candidate Education Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_education (
            education_id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id VARCHAR(100),
            qualification VARCHAR(255),
            degree VARCHAR(255),
            specialization VARCHAR(255),
            institution VARCHAR(255),
            university VARCHAR(255),
            start_year VARCHAR(50),
            end_year VARCHAR(50),
            percentage VARCHAR(50),
            cgpa VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidate Education table ready.');
    });

    // 25. Candidate Experience Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_experience (
            experience_id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id VARCHAR(100),
            company_name VARCHAR(255),
            job_title VARCHAR(255),
            employment_type VARCHAR(100),
            start_date VARCHAR(50),
            end_date VARCHAR(50),
            currently_working INT DEFAULT 0,
            location VARCHAR(255),
            description TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidate Experience table ready.');
    });

    // 26. Candidate Skills Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_skills (
            skill_id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id VARCHAR(100),
            skill_name VARCHAR(255),
            skill_category VARCHAR(100)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidate Skills table ready.');
    });

    // 27. Career Preferences Table
    db.run(`
        CREATE TABLE IF NOT EXISTS career_preferences (
            preference_id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id VARCHAR(100),
            preferred_job_types TEXT,
            preferred_locations TEXT,
            preferred_work_modes TEXT,
            minimum_salary VARCHAR(100),
            maximum_salary VARCHAR(100),
            notice_period VARCHAR(100),
            preferred_roles TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Career Preferences table ready.');
    });

    // 28. Saved Jobs Table
    db.run(`
        CREATE TABLE IF NOT EXISTS saved_jobs (
            saved_job_id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id VARCHAR(100),
            job_id VARCHAR(100),
            saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY cand_job (candidate_id, job_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Saved Jobs table ready.');
    });

    // 29. Candidate Notifications Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_notifications (
            notif_id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id VARCHAR(100),
            type VARCHAR(100),
            message TEXT,
            is_read INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidate Notifications table ready.');
    });

    // 30. Admin Broadcast Notifications Table
    db.run(`
        CREATE TABLE IF NOT EXISTS admin_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            target_group VARCHAR(100) NOT NULL DEFAULT 'all',
            target_user_id INT,
            target_user_email VARCHAR(255),
            notification_type VARCHAR(100) DEFAULT 'announcement',
            channels VARCHAR(100) DEFAULT 'in_app',
            action_url TEXT,
            priority VARCHAR(50) DEFAULT 'normal',
            sender_name VARCHAR(255) DEFAULT 'System Admin',
            sent_count INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Admin Broadcast Notifications table ready.');
    });

    // 31. Candidate Plans Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            plan_name VARCHAR(255) NOT NULL,
            price DOUBLE NOT NULL DEFAULT 0,
            application_limit INT NOT NULL DEFAULT 10,
            duration_type VARCHAR(50) DEFAULT 'monthly',
            duration_days INT DEFAULT 30,
            dedicated_support INT DEFAULT 0,
            support_duration VARCHAR(100) DEFAULT '30 Days',
            mentor_guidance INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'active',
            is_popular INT DEFAULT 0,
            badge_text VARCHAR(100),
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) {
            console.log('Candidate Plans table ready.');
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

    // 32. Plans Table (Unified Dynamic Plans)
    db.run(`
        CREATE TABLE IF NOT EXISTS plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            plan_type VARCHAR(100) NOT NULL DEFAULT 'employer',
            plan_name VARCHAR(255) NOT NULL,
            description TEXT,
            original_price DOUBLE DEFAULT 0,
            offer_price DOUBLE DEFAULT 0,
            discount_percentage DOUBLE DEFAULT 0,
            duration VARCHAR(100) DEFAULT '30 Days',
            duration_days INT DEFAULT 30,
            posting_limit INT DEFAULT 1,
            candidate_views_limit INT DEFAULT 50,
            resume_download_limit INT DEFAULT 50,
            popular INT DEFAULT 0,
            recommended INT DEFAULT 0,
            status VARCHAR(50) DEFAULT 'active',
            badge_text VARCHAR(100) DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) {
            console.log('Unified Plans table ready.');

            // Ensure columns for student candidate unlocks and resume downloads
            db.run("ALTER TABLE plans ADD COLUMN candidate_views_limit INT DEFAULT 50", () => {});
            db.run("ALTER TABLE plans ADD COLUMN resume_download_limit INT DEFAULT 50", () => {});

            // Seed requested 20-Jobs (1500) and Unlimited (5000) plans if not present
            db.get("SELECT id FROM plans WHERE plan_name = 'Standard 20 Jobs Pack'", [], (chkErr, pRow1) => {
                if (!pRow1) {
                    db.run(`
                        INSERT INTO plans (
                            plan_type, plan_name, description, original_price, offer_price,
                            discount_percentage, duration, duration_days, posting_limit,
                            candidate_views_limit, resume_download_limit,
                            popular, recommended, status, badge_text
                        ) VALUES ('employer', 'Standard 20 Jobs Pack', 'Post up to 20 jobs for 1 month with 50 student resumes & contact details.', 1999, 1500, 25, '30 Days', 30, 20, 50, 50, 0, 1, 'active', '20 JOBS PACK')
                    `, function (p1Err) {
                        const newId = this ? this.lastID : null;
                        if (newId) {
                            const feats = [
                                { name: '20 Active Job Postings', included: 1, value: '20 Jobs' },
                                { name: '30 Day Job Validity', included: 1, value: '30 Days' },
                                { name: '50 Student Resumes & Contacts', included: 1, value: '50 Students' },
                                { name: 'Instant Applicant Notifications', included: 1, value: 'Instant' },
                                { name: 'Candidate Database Access', included: 1, value: 'Included' }
                            ];
                            feats.forEach((f, idx) => {
                                db.run("INSERT INTO plan_features (plan_id, feature_name, included, feature_value, display_order) VALUES (?, ?, ?, ?, ?)", [newId, f.name, f.included, f.value, idx]);
                            });
                        }
                    });
                }
            });

            db.get("SELECT id FROM plans WHERE plan_name = 'Unlimited Super Recruiter'", [], (chkErr, pRow2) => {
                if (!pRow2) {
                    db.run(`
                        INSERT INTO plans (
                            plan_type, plan_name, description, original_price, offer_price,
                            discount_percentage, duration, duration_days, posting_limit,
                            candidate_views_limit, resume_download_limit,
                            popular, recommended, status, badge_text
                        ) VALUES ('employer', 'Unlimited Super Recruiter', 'Post unlimited jobs for 1 month with 100 student phone numbers, full details, and resumes.', 6999, 5000, 28, '30 Days', 30, -1, 100, 100, 1, 0, 'active', 'UNLIMITED JOBS')
                    `, function (p2Err) {
                        const newId = this ? this.lastID : null;
                        if (newId) {
                            const feats = [
                                { name: 'Unlimited Job Postings', included: 1, value: 'Unlimited' },
                                { name: '30 Day Extended Validity', included: 1, value: '30 Days' },
                                { name: '100 Student Resumes & Contacts', included: 1, value: '100 Students' },
                                { name: 'Direct Phone & Email Access', included: 1, value: 'Included' },
                                { name: 'Priority Applicant Screening', included: 1, value: 'VIP Support' }
                            ];
                            feats.forEach((f, idx) => {
                                db.run("INSERT INTO plan_features (plan_id, feature_name, included, feature_value, display_order) VALUES (?, ?, ?, ?, ?)", [newId, f.name, f.included, f.value, idx]);
                            });
                        }
                    });
                }
            });

            // 33. Plan Features Table
            db.run(`
                CREATE TABLE IF NOT EXISTS plan_features (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    plan_id INT NOT NULL,
                    feature_name VARCHAR(255) NOT NULL,
                    included INT DEFAULT 1,
                    feature_value VARCHAR(255) DEFAULT '',
                    display_order INT DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `, (pfErr) => {
                if (!pfErr) {
                    console.log('Plan Features table ready.');
                    db.get("SELECT \`value\` FROM system_settings WHERE \`key\` = 'dynamic_plans_seeded'", [], (sErr, sRow) => {
                        if (!sRow) {
                            db.get('SELECT COUNT(*) as count FROM plans', [], (pCountErr, pCountRow) => {
                                if (!pCountErr && (!pCountRow || pCountRow.count === 0)) {
                                    console.log('Seeding initial dynamic plans and features into MySQL...');
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
                                                { name: 'Database Access', included: 0, value: '' }
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
                                                { name: 'Candidate Database Access', included: 1, value: '50 Views' }
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
                                                { name: 'Screened Candidate Leads', included: 1, value: '50 Leads' }
                                            ]
                                        }
                                    ];

                                    const candidatePlansSeed = [
                                        {
                                            plan_type: 'candidate', plan_name: 'Basic Free', original_price: 0, offer_price: 0,
                                            discount_percentage: 0, duration: '30 Days', duration_days: 30, posting_limit: 10,
                                            popular: 0, recommended: 0, badge_text: 'Free Forever',
                                            description: 'Standard package for candidates beginning their job search.',
                                            features: [
                                                { name: '10 Monthly Job Applications', included: 1, value: '10 Apps' },
                                                { name: 'Basic Job Alerts', included: 1, value: 'Email' }
                                            ]
                                        },
                                        {
                                            plan_type: 'candidate', plan_name: 'Pro Career Accelerator', original_price: 499, offer_price: 299,
                                            discount_percentage: 40, duration: '30 Days', duration_days: 30, posting_limit: 50,
                                            popular: 1, recommended: 0, badge_text: 'MOST POPULAR',
                                            description: 'Fast-track your interview calls with highlighted profile and AI resume scoring.',
                                            features: [
                                                { name: '50 Job Applications / Month', included: 1, value: '50 Apps' },
                                                { name: 'Featured Profile Spotlight', included: 1, value: 'Top 5%' }
                                            ]
                                        }
                                    ];

                                    [...employerPlansSeed, ...candidatePlansSeed].forEach(p => {
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
                                        ], function (insErr, res) {
                                            const newPlanId = res ? res.lastID : this.lastID;
                                            if (newPlanId) {
                                                (p.features || []).forEach((feat, idx) => {
                                                    db.run(`
                                                        INSERT INTO plan_features (plan_id, feature_name, included, feature_value, display_order)
                                                        VALUES (?, ?, ?, ?, ?)
                                                    `, [newPlanId, feat.name, feat.included, feat.value || '', idx]);
                                                });
                                            }
                                        });
                                    });

                                    db.run("INSERT IGNORE INTO system_settings (\`key\`, \`value\`) VALUES ('dynamic_plans_seeded', '1')");
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    // 34. Candidate Subscriptions Table
    db.run(`
        CREATE TABLE IF NOT EXISTS candidate_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id INT NOT NULL,
            candidate_email VARCHAR(255),
            candidate_name VARCHAR(255),
            plan_id INT NOT NULL,
            plan_name VARCHAR(255) NOT NULL,
            offer_id INT,
            amount_paid DOUBLE DEFAULT 0,
            application_limit INT NOT NULL,
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_date DATETIME NOT NULL,
            payment_status VARCHAR(50) DEFAULT 'completed',
            status VARCHAR(50) DEFAULT 'active'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Candidate Subscriptions table ready.');
    });

    // 35. Offers Table
    db.run(`
        CREATE TABLE IF NOT EXISTS offers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            offer_name VARCHAR(255) NOT NULL,
            plan_id INT NOT NULL,
            offer_type VARCHAR(100) DEFAULT 'festival',
            original_price DOUBLE NOT NULL,
            offer_price DOUBLE NOT NULL,
            discount_value VARCHAR(100),
            extra_applications INT DEFAULT 0,
            extra_features TEXT,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            priority INT DEFAULT 1,
            status VARCHAR(50) DEFAULT 'active',
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Offers table ready.');
    });

    // 36. Mentors Table
    db.run(`
        CREATE TABLE IF NOT EXISTS mentors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            mobile VARCHAR(50),
            profile_photo LONGTEXT,
            expertise VARCHAR(255) NOT NULL,
            experience VARCHAR(255) NOT NULL,
            availability VARCHAR(255) DEFAULT 'Weekdays & Weekends',
            status VARCHAR(50) DEFAULT 'active',
            bio TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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

    // 37. Mentor Requests Table
    db.run(`
        CREATE TABLE IF NOT EXISTS mentor_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id INT NOT NULL,
            candidate_name VARCHAR(255),
            candidate_email VARCHAR(255),
            mentor_id INT,
            mentor_name VARCHAR(255),
            topic VARCHAR(255) NOT NULL,
            notes TEXT,
            request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_date DATETIME,
            status VARCHAR(50) DEFAULT 'pending'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, (err) => {
        if (!err) console.log('Mentor Requests table ready.');
    });

    // Seed demo accounts
    const demoAccounts = [
        { email: 'admin@jobportal.com', password: 'admin123', role: 'admin' },
        { email: 'candidate@test.com',  password: 'password',  role: 'jobseeker' },
        { email: 'company@test.com',    password: 'password',  role: 'company', companyName: 'Tech Solutions Pvt Ltd', hrName: 'Jane Smith', phone: '+91 9876543210' },
        { email: 'dinesh@gmail.com',    password: 'password123', role: 'company', companyName: 'TCS', hrName: 'Dinesh Kumar', phone: '+91 9876543211' },
        { email: 'divya@gmail.com',     password: 'password123', role: 'company', companyName: 'Mahendira', hrName: 'Divya Bharathi', phone: '+91 9876543212' },
        { email: 'mariya@gmail.com',    password: 'password123', role: 'company', companyName: 'Toray', hrName: 'Mariya Selvam', phone: '+91 9876543213' },
        { email: 'nivetha@gmail.com',   password: 'password123', role: 'company', companyName: 'Nerolac', hrName: 'Nivetha R', phone: '+91 9876543214' },
        { email: 'sathi@gmail.com',     password: 'password123', role: 'company', companyName: 'sasa pvt ltd', hrName: 'Sathish', phone: '+91 95854672054' },
    ];

    for (const account of demoAccounts) {
        db.get('SELECT id FROM users WHERE email = ?', [account.email], async (err, row) => {
            if (!row) {
                const hashed = await bcrypt.hash(account.password, 10);
                db.run(
                    'INSERT INTO users (email, password, role, companyName, hrName, phone) VALUES (?, ?, ?, ?, ?, ?)',
                    [account.email, hashed, account.role, account.companyName || null, account.hrName || null, account.phone || null],
                    (err) => {
                        if (!err) console.log(`Seeded demo account: ${account.email} (${account.role})`);
                    }
                );
            }
        });
    }
}

function fallbackToMysqlOrSqlite() {
    candidatePool.getConnection((err, connection) => {
        if (!err && connection) {
            activeEngine = 'mysql';
            mysqlPool = candidatePool;
            console.log('✅ Connected to MySQL database:', process.env.DB_NAME || 'job_portal_db');
            connection.query('SET SESSION max_allowed_packet = 67108864', () => {});
            connection.release();
            initSchemaAndSeeds();
        } else {
            activeEngine = 'sqlite';
            if (!sqlite3) {
                console.error('❌ MySQL server unreachable and SQLite is unavailable:', err ? err.message : 'Unknown error');
                return;
            }
            const sqliteFilePath = path.join(__dirname, 'job_portal.sqlite');
            sqliteDb = new sqlite3.Database(sqliteFilePath, (sErr) => {
                if (sErr) {
                    console.error('❌ Error opening SQLite database:', sErr.message);
                } else {
                    console.log(`ℹ️ Local MySQL server unreachable (${err ? err.message : 'timeout'}).`);
                    console.log(`✅ Seamlessly initialized SQLite database at: ${sqliteFilePath}`);
                    // Enable foreign keys in SQLite
                    sqliteDb.run('PRAGMA foreign_keys = ON;', () => {
                        initSchemaAndSeeds();
                    });
                }
            });
        }
    });
}

// 1. Prioritize Supabase PostgreSQL if DATABASE_URL is configured
const hasValidSupabaseUrl = process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes('supabase.com') &&
    !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]');

if (hasValidSupabaseUrl) {
    if (!pgPool) {
        pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 15000
        });
    }

    pgPool.connect((err, client, release) => {
        if (!err && client) {
            activeEngine = 'supabase';
            lastError = null;
            console.log('✅ Connected to Supabase PostgreSQL database!');
            release();
            if (!process.env.VERCEL) {
                initSchemaAndSeeds();
            }
        } else {
            lastError = err ? err.message : 'Unknown connect error';
            console.warn('⚠️ Supabase connection failed:', lastError);
            if (!process.env.VERCEL) {
                fallbackToMysqlOrSqlite();
            }
        }
    });
} else {
    fallbackToMysqlOrSqlite();
}

module.exports = db;

