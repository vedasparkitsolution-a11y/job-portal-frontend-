const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get matched candidates for employer's jobs
router.get('/matched-candidates', verifyToken, (req, res) => {
    // 1. Get employer's jobs
    db.all('SELECT * FROM jobs WHERE companyId = ? OR companyId IN (SELECT companyName FROM users WHERE id = ?)', [req.user.id, req.user.id], (err, jobs) => {
        if (err) return res.status(500).json({ message: 'Error fetching jobs' });
        
        if (jobs.length === 0) {
            return res.json([]);
        }

        // We will just do a simple match against all jobseekers
        db.all('SELECT id, email, role, phone, address, createdAt FROM users WHERE role = "jobseeker"', [], (err, candidates) => {
            if (err) return res.status(500).json({ message: 'Error fetching candidates' });

            // We also need to know which ones are unlocked
            db.all('SELECT candidateId FROM unlocked_candidates WHERE employerId = ?', [req.user.id], (err, unlocked) => {
                const unlockedIds = new Set(unlocked ? unlocked.map(u => u.candidateId) : []);

                // Simplified matching logic (random/mocked for now, but structured to allow real scoring)
                // Real scoring would compare skills from `jobs` and skills from a candidate profile table.
                const matches = candidates.map(candidate => {
                    // Mock match percentage between 60 and 99 for demonstration
                    const matchPercentage = Math.floor(Math.random() * 40) + 60;
                    
                    const isUnlocked = unlockedIds.has(candidate.id);
                    
                    return {
                        id: candidate.id,
                        matchPercentage,
                        isUnlocked,
                        // Public info
                        name: `Candidate #${candidate.id}`, // Or first name + initial if we had it
                        skills: ['React', 'Node.js', 'JavaScript'], // Mock data
                        experience: '2 Years',
                        education: 'B.Tech',
                        city: 'Bangalore',
                        resumeScore: Math.floor(Math.random() * 20) + 70,
                        portfolioAvailable: true,
                        
                        // Protected info (only sent if unlocked)
                        email: isUnlocked ? candidate.email : '********@gmail.com',
                        phone: isUnlocked ? candidate.phone || '98******54' : '98******54',
                        address: isUnlocked ? candidate.address || 'Unlocked Address' : '********',
                    };
                });

                // Sort by match percentage descending
                matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

                res.json(matches);
            });
        });
    });
});

// Unlock contact details
router.post('/unlock-contact', verifyToken, (req, res) => {
    const { candidateId } = req.body;

    if (!candidateId) return res.status(400).json({ message: 'Candidate ID is required' });

    // 1. Check if already unlocked
    db.get('SELECT * FROM unlocked_candidates WHERE employerId = ? AND candidateId = ?', [req.user.id, candidateId], (err, existing) => {
        if (existing) {
            return res.json({ message: 'Already unlocked' });
        }

        // 2. Check active subscription
        const query = `
            SELECT s.*, p.contact_views 
            FROM subscriptions s
            JOIN subscription_plans p ON s.planId = p.id
            WHERE s.userId = ? AND s.status = 'active' AND s.expiryDate > datetime('now')
            ORDER BY s.id DESC LIMIT 1
        `;

        db.get(query, [req.user.id], (err, subscription) => {
            if (err) return res.status(500).json({ message: 'Error checking subscription' });

            if (!subscription) {
                return res.status(403).json({ message: 'No active subscription. Please upgrade to premium.' });
            }

            if (subscription.contact_views !== -1 && subscription.contactsViewed >= subscription.contact_views) {
                return res.status(403).json({ message: 'Contact view limit reached. Please upgrade your plan.' });
            }

            // 3. Unlock candidate
            db.run('INSERT INTO unlocked_candidates (employerId, candidateId) VALUES (?, ?)', [req.user.id, candidateId], function(err) {
                if (err) return res.status(500).json({ message: 'Error unlocking candidate' });

                // 4. Update subscription usage
                db.run('UPDATE subscriptions SET contactsViewed = contactsViewed + 1 WHERE id = ?', [subscription.id], (err) => {
                    // Fetch real details
                    db.get('SELECT email, phone, address FROM users WHERE id = ?', [candidateId], (err, candidate) => {
                        res.json({
                            message: 'Candidate unlocked successfully',
                            candidate: {
                                email: candidate.email,
                                phone: candidate.phone,
                                address: candidate.address
                            }
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

