-- ===================================================
-- JOB PORTAL SUPABASE (POSTGRESQL) SCHEMA SETUP
-- Paste this script into Supabase SQL Editor and click RUN
-- ===================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50),
    "isPremium" INT DEFAULT 0,
    "applicationCount" INT DEFAULT 0,
    phone VARCHAR(50),
    address TEXT,
    "companyName" VARCHAR(255),
    "hrName" VARCHAR(255),
    approved_access INT DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    logo TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    about TEXT,
    industry VARCHAR(100),
    team_size VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employers Table
CREATE TABLE IF NOT EXISTS employers (
    id SERIAL PRIMARY KEY,
    "userId" INT,
    "companyId" INT,
    "hrName" VARCHAR(255),
    designation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100),
    employer_id VARCHAR(100),
    company_id VARCHAR(100),
    "companyId" INT,
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
    "jobType" VARCHAR(100),
    "googleFormLink" TEXT,
    cgpa VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    latitude VARCHAR(100),
    longitude VARCHAR(100),
    geo_address TEXT,
    geo_radius VARCHAR(50),
    application_questions TEXT
);

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(100),
    "jobId" VARCHAR(100),
    "applicantId" VARCHAR(100),
    candidate_id VARCHAR(100),
    candidate_email VARCHAR(255),
    applicant_email VARCHAR(255),
    "companyId" VARCHAR(100),
    employer_id VARCHAR(100),
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    "appliedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    applied_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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
);

-- 6. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(100) UNIQUE,
    "userId" INT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    headline VARCHAR(255),
    bio TEXT,
    current_designation VARCHAR(100),
    current_company VARCHAR(255),
    experience_years VARCHAR(50),
    current_salary VARCHAR(50),
    expected_salary VARCHAR(50),
    notice_period VARCHAR(50),
    highest_qualification VARCHAR(100),
    skills TEXT,
    resume_url TEXT,
    profile_photo TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    gender VARCHAR(20),
    dob VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Saved Jobs Table
CREATE TABLE IF NOT EXISTS saved_jobs (
    id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(100),
    job_id VARCHAR(100),
    saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Candidate Notifications
CREATE TABLE IF NOT EXISTS candidate_notifications (
    id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Admin Notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    "companyId" INT,
    title VARCHAR(255),
    type VARCHAR(100),
    timer INT,
    "passingMarks" INT,
    status VARCHAR(50) DEFAULT 'active',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id SERIAL PRIMARY KEY,
    "assessmentId" INT,
    "questionData" TEXT,
    answer TEXT,
    language VARCHAR(100)
);

-- 13. Assessment Attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id SERIAL PRIMARY KEY,
    "assessmentId" INT,
    "candidateId" INT,
    score DOUBLE PRECISION,
    details TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    "userId" INT,
    "companyId" VARCHAR(100),
    "companyName" VARCHAR(255),
    "employerName" VARCHAR(255),
    "userEmail" VARCHAR(255),
    "planId" INT,
    target_role VARCHAR(100) DEFAULT 'employer',
    plan_type VARCHAR(100) DEFAULT 'common',
    amount DOUBLE PRECISION DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'paid',
    status VARCHAR(50) DEFAULT 'active',
    "startDate" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    target_role VARCHAR(100) DEFAULT 'employer',
    plan_type VARCHAR(100) DEFAULT 'common',
    company_id VARCHAR(100) DEFAULT '',
    company_name VARCHAR(255) DEFAULT '',
    price DOUBLE PRECISION DEFAULT 0,
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
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. Plan Usage
CREATE TABLE IF NOT EXISTS plan_usage (
    id SERIAL PRIMARY KEY,
    employer_id VARCHAR(100),
    company_id VARCHAR(100),
    jobs_posted INT DEFAULT 0,
    resumes_viewed INT DEFAULT 0,
    candidate_contacts_used INT DEFAULT 0,
    data_requests_used INT DEFAULT 0,
    data_exports_used INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(100),
    order_id VARCHAR(100),
    amount DOUBLE PRECISION,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50),
    "userEmail" VARCHAR(255),
    "userId" INT,
    "planId" INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 18. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(100),
    job_id VARCHAR(100),
    candidate_id VARCHAR(100),
    employer_id VARCHAR(100),
    scheduled_time TIMESTAMPTZ,
    meeting_link TEXT,
    interview_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'scheduled',
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. OTPs Table
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255),
    otp VARCHAR(10),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 20. Mentors Table
CREATE TABLE IF NOT EXISTS mentors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    title VARCHAR(255),
    company VARCHAR(255),
    experience VARCHAR(50),
    bio TEXT,
    skills TEXT,
    price_per_session DOUBLE PRECISION DEFAULT 0,
    rating DOUBLE PRECISION DEFAULT 5.0,
    profile_photo TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Default System Settings Seed
INSERT INTO system_settings (key, value, description)
VALUES 
    ('free_employer_job_limit', '3', 'Default maximum free job postings allowed per employer'),
    ('require_candidate_consent', 'true', 'Require candidate consent for contact info export'),
    ('mask_contact_info_default', 'false', 'Mask phone and email by default on preview')
ON CONFLICT (key) DO NOTHING;

