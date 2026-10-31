const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Helper: Record Admin Audit Log
const recordAuditLog = (user, action, targetType, targetId, targetName, description, details = {}) => {
    const adminId = user?.id || 'admin_1';
    const adminName = user?.name || 'Administrator';
    const adminEmail = user?.email || 'admin@jobportal.com';
    const detailsJson = typeof details === 'string' ? details : JSON.stringify(details, null, 2);

    db.run(`
        INSERT INTO audit_logs (admin_id, admin_name, admin_email, action, target_type, target_id, target_name, description, details_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [adminId, adminName, adminEmail, action, targetType, String(targetId), targetName, description, detailsJson], (err) => {
        if (err) console.error('Failed to log audit event:', err.message);
    });
};

// 1. GET /api/plans - List all plans with nested ordered features
router.get('/', (req, res) => {
    const { plan_type, status, include_inactive } = req.query;

    let query = 'SELECT * FROM plans WHERE 1=1';
    const params = [];

    if (plan_type) {
        query += ' AND plan_type = ?';
        params.push(plan_type);
    }

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    } else if (include_inactive === 'false') {
        query += " AND status = 'active'";
    }

    query += ' ORDER BY original_price ASC, id ASC';

    db.all(query, params, (err, plans) => {
        if (err) {
            console.error('Error fetching plans:', err);
            return res.status(500).json({ message: 'Database error fetching plans: ' + err.message });
        }

        if (!plans || plans.length === 0) {
            return res.json([]);
        }

        // Fetch features for all returned plans
        const planIds = plans.map(p => p.id);
        const placeholders = planIds.map(() => '?').join(',');

        db.all(`
            SELECT * FROM plan_features 
            WHERE plan_id IN (${placeholders}) 
            ORDER BY display_order ASC, id ASC
        `, planIds, (fErr, features) => {
            if (fErr) {
                console.error('Error fetching features:', fErr);
                return res.json(plans.map(p => ({ ...p, features: [] })));
            }

            const featuresByPlan = {};
            (features || []).forEach(f => {
                if (!featuresByPlan[f.plan_id]) featuresByPlan[f.plan_id] = [];
                featuresByPlan[f.plan_id].push({
                    id: f.id,
                    feature_name: f.feature_name,
                    included: Boolean(f.included),
                    feature_value: f.feature_value || '',
                    display_order: f.display_order || 0
                });
            });

            const result = plans.map(p => ({
                ...p,
                name: p.plan_name,
                is_popular: Boolean(p.popular),
                is_recommended: Boolean(p.recommended),
                popular: Boolean(p.popular),
                recommended: Boolean(p.recommended),
                features: featuresByPlan[p.id] || []
            }));

            res.json(result);
        });
    });
});

// 2. GET /api/plans/:id - Get single plan with its features
router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM plans WHERE id = ?', [id], (err, plan) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        db.all('SELECT * FROM plan_features WHERE plan_id = ? ORDER BY display_order ASC, id ASC', [id], (fErr, features) => {
            if (fErr) return res.status(500).json({ message: 'Error fetching features: ' + fErr.message });

            res.json({
                ...plan,
                name: plan.plan_name,
                is_popular: Boolean(plan.popular),
                is_recommended: Boolean(plan.recommended),
                popular: Boolean(plan.popular),
                recommended: Boolean(plan.recommended),
                features: (features || []).map(f => ({
                    id: f.id,
                    feature_name: f.feature_name,
                    included: Boolean(f.included),
                    feature_value: f.feature_value || '',
                    display_order: f.display_order || 0
                }))
            });
        });
    });
});

// 3. POST /api/plans - Create a new plan with dynamic features (Admin only)
router.post('/', verifyToken, verifyRole(['admin']), (req, res) => {
    const {
        plan_type = 'employer',
        plan_name,
        name,
        description = '',
        original_price = 0,
        offer_price = 0,
        duration = '30 Days',
        duration_days = 30,
        posting_limit = 1,
        application_limit = 10,
        candidate_views_limit = 50,
        resume_download_limit = 50,
        popular = 0,
        is_popular = 0,
        recommended = 0,
        is_recommended = 0,
        status = 'active',
        badge_text = '',
        features = []
    } = req.body;

    const finalPlanName = (plan_name || name || '').trim();
    if (!finalPlanName) {
        return res.status(400).json({ message: 'Plan name is required.' });
    }

    let origPrice = Math.max(0, Number(original_price) || 0);
    let offPrice = Math.max(0, Number(offer_price !== undefined && offer_price !== '' ? offer_price : origPrice));
    if (origPrice === 0 && offPrice > 0) {
        origPrice = offPrice;
    }

    if (offPrice > origPrice && origPrice > 0) {
        return res.status(400).json({ message: 'Offer price cannot be greater than original price.' });
    }

    let discountPercentage = 0;
    if (origPrice > 0 && offPrice < origPrice) {
        discountPercentage = Math.round(((origPrice - offPrice) / origPrice) * 100);
    }

    const finalLimit = plan_type === 'candidate' 
        ? (application_limit !== undefined ? Number(application_limit) : (posting_limit !== undefined ? Number(posting_limit) : 10)) 
        : (posting_limit !== undefined ? Number(posting_limit) : 1);

    const candLimit = candidate_views_limit !== undefined ? Number(candidate_views_limit) : 50;
    const resLimit = resume_download_limit !== undefined ? Number(resume_download_limit) : 50;

    const isPop = (popular || is_popular) ? 1 : 0;
    const isRec = (recommended || is_recommended) ? 1 : 0;

    const sql = `
        INSERT INTO plans (
            plan_type, plan_name, description, original_price, offer_price,
            discount_percentage, duration, duration_days, posting_limit,
            candidate_views_limit, resume_download_limit,
            popular, recommended, status, badge_text, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    db.run(sql, [
        plan_type, finalPlanName, description, origPrice, offPrice,
        discountPercentage, duration, Number(duration_days) || 30, finalLimit,
        candLimit, resLimit,
        isPop, isRec, status, badge_text
    ], function (err) {
        if (err) {
            console.error('Error inserting plan:', err);
            return res.status(500).json({ message: 'Failed to create plan: ' + err.message });
        }

        const newPlanId = this.lastID;

        // Insert features
        if (Array.isArray(features) && features.length > 0) {
            features.forEach((f, idx) => {
                const fName = (f.feature_name || f.name || '').trim();
                if (fName) {
                    const inc = (f.included === true || f.included === 1 || f.included === '1') ? 1 : 0;
                    db.run(
                        `INSERT INTO plan_features (plan_id, feature_name, included, feature_value, display_order) VALUES (?, ?, ?, ?, ?)`,
                        [newPlanId, fName, inc, f.feature_value || f.value || '', idx]
                    );
                }
            });
            recordAuditLog(req.user, 'CREATE_PLAN', 'plans', newPlanId, finalPlanName, `Created ${plan_type} plan "${finalPlanName}" with ${features.length} features`, req.body);
            res.status(201).json({ success: true, message: 'Plan created successfully', planId: newPlanId });
        } else {
            recordAuditLog(req.user, 'CREATE_PLAN', 'plans', newPlanId, finalPlanName, `Created ${plan_type} plan "${finalPlanName}"`, req.body);
            res.status(201).json({ success: true, message: 'Plan created successfully', planId: newPlanId });
        }
    });
});

// 4. PUT /api/plans/:id - Update plan and its dynamic features (Admin only)
router.put('/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    const {
        plan_type = 'employer',
        plan_name,
        name,
        description = '',
        original_price = 0,
        offer_price = 0,
        duration = '30 Days',
        duration_days = 30,
        posting_limit = 1,
        application_limit = 10,
        candidate_views_limit = 50,
        resume_download_limit = 50,
        popular = 0,
        is_popular = 0,
        recommended = 0,
        is_recommended = 0,
        status = 'active',
        badge_text = '',
        features = []
    } = req.body;

    const finalPlanName = (plan_name || name || '').trim();
    if (!finalPlanName) {
        return res.status(400).json({ message: 'Plan name is required.' });
    }

    let origPrice = Math.max(0, Number(original_price) || 0);
    let offPrice = Math.max(0, Number(offer_price !== undefined && offer_price !== '' ? offer_price : origPrice));
    if (origPrice === 0 && offPrice > 0) {
        origPrice = offPrice;
    }

    let discountPercentage = 0;
    if (origPrice > 0 && offPrice < origPrice) {
        discountPercentage = Math.round(((origPrice - offPrice) / origPrice) * 100);
    }

    const finalLimit = plan_type === 'candidate' 
        ? (application_limit !== undefined ? Number(application_limit) : (posting_limit !== undefined ? Number(posting_limit) : 10)) 
        : (posting_limit !== undefined ? Number(posting_limit) : 1);

    const candLimit = candidate_views_limit !== undefined ? Number(candidate_views_limit) : 50;
    const resLimit = resume_download_limit !== undefined ? Number(resume_download_limit) : 50;

    const isPop = (popular || is_popular) ? 1 : 0;
    const isRec = (recommended || is_recommended) ? 1 : 0;

    const sql = `
        UPDATE plans SET
            plan_type = ?, plan_name = ?, description = ?, original_price = ?, offer_price = ?,
            discount_percentage = ?, duration = ?, duration_days = ?, posting_limit = ?,
            candidate_views_limit = ?, resume_download_limit = ?,
            popular = ?, recommended = ?, status = ?, badge_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.run(sql, [
        plan_type, finalPlanName, description, origPrice, offPrice,
        discountPercentage, duration, Number(duration_days) || 30, finalLimit,
        candLimit, resLimit,
        isPop, isRec, status, badge_text, id
    ], function (err) {
        if (err) {
            console.error('Error updating plan:', err);
            return res.status(500).json({ message: 'Failed to update plan: ' + err.message });
        }

        // Synchronize features: delete existing and re-insert
        db.run('DELETE FROM plan_features WHERE plan_id = ?', [id], (delErr) => {
            if (Array.isArray(features) && features.length > 0) {
                features.forEach((f, idx) => {
                    const fName = (f.feature_name || f.name || '').trim();
                    if (fName) {
                        const inc = (f.included === true || f.included === 1 || f.included === '1') ? 1 : 0;
                        db.run(
                            `INSERT INTO plan_features (plan_id, feature_name, included, feature_value, display_order) VALUES (?, ?, ?, ?, ?)`,
                            [id, fName, inc, f.feature_value || f.value || '', idx]
                        );
                    }
                });
                recordAuditLog(req.user, 'UPDATE_PLAN', 'plans', id, finalPlanName, `Updated plan "${finalPlanName}" and features`, req.body);
                res.json({ success: true, message: 'Plan updated successfully' });
            } else {
                recordAuditLog(req.user, 'UPDATE_PLAN', 'plans', id, finalPlanName, `Updated plan "${finalPlanName}"`, req.body);
                res.json({ success: true, message: 'Plan updated successfully' });
            }
        });
    });
});

// 5. DELETE /api/plans/:id - Permanently delete a plan and its features (Admin only)
router.delete('/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;

    db.get('SELECT plan_name FROM plans WHERE id = ?', [id], (err, plan) => {
        const planName = plan?.plan_name || `Plan #${id}`;

        db.run('DELETE FROM plan_features WHERE plan_id = ?', [id], () => {});
        db.run('DELETE FROM plans WHERE id = ?', [id], function (delErr) {
            if (delErr) return res.status(500).json({ message: 'Error deleting plan: ' + delErr.message });

            // Also clean from legacy tables if ID was shared
            db.run('DELETE FROM subscription_plans WHERE id = ?', [id], () => {});
            db.run('DELETE FROM candidate_plans WHERE id = ?', [id], () => {});

            recordAuditLog(req.user, 'DELETE_PLAN', 'plans', id, planName, `Permanently deleted plan "${planName}"`);
            res.json({ success: true, message: `Plan "${planName}" deleted successfully` });
        });
    });
});

// 6. PATCH /api/plans/:id/status - Toggle active/inactive status (Admin only)
router.patch('/:id/status', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const newStatus = status === 'active' ? 'active' : 'inactive';

    db.run('UPDATE plans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id], function (err) {
        if (err) return res.status(500).json({ message: 'Error updating status: ' + err.message });
        recordAuditLog(req.user, 'UPDATE_STATUS', 'plans', id, `Plan #${id}`, `Changed plan status to ${newStatus}`);
        res.json({ success: true, message: `Plan status set to ${newStatus}` });
    });
});

// 7. POST /api/plans/:id/duplicate - Duplicate an existing plan and its features (Admin only)
router.post('/:id/duplicate', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM plans WHERE id = ?', [id], (err, origPlan) => {
        if (err || !origPlan) return res.status(404).json({ message: 'Original plan not found' });

        const newName = `${origPlan.plan_name} (Copy)`;

        db.run(`
            INSERT INTO plans (
                plan_type, plan_name, description, original_price, offer_price,
                discount_percentage, duration, duration_days, posting_limit,
                popular, recommended, status, badge_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            origPlan.plan_type, newName, origPlan.description, origPlan.original_price, origPlan.offer_price,
            origPlan.discount_percentage, origPlan.duration, origPlan.duration_days, origPlan.posting_limit,
            0, 0, 'active', origPlan.badge_text
        ], function (insErr) {
            if (insErr) return res.status(500).json({ message: 'Failed to duplicate plan: ' + insErr.message });

            const newPlanId = this.lastID;

            db.all('SELECT * FROM plan_features WHERE plan_id = ? ORDER BY display_order ASC', [id], (fErr, features) => {
                if (features && features.length > 0) {
                    features.forEach((f, idx) => {
                        db.run(
                            `INSERT INTO plan_features (plan_id, feature_name, included, feature_value, display_order) VALUES (?, ?, ?, ?, ?)`,
                            [newPlanId, f.feature_name, f.included, f.feature_value || '', idx]
                        );
                    });
                    recordAuditLog(req.user, 'DUPLICATE_PLAN', 'plans', newPlanId, newName, `Duplicated plan from #${id}`);
                    res.status(201).json({ success: true, message: `Plan duplicated as "${newName}"`, planId: newPlanId });
                } else {
                    recordAuditLog(req.user, 'DUPLICATE_PLAN', 'plans', newPlanId, newName, `Duplicated plan from #${id}`);
                    res.status(201).json({ success: true, message: `Plan duplicated as "${newName}"`, planId: newPlanId });
                }
            });
        });
    });
});

module.exports = router;
