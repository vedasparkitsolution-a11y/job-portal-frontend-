const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/authMiddleware');

// Helper: Generate Candidate ID (e.g. CAND-10001)
function generateCandidateId(callback) {
    db.get('SELECT COUNT(*) as count FROM candidates', (err, row) => {
        const num = (row ? row.count : 0) + 10001;
        callback(`CAND-${num}`);
    });
}

// 1. Send OTP (Mobile OTP Verification - Requirement 1 & 2)
router.post('/send-otp', (req, res) => {
    const { mobileNumber, countryCode } = req.body;
    if (!mobileNumber) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    const clean = mobileNumber.replace(/\D/g, '');
    if (clean.length < 10 || clean.length > 12) {
        return res.status(400).json({ message: 'Invalid 10-digit mobile number' });
    }

    const fullMobile = `${countryCode || '+91'} ${clean}`;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.run(
        `INSERT INTO otps (mobile_number, otp_code, expires_at) VALUES (?, ?, ?)`,
        [fullMobile, otpCode, expiresAt],
        function (err) {
            if (err) {
                console.error('Error storing OTP:', err);
            }
            res.json({
                message: 'OTP sent successfully',
                mobileNumber: fullMobile,
                otpCode: process.env.NODE_ENV === 'production' ? undefined : otpCode
            });
        }
    );
});

// 2. Verify OTP (Requirement 2 & 3)
router.post('/verify-otp', (req, res) => {
    const { mobileNumber, countryCode, otp } = req.body;
    if (!mobileNumber || !otp) {
        return res.status(400).json({ message: 'Mobile number and 6-digit OTP are required' });
    }

    const clean = mobileNumber.replace(/\D/g, '');
    const fullMobile = `${countryCode || '+91'} ${clean}`;

    // Demo OTP bypass
    if (otp === '123456') {
        return checkCandidateAccount(fullMobile, res);
    }

    db.get(
        `SELECT * FROM otps WHERE mobile_number = ? AND otp_code = ? AND verified = 0 ORDER BY id DESC LIMIT 1`,
        [fullMobile, otp],
        (err, row) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (!row) return res.status(400).json({ message: 'Invalid or expired OTP' });

            db.run(`UPDATE otps SET verified = 1 WHERE id = ?`, [row.id]);
            checkCandidateAccount(fullMobile, res);
        }
    );
});

function checkCandidateAccount(mobileNumber, res) {
    db.get(`SELECT * FROM candidates WHERE mobile_number = ?`, [mobileNumber], (err, candidate) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        if (candidate) {
            // Existing Candidate
            const token = jwt.sign(
                { id: candidate.candidate_id, role: 'jobseeker', email: candidate.email },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: '7d' }
            );

            return res.json({
                exists: true,
                message: 'OTP verified. Welcome back!',
                candidate,
                token
            });
        } else {
            // New Candidate -> Profile creation required
            return res.json({
                exists: false,
                message: 'OTP verified. Please complete your candidate profile.',
                mobileNumber
            });
        }
    });
}

// 3. Candidate Google Auth (Requirement 4)
router.post('/google', (req, res) => {
    const { email, googleAccountId, fullName } = req.body;
    if (!email) return res.status(400).json({ message: 'Google email is required' });

    db.get(`SELECT * FROM candidates WHERE email = ?`, [email], (err, candidate) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        if (candidate) {
            const token = jwt.sign(
                { id: candidate.candidate_id, role: 'jobseeker', email: candidate.email },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: '7d' }
            );
            return res.json({
                exists: true,
                candidate,
                token
            });
        } else {
            return res.json({
                exists: false,
                email,
                fullName,
                googleAccountId,
                message: 'New user via Google. Please verify mobile number to complete profile.'
            });
        }
    });
});

// 4. Save Candidate Profile (Multi-step - Requirement 5 to 14)
router.post('/profile', (req, res) => {
    const body = req.body;
    const mobile = body.mobile_number || body.phone;
    if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });

    db.get(`SELECT * FROM candidates WHERE mobile_number = ? OR email = ?`, [mobile, body.email], (err, existing) => {
        const candidateId = existing ? existing.candidate_id : (body.candidate_id || `CAND-${Date.now()}`);
        const profileCompletion = calculateCompletionScore(body);

        // Limit huge raw image strings if uncompressed (> 500KB) to prevent MySQL max_allowed_packet error
        let rawPhoto = body.profile_photo || body.photo || '';
        if (typeof rawPhoto === 'string' && rawPhoto.length > 600000) {
            rawPhoto = ''; // Exceeds safe packet size
        }

        let rawResume = body.resume_url || body.resumeURL || '';
        if (typeof rawResume === 'string' && rawResume.length > 500000) {
            rawResume = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        }

        if (existing) {
            // Update
            const query = `
                UPDATE candidates SET
                    full_name = ?, profile_photo = ?, date_of_birth = ?, gender = ?, city = ?, state = ?, country = ?, pincode = ?, address = ?,
                    professional_headline = ?, current_job_title = ?, current_company = ?, total_experience = ?, experience_type = ?, about_me = ?,
                    resume_url = ?, resume_name = ?, resume_updated_at = ?, profile_completed = 1, profile_completion_percentage = ?, updated_at = CURRENT_TIMESTAMP
                WHERE candidate_id = ?
            `;
            const params = [
                body.full_name || body.name, rawPhoto, body.date_of_birth || body.dob, body.gender,
                body.city, body.state, body.country, body.pincode, body.address,
                body.professional_headline, body.current_job_title, body.current_company, body.total_experience, body.experience_type || 'Experienced', body.about_me,
                rawResume, body.resume_name || 'Resume.pdf', new Date().toISOString(),
                profileCompletion, candidateId
            ];

            db.run(query, params, function (err) {
                if (err) return res.status(500).json({ message: 'Error updating candidate profile: ' + err.message });

                saveSubTables(candidateId, body, () => {
                    const token = jwt.sign(
                        { id: candidateId, role: 'jobseeker', email: body.email },
                        process.env.JWT_SECRET || 'secret_key',
                        { expiresIn: '7d' }
                    );

                    res.json({
                        message: '🎉 Your Profile Has Been Updated Successfully!',
                        candidate_id: candidateId,
                        profile_completion_percentage: profileCompletion,
                        token
                    });
                });
            });
        } else {
            // Insert New Candidate
            generateCandidateId((newId) => {
                const finalId = candidateId.startsWith('CAND-') ? candidateId : newId;
                const query = `
                    INSERT INTO candidates (
                        candidate_id, mobile_number, mobile_verified, email, password_hash, google_account_id,
                        full_name, profile_photo, date_of_birth, gender, city, state, country, pincode, address,
                        professional_headline, current_job_title, current_company, total_experience, experience_type, about_me,
                        resume_url, resume_name, resume_updated_at, profile_completed, profile_completion_percentage
                    ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1, ?)
                `;

                const params = [
                    finalId, mobile, body.email || '', body.password || '', body.google_account_id || '',
                    body.full_name || body.name || 'Candidate', rawPhoto, body.date_of_birth || body.dob, body.gender || 'Any',
                    body.city || '', body.state || '', body.country || 'India', body.pincode || '', body.address || '',
                    body.professional_headline || '', body.current_job_title || '', body.current_company || '', body.total_experience || 'Fresher',
                    body.experience_type || 'Fresher', body.about_me || '', rawResume, body.resume_name || '', profileCompletion
                ];

                db.run(query, params, function (err) {
                    if (err) return res.status(500).json({ message: 'Error creating candidate profile: ' + err.message });

                    // Also sync with users table for legacy compatibility
                    db.run(
                        `INSERT OR IGNORE INTO users (email, password, role, phone, address) VALUES (?, ?, 'jobseeker', ?, ?)`,
                        [body.email, body.password || 'password', mobile, body.address || '']
                    );

                    saveSubTables(finalId, body, () => {
                        const token = jwt.sign(
                            { id: finalId, role: 'jobseeker', email: body.email },
                            process.env.JWT_SECRET || 'secret_key',
                            { expiresIn: '7d' }
                        );

                        res.status(201).json({
                            message: '🎉 Your Profile Has Been Created Successfully!',
                            candidate_id: finalId,
                            profile_completion_percentage: profileCompletion,
                            token
                        });
                    });
                });
            });
        }
    });
});

function calculateCompletionScore(body) {
    let score = 0;
    if (body.full_name || body.name) score += 15;
    if (body.email && (body.mobile_number || body.phone)) score += 15;
    if (body.education && body.education.length > 0) score += 20;
    if (body.experience && body.experience.length > 0) score += 15;
    if (body.skills && (typeof body.skills === 'string' ? body.skills : body.skills.length > 0)) score += 15;
    if (body.resume_url || body.resumeURL) score += 10;
    if (body.career_preferences || body.preferred_roles) score += 10;
    return Math.min(100, Math.max(score, 40));
}

function saveSubTables(candidateId, body, callback) {
    // Education
    if (Array.isArray(body.education)) {
        db.run(`DELETE FROM candidate_education WHERE candidate_id = ?`, [candidateId], () => {
            body.education.forEach(edu => {
                db.run(
                    `INSERT INTO candidate_education (candidate_id, qualification, degree, specialization, institution, university, start_year, end_year, percentage, cgpa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [candidateId, edu.qualification || '', edu.degree || '', edu.specialization || '', edu.institution || '', edu.university || '', edu.start_year || '', edu.end_year || '', edu.percentage || '', edu.cgpa || '']
                );
            });
        });
    }

    // Experience
    if (Array.isArray(body.experience)) {
        db.run(`DELETE FROM candidate_experience WHERE candidate_id = ?`, [candidateId], () => {
            body.experience.forEach(exp => {
                db.run(
                    `INSERT INTO candidate_experience (candidate_id, company_name, job_title, employment_type, start_date, end_date, currently_working, location, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [candidateId, exp.company_name || '', exp.job_title || '', exp.employment_type || 'Full Time', exp.start_date || '', exp.end_date || '', exp.currently_working ? 1 : 0, exp.location || '', exp.description || '']
                );
            });
        });
    }

    // Skills
    if (body.skills) {
        db.run(`DELETE FROM candidate_skills WHERE candidate_id = ?`, [candidateId], () => {
            const skillList = Array.isArray(body.skills) ? body.skills : String(body.skills).split(',').map(s => s.trim()).filter(Boolean);
            skillList.forEach(sk => {
                const name = typeof sk === 'object' ? sk.name : sk;
                const cat = typeof sk === 'object' ? sk.category : 'Technical';
                db.run(`INSERT INTO candidate_skills (candidate_id, skill_name, skill_category) VALUES (?, ?, ?)`, [candidateId, name, cat]);
            });
        });
    }

    // Career Preferences
    if (body.career_preferences || body.preferred_locations || body.preferred_roles) {
        const pref = body.career_preferences || body;
        db.run(`DELETE FROM career_preferences WHERE candidate_id = ?`, [candidateId], () => {
            db.run(
                `INSERT INTO career_preferences (candidate_id, preferred_job_types, preferred_locations, preferred_work_modes, minimum_salary, maximum_salary, notice_period, preferred_roles) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    candidateId,
                    Array.isArray(pref.preferred_job_types) ? pref.preferred_job_types.join(',') : pref.preferred_job_types || '',
                    Array.isArray(pref.preferred_locations) ? pref.preferred_locations.join(',') : pref.preferred_locations || '',
                    pref.preferred_work_modes || pref.work_mode || 'Any',
                    pref.minimum_salary || '',
                    pref.maximum_salary || '',
                    pref.notice_period || 'Immediate Joiner',
                    Array.isArray(pref.preferred_roles) ? pref.preferred_roles.join(',') : pref.preferred_roles || ''
                ]
            );
        });
    }

    if (callback) callback();
}

// 5. Get Candidate Profile (Requirement 15)
router.get('/profile/:id', (req, res) => {
    const candidateId = req.params.id;
    db.get(`SELECT * FROM candidates WHERE candidate_id = ? OR email = ? OR mobile_number = ?`, [candidateId, candidateId, candidateId], (err, candidate) => {
        if (err || !candidate) return res.status(404).json({ message: 'Candidate profile not found' });

        db.all(`SELECT * FROM candidate_education WHERE candidate_id = ?`, [candidate.candidate_id], (err, education) => {
            db.all(`SELECT * FROM candidate_experience WHERE candidate_id = ?`, [candidate.candidate_id], (err, experience) => {
                db.all(`SELECT * FROM candidate_skills WHERE candidate_id = ?`, [candidate.candidate_id], (err, skills) => {
                    db.get(`SELECT * FROM career_preferences WHERE candidate_id = ?`, [candidate.candidate_id], (err, preferences) => {
                        res.json({
                            ...candidate,
                            education: education || [],
                            experience: experience || [],
                            skills: skills ? skills.map(s => s.skill_name) : [],
                            career_preferences: preferences || {}
                        });
                    });
                });
            });
        });
    });
});

// 6. Save/Unsave Job (Requirement 24)
router.post('/save-job', verifyToken, (req, res) => {
    const { candidateId, jobId } = req.body;
    const cid = candidateId || req.user.id;
    if (!jobId) return res.status(400).json({ message: 'Job ID is required' });

    db.run(`INSERT OR IGNORE INTO saved_jobs (candidate_id, job_id) VALUES (?, ?)`, [cid, jobId], function (err) {
        if (err) return res.status(500).json({ message: 'Error saving job' });
        res.json({ message: 'Job saved successfully!' });
    });
});

router.delete('/save-job/:jobId', verifyToken, (req, res) => {
    const candidateId = req.user.id;
    const jobId = req.params.jobId;

    db.run(`DELETE FROM saved_jobs WHERE (candidate_id = ? OR candidate_id = ?) AND (job_id = ? OR job_id = ?)`, [candidateId, req.user.email, jobId, jobId], function (err) {
        if (err) return res.status(500).json({ message: 'Error unsaving job' });
        res.json({ message: 'Job removed from saved jobs' });
    });
});

router.get('/saved-jobs/:candidateId', (req, res) => {
    const cid = req.params.candidateId;
    const query = `
        SELECT j.* FROM jobs j 
        JOIN saved_jobs sj ON (j.job_id = sj.job_id OR j.id = sj.job_id)
        WHERE sj.candidate_id = ?
        ORDER BY sj.saved_at DESC
    `;
    db.all(query, [cid], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching saved jobs' });
        res.json(rows || []);
    });
});

// 7. Get Recommended Jobs (Requirement 25)
router.get('/recommended-jobs/:candidateId', (req, res) => {
    const cid = req.params.candidateId;

    db.get(`SELECT * FROM candidates WHERE candidate_id = ? OR email = ?`, [cid, cid], (err, candidate) => {
        if (!candidate) {
            // Fallback: Return top active jobs
            return db.all(`SELECT * FROM jobs WHERE status = 'active' OR status = 'open' LIMIT 10`, [], (err, rows) => {
                res.json(rows || []);
            });
        }

        db.all(`SELECT * FROM candidate_skills WHERE candidate_id = ?`, [candidate.candidate_id], (err, skills) => {
            db.get(`SELECT * FROM career_preferences WHERE candidate_id = ?`, [candidate.candidate_id], (err, preferences) => {
                const candidateSkillNames = skills ? skills.map(s => s.skill_name.toLowerCase()) : [];
                const prefLocations = preferences?.preferred_locations ? preferences.preferred_locations.toLowerCase() : '';

                db.all(`SELECT * FROM jobs WHERE status = 'active' OR status = 'open'`, [], (err, jobs) => {
                    if (err || !jobs) return res.json([]);

                    // Match scoring algorithm
                    const scored = jobs.map(job => {
                        let score = 50; // base score
                        const jobSkills = (job.required_skills || job.skills || '').toLowerCase();
                        const jobLoc = (job.job_location || job.location || '').toLowerCase();

                        // Skill match
                        candidateSkillNames.forEach(sk => {
                            if (jobSkills.includes(sk)) score += 15;
                        });

                        // Location match
                        if (prefLocations && jobLoc && prefLocations.includes(jobLoc)) {
                            score += 20;
                        }

                        return {
                            ...job,
                            matchScore: Math.min(99, score)
                        };
                    });

                    scored.sort((a, b) => b.matchScore - a.matchScore);
                    res.json(scored.slice(0, 12));
                });
            });
        });
    });
});

// 8. Get Candidate Notifications
router.get('/notifications', verifyToken, (req, res) => {
    db.all(`SELECT * FROM candidate_notifications WHERE candidate_id = ? OR candidate_id = ? ORDER BY created_at DESC LIMIT 50`, [req.user.id, req.user.email], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching notifications' });
        res.json(rows || []);
    });
});

module.exports = router;

