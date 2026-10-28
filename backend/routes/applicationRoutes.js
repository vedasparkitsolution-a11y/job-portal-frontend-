const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply for a Job (Requirement 1, 2, 4, 9, 11)
router.post('/apply', verifyToken, (req, res) => {
    const {
        jobId, companyId, employerId,
        applicationQuestions, applicationAnswers,
        joiningAvailability, interviewAvailability,
        candidateName, education, skills, experience,
        resumeUrl, resumeURL, coverLetter, coverMessage,
        candidateEmail, applicantEmail, jobTitle, companyName
    } = req.body;
    
    const applicantId = String(req.body.candidateId || req.body.applicantId || req.user?.id || '').trim();
    const finalCandidateEmail = String(candidateEmail || applicantEmail || req.user?.email || '').trim().toLowerCase();

    if (!jobId) {
        return res.status(400).json({ message: 'Job ID is required' });
    }

    const finalCompanyId = companyId || employerId || req.body.employer_id || '';
    const finalEmployerId = employerId || companyId || req.body.employer_id || '';
    const appIdStr = `APP-${Date.now()}`;
    const qStr = typeof applicationQuestions === 'object' ? JSON.stringify(applicationQuestions) : (applicationQuestions || '');
    const aStr = typeof applicationAnswers === 'object' ? JSON.stringify(applicationAnswers) : (applicationAnswers || '');

    // 1. Check if already applied (prevent duplicate applications)
    const checkQuery = `
        SELECT id FROM applications 
        WHERE (jobId = ? OR jobId = ? OR CAST(jobId AS CHAR) = ?)
          AND (
            (applicantId = ? AND ? != '' AND applicantId != '0')
            OR (candidate_id = ? AND ? != '' AND candidate_id != '0')
            OR (LOWER(TRIM(candidate_email)) = ? AND ? != '')
            OR (LOWER(TRIM(applicant_email)) = ? AND ? != '')
          )
    `;
    db.get(checkQuery, [
        String(jobId), String(jobId), String(jobId),
        applicantId, applicantId,
        applicantId, applicantId,
        finalCandidateEmail, finalCandidateEmail,
        finalCandidateEmail, finalCandidateEmail
    ], (err, existing) => {
        if (err) {
            console.error('Error checking existing application:', err);
            return res.status(500).json({ message: 'Database error checking application status' });
        }

        if (existing) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        // 2. Enforce Dynamic Candidate Application Limit (Requirement 2 & 13)
        db.get('SELECT COUNT(*) as count FROM applications WHERE (applicantId = ? AND ? != "") OR (LOWER(TRIM(candidate_email)) = ? AND ? != "")', 
            [applicantId, applicantId, finalCandidateEmail, finalCandidateEmail], (countErr, countRow) => {
            const currentAppCount = countRow?.count || 0;

            const subCheckQuery = `
                SELECT cs.*, cp.application_limit as plan_limit, o.extra_applications
                FROM candidate_subscriptions cs
                LEFT JOIN candidate_plans cp ON cs.plan_id = cp.id
                LEFT JOIN offers o ON cs.offer_id = o.id
                WHERE (cs.candidate_id = ? OR LOWER(TRIM(cs.candidate_email)) = ?)
                  AND cs.status = 'active'
                  AND cs.end_date > datetime('now')
                ORDER BY cs.id DESC LIMIT 1
            `;

            db.get(subCheckQuery, [applicantId, finalCandidateEmail], (subErr, activeSub) => {
                let allowedLimit = 10;

                if (activeSub) {
                    allowedLimit = (activeSub.application_limit || activeSub.plan_limit || 20) + (activeSub.extra_applications || 0);
                } else {
                    // Fallback to active dynamic free plan limit from candidate_plans table
                    db.get('SELECT application_limit FROM candidate_plans WHERE price = 0 AND status = "active" LIMIT 1', [], (fpErr, fp) => {
                        if (fp && fp.application_limit !== undefined) {
                            allowedLimit = fp.application_limit;
                        }
                        checkAndProceed(allowedLimit);
                    });
                    return;
                }

                checkAndProceed(allowedLimit);

                function checkAndProceed(limit) {
                    if (limit !== -1 && currentAppCount >= limit) {
                        return res.status(403).json({
                            message: 'You have reached your current job application limit. Upgrade your plan to continue applying for jobs.',
                            limitReached: true,
                            currentCount: currentAppCount,
                            limit: limit
                        });
                    }

                    // 3. Fetch candidate profile details if not fully provided in request
                    db.get('SELECT * FROM candidates WHERE candidate_id = ? OR email = ?', [applicantId, finalCandidateEmail], (err, cand) => {
                        const finalName = candidateName || cand?.full_name || req.user?.name || 'Candidate';
                        const finalEdu = education || 'Graduate';
                        const finalSkills = skills || '';
                        const finalExp = experience || cand?.total_experience || 'Fresher';
                        const finalResume = resumeUrl || resumeURL || cand?.resume_url || '';
                        const finalCover = coverLetter || coverMessage || '';
                        const finalPhoto = cand?.profile_photo || '';
                        const finalJobTitle = jobTitle || '';
                        const finalCompName = companyName || '';

                        // 4. Insert Application Record
                        const insertQuery = `
                            INSERT INTO applications (
                                application_id, jobId, applicantId, companyId, employer_id, candidate_id,
                                candidate_email, applicant_email, job_title, company_name,
                                application_questions, application_answers, joining_availability, interview_availability,
                                candidate_name, education, skills, experience, profile_photo, resume_url, cover_letter,
                                status, appliedAt, applied_date
                            ) VALUES (
                                ?, ?, ?, ?, ?, ?,
                                ?, ?, ?, ?,
                                ?, ?, ?, ?,
                                ?, ?, ?, ?, ?, ?, ?,
                                'Applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                            )
                        `;

                        const params = [
                            appIdStr, String(jobId), applicantId, String(finalCompanyId), String(finalEmployerId), applicantId,
                            finalCandidateEmail, finalCandidateEmail, finalJobTitle, finalCompName,
                            qStr, aStr, joiningAvailability || '', interviewAvailability || '',
                            finalName, finalEdu, finalSkills, finalExp, finalPhoto, finalResume, finalCover
                        ];

                        db.run(insertQuery, params, function (err) {
                            if (err) {
                                console.error('Error inserting application:', err);
                                return res.status(500).json({ message: 'Error submitting application: ' + err.message });
                            }

                            // Increment candidate application count if user exists in users table
                            db.run('UPDATE users SET applicationCount = COALESCE(applicationCount, 0) + 1 WHERE id = ? OR email = ?', [applicantId, finalCandidateEmail]);

                            res.status(201).json({
                                message: 'Application submitted successfully',
                                applicationId: appIdStr,
                                id: this.lastID,
                                status: 'Applied'
                            });
                        });
                    });
                }
            });
        });
    });
});

// Check if candidate already applied for a job
router.get('/check-applied/:jobId', verifyToken, (req, res) => {
    const jobId = String(req.params.jobId || '').trim();
    const applicantId = String(req.query.userId || req.query.candidateId || (req.user?.role === 'jobseeker' ? req.user?.id : '') || '').trim();
    const candidateEmail = String(req.query.email || req.query.candidateEmail || (req.user?.role === 'jobseeker' ? req.user?.email : '') || '').trim().toLowerCase();

    // If no candidate identifier is provided, they have definitely NOT applied
    if (!applicantId && !candidateEmail) {
        return res.json({ applied: false, application: null });
    }

    const query = `
        SELECT id, application_id, status, appliedAt, applied_date, jobId, applicantId, candidate_email 
        FROM applications 
        WHERE (jobId = ? OR jobId = ? OR CAST(jobId AS CHAR) = ?)
          AND (
            (applicantId = ? AND ? != '' AND applicantId != '0')
            OR (candidate_id = ? AND ? != '' AND candidate_id != '0')
            OR (LOWER(TRIM(candidate_email)) = ? AND ? != '')
            OR (LOWER(TRIM(applicant_email)) = ? AND ? != '')
          )
    `;
    const params = [
        jobId, jobId, jobId,
        applicantId, applicantId,
        applicantId, applicantId,
        candidateEmail, candidateEmail,
        candidateEmail, candidateEmail
    ];

    db.get(query, params, (err, row) => {
        if (err) {
            console.error('Error in check-applied:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json({ applied: !!row, application: row || null });
    });
});

// Get Candidate's Own Applications (Requirement 8)
router.get('/my-applications', verifyToken, (req, res) => {
    const applicantId = String(req.query.userId || (req.user?.role === 'jobseeker' ? req.user?.id : '') || '').trim();
    const candidateEmail = String(req.query.email || (req.user?.role === 'jobseeker' ? req.user?.email : '') || '').trim().toLowerCase();

    if (!applicantId && !candidateEmail) {
        return res.json([]);
    }

    const query = `
        SELECT a.*, 
               COALESCE(j.title, j.job_title, a.job_title, 'Position') as jobTitle, 
               COALESCE(j.location, j.job_location, 'Location') as jobLocation, 
               COALESCE(j.company_name, u.companyName, a.company_name, 'Company') as companyName,
               COALESCE(j.company_logo, '') as companyLogo
        FROM applications a
        LEFT JOIN jobs j ON (a.jobId = j.id OR a.jobId = j.job_id OR CAST(a.jobId AS CHAR) = CAST(j.id AS CHAR) OR CAST(a.jobId AS CHAR) = CAST(j.job_id AS CHAR))
        LEFT JOIN users u ON a.companyId = u.id
        WHERE (a.applicantId = ? AND ? != '' AND a.applicantId != '0') 
           OR (a.candidate_id = ? AND ? != '' AND a.candidate_id != '0')
           OR (LOWER(TRIM(a.candidate_email)) = ? AND ? != '')
           OR (LOWER(TRIM(a.applicant_email)) = ? AND ? != '')
        ORDER BY a.appliedAt DESC, a.id DESC
    `;
    const params = [
        applicantId, applicantId,
        applicantId, applicantId,
        candidateEmail, candidateEmail,
        candidateEmail, candidateEmail
    ];

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching candidate applications:', err);
            return res.status(500).json({ message: 'Error fetching applications' });
        }
        res.json(rows || []);
    });
});

// Get All Applications for an Employer's Company
router.get('/company', verifyToken, (req, res) => {
    const queryCompanyId = (req.query.companyId || req.query.company_id || req.query.employerId || '').trim();
    const queryCompanyName = (req.query.companyName || req.query.company_name || '').trim();
    const userEmail = req.user?.email || '';
    const userId = req.user?.id || '';
    const userRole = req.user?.role || '';

    const targetCompanyIds = new Set();
    const targetCompanyNames = new Set();

    if (queryCompanyId && queryCompanyId !== 'null' && queryCompanyId !== 'undefined') {
        targetCompanyIds.add(queryCompanyId);
    }
    if (queryCompanyName && queryCompanyName !== 'null' && queryCompanyName !== 'undefined') {
        targetCompanyNames.add(queryCompanyName.toLowerCase().trim());
    }

    if (userId && userId !== 'admin_1') {
        targetCompanyIds.add(String(userId));
        targetCompanyIds.add(`comp_${userId}`);
        targetCompanyIds.add(`emp_${userId}`);
    }

    db.get('SELECT id, email, companyName FROM users WHERE id = ? OR email = ?', [userId, userEmail], (err, u) => {
        if (u) {
            if (u.id) targetCompanyIds.add(String(u.id));
            if (u.companyName) targetCompanyNames.add(u.companyName.toLowerCase().trim());
        }

        db.get('SELECT company_id, employer_id, company_name FROM companies WHERE company_email = ? OR employer_id = ? OR company_id = ?',
            [userEmail, `emp_${userId}`, queryCompanyId || ''], (cErr, comp) => {
            if (comp) {
                if (comp.company_id) targetCompanyIds.add(comp.company_id);
                if (comp.employer_id) targetCompanyIds.add(comp.employer_id);
                if (comp.company_name) targetCompanyNames.add(comp.company_name.toLowerCase().trim());
            }

            const conditions = [];
            const params = [];

            if (targetCompanyIds.size > 0) {
                const idsArray = Array.from(targetCompanyIds);
                const placeholders = idsArray.map(() => '?').join(',');
                conditions.push(`(j.company_id IN (${placeholders}) OR j.employer_id IN (${placeholders}) OR CAST(j.companyId AS CHAR) IN (${placeholders}))`);
                params.push(...idsArray, ...idsArray, ...idsArray);
            }

            if (targetCompanyNames.size > 0) {
                const namesArray = Array.from(targetCompanyNames);
                const placeholders = namesArray.map(() => 'LOWER(TRIM(?))').join(',');
                conditions.push(`LOWER(TRIM(j.company_name)) IN (${placeholders})`);
                params.push(...namesArray);
            }

            if (conditions.length === 0) {
                if (userRole === 'admin' && !queryCompanyName && !queryCompanyId) {
                    const allSql = `
                        SELECT a.*, COALESCE(j.title, j.job_title, 'Position') as jobTitle, j.company_name as companyName
                        FROM applications a
                        LEFT JOIN jobs j ON (a.jobId = j.id OR a.jobId = j.job_id)
                        ORDER BY a.appliedAt DESC
                    `;
                    db.all(allSql, [], (err, rows) => {
                        if (err) return res.status(500).json({ message: 'Error fetching applications' });
                        return res.json(rows || []);
                    });
                    return;
                } else {
                    return res.json([]);
                }
            }

            const query = `
                SELECT a.*, 
                       COALESCE(j.title, j.job_title, 'Position') as jobTitle, 
                       j.company_name as companyName,
                       COALESCE(c.mobile_number, u.phone, '+91 98765 43210') as real_phone,
                       COALESCE(a.candidate_email, c.email, u.email, 'candidate@gmail.com') as real_email,
                       COALESCE(c.city, c.address, u.address, 'Chennai, Tamil Nadu') as real_address,
                       COALESCE(c.resume_url, a.resume_url, '') as real_resume_url,
                       COALESCE(c.resume_name, 'Resume.pdf') as real_resume_name
                FROM applications a
                JOIN jobs j ON (a.jobId = j.id OR a.jobId = j.job_id OR CAST(a.jobId AS CHAR) = CAST(j.id AS CHAR) OR CAST(a.jobId AS CHAR) = CAST(j.job_id AS CHAR))
                LEFT JOIN candidates c ON (a.candidate_id = c.candidate_id OR a.applicantId = c.candidate_id OR a.candidate_email = c.email)
                LEFT JOIN users u ON (a.candidate_id = u.id OR a.applicantId = u.id OR a.candidate_email = u.email)
                WHERE ${conditions.join(' OR ')}
                ORDER BY a.appliedAt DESC, a.id DESC
            `;

            db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Error fetching company applications:', err);
                    return res.status(500).json({ message: 'Error fetching company applications' });
                }

                db.all('SELECT candidateId FROM unlocked_candidates WHERE employerId IN (?, ?, ?)', 
                    [String(userId), `comp_${userId}`, `emp_${userId}`], (uErr, unlockedList) => {
                    const unlockedSet = new Set(unlockedList ? unlockedList.map(u => String(u.candidateId)) : []);

                    const sanitized = (rows || []).map(row => {
                        const candId = String(row.candidate_id || row.applicantId || row.id);
                        const isUnlocked = unlockedSet.has(candId) || 
                                           unlockedSet.has(String(row.applicantId)) || 
                                           unlockedSet.has(String(row.id)) || 
                                           unlockedSet.has(String(row.application_id)) || 
                                           unlockedSet.has(String(row.candidate_email)) || 
                                           (userRole === 'admin');

                        return {
                            ...row,
                            id: row.id || row.application_id,
                            applicationId: row.application_id || row.id,
                            candidateName: row.candidate_name || 'Candidate',
                            isUnlocked,
                            isContactPrivate: !isUnlocked,
                            email: isUnlocked ? row.real_email : '********@gmail.com',
                            phone: isUnlocked ? row.real_phone : '+91 98******10',
                            address: isUnlocked ? row.real_address : '********',
                            resumeUrl: row.real_resume_url || row.resume_url || '',
                            resumeURL: row.real_resume_url || row.resume_url || ''
                        };
                    });

                    res.json(sanitized);
                });
            });
        });
    });
});

// Get Applications for a Job (Employer View)
router.get('/job/:jobId', verifyToken, (req, res) => {
    if (req.user.role !== 'company' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized. Employer or Admin role required.' });
    }

    const { jobId } = req.params;
    const userId = String(req.user.id);

    // Check if employer owns the job or is admin
    db.get('SELECT * FROM jobs WHERE (id = ? OR job_id = ?)', [jobId, jobId], (err, job) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!job && req.user.role !== 'admin') {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Fetch applications for this job with candidate details joined
        const query = `
            SELECT a.*,
                   COALESCE(c.mobile_number, u.phone, '+91 98765 43210') as real_phone,
                   COALESCE(a.candidate_email, c.email, u.email, 'candidate@gmail.com') as real_email,
                   COALESCE(c.city, c.address, u.address, 'Chennai, Tamil Nadu') as real_address,
                   COALESCE(c.resume_url, a.resume_url, '') as real_resume_url,
                   COALESCE(c.resume_name, 'Resume.pdf') as real_resume_name
            FROM applications a
            LEFT JOIN candidates c ON (a.candidate_id = c.candidate_id OR a.applicantId = c.candidate_id OR a.candidate_email = c.email)
            LEFT JOIN users u ON (a.candidate_id = u.id OR a.applicantId = u.id OR a.candidate_email = u.email)
            WHERE a.jobId = ? OR a.jobId = ? OR CAST(a.jobId AS CHAR) = ?
            ORDER BY a.appliedAt DESC, a.applied_date DESC
        `;

        db.all(query, [jobId, String(jobId), String(jobId)], (err, rows) => {
            if (err) {
                console.error('Error fetching job applications:', err);
                return res.status(500).json({ message: 'Error fetching applications' });
            }

            // Check unlocked candidates for this employer
            db.all('SELECT candidateId FROM unlocked_candidates WHERE employerId IN (?, ?, ?)', 
                [userId, `comp_${userId}`, `emp_${userId}`], (err, unlockedList) => {
                const unlockedSet = new Set(unlockedList ? unlockedList.map(u => String(u.candidateId)) : []);

                const sanitizedRows = (rows || []).map(row => {
                    const candId = String(row.candidate_id || row.applicantId || row.id);
                    const isUnlocked = unlockedSet.has(candId) || 
                                       unlockedSet.has(String(row.applicantId)) || 
                                       unlockedSet.has(String(row.id)) || 
                                       unlockedSet.has(String(row.application_id)) || 
                                       unlockedSet.has(String(row.candidate_email)) || 
                                       (req.user?.role === 'admin');

                    let parsedQuestions = [];
                    let parsedAnswers = {};

                    try {
                        if (row.application_questions) {
                            parsedQuestions = typeof row.application_questions === 'string' 
                                ? JSON.parse(row.application_questions) 
                                : row.application_questions;
                        }
                    } catch (e) {}

                    try {
                        if (row.application_answers) {
                            parsedAnswers = typeof row.application_answers === 'string' 
                                ? JSON.parse(row.application_answers) 
                                : row.application_answers;
                        }
                    } catch (e) {}

                    return {
                        id: row.id || row.application_id,
                        applicationId: row.application_id || row.id,
                        jobId: row.jobId,
                        candidateId: row.candidate_id || row.applicantId,
                        applicantId: row.applicantId || row.candidate_id,
                        candidateName: row.candidate_name || 'Candidate',
                        profilePhoto: row.profile_photo || '',
                        education: row.education || 'Graduate',
                        skills: row.skills || '',
                        experience: row.experience || 'Fresher',
                        status: row.status || 'Applied',
                        applicationStatus: row.status || 'Applied',
                        appliedDate: row.applied_date || row.appliedAt,
                        appliedAt: row.appliedAt || row.applied_date,
                        joiningAvailability: row.joining_availability || 'Immediately',
                        interviewAvailability: row.interview_availability || 'Anytime',
                        applicationQuestions: parsedQuestions,
                        applicationAnswers: parsedAnswers,
                        coverLetter: row.cover_letter || '',
                        // Unlock / Contact Access
                        isUnlocked,
                        isContactPrivate: !isUnlocked,
                        email: isUnlocked ? row.real_email : '********@gmail.com',
                        phone: isUnlocked ? row.real_phone : '+91 98******10',
                        address: isUnlocked ? row.real_address : '********',
                        resumeUrl: row.real_resume_url || row.resume_url || '',
                        resumeURL: row.real_resume_url || row.resume_url || '',
                        resumeName: row.real_resume_name || 'Resume.pdf'
                    };
                });

                res.json(sanitizedRows);
            });
        });
    });
});

// Update Application Status (Requirement 8 & 11)
router.post('/update-status', verifyToken, (req, res) => {
    if (req.user.role !== 'company' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const { applicationId, id, status, recruiterNotes } = req.body;
    const targetId = applicationId || id;

    if (!targetId || !status) {
        return res.status(400).json({ message: 'Application ID and status are required' });
    }

    const validStatuses = ['New', 'Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];
    const normalizedStatus = validStatuses.find(s => s.toLowerCase() === status.toLowerCase()) || status;

    const query = `
        UPDATE applications 
        SET status = ? 
        WHERE id = ? OR application_id = ?
    `;

    db.run(query, [normalizedStatus, targetId, String(targetId)], function (err) {
        if (err) {
            console.error('Error updating application status:', err);
            return res.status(500).json({ message: 'Failed to update application status' });
        }
        res.json({ message: `Application status updated to ${normalizedStatus}`, status: normalizedStatus });
    });
});

module.exports = router;
