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
        resumeUrl, resumeURL, coverLetter, coverMessage
    } = req.body;
    
    const applicantId = req.user.id;

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
        WHERE (jobId = ? OR jobId = ?) AND (applicantId = ? OR candidate_id = ? OR candidate_id = ?)
    `;
    db.get(checkQuery, [jobId, String(jobId), applicantId, applicantId, String(applicantId)], (err, existing) => {
        if (err) {
            console.error('Error checking existing application:', err);
            return res.status(500).json({ message: 'Database error checking application status' });
        }

        if (existing) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        // 2. Enforce Dynamic Candidate Application Limit (Requirement 2 & 13)
        db.get('SELECT COUNT(*) as count FROM applications WHERE applicantId = ? OR candidate_id = ?', [applicantId, applicantId], (countErr, countRow) => {
            const currentAppCount = countRow?.count || 0;

            const subCheckQuery = `
                SELECT cs.*, cp.application_limit as plan_limit, o.extra_applications
                FROM candidate_subscriptions cs
                LEFT JOIN candidate_plans cp ON cs.plan_id = cp.id
                LEFT JOIN offers o ON cs.offer_id = o.id
                WHERE (cs.candidate_id = ? OR cs.candidate_email = ?)
                  AND cs.status = 'active'
                  AND cs.end_date > datetime('now')
                ORDER BY cs.id DESC LIMIT 1
            `;

            db.get(subCheckQuery, [applicantId, req.user.email || ''], (subErr, activeSub) => {
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
                    db.get('SELECT * FROM candidates WHERE candidate_id = ? OR candidate_id = ?', [applicantId, `CAND-${applicantId}`], (err, cand) => {
                        const finalName = candidateName || cand?.full_name || req.user.name || 'Candidate';
                        const finalEdu = education || 'Graduate';
                        const finalSkills = skills || '';
                        const finalExp = experience || cand?.total_experience || 'Fresher';
                        const finalResume = resumeUrl || resumeURL || cand?.resume_url || '';
                        const finalCover = coverLetter || coverMessage || '';
                        const finalPhoto = cand?.profile_photo || '';

                        // 4. Insert Application Record
                        const insertQuery = `
                            INSERT INTO applications (
                                application_id, jobId, applicantId, companyId, employer_id, candidate_id,
                                application_questions, application_answers, joining_availability, interview_availability,
                                candidate_name, education, skills, experience, profile_photo, resume_url, cover_letter,
                                status, appliedAt, applied_date
                            ) VALUES (
                                ?, ?, ?, ?, ?, ?,
                                ?, ?, ?, ?,
                                ?, ?, ?, ?, ?, ?, ?,
                                'Applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                            )
                        `;

                        const params = [
                            appIdStr, jobId, applicantId, finalCompanyId, finalEmployerId, applicantId,
                            qStr, aStr, joiningAvailability || '', interviewAvailability || '',
                            finalName, finalEdu, finalSkills, finalExp, finalPhoto, finalResume, finalCover
                        ];

                        db.run(insertQuery, params, function (err) {
                            if (err) {
                                console.error('Error inserting application:', err);
                                return res.status(500).json({ message: 'Error submitting application: ' + err.message });
                            }

                            // Increment candidate application count if user exists in users table
                            db.run('UPDATE users SET applicationCount = COALESCE(applicationCount, 0) + 1 WHERE id = ?', [applicantId]);

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
    const { jobId } = req.params;
    const applicantId = req.user.id;

    const query = `
        SELECT id, application_id, status, appliedAt, applied_date 
        FROM applications 
        WHERE (jobId = ? OR jobId = ?) AND (applicantId = ? OR candidate_id = ? OR candidate_id = ?)
    `;
    db.get(query, [jobId, String(jobId), applicantId, applicantId, String(applicantId)], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ applied: !!row, application: row || null });
    });
});

// Get Candidate's Own Applications (Requirement 8)
router.get('/my-applications', verifyToken, (req, res) => {
    const query = `
        SELECT a.*, 
               COALESCE(j.title, j.job_title, 'Position') as jobTitle, 
               COALESCE(j.location, j.job_location, 'Location') as jobLocation, 
               COALESCE(j.company_name, u.companyName, 'Company') as companyName,
               COALESCE(j.company_logo, '') as companyLogo
        FROM applications a
        LEFT JOIN jobs j ON (a.jobId = j.id OR a.jobId = j.job_id OR CAST(a.jobId AS TEXT) = CAST(j.id AS TEXT))
        LEFT JOIN users u ON a.companyId = u.id
        WHERE a.applicantId = ? OR a.candidate_id = ?
        ORDER BY a.appliedAt DESC, a.id DESC
    `;
    db.all(query, [req.user.id, req.user.id], (err, rows) => {
        if (err) {
            console.error('Error fetching candidate applications:', err);
            return res.status(500).json({ message: 'Error fetching applications' });
        }
        res.json(rows || []);
    });
});

// Get Applications for a Job (Employer View - Requirement 5, 6, 7, 9)
// IMPORTANT SECURITY / PRIVACY REQUIREMENT:
// Strictly excludes candidate email, mobile number, and personal address from the response.
router.get('/job/:jobId', verifyToken, (req, res) => {
    if (req.user.role !== 'company' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized. Employer or Admin role required.' });
    }

    const { jobId } = req.params;

    // Check if employer owns the job or is admin
    db.get('SELECT * FROM jobs WHERE (id = ? OR job_id = ?)', [jobId, jobId], (err, job) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!job && req.user.role !== 'admin') {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (req.user.role !== 'admin' && job.companyId != req.user.id && job.employer_id != req.user.id && job.company_id != req.user.id) {
            return res.status(403).json({ message: 'Unauthorized. You can only view applications for your own jobs.' });
        }

        // Fetch applications for this job
        const query = `
            SELECT a.id, a.application_id, a.jobId, a.applicantId, a.candidate_id, a.companyId, a.employer_id,
                   a.candidate_name, a.education, a.skills, a.experience, a.profile_photo,
                   a.resume_url, a.cover_letter, a.status, a.appliedAt, a.applied_date,
                   a.application_questions, a.application_answers,
                   a.joining_availability, a.interview_availability
            FROM applications a
            WHERE a.jobId = ? OR a.jobId = ?
            ORDER BY a.appliedAt DESC, a.applied_date DESC
        `;

        db.all(query, [jobId, String(jobId)], (err, rows) => {
            if (err) {
                console.error('Error fetching job applications:', err);
                return res.status(500).json({ message: 'Error fetching applications' });
            }

            // Check unlocked candidates for this employer if contact unlocking is used in other features
            db.all('SELECT candidateId FROM unlocked_candidates WHERE employerId = ?', [req.user.id], (err, unlockedList) => {
                const unlockedSet = new Set(unlockedList ? unlockedList.map(u => String(u.candidateId)) : []);

                // Privacy Sanitization: NEVER expose candidate private contact fields (email, phone, address) by default
                const sanitizedRows = (rows || []).map(row => {
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
                        resumeUrl: row.resume_url || '',
                        resumeURL: row.resume_url || '',
                        coverLetter: row.cover_letter || '',
                        status: row.status || 'Applied',
                        applicationStatus: row.status || 'Applied',
                        appliedDate: row.applied_date || row.appliedAt,
                        appliedAt: row.appliedAt || row.applied_date,
                        joiningAvailability: row.joining_availability || 'Immediately',
                        interviewAvailability: row.interview_availability || 'Anytime',
                        applicationQuestions: parsedQuestions,
                        applicationAnswers: parsedAnswers,
                        // Strict Privacy Protection
                        isContactPrivate: true,
                        email: '[Hidden for Privacy]',
                        phone: '[Hidden for Privacy]',
                        address: '[Hidden for Privacy]'
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
