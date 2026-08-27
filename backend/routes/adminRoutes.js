const express = require('express');
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const router = express.Router();

// All admin routes require authentication + admin role
router.use(verifyToken, verifyRole(['admin']));

// 1. GET /api/admin/users - List all users
router.get('/users', (req, res) => {
    db.all('SELECT id, email, role, phone, address, companyName, hrName, isPremium, approved_access, createdAt FROM users ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ users: rows });
    });
});

// 2. GET /api/admin/users-classified - Comprehensive User Classification & Management
router.get('/users-classified', (req, res) => {
    const { tab, search, role } = req.query;

    const userQuery = `
        SELECT u.id, u.email, u.role, u.phone, u.companyName, u.hrName, u.isPremium, u.approved_access, u.createdAt,
               s.id as subscription_id, s.status as subscription_status, s.startDate as sub_start,
               s.expiryDate as sub_expiry, s.amount as sub_amount,
               p.name as plan_name, p.plan_type, p.target_role as plan_target_role
        FROM users u
        LEFT JOIN (
            SELECT * FROM subscriptions 
            WHERE id IN (SELECT MAX(id) FROM subscriptions GROUP BY userId, userEmail)
        ) s ON (s.userId = u.id OR s.userEmail = u.email)
        LEFT JOIN subscription_plans p ON s.planId = p.id
        ORDER BY u.createdAt DESC
    `;

    db.all(userQuery, [], (err, users) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });

        let classified = (users || []).map(u => {
            const isSubActive = u.subscription_status === 'active' && u.sub_expiry && new Date(u.sub_expiry) > new Date();
            const isPremiumUser = isSubActive || u.isPremium === 1;

            let userType = 'General';
            if (isPremiumUser) userType = 'Premium';
            else if (!u.role || u.role === 'viewer') userType = 'Viewer';

            return {
                id: u.id,
                email: u.email,
                name: u.hrName || u.companyName || u.email?.split('@')[0],
                role: u.role || 'jobseeker',
                company: u.companyName || '—',
                phone: u.phone || '—',
                userType,
                isPremium: isPremiumUser ? 1 : 0,
                activePlan: isPremiumUser ? (u.plan_name || 'Premium Plan') : 'Free Tier',
                planType: u.plan_type || 'Common',
                status: 'Active',
                startDate: u.sub_start || u.createdAt,
                expiryDate: u.sub_expiry || '—',
                amountPaid: u.sub_amount ? `₹${u.sub_amount}` : '₹0',
                subscriptionId: u.subscription_id
            };
        });

        // Filter by tab
        if (tab === 'premium') {
            classified = classified.filter(u => u.userType === 'Premium');
        } else if (tab === 'general') {
            classified = classified.filter(u => u.userType === 'General');
        } else if (tab === 'viewers') {
            classified = classified.filter(u => u.userType === 'Viewer' || u.role === 'viewer');
        } else if (tab === 'employers') {
            classified = classified.filter(u => u.role === 'company');
        } else if (tab === 'candidates') {
            classified = classified.filter(u => u.role === 'jobseeker');
        }

        // Search
        if (search) {
            const s = search.toLowerCase();
            classified = classified.filter(u => 
                (u.name && u.name.toLowerCase().includes(s)) ||
                (u.email && u.email.toLowerCase().includes(s)) ||
                (u.company && u.company.toLowerCase().includes(s)) ||
                (u.activePlan && u.activePlan.toLowerCase().includes(s))
            );
        }

        res.json({ users: classified, totalCount: classified.length });
    });
});

// 3. GET /api/admin/users/:id - Get a single user
router.get('/users/:id', (req, res) => {
    db.get('SELECT id, email, role, phone, address, companyName, hrName, isPremium, createdAt FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!row) return res.status(404).json({ message: 'User not found' });
        res.json({ user: row });
    });
});

// 4. DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    });
});

// 5. PUT /api/admin/users/:id/role - Change a user's role
router.put('/users/:id/role', (req, res) => {
    const { role } = req.body;
    if (!['jobseeker', 'company', 'admin', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }
    db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User role updated successfully' });
    });
});

// 6. GET /api/admin/analytics-summary - Advanced Admin Dashboard Statistics
router.get('/analytics-summary', (req, res) => {
    const stats = {
        totalUsers: 0,
        premiumEmployers: 0,
        premiumCandidates: 0,
        generalUsers: 0,
        viewers: 0,
        activePlans: 0,
        expiredPlans: 0,
        monthlyRevenue: 0,
        pendingDataRequests: 0,
        completedDataRequests: 0,
        totalJobs: 0
    };

    db.all('SELECT role, isPremium, COUNT(*) as count FROM users GROUP BY role, isPremium', [], (err, userCounts) => {
        (userCounts || []).forEach(r => {
            stats.totalUsers += r.count;
            if (r.role === 'company') {
                if (r.isPremium === 1) stats.premiumEmployers += r.count;
                else stats.generalUsers += r.count;
            } else if (r.role === 'jobseeker') {
                if (r.isPremium === 1) stats.premiumCandidates += r.count;
                else stats.generalUsers += r.count;
            } else if (r.role === 'viewer') {
                stats.viewers += r.count;
            }
        });

        db.all("SELECT status, COUNT(*) as count FROM subscriptions WHERE status = 'active' AND expiryDate > datetime('now')", [], (err, subRows) => {
            stats.activePlans = subRows?.[0]?.count || 0;

            db.all("SELECT COUNT(*) as count FROM subscriptions WHERE expiryDate <= datetime('now') OR status = 'expired'", [], (err, expRows) => {
                stats.expiredPlans = expRows?.[0]?.count || 0;

                db.all("SELECT status, COUNT(*) as count FROM candidate_data_requests GROUP BY status", [], (err, reqRows) => {
                    (reqRows || []).forEach(r => {
                        if (r.status === 'pending' || r.status === 'processing') stats.pendingDataRequests += r.count;
                        else if (r.status === 'completed' || r.status === 'approved') stats.completedDataRequests += r.count;
                    });

                    db.get("SELECT SUM(amount) as total FROM payments WHERE status = 'success' OR status = 'paid'", (err, revRow) => {
                        stats.monthlyRevenue = revRow?.total || 0;

                        db.get("SELECT COUNT(*) as count FROM jobs", (err, jobRow) => {
                            stats.totalJobs = jobRow?.count || 0;
                            res.json({ stats });
                        });
                    });
                });
            });
        });
    });
});

// 7. GET /api/admin/audit-logs - Audit Logs
router.get('/audit-logs', (req, res) => {
    const { action, target_type, search } = req.query;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (action) {
        query += ' AND action = ?';
        params.push(action);
    }

    if (target_type) {
        query += ' AND target_type = ?';
        params.push(target_type);
    }

    if (search) {
        query += ' AND (admin_name LIKE ? OR target_name LIKE ? OR description LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
    }

    query += ' ORDER BY id DESC LIMIT 200';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
        res.json(rows || []);
    });
});

// 8. GET /api/admin/payments - Payment & Transaction History
router.get('/payments', (req, res) => {
    const query = `
        SELECT p.*, u.email as user_email, u.companyName, u.hrName, sp.name as plan_name
        FROM payments p
        LEFT JOIN users u ON p.userId = u.id
        LEFT JOIN subscription_plans sp ON p.planId = sp.id
        ORDER BY p.id DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows || []);
    });
});

// 9. Legacy stats route
router.get('/stats', (req, res) => {
    db.all('SELECT role, COUNT(*) as count FROM users GROUP BY role', [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        const stats = { totalUsers: 0, jobseekers: 0, companies: 0, admins: 0 };
        rows.forEach(row => {
            stats.totalUsers += row.count;
            if (row.role === 'jobseeker') stats.jobseekers += row.count;
            if (row.role === 'employer' || row.role === 'company') stats.companies += row.count;
            if (row.role === 'admin') stats.admins += row.count;
        });
        res.json(stats);
    });
});
// 10. PATCH /api/admin/users/:id/approved-access - Toggle Approved Access for a User / Candidate
router.patch('/users/:id/approved-access', (req, res) => {
    const { id } = req.params;
    const { approved_access } = req.body;
    const val = (approved_access === true || approved_access === 1 || approved_access === '1' || approved_access === 'true') ? 1 : 0;
    
    db.run('UPDATE users SET approved_access = ? WHERE id = ?', [val, id], function(err) {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
        res.json({ 
            success: true, 
            message: 'Approved Access updated successfully.', 
            approved_access: !!val,
            userId: id 
        });
    });
});

// 11. PATCH /api/admin/companies/:id/approved-access - Toggle Approved Access for an Employer / Company
router.patch('/companies/:id/approved-access', (req, res) => {
    const { id } = req.params;
    const { approved_access } = req.body;
    const val = (approved_access === true || approved_access === 1 || approved_access === '1' || approved_access === 'true') ? 1 : 0;

    db.run('UPDATE companies SET approved_access = ? WHERE company_id = ? OR id = ?', [val, id, id], function(err) {
        if (err) {
            // Also update users table if companyId maps to user
            db.run('UPDATE users SET approved_access = ? WHERE id = ?', [val, id]);
        } else {
            db.run('UPDATE users SET approved_access = ? WHERE id = ? OR companyName = (SELECT company_name FROM companies WHERE company_id = ?)', [val, id, id]);
        }
        res.json({ 
            success: true, 
            message: 'Approved Access updated successfully.', 
            approved_access: !!val,
            companyId: id 
        });
    });
});

// 12. GET /api/admin/notifications - Get all Admin Notifications
router.get('/notifications', (req, res) => {
    const { group, search, type } = req.query;
    let query = 'SELECT * FROM admin_notifications WHERE 1=1';
    const params = [];

    if (group && group !== 'all') {
        query += ' AND target_group = ?';
        params.push(group);
    }
    if (type && type !== 'all') {
        query += ' AND notification_type = ?';
        params.push(type);
    }
    if (search) {
        query += ' AND (title LIKE ? OR message LIKE ? OR target_user_email LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
    }

    query += ' ORDER BY id DESC LIMIT 200';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
        res.json(rows || []);
    });
});

// 13. POST /api/admin/notifications - Send & Dispatch Notification to Candidates / Employers / All
router.post('/notifications', (req, res) => {
    const { 
        title, 
        message, 
        target_group = 'all', 
        target_user_id = null, 
        target_user_email = null, 
        notification_type = 'announcement', 
        channels = 'in_app', 
        action_url = '', 
        priority = 'normal' 
    } = req.body;

    if (!title || !message) {
        return res.status(400).json({ message: 'Title and message are required.' });
    }

    // Determine recipient count
    let countQuery = "SELECT COUNT(*) as count FROM users WHERE 1=1";
    if (target_group === 'candidates') {
        countQuery += " AND (role = 'jobseeker' OR role IS NULL)";
    } else if (target_group === 'employers') {
        countQuery += " AND role = 'company'";
    } else if (target_group === 'specific') {
        countQuery += ` AND (id = '${target_user_id}' OR email = '${target_user_email}')`;
    }

    db.get(countQuery, [], (err, row) => {
        const sentCount = row?.count || 1;

        const insertQuery = `
            INSERT INTO admin_notifications 
            (title, message, target_group, target_user_id, target_user_email, notification_type, channels, action_url, priority, sender_name, sent_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [
            title,
            message,
            target_group,
            target_user_id,
            target_user_email,
            notification_type,
            channels,
            action_url,
            priority,
            req.user?.name || req.user?.email || 'System Administrator',
            sentCount
        ], function(insertErr) {
            if (insertErr) return res.status(500).json({ message: 'Failed to record notification: ' + insertErr.message });
            
            const newNotifId = this.lastID;

            // Also insert into candidate_notifications if targets candidates or all
            if (target_group === 'candidates' || target_group === 'all') {
                db.all("SELECT candidate_id, id FROM candidates", [], (candErr, candidates) => {
                    if (!candErr && Array.isArray(candidates) && candidates.length > 0) {
                        const stmt = db.prepare('INSERT INTO candidate_notifications (candidate_id, type, message) VALUES (?, ?, ?)');
                        candidates.forEach(c => {
                            stmt.run(c.candidate_id || `cand_${c.id}`, notification_type, `${title}: ${message}`);
                        });
                        stmt.finalize();
                    }
                });
            }

            res.status(201).json({
                success: true,
                message: `Notification successfully broadcasted to ${sentCount} recipient(s).`,
                notification: {
                    id: newNotifId,
                    title,
                    message,
                    target_group,
                    notification_type,
                    channels,
                    action_url,
                    priority,
                    sent_count: sentCount,
                    created_at: new Date().toISOString()
                }
            });
        });
    });
});

// 14. DELETE /api/admin/notifications/:id - Delete Notification
router.delete('/notifications/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM admin_notifications WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Notification not found' });
        res.json({ success: true, message: 'Notification deleted successfully.' });
    });
});

module.exports = router;
