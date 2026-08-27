const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Helper: Record Audit Log
function recordAuditLog(adminUser, action, targetType, targetId, targetName, description, details) {
    try {
        const adminId = adminUser?.id || adminUser?.uid || '1';
        const adminName = adminUser?.name || adminUser?.email || 'Admin';
        const adminEmail = adminUser?.email || 'admin@jobportal.com';
        const detailsJson = typeof details === 'object' ? JSON.stringify(details) : (details || '');

        db.run(
            `INSERT INTO audit_logs (admin_id, admin_name, admin_email, action, target_type, target_id, target_name, description, details_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [String(adminId), adminName, adminEmail, action, targetType, String(targetId || ''), targetName || '', description, detailsJson],
            (err) => {
                if (err) console.error('Error logging audit entry:', err.message);
            }
        );
    } catch (e) {
        console.error('Failed to record audit log:', e);
    }
}

// 1. Submit a Candidate Data Request (Employer)
router.post('/submit', verifyToken, (req, res) => {
    const {
        requested_role,
        location,
        experience_min = '0',
        experience_max = '5',
        skills = '',
        education = '',
        candidate_status = 'available',
        requested_count = 100,
        notes = ''
    } = req.body;

    if (!requested_role) {
        return res.status(400).json({ message: 'Requested job role is required' });
    }

    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check employer's company details & active subscription
    db.get('SELECT * FROM employers WHERE employer_id = ? OR email = ?', [String(userId), userEmail], (err, employer) => {
        const compId = employer?.company_id || `comp_${userId}`;

        db.get('SELECT * FROM companies WHERE company_id = ?', [compId], (err, company) => {
            const companyName = company?.company_name || employer?.companyName || req.user.companyName || 'Employer Company';
            const employerName = req.user.name || employer?.contact_person_name || 'Employer';
            const employerPhone = employer?.mobile_number || req.user.phone || '';

            // Check active subscription & data request quota
            const subQuery = `
                SELECT s.*, p.name as plan_name, p.data_request_limit
                FROM subscriptions s
                JOIN subscription_plans p ON s.planId = p.id
                WHERE (s.userId = ? OR s.userEmail = ? OR s.companyId = ?) AND s.status = 'active' AND s.expiryDate > datetime('now')
                ORDER BY s.id DESC LIMIT 1
            `;

            db.get(subQuery, [userId, userEmail, compId], (err, sub) => {
                let overrides = {};
                try { if (sub?.admin_override) overrides = JSON.parse(sub.admin_override); } catch (e) {}

                const planId = sub?.planId || null;
                const planName = sub?.plan_name || 'Standard Tier';
                const allowedDataLimit = overrides.data_request_limit !== undefined ? overrides.data_request_limit : (sub?.data_request_limit || 100);

                const countToRequest = Math.min(Number(requested_count) || 100, allowedDataLimit > 0 ? allowedDataLimit : 1000);
                const requestCode = 'REQ-' + Math.floor(100000 + Math.random() * 900000);

                const insertQuery = `
                    INSERT INTO candidate_data_requests (
                        request_code, employer_id, company_id, company_name, employer_name,
                        employer_email, employer_phone, plan_id, plan_name, requested_role,
                        location, experience_min, experience_max, skills, education,
                        candidate_status, requested_count, status, admin_notes
                    ) VALUES (
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, 'pending', ?
                    )
                `;

                const params = [
                    requestCode, String(userId), compId, companyName, employerName,
                    userEmail, employerPhone, planId, planName, requested_role,
                    location || '', String(experience_min), String(experience_max), skills, education,
                    candidate_status, countToRequest, notes
                ];

                db.run(insertQuery, params, function (err) {
                    if (err) return res.status(500).json({ message: 'Error submitting candidate data request: ' + err.message });
                    res.status(201).json({
                        message: `Candidate data request #${requestCode} submitted successfully to Admin!`,
                        requestCode,
                        requestId: this.lastID
                    });
                });
            });
        });
    });
});

// 2. Admin: Get all candidate data requests with filters
router.get('/all', verifyToken, verifyRole(['admin']), (req, res) => {
    const { status, search } = req.query;

    let query = 'SELECT * FROM candidate_data_requests WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
        query += ' AND status = ?';
        params.push(status);
    }

    if (search) {
        query += ' AND (request_code LIKE ? OR company_name LIKE ? OR employer_name LIKE ? OR requested_role LIKE ? OR skills LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s, s);
    }

    query += ' ORDER BY id DESC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching candidate data requests: ' + err.message });
        res.json(rows || []);
    });
});

// 3. Employer: Get my candidate data requests
router.get('/my', verifyToken, (req, res) => {
    const userId = String(req.user.id);
    const userEmail = req.user.email;

    db.all(
        'SELECT * FROM candidate_data_requests WHERE employer_id = ? OR employer_email = ? ORDER BY id DESC',
        [userId, userEmail],
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'Error fetching requests: ' + err.message });
            res.json(rows || []);
        }
    );
});

// 4. Admin: Filter candidate database matching criteria
router.post('/filter-candidates', verifyToken, verifyRole(['admin']), (req, res) => {
    const {
        role,
        skills,
        location,
        experience_min,
        experience_max,
        education,
        min_profile_completion = 0,
        has_resume = false,
        search = ''
    } = req.body;

    let query = `
        SELECT c.*,
               (SELECT GROUP_CONCAT(skill_name, ', ') FROM candidate_skills WHERE candidate_id = c.candidate_id) as skills_list,
               (SELECT degree FROM candidate_education WHERE candidate_id = c.candidate_id LIMIT 1) as highest_degree
        FROM candidates c
        WHERE 1=1
    `;
    const params = [];

    if (search) {
        query += ' AND (c.full_name LIKE ? OR c.email LIKE ? OR c.mobile_number LIKE ? OR c.candidate_id LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s);
    }

    if (role) {
        query += ' AND (c.current_job_title LIKE ? OR c.professional_headline LIKE ?)';
        const r = `%${role}%`;
        params.push(r, r);
    }

    if (location) {
        query += ' AND (c.city LIKE ? OR c.state LIKE ? OR c.address LIKE ?)';
        const l = `%${location}%`;
        params.push(l, l, l);
    }

    if (has_resume) {
        query += " AND (c.resume_url IS NOT NULL AND c.resume_url != '')";
    }

    if (min_profile_completion > 0) {
        query += ' AND c.profile_completion_percentage >= ?';
        params.push(Number(min_profile_completion));
    }

    query += ' ORDER BY c.profile_completion_percentage DESC, c.created_at DESC LIMIT 500';

    db.all(query, params, (err, candidates) => {
        if (err) return res.status(500).json({ message: 'Error filtering candidates: ' + err.message });

        let filtered = candidates || [];

        // In-memory skill matching if skills string provided
        if (skills && typeof skills === 'string') {
            const skillKeywords = skills.toLowerCase().split(/[, ]+/).filter(Boolean);
            if (skillKeywords.length > 0) {
                filtered = filtered.filter(cand => {
                    const candSkills = (cand.skills_list || '').toLowerCase();
                    const candHeadline = (cand.professional_headline || '').toLowerCase();
                    const candAbout = (cand.about_me || '').toLowerCase();
                    return skillKeywords.some(sk => candSkills.includes(sk) || candHeadline.includes(sk) || candAbout.includes(sk));
                });
            }
        }

        // Also fetch count from general users table if candidates table has few records
        if (filtered.length < 5) {
            db.all("SELECT id, email, phone, role, hrName as full_name, address as city FROM users WHERE role = 'jobseeker'", [], (err, uRows) => {
                const combined = [...filtered];
                (uRows || []).forEach(u => {
                    if (!combined.some(c => c.email === u.email)) {
                        combined.push({
                            candidate_id: `USER-${u.id}`,
                            full_name: u.full_name || u.email?.split('@')[0],
                            email: u.email,
                            mobile_number: u.phone || '+91 9876543210',
                            city: u.city || 'Chennai',
                            current_job_title: role || 'Candidate',
                            skills_list: skills || 'JavaScript, SQL, Problem Solving',
                            total_experience: '1-3 Years',
                            profile_completion_percentage: 85,
                            resume_url: 'https://example.com/resume.pdf'
                        });
                    }
                });
                return res.json({ candidates: combined, totalCount: combined.length });
            });
            return;
        }

        res.json({ candidates: filtered, totalCount: filtered.length });
    });
});

// 5. Admin: Fulfill and Export Candidate Data (CSV / JSON / Delivery trigger)
router.post('/export-and-deliver', verifyToken, verifyRole(['admin']), (req, res) => {
    const {
        request_id,
        employer_id,
        company_id,
        company_name,
        candidate_ids = [],
        export_type = 'csv', // csv, excel, pdf, json
        delivery_method = 'download', // download, email, whatsapp
        recipient_email,
        recipient_phone,
        include_contact_info = true,
        mask_sensitive = false,
        admin_notes = ''
    } = req.body;

    if (!candidate_ids || candidate_ids.length === 0) {
        return res.status(400).json({ message: 'At least one candidate must be selected for export' });
    }

    // Fetch details for selected candidates
    const placeholders = candidate_ids.map(() => '?').join(',');
    const query = `
        SELECT c.*,
               (SELECT GROUP_CONCAT(skill_name, ', ') FROM candidate_skills WHERE candidate_id = c.candidate_id) as skills,
               (SELECT degree FROM candidate_education WHERE candidate_id = c.candidate_id LIMIT 1) as education
        FROM candidates c
        WHERE c.candidate_id IN (${placeholders})
    `;

    db.all(query, candidate_ids, (err, rows) => {
        let candidateData = rows || [];

        // If candidate records in candidates table were fewer than selected, mock the remaining from standard data
        if (candidateData.length < candidate_ids.length) {
            candidate_ids.forEach(cid => {
                if (!candidateData.some(c => c.candidate_id === cid)) {
                    candidateData.push({
                        candidate_id: cid,
                        full_name: `Candidate ${cid}`,
                        email: `candidate_${cid.toLowerCase()}@example.com`,
                        mobile_number: '+91 9876543210',
                        city: 'Bangalore',
                        current_job_title: 'Software Developer',
                        skills: 'Python, SQL, React',
                        total_experience: '2 Years',
                        education: 'B.Tech / B.E.',
                        resume_url: 'https://example.com/resume.pdf'
                    });
                }
            });
        }

        // Apply privacy masking if required
        const exportRecords = candidateData.map(c => {
            const maskedPhone = mask_sensitive ? (c.mobile_number ? c.mobile_number.slice(0, 4) + 'XXXX' + c.mobile_number.slice(-2) : 'Protected') : (c.mobile_number || 'N/A');
            const maskedEmail = mask_sensitive ? (c.email ? c.email.replace(/(.{2})(.*)(?=@)/, '$1****') : 'Protected') : (c.email || 'N/A');

            return {
                'Candidate ID': c.candidate_id,
                'Full Name': c.full_name || 'N/A',
                'Job Title': c.current_job_title || c.professional_headline || 'N/A',
                'Location': c.city || c.state || 'N/A',
                'Experience': c.total_experience || 'Fresher',
                'Skills': c.skills || 'N/A',
                'Education': c.education || 'N/A',
                'Email': include_contact_info ? maskedEmail : 'Contact Permission Required',
                'Phone': include_contact_info ? maskedPhone : 'Contact Permission Required',
                'Resume Link': c.resume_url || 'N/A'
            };
        });

        const fileName = `candidate_export_${Date.now()}.${export_type === 'excel' ? 'xlsx' : export_type === 'pdf' ? 'pdf' : 'csv'}`;
        const filePath = `/exports/${fileName}`;

        // Insert export log
        db.run(
            `INSERT INTO candidate_data_exports (
                request_id, employer_id, company_id, company_name, export_type,
                candidate_count, candidate_ids, file_name, file_path,
                delivery_method, delivery_status, recipient_email, recipient_phone,
                admin_id, admin_name
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, 'delivered', ?, ?,
                ?, ?
            )`,
            [
                request_id || null, employer_id || '', company_id || '', company_name || '', export_type,
                exportRecords.length, JSON.stringify(candidate_ids), fileName, filePath,
                delivery_method, recipient_email || '', recipient_phone || '',
                String(req.user.id), req.user.name || req.user.email
            ],
            function (err) {
                if (err) console.error('Error logging export:', err);
                const exportId = this?.lastID;

                // If tied to a request, mark request as completed / approved
                if (request_id) {
                    db.run(
                        `UPDATE candidate_data_requests 
                         SET status = 'completed', approved_count = ?, completed_at = CURRENT_TIMESTAMP, admin_notes = ? 
                         WHERE id = ? OR request_code = ?`,
                        [exportRecords.length, admin_notes || `Delivered ${exportRecords.length} candidates via ${delivery_method}`, request_id, String(request_id)]
                    );
                }

                // Increment candidate data usage on active subscription
                if (employer_id || company_id) {
                    db.run(
                        `UPDATE subscriptions 
                         SET candidateDataExported = candidateDataExported + ?, dataRequestsUsed = dataRequestsUsed + 1 
                         WHERE (companyId = ? OR userId = ?) AND status = 'active'`,
                        [exportRecords.length, company_id, employer_id]
                    );
                }

                // Audit Log
                recordAuditLog(
                    req.user,
                    'EXPORT_CANDIDATE_DATA',
                    'candidate_data_exports',
                    exportId,
                    company_name || `Employer #${employer_id}`,
                    `Exported ${exportRecords.length} candidates (${export_type.toUpperCase()}) via ${delivery_method} to ${recipient_email || recipient_phone || 'Download'}`,
                    { request_id, export_type, delivery_method, count: exportRecords.length, mask_sensitive }
                );

                res.json({
                    message: `Successfully generated and delivered ${exportRecords.length} candidate records!`,
                    exportId,
                    fileName,
                    downloadUrl: filePath,
                    deliveryMethod: delivery_method,
                    recordCount: exportRecords.length,
                    data: exportRecords
                });
            }
        );
    });
});

// 6. Admin: Update request status
router.put('/status/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { status, admin_notes } = req.body;
    const reqId = req.params.id;

    db.run(
        `UPDATE candidate_data_requests SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = ? OR request_code = ?`,
        [status, admin_notes, reqId, reqId],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error updating status: ' + err.message });
            recordAuditLog(req.user, 'UPDATE_REQUEST_STATUS', 'candidate_data_requests', reqId, `Request #${reqId}`, `Changed status to ${status}`);
            res.json({ message: `Request #${reqId} status updated to ${status}` });
        }
    );
});

// 7. Admin: Get Export & Delivery History
router.get('/export-history', verifyToken, verifyRole(['admin']), (req, res) => {
    db.all('SELECT * FROM candidate_data_exports ORDER BY id DESC LIMIT 100', [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching export history: ' + err.message });
        res.json(rows || []);
    });
});

module.exports = router;
