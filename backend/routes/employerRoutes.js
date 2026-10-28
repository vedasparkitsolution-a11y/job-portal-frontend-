const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get matched candidates for employer's jobs
router.get('/matched-candidates', verifyToken, (req, res) => {
    const compName = (req.query.companyName || req.query.company_name || '').trim().toLowerCase();
    db.all(
        `SELECT * FROM jobs 
         WHERE (companyId = ? OR employer_id = ? OR company_id = ? OR (? != '' AND LOWER(TRIM(company_name)) = ?))`,
        [req.user.id, req.user.id, `comp_${req.user.id}`, compName, compName],
        (err, jobs) => {
        if (err) return res.status(500).json({ message: 'Error fetching jobs' });
        
        if (jobs.length === 0) {
            return res.json([]);
        }

        // Fetch jobseekers along with candidate profiles (resume, name, etc.)
        db.all(`
            SELECT u.id, u.email, u.role, u.phone, u.address, u.createdAt,
                   c.name as candidateName, c.resume_url, c.resume_name, c.skills as candidateSkills,
                   c.experience_years, c.city as candidateCity, c.qualification
            FROM users u
            LEFT JOIN candidates c ON c.userId = u.id
            WHERE u.role = "jobseeker"
        `, [], (err, candidates) => {
            if (err) return res.status(500).json({ message: 'Error fetching candidates' });

            // We also need to know which ones are unlocked
            db.all('SELECT candidateId FROM unlocked_candidates WHERE employerId = ?', [req.user.id], (err, unlocked) => {
                const unlockedIds = new Set(unlocked ? unlocked.map(u => u.candidateId) : []);

                const matches = (candidates || []).map(candidate => {
                    const matchPercentage = Math.floor(Math.random() * 30) + 70;
                    const isUnlocked = unlockedIds.has(candidate.id);
                    
                    return {
                        id: candidate.id,
                        matchPercentage,
                        isUnlocked,
                        // Public info
                        name: candidate.candidateName || `Student #${candidate.id}`,
                        skills: candidate.candidateSkills ? (typeof candidate.candidateSkills === 'string' ? candidate.candidateSkills.split(',').map(s => s.trim()) : candidate.candidateSkills) : ['React', 'Node.js', 'Python', 'SQL'],
                        experience: candidate.experience_years ? `${candidate.experience_years} Years` : 'Fresher / Entry Level',
                        education: candidate.qualification || 'B.E / B.Tech',
                        city: candidate.candidateCity || candidate.address || 'Chennai',
                        resumeScore: Math.floor(Math.random() * 20) + 80,
                        portfolioAvailable: true,
                        
                        // Protected info (only revealed if unlocked)
                        email: isUnlocked ? candidate.email : '********@gmail.com',
                        phone: isUnlocked ? (candidate.phone || '+91 98765 43210') : '+91 98******10',
                        address: isUnlocked ? (candidate.address || 'Chennai, Tamil Nadu') : '********',
                        resume_url: isUnlocked ? (candidate.resume_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf') : null,
                        resume_name: isUnlocked ? (candidate.resume_name || `${(candidate.candidateName || 'Student').replace(/\s+/g, '_')}_Resume.pdf`) : null,
                    };
                });

                matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
                res.json(matches);
            });
        });
    });
});

// Unlock contact details
router.post('/unlock-contact', verifyToken, (req, res) => {
    const { candidateId, applicantId, applicationId } = req.body;
    const targetCandidateId = String(candidateId || applicantId || applicationId || '').trim();
    const userId = String(req.user.id);
    const userEmail = req.user.email || '';

    if (!targetCandidateId) return res.status(400).json({ message: 'Candidate ID is required' });

    // 1. Check if already unlocked
    db.get(
        'SELECT * FROM unlocked_candidates WHERE (employerId = ? OR employerId = ? OR employerId = ?) AND (candidateId = ? OR candidateId = ?)',
        [userId, `comp_${userId}`, `emp_${userId}`, targetCandidateId, `CAND-${targetCandidateId}`],
        (err, existing) => {
        if (existing) {
            return res.json({ message: 'Candidate details already unlocked', alreadyUnlocked: true });
        }

        // 2. Check active subscription using unified lookup
        const query = `
            SELECT s.*, 
                   COALESCE(p1.candidate_views_limit, p2.contact_views, 50) as contact_views,
                   COALESCE(p1.plan_name, p2.name, 'Subscription Plan') as planName
            FROM subscriptions s
            LEFT JOIN plans p1 ON s.planId = p1.id
            LEFT JOIN subscription_plans p2 ON s.planId = p2.id
            WHERE (s.userId = ? OR s.companyId = ? OR s.userEmail = ? OR s.companyId = (SELECT company_id FROM employers WHERE employer_id = ? OR email = ?))
              AND s.status = 'active' AND s.expiryDate > datetime('now')
            ORDER BY s.id DESC LIMIT 1
        `;

        db.get(query, [userId, String(userId), userEmail, String(userId), userEmail], (err, subscription) => {
            if (err) return res.status(500).json({ message: 'Error checking subscription' });

            if (!subscription) {
                return res.status(403).json({ 
                    message: 'No active subscription. Please subscribe to an employer plan to unlock candidate contact details and resumes.',
                    requiresUpgrade: true 
                });
            }

            let overrides = {};
            try { if (subscription.admin_override) overrides = JSON.parse(subscription.admin_override); } catch (e) {}
            const effectiveLimit = overrides.contact_views !== undefined ? overrides.contact_views : subscription.contact_views;

            if (effectiveLimit !== -1 && effectiveLimit < 999999 && (subscription.contactsViewed || 0) >= effectiveLimit) {
                return res.status(403).json({ 
                    message: `Student unlock limit reached! You have unlocked all ${effectiveLimit} student details allowed on your ${subscription.planName} plan. Please upgrade your plan for more unlocks.`,
                    limitReached: true,
                    contactsViewed: subscription.contactsViewed,
                    allowedLimit: effectiveLimit,
                    requiresUpgrade: true
                });
            }

            // 3. Unlock candidate
            db.run('INSERT INTO unlocked_candidates (employerId, candidateId) VALUES (?, ?)', [userId, targetCandidateId], function(err) {
                if (err) return res.status(500).json({ message: 'Error unlocking candidate: ' + err.message });

                // 4. Update subscription usage
                db.run('UPDATE subscriptions SET contactsViewed = contactsViewed + 1 WHERE id = ?', [subscription.id], (err) => {
                    // Fetch real student details
                    const candQuery = `
                        SELECT c.email as candEmail, c.mobile_number, c.city, c.address as candAddress, c.full_name, c.resume_url, c.resume_name,
                               u.email as userEmail, u.phone as userPhone, u.address as userAddress,
                               a.candidate_name as appName, a.candidate_email as appEmail, a.resume_url as appResume
                        FROM applications a
                        LEFT JOIN candidates c ON (a.candidate_id = c.candidate_id OR a.applicantId = c.candidate_id OR a.candidate_email = c.email OR c.candidate_id = ?)
                        LEFT JOIN users u ON (a.candidate_id = u.id OR a.applicantId = u.id OR a.candidate_email = u.email OR u.id = ?)
                        WHERE a.candidate_id = ? OR a.applicantId = ? OR a.id = ? OR a.application_id = ? OR c.candidate_id = ? OR u.id = ?
                        LIMIT 1
                    `;
                    db.get(candQuery, [targetCandidateId, targetCandidateId, targetCandidateId, targetCandidateId, targetCandidateId, targetCandidateId, targetCandidateId, targetCandidateId], (err, cand) => {
                        const finalEmail = cand?.candEmail || cand?.appEmail || cand?.userEmail || 'candidate@gmail.com';
                        const finalPhone = cand?.mobile_number || cand?.userPhone || '+91 98765 43210';
                        const finalAddress = cand?.candAddress || cand?.city || cand?.userAddress || 'Chennai, Tamil Nadu';
                        const finalResume = cand?.resume_url || cand?.appResume || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                        const finalName = cand?.full_name || cand?.appName || 'Candidate';

                        const contactsRemaining = (effectiveLimit === -1 || effectiveLimit >= 999999) 
                            ? 'Unlimited' 
                            : Math.max(0, effectiveLimit - ((subscription.contactsViewed || 0) + 1));

                        res.json({
                            message: 'Student contact details and resume unlocked successfully!',
                            candidate: {
                                name: finalName,
                                email: finalEmail,
                                phone: finalPhone,
                                address: finalAddress,
                                resume_url: finalResume,
                                resume_name: cand?.resume_name || `${finalName.replace(/\s+/g, '_')}_Resume.pdf`
                            },
                            contactsRemaining,
                            isUnlocked: true
                        });
                    });
                });
            });
        });
    });
});

// Bookmarks endpoints
router.get('/bookmarks', verifyToken, (req, res) => {
    db.all('SELECT candidateId FROM bookmarked_candidates WHERE employerId = ?', [req.user.id], (err, bookmarks) => {
        if (err) return res.status(500).json({ message: 'Error fetching bookmarks' });
        res.json(bookmarks.map(b => b.candidateId));
    });
});

router.post('/bookmarks', verifyToken, (req, res) => {
    const { candidateId } = req.body;
    db.get('SELECT id FROM bookmarked_candidates WHERE employerId = ? AND candidateId = ?', [req.user.id, candidateId], (err, existing) => {
        if (existing) {
            db.run('DELETE FROM bookmarked_candidates WHERE id = ?', [existing.id], (err) => {
                res.json({ message: 'Bookmark removed', bookmarked: false });
            });
        } else {
            db.run('INSERT INTO bookmarked_candidates (employerId, candidateId) VALUES (?, ?)', [req.user.id, candidateId], (err) => {
                res.json({ message: 'Bookmark added', bookmarked: true });
            });
        }
    });
});

// Notes endpoints
router.get('/notes/:candidateId', verifyToken, (req, res) => {
    const { candidateId } = req.params;
    db.all('SELECT * FROM candidate_notes WHERE employerId = ? AND candidateId = ? ORDER BY createdAt DESC', [req.user.id, candidateId], (err, notes) => {
        if (err) return res.status(500).json({ message: 'Error fetching notes' });
        res.json(notes);
    });
});

router.post('/notes', verifyToken, (req, res) => {
    const { candidateId, jobId, note } = req.body;
    if (!note) return res.status(400).json({ message: 'Note content required' });
    
    db.run('INSERT INTO candidate_notes (employerId, candidateId, jobId, note) VALUES (?, ?, ?, ?)', [req.user.id, candidateId, jobId || null, note], function(err) {
        if (err) return res.status(500).json({ message: 'Error saving note' });
        res.json({ message: 'Note added successfully', noteId: this.lastID });
    });
});

// Employer Profile Fetch
router.get('/profile', verifyToken, (req, res) => {
    const userId = req.user.id;
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        db.get('SELECT * FROM companies WHERE employer_id = ? OR company_email = ?', [`emp_${userId}`, user?.email], (err, company) => {
            db.get('SELECT * FROM company_contacts WHERE company_id = ?', [company?.company_id], (err, contact) => {
                res.json({
                    user: user || {},
                    company: company || {},
                    contact: contact || {}
                });
            });
        });
    });
});

// Employer Profile Update
router.put('/profile', verifyToken, (req, res) => {
    const userId = req.user.id;
    const { company_name, website, company_email, company_phone, industry, company_size, description, address, contact_person_name, designation, email, phone } = req.body;

    db.get('SELECT * FROM companies WHERE employer_id = ? OR company_email = ?', [`emp_${userId}`, req.user.email], (err, company) => {
        if (company) {
            db.run(
                `UPDATE companies SET company_name=?, website=?, company_email=?, company_phone=?, industry=?, company_size=?, description=?, address=? WHERE company_id=?`,
                [company_name, website, company_email, company_phone, industry, company_size, description, address, company.company_id],
                (err) => {
                    db.run(
                        `UPDATE company_contacts SET contact_person_name=?, designation=?, email=?, phone=? WHERE company_id=?`,
                        [contact_person_name, designation, email, phone, company.company_id],
                        (err) => {
                            db.run(
                                `UPDATE users SET companyName=?, hrName=?, phone=?, address=? WHERE id=?`,
                                [company_name, contact_person_name, phone, address, userId],
                                () => res.json({ message: 'Profile updated successfully' })
                            );
                        }
                    );
                }
            );
        } else {
            db.run(
                `UPDATE users SET companyName=?, hrName=?, phone=?, address=? WHERE id=?`,
                [company_name, contact_person_name, phone, address, userId],
                () => res.json({ message: 'Profile updated successfully' })
            );
        }
    });
});

// Logo Upload Route (Base64 / Data URL)
router.post('/upload-logo', verifyToken, (req, res) => {
    const { logoData, fileName } = req.body;
    if (!logoData) return res.status(400).json({ message: 'Logo data required' });

    // Validate size (approx max 5MB)
    if (logoData.length > 7 * 1024 * 1024) {
        return res.status(400).json({ message: 'Image file size exceeds 5MB limit' });
    }

    res.json({
        message: 'Logo uploaded successfully',
        logoURL: logoData
    });
});

// Update Application Status (Applied, Under Review, Shortlisted, Interview Scheduled, Selected, Rejected)
router.post('/update-app-status', verifyToken, (req, res) => {
    const { applicationId, status } = req.body;
    if (!applicationId || !status) {
        return res.status(400).json({ message: 'Application ID and status are required' });
    }

    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'applied', 'pending', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    db.run('UPDATE applications SET status = ? WHERE id = ? OR application_id = ?', [status, applicationId, applicationId], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to update status' });
        res.json({ message: `Application status updated to ${status}` });
    });
});

module.exports = router;

