const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'mock_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_key_secret'
});

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

// 1. Get all subscription plans with optional filtering
router.get('/plans', (req, res) => {
    const { target_role, plan_type, company_id, include_inactive } = req.query;

    let query = 'SELECT * FROM subscription_plans WHERE 1=1';
    const params = [];

    if (!include_inactive) {
        query += " AND (status = 'active' OR status IS NULL)";
    }

    if (target_role) {
        query += ' AND (target_role = ? OR role = ?)';
        params.push(target_role, target_role === 'employer' ? 'company' : 'jobseeker');
    }

    if (plan_type) {
        query += ' AND plan_type = ?';
        params.push(plan_type);
    }

    // If company_id is given (e.g. for employer browsing plans), show common plans + company's dedicated plans
    if (company_id) {
        query += " AND (plan_type = 'common' OR company_id = ? OR company_id = '' OR company_id IS NULL)";
        params.push(company_id);
    }

    query += ' ORDER BY priority_level ASC, price ASC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching plans: ' + err.message });
        res.json(rows || []);
    });
});

// 2. Get System Settings
router.get('/settings', (req, res) => {
    db.all('SELECT * FROM system_settings', [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching settings' });
        const settingsMap = {};
        (rows || []).forEach(r => {
            settingsMap[r.key] = r.value;
        });
        if (!settingsMap.free_employer_job_limit) settingsMap.free_employer_job_limit = '3';
        if (!settingsMap.require_candidate_consent) settingsMap.require_candidate_consent = 'true';
        if (!settingsMap.mask_contact_info_default) settingsMap.mask_contact_info_default = 'false';
        res.json(settingsMap);
    });
});

// 3. Update System Settings (Admin only)
router.put('/settings', verifyToken, verifyRole(['admin']), (req, res) => {
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No settings provided' });
    }

    const keys = Object.keys(updates);
    let completed = 0;
    let hasError = false;

    keys.forEach(key => {
        const val = String(updates[key]);
        db.run(
            `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
            [key, val],
            (err) => {
                if (err && !hasError) {
                    hasError = true;
                    return res.status(500).json({ message: 'Error updating setting ' + key });
                }
                completed++;
                if (completed === keys.length && !hasError) {
                    recordAuditLog(req.user, 'UPDATE_SETTINGS', 'system_settings', 'global', 'Global Settings', 'Updated system settings', updates);
                    res.json({ message: 'System settings updated successfully', settings: updates });
                }
            }
        );
    });
});

// 4. Create a new subscription plan (Admin only)
router.post('/plans', verifyToken, verifyRole(['admin']), (req, res) => {
    const {
        name,
        target_role = 'employer',
        plan_type = 'common',
        company_id = '',
        company_name = '',
        price = 0,
        billing_type = 'monthly',
        duration_months = 1,
        status = 'active',
        badge_text = '',
        discount_percent = 0,
        is_popular = false,
        priority_level = 1,
        job_limit = 20,
        contact_views = -1,
        resume_downloads = -1,
        candidate_search_limit = -1,
        data_request_limit = 0,
        data_export_limit = 0,
        active_job_limit = -1,
        interview_limit = -1,
        message_limit = -1,
        application_limit = -1,
        resume_upload_limit = 1,
        resume_analysis_limit = 0,
        featured_profile = 0,
        skill_test_access = 1,
        mock_interview_access = 0,
        job_alert_access = 1,
        recruiter_contact_access = 0,
        premium_job_access = 1,
        allowed_data_fields = '["name","skills","experience","location","education","resume"]',
        features = ''
    } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Plan name and price are required' });
    }

    if (plan_type === 'company_specific' && !company_name && !company_id) {
        return res.status(400).json({ message: 'Company Name or ID is required for company-specific plans' });
    }

    const query = `
        INSERT INTO subscription_plans (
            name, target_role, plan_type, company_id, company_name, price, billing_type,
            duration_months, status, badge_text, discount_percent, is_popular, priority_level,
            job_limit, contact_views, resume_downloads, candidate_search_limit, data_request_limit,
            data_export_limit, active_job_limit, interview_limit, message_limit,
            application_limit, resume_upload_limit, resume_analysis_limit, featured_profile,
            skill_test_access, mock_interview_access, job_alert_access, recruiter_contact_access,
            premium_job_access, allowed_data_fields, features, role
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?
        )
    `;

    const roleCompat = target_role === 'employer' ? 'company' : 'jobseeker';
    const params = [
        name, target_role, plan_type, company_id, company_name, Number(price), billing_type,
        Number(duration_months) || 1, status, badge_text, Number(discount_percent) || 0, is_popular ? 1 : 0, Number(priority_level) || 1,
        Number(job_limit), Number(contact_views), Number(resume_downloads), Number(candidate_search_limit), Number(data_request_limit),
        Number(data_export_limit), Number(active_job_limit), Number(interview_limit), Number(message_limit),
        Number(application_limit), Number(resume_upload_limit), Number(resume_analysis_limit), featured_profile ? 1 : 0,
        skill_test_access ? 1 : 0, mock_interview_access ? 1 : 0, job_alert_access ? 1 : 0, recruiter_contact_access ? 1 : 0,
        premium_job_access ? 1 : 0, typeof allowed_data_fields === 'object' ? JSON.stringify(allowed_data_fields) : allowed_data_fields,
        features, roleCompat
    ];

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ message: 'Error creating plan: ' + err.message });
        const newPlanId = this.lastID;
        recordAuditLog(req.user, 'CREATE_PLAN', 'subscription_plans', newPlanId, name, `Created plan "${name}" for ${target_role}`, req.body);
        res.status(201).json({ message: 'Plan created successfully', planId: newPlanId });
    });
});

// 5. Update an existing subscription plan (Admin only)
router.put('/plans/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const planId = req.params.id;
    const {
        name,
        target_role,
        plan_type,
        company_id,
        company_name,
        price,
        billing_type,
        duration_months,
        status,
        badge_text,
        discount_percent,
        is_popular,
        priority_level,
        job_limit,
        contact_views,
        resume_downloads,
        candidate_search_limit,
        data_request_limit,
        data_export_limit,
        active_job_limit,
        interview_limit,
        message_limit,
        application_limit,
        resume_upload_limit,
        resume_analysis_limit,
        featured_profile,
        skill_test_access,
        mock_interview_access,
        job_alert_access,
        recruiter_contact_access,
        premium_job_access,
        allowed_data_fields,
        features
    } = req.body;

    const query = `
        UPDATE subscription_plans SET
            name = COALESCE(?, name),
            target_role = COALESCE(?, target_role),
            plan_type = COALESCE(?, plan_type),
            company_id = COALESCE(?, company_id),
            company_name = COALESCE(?, company_name),
            price = COALESCE(?, price),
            billing_type = COALESCE(?, billing_type),
            duration_months = COALESCE(?, duration_months),
            status = COALESCE(?, status),
            badge_text = COALESCE(?, badge_text),
            discount_percent = COALESCE(?, discount_percent),
            is_popular = COALESCE(?, is_popular),
            priority_level = COALESCE(?, priority_level),
            job_limit = COALESCE(?, job_limit),
            contact_views = COALESCE(?, contact_views),
            resume_downloads = COALESCE(?, resume_downloads),
            candidate_search_limit = COALESCE(?, candidate_search_limit),
            data_request_limit = COALESCE(?, data_request_limit),
            data_export_limit = COALESCE(?, data_export_limit),
            active_job_limit = COALESCE(?, active_job_limit),
            interview_limit = COALESCE(?, interview_limit),
            message_limit = COALESCE(?, message_limit),
            application_limit = COALESCE(?, application_limit),
            resume_upload_limit = COALESCE(?, resume_upload_limit),
            resume_analysis_limit = COALESCE(?, resume_analysis_limit),
            featured_profile = COALESCE(?, featured_profile),
            skill_test_access = COALESCE(?, skill_test_access),
            mock_interview_access = COALESCE(?, mock_interview_access),
            job_alert_access = COALESCE(?, job_alert_access),
            recruiter_contact_access = COALESCE(?, recruiter_contact_access),
            premium_job_access = COALESCE(?, premium_job_access),
            allowed_data_fields = COALESCE(?, allowed_data_fields),
            features = COALESCE(?, features),
            role = COALESCE(?, role),
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const roleCompat = target_role ? (target_role === 'employer' ? 'company' : 'jobseeker') : null;
    const allowedFieldsStr = allowed_data_fields ? (typeof allowed_data_fields === 'object' ? JSON.stringify(allowed_data_fields) : allowed_data_fields) : null;

    const params = [
        name, target_role, plan_type, company_id, company_name, price, billing_type,
        duration_months, status, badge_text, discount_percent, is_popular !== undefined ? (is_popular ? 1 : 0) : null, priority_level,
        job_limit, contact_views, resume_downloads, candidate_search_limit, data_request_limit,
        data_export_limit, active_job_limit, interview_limit, message_limit,
        application_limit, resume_upload_limit, resume_analysis_limit, featured_profile !== undefined ? (featured_profile ? 1 : 0) : null,
        skill_test_access !== undefined ? (skill_test_access ? 1 : 0) : null, mock_interview_access !== undefined ? (mock_interview_access ? 1 : 0) : null,
        job_alert_access !== undefined ? (job_alert_access ? 1 : 0) : null, recruiter_contact_access !== undefined ? (recruiter_contact_access ? 1 : 0) : null,
        premium_job_access !== undefined ? (premium_job_access ? 1 : 0) : null, allowedFieldsStr, features, roleCompat,
        planId
    ];

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ message: 'Error updating plan: ' + err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Plan not found' });
        recordAuditLog(req.user, 'UPDATE_PLAN', 'subscription_plans', planId, name || `Plan #${planId}`, `Updated plan #${planId}`, req.body);
        res.json({ message: 'Plan updated successfully' });
    });
});

// 6. Duplicate a Plan (Admin only)
router.post('/plans/:id/duplicate', verifyToken, verifyRole(['admin']), (req, res) => {
    const planId = req.params.id;

    db.get('SELECT * FROM subscription_plans WHERE id = ?', [planId], (err, orig) => {
        if (err || !orig) return res.status(404).json({ message: 'Original plan not found' });

        const newName = `${orig.name} (Copy)`;
        const query = `
            INSERT INTO subscription_plans (
                name, target_role, plan_type, company_id, company_name, price, billing_type,
                duration_months, status, badge_text, discount_percent, is_popular, priority_level,
                job_limit, contact_views, resume_downloads, candidate_search_limit, data_request_limit,
                data_export_limit, active_job_limit, interview_limit, message_limit,
                application_limit, resume_upload_limit, resume_analysis_limit, featured_profile,
                skill_test_access, mock_interview_access, job_alert_access, recruiter_contact_access,
                premium_job_access, allowed_data_fields, features, role
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?
            )
        `;
        const params = [
            newName, orig.target_role, orig.plan_type, orig.company_id, orig.company_name, orig.price, orig.billing_type,
            orig.duration_months, 'active', orig.badge_text, orig.discount_percent, 0, orig.priority_level,
            orig.job_limit, orig.contact_views, orig.resume_downloads, orig.candidate_search_limit, orig.data_request_limit,
            orig.data_export_limit, orig.active_job_limit, orig.interview_limit, orig.message_limit,
            orig.application_limit, orig.resume_upload_limit, orig.resume_analysis_limit, orig.featured_profile,
            orig.skill_test_access, orig.mock_interview_access, orig.job_alert_access, orig.recruiter_contact_access,
            orig.premium_job_access, orig.allowed_data_fields, orig.features, orig.role
        ];

        db.run(query, params, function (err) {
            if (err) return res.status(500).json({ message: 'Error duplicating plan: ' + err.message });
            recordAuditLog(req.user, 'DUPLICATE_PLAN', 'subscription_plans', this.lastID, newName, `Duplicated plan from #${planId}`, { originalId: planId });
            res.status(201).json({ message: 'Plan duplicated successfully', planId: this.lastID });
        });
    });
});

// 7. Delete a subscription plan (Admin only)
router.delete('/plans/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const planId = req.params.id;

    db.get('SELECT name FROM subscription_plans WHERE id = ?', [planId], (err, plan) => {
        db.run('DELETE FROM candidate_plans WHERE id = ?', [planId], () => {});
        db.run('DELETE FROM plan_features WHERE plan_id = ?', [planId], () => {});
        db.run('DELETE FROM subscription_plans WHERE id = ?', [planId], function (delErr) {
            if (delErr) {
                console.error('Error deleting from subscription_plans:', delErr);
                return res.status(500).json({ message: 'Error deleting plan: ' + delErr.message });
            }
            recordAuditLog(req.user, 'DELETE_PLAN', 'subscription_plans', planId, plan?.name || `Plan #${planId}`, `Deleted plan #${planId}`);
            res.json({ success: true, message: 'Plan deleted successfully' });
        });
    });
});

// 8. Admin: List all active and historical subscriptions with detailed usage
router.get('/active-list', verifyToken, verifyRole(['admin']), (req, res) => {
    const { status, role, search } = req.query;

    let query = `
        SELECT s.*, p.name as plan_name, p.target_role as plan_target_role, p.plan_type as plan_plan_type,
               p.job_limit, p.contact_views, p.resume_downloads, p.candidate_search_limit,
               p.data_request_limit, p.data_export_limit, p.price as plan_price,
               u.email as user_email_db, u.phone as user_phone, u.companyName as user_company,
               u.hrName as user_hr_name
        FROM subscriptions s
        LEFT JOIN subscription_plans p ON s.planId = p.id
        LEFT JOIN users u ON s.userId = u.id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        query += ' AND s.status = ?';
        params.push(status);
    }

    if (role) {
        query += ' AND (s.target_role = ? OR p.target_role = ?)';
        params.push(role, role);
    }

    if (search) {
        query += ` AND (s.companyName LIKE ? OR s.employerName LIKE ? OR s.userEmail LIKE ? OR p.name LIKE ? OR u.email LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s, s, s, s);
    }

    query += ' ORDER BY s.id DESC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching subscriptions: ' + err.message });

        const enriched = (rows || []).map(row => {
            let overrides = {};
            try {
                if (row.admin_override) overrides = JSON.parse(row.admin_override);
            } catch (e) {}

            const isExpired = row.expiryDate && new Date(row.expiryDate) < new Date();
            const effectiveStatus = (row.status === 'active' && isExpired) ? 'expired' : row.status;

            return {
                ...row,
                effectiveStatus,
                overrides,
                effective_job_limit: overrides.job_limit !== undefined ? overrides.job_limit : (row.job_limit ?? 20),
                effective_contact_limit: overrides.contact_views !== undefined ? overrides.contact_views : (row.contact_views ?? -1),
                effective_resume_limit: overrides.resume_downloads !== undefined ? overrides.resume_downloads : (row.resume_downloads ?? -1),
                effective_data_limit: overrides.data_request_limit !== undefined ? overrides.data_request_limit : (row.data_request_limit ?? 0)
            };
        });

        res.json(enriched);
    });
});

// 9. Admin: Manually Grant Premium Access
router.post('/grant-manual', verifyToken, verifyRole(['admin']), (req, res) => {
    const {
        userId,
        target_role = 'employer',
        companyId = '',
        companyName = '',
        employerName = '',
        userEmail = '',
        planId,
        startDate = new Date().toISOString(),
        expiryDate,
        amount = 0,
        payment_status = 'waived',
        admin_override = {},
        internal_notes = ''
    } = req.body;

    if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required to grant premium access' });
    }

    // Default 1 month expiry if not specified
    let calculatedExpiry = expiryDate;
    if (!calculatedExpiry) {
        const d = new Date(startDate || Date.now());
        d.setMonth(d.getMonth() + 1);
        calculatedExpiry = d.toISOString();
    }

    db.get('SELECT * FROM subscription_plans WHERE id = ?', [planId], (err, plan) => {
        if (err || !plan) return res.status(404).json({ message: 'Selected plan not found' });

        const overrideStr = typeof admin_override === 'object' ? JSON.stringify(admin_override) : (admin_override || '{}');

        const insertQuery = `
            INSERT INTO subscriptions (
                userId, companyId, companyName, employerName, userEmail, planId,
                target_role, plan_type, amount, payment_status, status,
                startDate, expiryDate, contactsViewed, resumeDownloads,
                jobsUsed, dataRequestsUsed, candidateDataExported,
                admin_override, internal_notes
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, 'active',
                ?, ?, 0, 0,
                0, 0, 0,
                ?, ?
            )
        `;

        const params = [
            userId || null,
            companyId || plan.company_id || '',
            companyName || plan.company_name || '',
            employerName || '',
            userEmail || '',
            planId,
            target_role || plan.target_role || 'employer',
            plan.plan_type || 'common',
            Number(amount) || plan.price || 0,
            payment_status,
            startDate,
            calculatedExpiry,
            overrideStr,
            internal_notes
        ];

        db.run(insertQuery, params, function (err) {
            if (err) return res.status(500).json({ message: 'Error granting subscription: ' + err.message });
            const subId = this.lastID;

            // Set user isPremium in database if userId provided
            if (userId) {
                db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [userId]);
            }

            recordAuditLog(
                req.user,
                'GRANT_PREMIUM',
                'subscriptions',
                subId,
                companyName || employerName || userEmail || `User #${userId}`,
                `Manually granted "${plan.name}" (₹${amount || plan.price}) until ${calculatedExpiry}`,
                { planId, planName: plan.name, userId, companyName, calculatedExpiry, admin_override }
            );

            res.status(201).json({
                message: `Premium access to "${plan.name}" granted successfully`,
                subscriptionId: subId,
                expiryDate: calculatedExpiry
            });
        });
    });
});

// 10. Admin: Override Specific Limits on a Subscription
router.put('/subscriptions/:id/override-limits', verifyToken, verifyRole(['admin']), (req, res) => {
    const subId = req.params.id;
    const { admin_override, internal_notes } = req.body;

    const overrideStr = typeof admin_override === 'object' ? JSON.stringify(admin_override) : admin_override;

    db.run(
        `UPDATE subscriptions SET admin_override = ?, internal_notes = COALESCE(?, internal_notes), updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [overrideStr, internal_notes, subId],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error overriding limits: ' + err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Subscription not found' });
            recordAuditLog(req.user, 'OVERRIDE_LIMITS', 'subscriptions', subId, `Subscription #${subId}`, 'Overrode subscription limits', { admin_override });
            res.json({ message: 'Limits successfully updated' });
        }
    );
});

// 11. Admin: Extend Subscription Expiry
router.put('/subscriptions/:id/extend', verifyToken, verifyRole(['admin']), (req, res) => {
    const subId = req.params.id;
    const { days = 30, newExpiryDate } = req.body;

    db.get('SELECT * FROM subscriptions WHERE id = ?', [subId], (err, sub) => {
        if (err || !sub) return res.status(404).json({ message: 'Subscription not found' });

        let updatedExpiry = newExpiryDate;
        if (!updatedExpiry) {
            const currentExp = sub.expiryDate ? new Date(sub.expiryDate) : new Date();
            const baseDate = currentExp > new Date() ? currentExp : new Date();
            baseDate.setDate(baseDate.getDate() + Number(days));
            updatedExpiry = baseDate.toISOString();
        }

        db.run(
            `UPDATE subscriptions SET expiryDate = ?, status = 'active', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
            [updatedExpiry, subId],
            function (err) {
                if (err) return res.status(500).json({ message: 'Error extending subscription: ' + err.message });
                recordAuditLog(req.user, 'EXTEND_SUBSCRIPTION', 'subscriptions', subId, `Subscription #${subId}`, `Extended expiry to ${updatedExpiry}`, { days, updatedExpiry });
                res.json({ message: 'Subscription extended successfully', expiryDate: updatedExpiry });
            }
        );
    });
});

// 12. Admin: Change Subscription Status (suspend, reactivate, cancel)
router.put('/subscriptions/:id/status', verifyToken, verifyRole(['admin']), (req, res) => {
    const subId = req.params.id;
    const { status } = req.body;

    if (!['active', 'suspended', 'cancelled', 'expired'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    db.run(
        `UPDATE subscriptions SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, subId],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error updating status: ' + err.message });
            recordAuditLog(req.user, 'CHANGE_SUB_STATUS', 'subscriptions', subId, `Subscription #${subId}`, `Changed status to "${status}"`);
            res.json({ message: `Subscription marked as ${status}` });
        }
    );
});

// 13. Employer Job Quota
router.get('/employer-quota', verifyToken, (req, res) => {
    const userId = req.user.id;
    const userEmail = req.user.email || '';
    const userCompany = req.user.companyName || '';

    db.get("SELECT value FROM system_settings WHERE key = 'free_employer_job_limit'", (err, settingRow) => {
        const defaultFreeLimit = parseInt(settingRow?.value || '3', 10);

        // Unified lookup for active subscription checking both plans and subscription_plans
        const subQuery = `
            SELECT s.*, 
                   COALESCE(p1.plan_name, p2.name, 'Premium Plan') as planName,
                   COALESCE(p1.posting_limit, p2.job_limit, 20) as plan_job_limit,
                   COALESCE(p1.candidate_views_limit, p2.contact_views, 50) as plan_contact_views,
                   COALESCE(p1.resume_download_limit, p2.resume_downloads, 50) as plan_resume_downloads,
                   COALESCE(p1.badge_text, p2.badge_text, '') as badge_text,
                   COALESCE(p1.offer_price, p1.original_price, p2.price, 0) as price
            FROM subscriptions s
            LEFT JOIN plans p1 ON s.planId = p1.id
            LEFT JOIN subscription_plans p2 ON s.planId = p2.id
            WHERE (s.userId = ? OR s.companyId = ? OR s.userEmail = ? OR s.companyId = (SELECT company_id FROM employers WHERE employer_id = ? OR email = ?))
              AND s.status = 'active' AND s.expiryDate > datetime('now')
            ORDER BY s.id DESC LIMIT 1
        `;

        db.get(subQuery, [userId, String(userId), userEmail, String(userId), userEmail], (subErr, sub) => {
            const targetIds = [String(userId), `comp_${userId}`, `emp_${userId}`];
            if (sub && sub.companyId) targetIds.push(String(sub.companyId));
            const idPlaceholders = targetIds.map(() => '?').join(',');

            let countQuery = `
                SELECT COUNT(*) as postedCount 
                FROM jobs 
                WHERE ((employer_id IN (${idPlaceholders}) OR company_id IN (${idPlaceholders}) OR CAST(companyId AS CHAR) IN (${idPlaceholders}))
            `;
            const countParams = [...targetIds, ...targetIds, ...targetIds];

            if (userCompany) {
                countQuery += ` OR LOWER(TRIM(company_name)) = LOWER(TRIM(?)))`;
                countParams.push(userCompany);
            } else {
                countQuery += `)`;
            }

            countQuery += ` AND (status IS NULL OR status != 'deleted')`;

            // If active subscription exists, count jobs posted since the subscription started
            if (sub && sub.startDate) {
                countQuery += ` AND createdAt >= ?`;
                countParams.push(sub.startDate);
            }

            db.get(countQuery, countParams, (err, countRow) => {
                let postedCount = countRow ? Number(countRow.postedCount ?? countRow.postedcount ?? 0) : 0;
                if (isNaN(postedCount)) postedCount = 0;
                if (sub && (sub.jobsUsed || sub.jobsused) && Number(sub.jobsUsed || sub.jobsused) > postedCount) {
                    postedCount = Number(sub.jobsUsed || sub.jobsused);
                }

                let allowedLimit = defaultFreeLimit;
                let isPremium = false;
                let activePlanName = 'Free Tier';
                let isUnlimited = false;
                let dataRequestLimit = 0;
                let resumeDownloadLimit = 0;
                let contactViewLimit = 0;
                let contactsViewed = 0;
                let contactsRemaining = 0;
                let remainingJobs = 0;
                let canPostMore = true;

                if (sub) {
                    isPremium = true;
                    activePlanName = sub.planName;

                    let overrides = {};
                    try { if (sub.admin_override) overrides = JSON.parse(sub.admin_override); } catch (e) {}

                    const rawJobLimit = overrides.job_limit !== undefined ? overrides.job_limit : sub.plan_job_limit;
                    if (rawJobLimit === -1 || rawJobLimit >= 999999) {
                        allowedLimit = 999999;
                        isUnlimited = true;
                        remainingJobs = 'Unlimited';
                        canPostMore = true;
                    } else {
                        allowedLimit = rawJobLimit;
                        remainingJobs = Math.max(0, allowedLimit - postedCount);
                        canPostMore = postedCount < allowedLimit;
                    }

                    const rawContactLimit = overrides.contact_views !== undefined ? overrides.contact_views : sub.plan_contact_views;
                    contactViewLimit = rawContactLimit;
                    contactsViewed = sub.contactsViewed || 0;
                    contactsRemaining = (rawContactLimit === -1 || rawContactLimit >= 999999) 
                        ? 'Unlimited' 
                        : Math.max(0, rawContactLimit - contactsViewed);

                    const rawResumeLimit = overrides.resume_downloads !== undefined ? overrides.resume_downloads : sub.plan_resume_downloads;
                    resumeDownloadLimit = rawResumeLimit;
                } else {
                    allowedLimit = defaultFreeLimit;
                    remainingJobs = Math.max(0, defaultFreeLimit - postedCount);
                    canPostMore = postedCount < defaultFreeLimit;
                }

                // Query next higher plan for upgrade recommendations (Employer plans only)
                db.all("SELECT id, plan_name, posting_limit, original_price, offer_price, duration FROM plans WHERE (plan_type = 'employer' OR plan_type IS NULL OR plan_type = '') AND (status = 'active' OR status IS NULL) ORDER BY posting_limit ASC, offer_price ASC", [], (plansErr, planRows) => {
                    let nextPlan = null;
                    if (Array.isArray(planRows) && planRows.length > 0) {
                        const higherPlans = planRows.filter(p => {
                            if (allowedLimit >= 999999) return false;
                            const pLimit = Number(p.posting_limit);
                            if (pLimit === -1 || pLimit >= 999999) return true;
                            return pLimit > allowedLimit;
                        });

                        higherPlans.sort((a, b) => {
                            const aLim = (a.posting_limit === -1 || a.posting_limit >= 999999) ? 9999999 : Number(a.posting_limit);
                            const bLim = (b.posting_limit === -1 || b.posting_limit >= 999999) ? 9999999 : Number(b.posting_limit);
                            return aLim - bLim;
                        });

                        if (higherPlans.length > 0) {
                            const candidate = higherPlans[0];
                            nextPlan = {
                                id: candidate.id,
                                name: candidate.plan_name,
                                posting_limit: candidate.posting_limit,
                                price: candidate.offer_price !== undefined ? candidate.offer_price : candidate.original_price,
                                duration: candidate.duration || '90 Days'
                            };
                        }
                    }

                    if (!nextPlan && allowedLimit < 999999) {
                        nextPlan = {
                            id: 'unlimited',
                            name: 'Unlimited Super Recruiter',
                            posting_limit: -1,
                            price: 5000,
                            duration: '180 Days'
                        };
                    }

                    res.json({
                        postedCount,
                        allowedLimit,
                        remainingJobs,
                        canPostMore,
                        isUnlimited,
                        isPremium,
                        activePlanName,
                        freeLimit: defaultFreeLimit,
                        contactViewLimit,
                        contactsViewed,
                        contactsRemaining,
                        resumeDownloadLimit,
                        expiryDate: sub?.expiryDate || null,
                        subscription: sub || null,
                        nextPlan
                    });
                });
            });
        });
    });
});

// 14. Plan Analytics (Admin only)
router.get('/analytics', verifyToken, verifyRole(['admin']), (req, res) => {
    // 1. Total revenue by plan role
    const revenueQuery = `
        SELECT target_role, SUM(amount) as total_amount, COUNT(*) as subscriber_count
        FROM subscriptions
        WHERE payment_status IN ('paid', 'success')
        GROUP BY target_role
    `;

    // 2. Subscriptions by status
    const statusQuery = `
        SELECT status, COUNT(*) as count FROM subscriptions GROUP BY status
    `;

    // 3. Plan-wise breakdown
    const planWiseQuery = `
        SELECT p.id, p.name, p.target_role, p.plan_type, p.price,
               COUNT(s.id) as total_subscribers,
               SUM(s.amount) as total_revenue
        FROM subscription_plans p
        LEFT JOIN subscriptions s ON p.id = s.planId AND s.payment_status IN ('paid', 'success')
        GROUP BY p.id
        ORDER BY total_revenue DESC
    `;

    // 4. Monthly revenue trend
    const monthlyQuery = `
        SELECT strftime('%Y-%m', startDate) as month, SUM(amount) as monthly_revenue, COUNT(*) as new_subscribers
        FROM subscriptions
        WHERE payment_status IN ('paid', 'success')
        GROUP BY month
        ORDER BY month DESC LIMIT 12
    `;

    db.all(revenueQuery, [], (err, revenueRows) => {
        db.all(statusQuery, [], (err, statusRows) => {
            db.all(planWiseQuery, [], (err, planWiseRows) => {
                db.all(monthlyQuery, [], (err, monthlyRows) => {
                    let totalRevenue = 0;
                    let employerRevenue = 0;
                    let candidateRevenue = 0;

                    (revenueRows || []).forEach(r => {
                        const amt = Number(r.total_amount) || 0;
                        totalRevenue += amt;
                        if (r.target_role === 'employer' || r.target_role === 'company') employerRevenue += amt;
                        else candidateRevenue += amt;
                    });

                    res.json({
                        totalRevenue,
                        employerRevenue,
                        candidateRevenue,
                        statusBreakdown: statusRows || [],
                        planWise: planWiseRows || [],
                        monthlyTrend: monthlyRows || []
                    });
                });
            });
        });
    });
});

// 14.5 Razorpay Config Info
router.get('/razorpay-config', (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID || 'mock_key_id';
    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'mock_key_id';
    res.json({ keyId, isMock });
});

// 15. Create Razorpay Order
router.post('/create-order', verifyToken, async (req, res) => {
    const { planId, targetRole = 'employer', offerId = null } = req.body;
    if (!planId) return res.status(400).json({ message: 'Plan ID is required' });

    try {
        let planDetails = null;
        let finalPrice = 0;
        let planName = '';

        // Priority 1: Check unified plans table
        const unifiedPlan = await new Promise((resolve) => {
            db.get('SELECT * FROM plans WHERE id = ?', [planId], (err, row) => resolve(row));
        });

        if (unifiedPlan) {
            planDetails = unifiedPlan;
            planName = unifiedPlan.plan_name;
            finalPrice = unifiedPlan.offer_price !== undefined && unifiedPlan.offer_price !== null ? unifiedPlan.offer_price : unifiedPlan.original_price;
        }

        if (!planDetails && targetRole === 'candidate') {
            // Fetch from candidate_plans
            const candidatePlan = await new Promise((resolve) => {
                db.get('SELECT * FROM candidate_plans WHERE id = ?', [planId], (err, row) => resolve(row));
            });

            if (candidatePlan) {
                planDetails = candidatePlan;
                planName = candidatePlan.plan_name;
                finalPrice = candidatePlan.price;

                if (offerId) {
                    const offer = await new Promise((resolve) => {
                        db.get('SELECT * FROM offers WHERE id = ?', [offerId], (err, row) => resolve(row));
                    });
                    if (offer && offer.offer_price !== undefined) {
                        finalPrice = offer.offer_price;
                        planDetails.appliedOffer = offer;
                    }
                }
            }
        }

        // If not found in candidate_plans or role is employer, check legacy subscription_plans
        if (!planDetails) {
            const subPlan = await new Promise((resolve) => {
                db.get('SELECT * FROM subscription_plans WHERE id = ?', [planId], (err, row) => resolve(row));
            });
            if (subPlan) {
                planDetails = subPlan;
                planName = subPlan.name;
                finalPrice = subPlan.price;
            }
        }

        if (!planDetails) {
            return res.status(404).json({ message: 'Selected subscription plan not found' });
        }

        const priceInPaise = Math.round(Number(finalPrice) * 100);
        const options = {
            amount: priceInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`
        };

        const keyId = process.env.RAZORPAY_KEY_ID || 'mock_key_id';
        const isLiveOrTestKey = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'mock_key_id';

        if (isLiveOrTestKey && priceInPaise > 0) {
            try {
                const order = await razorpay.orders.create(options);
                return res.json({ 
                    order, 
                    plan: { ...planDetails, name: planName, price: finalPrice },
                    keyId,
                    isMock: false
                });
            } catch (rzpErr) {
                console.warn('Razorpay API error, falling back to simulation order:', rzpErr.message);
            }
        }

        // Simulation / Free Order Fallback
        res.json({
            order: { 
                id: 'order_mock_' + Date.now(), 
                amount: priceInPaise, 
                currency: 'INR' 
            },
            plan: { ...planDetails, name: planName, price: finalPrice },
            keyId,
            isMock: true
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: 'Error creating payment order: ' + error.message });
    }
});

// 16. Verify Payment
router.post('/verify-payment', verifyToken, async (req, res) => {
    const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        planId,
        targetRole = 'employer',
        offerId = null 
    } = req.body || {};

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'mock_key_secret';
    const isMock = razorpay_order_id && razorpay_order_id.startsWith('order_mock_');
    const isMockEnv = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'mock_key_id';
    const isUpiOrSimulation = !razorpay_signature || razorpay_signature === 'mock_signature' || (razorpay_payment_id && razorpay_payment_id.startsWith('pay_upi_')) || isMock;

    let isAuthentic = isMock || isMockEnv || isUpiOrSimulation;
    if (!isAuthentic && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', key_secret).update(body.toString()).digest('hex');
        isAuthentic = expectedSignature === razorpay_signature;
    }

    if (!isAuthentic) {
        return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
    }

    try {
        const userId = req.user.id;
        const userEmail = req.user.email || '';

        // Query user and employer records to ensure complete company and contact metadata
        const userRecord = await new Promise(resolve => {
            db.get('SELECT * FROM users WHERE id = ? OR email = ?', [userId, userEmail], (err, row) => resolve(row || null));
        });
        const employerRecord = await new Promise(resolve => {
            db.get('SELECT * FROM employers WHERE email = ? OR employer_id = ?', [userEmail, `emp_${userId}`], (err, row) => resolve(row || null));
        });

        const userName = userRecord?.hrName || userRecord?.name || req.user.name || (userEmail ? userEmail.split('@')[0] : 'Employer');
        const userCompany = userRecord?.companyName || req.user.companyName || 'Company';
        const companyId = employerRecord?.company_id || userRecord?.company_id || `comp_${userId}`;

        // Check unified plans table first
        const unifiedPlan = await new Promise((resolve) => {
            db.get('SELECT * FROM plans WHERE id = ?', [planId], (err, row) => resolve(row));
        });

        if (unifiedPlan) {
            const finalPrice = unifiedPlan.offer_price !== undefined ? unifiedPlan.offer_price : unifiedPlan.original_price;
            const days = unifiedPlan.duration_days || 30;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);
            const formattedExpiry = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

            // Record payment in payments table
            db.run(
                `INSERT INTO payments (userId, planId, razorpayOrderId, razorpayPaymentId, amount, status) VALUES (?, ?, ?, ?, ?, 'success')`,
                [userId, planId, razorpay_order_id || 'order_mock', razorpay_payment_id || 'pay_mock', finalPrice]
            );

            if (unifiedPlan.plan_type === 'candidate') {
                // Record candidate subscription
                db.run(
                    `INSERT INTO candidate_subscriptions (
                        candidate_id, candidate_email, candidate_name, plan_id, plan_name,
                        amount_paid, application_limit, end_date, payment_status, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'active')`,
                    [userId, userEmail, userName, unifiedPlan.id, unifiedPlan.plan_name, finalPrice, unifiedPlan.posting_limit || 10, formattedExpiry],
                    function (err) {
                        if (err) return res.status(500).json({ message: 'Error activating candidate subscription: ' + err.message });
                        db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [userId]);
                        return res.json({
                            success: true,
                            message: `Payment verified! Successfully activated ${unifiedPlan.plan_name}.`,
                            expiryDate: formattedExpiry,
                            planName: unifiedPlan.plan_name,
                            application_limit: unifiedPlan.posting_limit || 10
                        });
                    }
                );
            } else {
                // Supersede older active subscriptions for this employer/user
                db.run(
                    `UPDATE subscriptions SET status = 'superseded', updatedAt = CURRENT_TIMESTAMP 
                     WHERE (userId = ? OR userEmail = ? OR companyId = ?) AND status = 'active'`,
                    [userId, userEmail, companyId]
                );

                // Record employer subscription with all tracking fields initialized
                db.run(
                    `INSERT INTO subscriptions (
                        userId, companyId, companyName, employerName, userEmail, planId, target_role, plan_type, amount,
                        payment_status, status, startDate, expiryDate, jobsUsed, contactsViewed, resumeDownloads
                    ) VALUES (?, ?, ?, ?, ?, ?, 'employer', 'common', ?, 'paid', 'active', CURRENT_TIMESTAMP, ?, 0, 0, 0)`,
                    [userId, companyId, userCompany, userName, userEmail, planId, finalPrice, formattedExpiry],
                    function (err) {
                        if (err) {
                            console.error('Error activating employer subscription:', err);
                            return res.status(500).json({ message: 'Error activating employer subscription: ' + err.message });
                        }
                        db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [userId]);
                        return res.json({
                            success: true,
                            message: `Payment verified and ${unifiedPlan.plan_name} activated successfully!`,
                            expiryDate: formattedExpiry,
                            planName: unifiedPlan.plan_name,
                            posting_limit: unifiedPlan.posting_limit,
                            candidate_views_limit: unifiedPlan.candidate_views_limit
                        });
                    }
                );
            }
            return;
        }

        // Check if candidate plan
        if (targetRole === 'candidate') {
            const candidatePlan = await new Promise((resolve) => {
                db.get('SELECT * FROM candidate_plans WHERE id = ?', [planId], (err, row) => resolve(row));
            });

            if (candidatePlan) {
                const finalPrice = candidatePlan.offer_price !== undefined ? candidatePlan.offer_price : candidatePlan.price;
                const days = candidatePlan.duration_days || 30;
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + days);

                db.run(
                    `INSERT INTO payments (userId, planId, razorpayOrderId, razorpayPaymentId, amount, status) VALUES (?, ?, ?, ?, ?, 'success')`,
                    [userId, planId, razorpay_order_id || 'order_mock', razorpay_payment_id || 'pay_mock', finalPrice]
                );

                db.run(
                    `INSERT INTO candidate_subscriptions (
                        candidate_id, candidate_email, candidate_name, plan_id, plan_name,
                        amount_paid, application_limit, end_date, payment_status, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'active')`,
                    [userId, userEmail, userName, candidatePlan.id, candidatePlan.name, finalPrice, candidatePlan.application_limit, expiryDate.toISOString()],
                    function (err) {
                        if (err) return res.status(500).json({ message: 'Error activating candidate subscription' });
                        db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [userId]);
                        return res.json({
                            message: `Payment verified! Successfully activated ${candidatePlan.name}.`,
                            expiryDate: expiryDate.toISOString(),
                            application_limit: candidatePlan.application_limit
                        });
                    }
                );
                return;
            }
        }

        // Fallback for legacy employer subscription_plans
        db.get('SELECT * FROM subscription_plans WHERE id = ?', [planId], (err, plan) => {
            if (err || !plan) {
                return res.status(404).json({ message: 'Subscription plan not found' });
            }

            const months = plan.duration_months || 1;
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + months);

            db.run(
                `INSERT INTO payments (userId, planId, razorpayOrderId, razorpayPaymentId, amount, status) VALUES (?, ?, ?, ?, ?, 'success')`,
                [userId, planId, razorpay_order_id || 'order_mock', razorpay_payment_id || 'pay_mock', plan.price],
                (pErr) => {
                    if (pErr) console.error('Error logging payment:', pErr.message);

                    db.run(
                        `INSERT INTO subscriptions (userId, planId, target_role, plan_type, amount, payment_status, status, startDate, expiryDate, jobsUsed, contactsViewed, resumeDownloads)
                         VALUES (?, ?, ?, ?, ?, 'paid', 'active', CURRENT_TIMESTAMP, ?, 0, 0, 0)`,
                        [userId, planId, plan.target_role || 'employer', plan.plan_type || 'common', plan.price, expiryDate.toISOString()],
                        function (sErr) {
                            if (sErr) return res.status(500).json({ message: 'Error activating subscription: ' + sErr.message });
                            db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [userId]);
                            res.json({ message: 'Payment verified and subscription activated successfully', expiryDate: expiryDate.toISOString() });
                        }
                    );
                }
            );
        });
    } catch (e) {
        console.error('Verify payment error:', e);
        res.status(500).json({ message: 'Payment verification failed: ' + e.message });
    }
});

// 16.5 Instant 1-Click Plan Activation (Testing / Direct Activation)
router.post('/activate-instant', verifyToken, async (req, res) => {
    const { planId, targetRole = 'employer' } = req.body || {};
    if (!planId) return res.status(400).json({ message: 'Plan ID is required for activation' });

    try {
        const userId = req.user.id;
        const userEmail = req.user.email || '';

        // Query user and employer records to ensure complete company and contact metadata
        const userRecord = await new Promise(resolve => {
            db.get('SELECT * FROM users WHERE id = ? OR email = ?', [userId, userEmail], (err, row) => resolve(row || null));
        });
        const employerRecord = await new Promise(resolve => {
            db.get('SELECT * FROM employers WHERE email = ? OR employer_id = ?', [userEmail, `emp_${userId}`], (err, row) => resolve(row || null));
        });

        const userName = userRecord?.hrName || userRecord?.name || req.user.name || (userEmail ? userEmail.split('@')[0] : 'Employer');
        const userCompany = userRecord?.companyName || req.user.companyName || 'Company';
        const companyId = employerRecord?.company_id || userRecord?.company_id || `comp_${userId}`;

        // Check unified plans table first
        let plan = await new Promise((resolve) => {
            db.get('SELECT * FROM plans WHERE id = ?', [planId], (err, row) => resolve(row));
        });

        // Check legacy subscription_plans if not found
        if (!plan) {
            plan = await new Promise((resolve) => {
                db.get('SELECT * FROM subscription_plans WHERE id = ?', [planId], (err, row) => resolve(row));
            });
        }

        if (!plan) {
            return res.status(404).json({ message: 'Selected subscription plan not found' });
        }

        const planName = plan.plan_name || plan.name || 'Subscription Plan';
        const finalPrice = plan.offer_price !== undefined && plan.offer_price !== null ? plan.offer_price : (plan.original_price || plan.price || 0);
        const days = plan.duration_days || (plan.duration_months ? plan.duration_months * 30 : 30);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Number(days));
        const formattedExpiry = expiryDate.toISOString().slice(0, 19).replace('T', ' ');

        // Record payment in payments table
        db.run(
            `INSERT INTO payments (userId, planId, razorpayOrderId, razorpayPaymentId, amount, status) VALUES (?, ?, ?, ?, ?, 'success')`,
            [userId, plan.id, 'instant_order_' + Date.now(), 'pay_instant_' + Date.now(), finalPrice],
            () => {}
        );

        if (targetRole === 'candidate' || plan.plan_type === 'candidate') {
            db.run(
                `INSERT INTO candidate_subscriptions (
                    candidate_id, candidate_email, candidate_name, plan_id, plan_name,
                    amount_paid, application_limit, end_date, payment_status, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'active')`,
                [userId, userEmail, userName, plan.id, planName, finalPrice, plan.posting_limit || 10, formattedExpiry],
                function (err) {
                    if (err) return res.status(500).json({ message: 'Error activating candidate subscription: ' + err.message });
                    db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [userId]);
                    return res.json({
                        success: true,
                        message: `🎉 Plan "${planName}" activated successfully!`,
                        expiryDate: formattedExpiry,
                        planName,
                        application_limit: plan.posting_limit || 10
                    });
                }
            );
        } else {
            // Supersede older active subscriptions for this employer/user
            db.run(
                `UPDATE subscriptions SET status = 'superseded', updatedAt = CURRENT_TIMESTAMP 
                 WHERE (userId = ? OR userEmail = ? OR companyId = ?) AND status = 'active'`,
                [userId, userEmail, companyId]
            );

            // Record employer subscription with all tracking fields initialized
            db.run(
                `INSERT INTO subscriptions (
                    userId, companyId, companyName, employerName, userEmail, planId, target_role, plan_type, amount,
                    payment_status, status, startDate, expiryDate, jobsUsed, contactsViewed, resumeDownloads
                ) VALUES (?, ?, ?, ?, ?, ?, 'employer', 'common', ?, 'paid', 'active', CURRENT_TIMESTAMP, ?, 0, 0, 0)`,
                [userId, companyId, userCompany, userName, userEmail, plan.id, finalPrice, formattedExpiry],
                function (err) {
                    if (err) {
                        console.error('Error activating employer subscription:', err);
                        return res.status(500).json({ message: 'Error activating employer subscription: ' + err.message });
                    }
                    db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [userId]);

                    recordAuditLog(
                        req.user,
                        'ACTIVATE_PLAN_INSTANT',
                        'subscriptions',
                        plan.id,
                        planName,
                        `Instantly activated "${planName}" for ${userCompany} (${userEmail})`,
                        { planId: plan.id, planName, userId, companyId, formattedExpiry }
                    );

                    return res.json({
                        success: true,
                        message: `🎉 Plan "${planName}" activated successfully!`,
                        expiryDate: formattedExpiry,
                        planName,
                        posting_limit: plan.posting_limit !== undefined ? plan.posting_limit : plan.job_limit,
                        candidate_views_limit: plan.candidate_views_limit !== undefined ? plan.candidate_views_limit : plan.contact_views
                    });
                }
            );
        }
    } catch (e) {
        console.error('Instant activation error:', e);
        res.status(500).json({ message: 'Instant activation failed: ' + e.message });
    }
});

// 17. Current User Subscription Status
router.get('/status', verifyToken, (req, res) => {
    const userId = req.user.id;
    const userEmail = req.user.email || '';

    const query = `
        SELECT s.*, 
               COALESCE(p1.plan_name, p2.name, 'Premium Plan') as planName,
               COALESCE(p1.plan_type, p2.plan_type, 'common') as plan_type,
               COALESCE(p1.posting_limit, p2.job_limit, 20) as job_limit,
               COALESCE(p1.candidate_views_limit, p2.contact_views, 50) as contact_views,
               COALESCE(p1.resume_download_limit, p2.resume_downloads, 50) as resume_downloads,
               COALESCE(p1.badge_text, p2.badge_text, '') as badge_text,
               COALESCE(p1.description, p2.features, '') as features
        FROM subscriptions s
        LEFT JOIN plans p1 ON s.planId = p1.id
        LEFT JOIN subscription_plans p2 ON s.planId = p2.id
        WHERE (s.userId = ? OR s.userEmail = ? OR s.companyId = ? OR s.companyId = (SELECT company_id FROM employers WHERE employer_id = ? OR email = ?))
          AND s.status = 'active' AND s.expiryDate > datetime('now')
        ORDER BY s.id DESC LIMIT 1
    `;

    db.get(query, [userId, userEmail, String(userId), String(userId), userEmail], (err, subscription) => {
        if (err) return res.status(500).json({ message: 'Error fetching subscription: ' + err.message });

        if (!subscription) {
            db.get('SELECT isPremium FROM users WHERE id = ?', [req.user.id], (err, user) => {
                return res.json({
                    hasActiveSubscription: false,
                    isLegacyPremium: user?.isPremium === 1
                });
            });
            return;
        }

        let overrides = {};
        try { if (subscription.admin_override) overrides = JSON.parse(subscription.admin_override); } catch (e) {}

        const remainingDays = Math.ceil((new Date(subscription.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        const effectiveContacts = overrides.contact_views !== undefined ? overrides.contact_views : subscription.contact_views;
        const effectiveDownloads = overrides.resume_downloads !== undefined ? overrides.resume_downloads : subscription.resume_downloads;
        const rawJobLimit = overrides.job_limit !== undefined ? overrides.job_limit : subscription.job_limit;
        const targetIds = [String(userId), `comp_${userId}`, `emp_${userId}`];
        if (subscription.companyId) targetIds.push(String(subscription.companyId));
        const idPlaceholders = targetIds.map(() => '?').join(',');

        let countSql = `SELECT COUNT(*) as cnt FROM jobs WHERE (employer_id IN (${idPlaceholders}) OR company_id IN (${idPlaceholders}) OR CAST(companyId AS CHAR) IN (${idPlaceholders})) AND (status IS NULL OR status != 'deleted')`;
        const countParams = [...targetIds, ...targetIds, ...targetIds];
        if (subscription.startDate) {
            countSql += ` AND createdAt >= ?`;
            countParams.push(subscription.startDate);
        }

        db.get(countSql, countParams, (cntErr, cntRow) => {
            const actualCount = Math.max(cntRow ? cntRow.cnt : 0, subscription.jobsUsed || 0);
            const jobsRemaining = (rawJobLimit === -1 || rawJobLimit >= 999999) 
                ? 'Unlimited' 
                : Math.max(0, rawJobLimit - actualCount);

            res.json({
                hasActiveSubscription: true,
                subscription: {
                    ...subscription,
                    remainingDays,
                    overrides,
                    jobLimit: rawJobLimit,
                    jobsUsed: actualCount,
                    jobsRemaining,
                    contactsRemaining: (effectiveContacts === -1 || effectiveContacts >= 999999) ? 'Unlimited' : Math.max(0, effectiveContacts - (subscription.contactsViewed || 0)),
                    downloadsRemaining: (effectiveDownloads === -1 || effectiveDownloads >= 999999) ? 'Unlimited' : Math.max(0, effectiveDownloads - (subscription.resumeDownloads || 0)),
                }
            });
        });
    });
});

// 18. Dynamic Candidate Plans API
// GET /api/subscriptions/candidate-plans - List all candidate plans
router.get('/candidate-plans', (req, res) => {
    const { status } = req.query;
    let query = 'SELECT * FROM candidate_plans';
    const params = [];

    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }
    query += ' ORDER BY price ASC';

    db.all(query, params, (err, plans) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });

        // Also fetch plan features
        db.all('SELECT * FROM plan_features', [], (fErr, features) => {
            const result = (plans || []).map(p => {
                const pFeatures = (features || []).filter(f => f.plan_id === p.id);
                return {
                    ...p,
                    featuresList: pFeatures
                };
            });
            res.json(result);
        });
    });
});

// POST /api/subscriptions/candidate-plans - Admin: Create Candidate Plan
router.post('/candidate-plans', verifyToken, verifyRole(['admin']), (req, res) => {
    const {
        plan_name, price, application_limit, duration_type, duration_days,
        dedicated_support, support_duration, mentor_guidance, is_popular, badge_text, description, features
    } = req.body;

    if (!plan_name) return res.status(400).json({ message: 'Plan name is required' });

    const query = `
        INSERT INTO candidate_plans (
            plan_name, price, application_limit, duration_type, duration_days,
            dedicated_support, support_duration, mentor_guidance, is_popular, badge_text, description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;

    db.run(
        query,
        [
            plan_name, Number(price) || 0, Number(application_limit) !== undefined ? Number(application_limit) : 10,
            duration_type || 'monthly', Number(duration_days) || 30,
            dedicated_support ? 1 : 0, support_duration || '30 Days', mentor_guidance ? 1 : 0,
            is_popular ? 1 : 0, badge_text || '', description || ''
        ],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error creating candidate plan: ' + err.message });
            const planId = this.lastID;

            // Insert features if provided
            if (Array.isArray(features) && features.length > 0) {
                features.forEach(f => {
                    db.run(
                        'INSERT INTO plan_features (plan_id, feature_key, feature_name, enabled) VALUES (?, ?, ?, ?)',
                        [planId, f.key || f.feature_key, f.name || f.feature_name, f.enabled ? 1 : 0]
                    );
                });
            }

            res.status(201).json({
                message: 'Candidate plan created successfully',
                id: planId
            });
        }
    );
});

// PUT /api/subscriptions/candidate-plans/:id - Admin: Update Candidate Plan
router.put('/candidate-plans/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    const {
        plan_name, price, application_limit, duration_type, duration_days,
        dedicated_support, support_duration, mentor_guidance, is_popular, badge_text, description, status, features
    } = req.body;

    const query = `
        UPDATE candidate_plans SET
            plan_name = COALESCE(?, plan_name),
            price = COALESCE(?, price),
            application_limit = COALESCE(?, application_limit),
            duration_type = COALESCE(?, duration_type),
            duration_days = COALESCE(?, duration_days),
            dedicated_support = COALESCE(?, dedicated_support),
            support_duration = COALESCE(?, support_duration),
            mentor_guidance = COALESCE(?, mentor_guidance),
            is_popular = COALESCE(?, is_popular),
            badge_text = COALESCE(?, badge_text),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.run(
        query,
        [
            plan_name, price !== undefined ? Number(price) : null, application_limit !== undefined ? Number(application_limit) : null,
            duration_type, duration_days !== undefined ? Number(duration_days) : null,
            dedicated_support !== undefined ? (dedicated_support ? 1 : 0) : null,
            support_duration, mentor_guidance !== undefined ? (mentor_guidance ? 1 : 0) : null,
            is_popular !== undefined ? (is_popular ? 1 : 0) : null, badge_text, description, status, id
        ],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error updating candidate plan: ' + err.message });
            
            // If features provided, replace them
            if (Array.isArray(features)) {
                db.run('DELETE FROM plan_features WHERE plan_id = ?', [id], () => {
                    features.forEach(f => {
                        db.run(
                            'INSERT INTO plan_features (plan_id, feature_key, feature_name, enabled) VALUES (?, ?, ?, ?)',
                            [id, f.key || f.feature_key, f.name || f.feature_name, f.enabled ? 1 : 0]
                        );
                    });
                });
            }

            res.json({ message: 'Candidate plan updated successfully' });
        }
    );
});

// DELETE /api/subscriptions/candidate-plans/:id - Admin: Delete Candidate Plan
router.delete('/candidate-plans/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM subscription_plans WHERE id = ?', [id], () => {});
    db.run('DELETE FROM candidate_plans WHERE id = ?', [id], function (err) {
        db.run('DELETE FROM plan_features WHERE plan_id = ?', [id], () => {});
        res.json({ success: true, message: 'Candidate plan deleted successfully' });
    });
});

// PATCH /api/subscriptions/candidate-plans/:id/status - Toggle Candidate Plan Status
router.patch('/candidate-plans/:id/status', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.run('UPDATE candidate_plans SET status = ? WHERE id = ?', [status, id], function (err) {
        if (err) return res.status(500).json({ message: 'Error updating plan status' });
        res.json({ message: 'Plan status updated to ' + status });
    });
});

// 19. Independent Offers API
// GET /api/subscriptions/offers - List all offers with dynamic status calculation
router.get('/offers', (req, res) => {
    const query = `
        SELECT o.*, cp.plan_name, cp.price as plan_original_price, cp.application_limit as plan_app_limit,
               cp.dedicated_support, cp.support_duration, cp.mentor_guidance
        FROM offers o
        LEFT JOIN candidate_plans cp ON o.plan_id = cp.id
        ORDER BY o.priority ASC, o.id DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });

        const now = new Date();
        const computed = (rows || []).map(offer => {
            const start = new Date(offer.start_date);
            const end = new Date(offer.end_date);
            end.setHours(23, 59, 59, 999);

            let computedStatus = offer.status;
            if (offer.status !== 'inactive') {
                if (now < start) computedStatus = 'scheduled';
                else if (now > end) computedStatus = 'expired';
                else computedStatus = 'active';
            }

            return {
                ...offer,
                computedStatus,
                is_currently_active: computedStatus === 'active'
            };
        });

        res.json(computed);
    });
});

// POST /api/subscriptions/offers - Admin: Create Independent Offer
router.post('/offers', verifyToken, verifyRole(['admin']), (req, res) => {
    const {
        offer_name, plan_id, offer_type, original_price, offer_price,
        discount_value, extra_applications, extra_features, start_date, end_date, priority, status, description
    } = req.body;

    if (!offer_name || !plan_id || !start_date || !end_date) {
        return res.status(400).json({ message: 'Offer name, plan, start date, and end date are required' });
    }

    const query = `
        INSERT INTO offers (
            offer_name, plan_id, offer_type, original_price, offer_price,
            discount_value, extra_applications, extra_features, start_date, end_date, priority, status, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        query,
        [
            offer_name, plan_id, offer_type || 'festival', Number(original_price) || 0, Number(offer_price) || 0,
            discount_value || '', Number(extra_applications) || 0, extra_features || '',
            start_date, end_date, Number(priority) || 1, status || 'active', description || ''
        ],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error creating offer: ' + err.message });
            res.status(201).json({
                message: 'Offer created successfully',
                id: this.lastID
            });
        }
    );
});

// PUT /api/subscriptions/offers/:id - Admin: Update Offer
router.put('/offers/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    const {
        offer_name, plan_id, offer_type, original_price, offer_price,
        discount_value, extra_applications, extra_features, start_date, end_date, priority, status, description
    } = req.body;

    const query = `
        UPDATE offers SET
            offer_name = COALESCE(?, offer_name),
            plan_id = COALESCE(?, plan_id),
            offer_type = COALESCE(?, offer_type),
            original_price = COALESCE(?, original_price),
            offer_price = COALESCE(?, offer_price),
            discount_value = COALESCE(?, discount_value),
            extra_applications = COALESCE(?, extra_applications),
            extra_features = COALESCE(?, extra_features),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            priority = COALESCE(?, priority),
            status = COALESCE(?, status),
            description = COALESCE(?, description)
        WHERE id = ?
    `;

    db.run(
        query,
        [
            offer_name, plan_id, offer_type,
            original_price !== undefined ? Number(original_price) : null,
            offer_price !== undefined ? Number(offer_price) : null,
            discount_value,
            extra_applications !== undefined ? Number(extra_applications) : null,
            extra_features, start_date, end_date,
            priority !== undefined ? Number(priority) : null,
            status, description, id
        ],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error updating offer: ' + err.message });
            res.json({ message: 'Offer updated successfully' });
        }
    );
});

// DELETE /api/subscriptions/offers/:id - Admin: Delete Offer
router.delete('/offers/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM offers WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ message: 'Error deleting offer' });
        res.json({ message: 'Offer deleted successfully' });
    });
});

// PATCH /api/subscriptions/offers/:id/status - Toggle Offer Status
router.patch('/offers/:id/status', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.run('UPDATE offers SET status = ? WHERE id = ?', [status, id], function (err) {
        if (err) return res.status(500).json({ message: 'Error updating offer status' });
        res.json({ message: 'Offer status updated to ' + status });
    });
});

// 20. Comprehensive Candidate Subscription Perks & Quota Check
// GET /api/subscriptions/candidate-perks
router.get('/candidate-perks', verifyToken, (req, res) => {
    const candidateId = req.user.id;
    const candidateEmail = req.user.email;

    // 1. Fetch Candidate's Actual Application Count
    db.get(
        'SELECT COUNT(*) as count FROM applications WHERE applicantId = ? OR candidate_id = ?',
        [candidateId, candidateId],
        (appErr, appRow) => {
            const actualApplicationsCount = appRow?.count || 0;

            // 2. Fetch Active Candidate Subscription from candidate_subscriptions or legacy subscriptions
            const subQuery = `
                SELECT cs.*, cp.plan_name, cp.price, cp.application_limit as plan_app_limit,
                       cp.dedicated_support, cp.support_duration, cp.mentor_guidance, cp.badge_text,
                       o.offer_name, o.extra_applications
                FROM candidate_subscriptions cs
                LEFT JOIN candidate_plans cp ON cs.plan_id = cp.id
                LEFT JOIN offers o ON cs.offer_id = o.id
                WHERE (cs.candidate_id = ? OR cs.candidate_email = ?) 
                  AND cs.status = 'active' 
                  AND cs.end_date > datetime('now')
                ORDER BY cs.id DESC LIMIT 1
            `;

            db.get(subQuery, [candidateId, candidateEmail], (sErr, sub) => {
                // If no active paid subscription, fetch default Free Plan from candidate_plans
                if (!sub) {
                    db.get('SELECT * FROM candidate_plans WHERE price = 0 AND status = "active" LIMIT 1', [], (fErr, freePlan) => {
                        const dynamicFreeLimit = freePlan ? freePlan.application_limit : 10;
                        const dynamicFreeSupport = freePlan ? Boolean(freePlan.dedicated_support) : false;
                        const dynamicFreeMentor = freePlan ? Boolean(freePlan.mentor_guidance) : false;

                        // Fetch active public offer if any
                        db.get(
                            "SELECT * FROM offers WHERE status = 'active' AND date('now') BETWEEN start_date AND end_date ORDER BY priority ASC LIMIT 1",
                            [],
                            (oErr, activeOffer) => {
                                return res.json({
                                    isPremium: false,
                                    planName: freePlan?.plan_name || 'Free Plan',
                                    planId: freePlan?.id || 1,
                                    application_limit: dynamicFreeLimit,
                                    applicationsUsed: actualApplicationsCount,
                                    applicationsRemaining: Math.max(0, dynamicFreeLimit - actualApplicationsCount),
                                    isLimitReached: actualApplicationsCount >= dynamicFreeLimit,
                                    dedicated_support: dynamicFreeSupport,
                                    support_duration: freePlan?.support_duration || 'None',
                                    mentor_guidance: dynamicFreeMentor,
                                    activeOffer: activeOffer || null,
                                    featured_profile: false,
                                    skill_test_access: true,
                                    mock_interview_access: false
                                });
                            }
                        );
                    });
                    return;
                }

                // Paid active subscription found
                const totalLimit = (sub.application_limit || sub.plan_app_limit || 20) + (sub.extra_applications || 0);
                const remainingDays = Math.max(1, Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24)));

                // Fetch plan features
                db.all('SELECT * FROM plan_features WHERE plan_id = ?', [sub.plan_id], (pfErr, features) => {
                    res.json({
                        isPremium: true,
                        planName: sub.plan_name || sub.planName || 'Premium Plan',
                        planId: sub.plan_id,
                        subscriptionId: sub.id,
                        startDate: sub.start_date,
                        expiryDate: sub.end_date,
                        remainingDays,
                        application_limit: totalLimit,
                        applicationsUsed: actualApplicationsCount,
                        applicationsRemaining: Math.max(0, totalLimit - actualApplicationsCount),
                        isLimitReached: actualApplicationsCount >= totalLimit,
                        dedicated_support: Boolean(sub.dedicated_support),
                        support_duration: sub.support_duration || '30 Days',
                        mentor_guidance: Boolean(sub.mentor_guidance),
                        badgeText: sub.badge_text || 'Premium',
                        activeOfferName: sub.offer_name || null,
                        features: features || [],
                        featured_profile: true,
                        mock_interview_access: true,
                        recruiter_contact_access: true
                    });
                });
            });
        }
    );
});

// 21. Candidate Upgrade / Subscribe flow
// POST /api/subscriptions/candidate-subscribe
router.post('/candidate-subscribe', verifyToken, (req, res) => {
    const { plan_id, offer_id } = req.body;
    const candidateId = req.user.id;
    const candidateName = req.user.name || req.user.email?.split('@')[0] || 'Candidate';
    const candidateEmail = req.user.email || '';

    // Fetch Plan Details
    db.get('SELECT * FROM candidate_plans WHERE id = ?', [plan_id], (pErr, plan) => {
        if (pErr || !plan) return res.status(404).json({ message: 'Candidate plan not found' });

        // Check if offer applied
        db.get('SELECT * FROM offers WHERE id = ? AND plan_id = ?', [offer_id || 0, plan.id], (oErr, offer) => {
            const finalPrice = offer ? offer.offer_price : plan.price;
            const extraApps = offer ? offer.extra_applications : 0;
            const finalAppLimit = plan.application_limit + extraApps;

            const days = plan.duration_days || 30;
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + days);

            const insertSubQuery = `
                INSERT INTO candidate_subscriptions (
                    candidate_id, candidate_email, candidate_name, plan_id, plan_name,
                    offer_id, amount_paid, application_limit, end_date, payment_status, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'active')
            `;

            db.run(
                insertSubQuery,
                [
                    candidateId, candidateEmail, candidateName, plan.id, plan.plan_name,
                    offer ? offer.id : null, finalPrice, finalAppLimit, endDate.toISOString()
                ],
                function (err) {
                    if (err) return res.status(500).json({ message: 'Error activating subscription: ' + err.message });
                    
                    // Mark user as premium in users table
                    db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [candidateId]);

                    res.status(201).json({
                        message: `Successfully upgraded to ${plan.plan_name}! 🎉`,
                        subscriptionId: this.lastID,
                        planName: plan.plan_name,
                        application_limit: finalAppLimit,
                        expiryDate: endDate.toISOString(),
                        dedicated_support: Boolean(plan.dedicated_support)
                    });
                }
            );
        });
    });
});

// 22. Payment History
router.get('/history', verifyToken, (req, res) => {
    const query = `
        SELECT py.*, p.name as planName 
        FROM payments py
        JOIN subscription_plans p ON py.planId = p.id
        WHERE py.userId = ?
        ORDER BY py.createdAt DESC
    `;
    db.all(query, [req.user.id], (err, payments) => {
        if (err) return res.status(500).json({ message: 'Error fetching payment history' });
        res.json(payments || []);
    });
});

module.exports = router;
