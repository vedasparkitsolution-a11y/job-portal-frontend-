-- ===================================================
-- JOB PORTAL SUPABASE (POSTGRESQL) SCHEMA SETUP
-- ===================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50),
    ispremium INT DEFAULT 0,
    applicationcount INT DEFAULT 0,
    phone VARCHAR(50),
    address TEXT,
    companyname VARCHAR(255),
    hrname VARCHAR(255),
    approved_access INT DEFAULT 0,
    createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(100) UNIQUE,
    employer_id VARCHAR(100),
    name VARCHAR(255),
    company_name VARCHAR(255),
    logo TEXT,
    company_logo TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    company_email VARCHAR(255),
    phone VARCHAR(50),
    company_phone VARCHAR(50),
    location VARCHAR(255),
    about TEXT,
    industry VARCHAR(100),
    company_type VARCHAR(100),
    team_size VARCHAR(50),
    company_size VARCHAR(100),
    year_established VARCHAR(50),
    registration_number VARCHAR(100),
    gst_number VARCHAR(100),
    description TEXT,
    address TEXT,
    approved_access INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employers Table
CREATE TABLE IF NOT EXISTS employers (
    id SERIAL PRIMARY KEY,
    employer_id VARCHAR(100) UNIQUE,
    userid INT,
    companyid INT,
    company_id VARCHAR(100),
    mobile_number VARCHAR(50) UNIQUE,
    mobile_verified INT DEFAULT 0,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    google_account_id VARCHAR(255),
    hrname VARCHAR(255),
    designation VARCHAR(100),
    profile_completed INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100),
    employer_id VARCHAR(100),
    company_id VARCHAR(100),
    companyid INT,
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
    jobtype VARCHAR(100),
    googleformlink TEXT,
    cgpa VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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
    jobid VARCHAR(100),
    applicantid VARCHAR(100),
    candidate_id VARCHAR(100),
    candidate_email VARCHAR(255),
    applicant_email VARCHAR(255),
    companyid VARCHAR(100),
    employer_id VARCHAR(100),
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    appliedat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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
    userid INT,
    mobile_number VARCHAR(50) UNIQUE,
    mobile_verified INT DEFAULT 0,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    google_account_id VARCHAR(255),
    full_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    headline VARCHAR(255),
    professional_headline VARCHAR(255),
    current_job_title VARCHAR(255),
    current_company VARCHAR(255),
    total_experience VARCHAR(100),
    experience_years VARCHAR(50),
    experience_type VARCHAR(100),
    about_me TEXT,
    bio TEXT,
    current_salary VARCHAR(50),
    expected_salary VARCHAR(50),
    notice_period VARCHAR(50),
    highest_qualification VARCHAR(100),
    skills TEXT,
    resume_url TEXT,
    resume_name VARCHAR(255),
    resume_updated_at VARCHAR(100),
    profile_photo TEXT,
    date_of_birth VARCHAR(50),
    dob VARCHAR(50),
    gender VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(50),
    address TEXT,
    profile_completed INT DEFAULT 0,
    profile_completion_percentage INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Candidate Education Table
CREATE TABLE IF NOT EXISTS candidate_education (
    education_id SERIAL PRIMARY KEY,
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
);

-- 8. Candidate Experience Table
CREATE TABLE IF NOT EXISTS candidate_experience (
    experience_id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(100),
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    employment_type VARCHAR(100),
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    currently_working INT DEFAULT 0,
    location VARCHAR(255),
    description TEXT
);

-- 9. Candidate Skills Table
CREATE TABLE IF NOT EXISTS candidate_skills (
    skill_id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(100),
    skill_name VARCHAR(255),
    skill_category VARCHAR(100)
);

-- 10. Career Preferences Table
CREATE TABLE IF NOT EXISTS career_preferences (
    preference_id SERIAL PRIMARY KEY,
    candidate_id VARCHAR(100),
    preferred_job_types TEXT,
    preferred_locations TEXT,
    preferred_work_modes TEXT,
    minimum_salary VARCHAR(100),
    maximum_salary VARCHAR(100),
    notice_period VARCHAR(100),
    preferred_roles TEXT
);

-- 11. OTPs Table
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255),
    mobile_number VARCHAR(50),
    otp VARCHAR(10),
    otp_code VARCHAR(20),
    verified INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Saved Jobs Table
CREATE TABLE IF NOT EXISTS saved_jobs (
    id SERIAL PRIMARY KEY,
    saved_job_id SERIAL,
    candidate_id VARCHAR(100),
    job_id VARCHAR(100),
    saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
