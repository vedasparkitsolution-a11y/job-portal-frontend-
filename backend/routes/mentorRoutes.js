const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// 1. GET /api/mentors - List all mentors (public or authenticated)
router.get('/', (req, res) => {
    const { status } = req.query;
    let query = 'SELECT * FROM mentors';
    const params = [];

    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    } else {
        query += " WHERE status = 'active'";
    }

    query += ' ORDER BY id ASC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
        res.json(rows || []);
    });
});

// 2. GET /api/mentors/all - Admin route: list all mentors including inactive
router.get('/all', verifyToken, verifyRole(['admin']), (req, res) => {
    db.all('SELECT * FROM mentors ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
        res.json(rows || []);
    });
});

// 3. POST /api/mentors - Admin: Add new mentor
router.post('/', verifyToken, verifyRole(['admin']), (req, res) => {
    const { name, email, mobile, profile_photo, expertise, experience, availability, status, bio } = req.body;
    if (!name || !expertise || !experience) {
        return res.status(400).json({ message: 'Name, expertise, and experience are required' });
    }

    const query = `
        INSERT INTO mentors (name, email, mobile, profile_photo, expertise, experience, availability, status, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        query,
        [name, email || '', mobile || '', profile_photo || '', expertise, experience, availability || 'Weekdays & Weekends', status || 'active', bio || ''],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error adding mentor: ' + err.message });
            res.status(201).json({
                message: 'Mentor added successfully',
                id: this.lastID,
                mentor: { id: this.lastID, ...req.body }
            });
        }
    );
});

// 4. PUT /api/mentors/:id - Admin: Update mentor
router.put('/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { name, email, mobile, profile_photo, expertise, experience, availability, status, bio } = req.body;

    const query = `
        UPDATE mentors SET
            name = COALESCE(?, name),
            email = COALESCE(?, email),
            mobile = COALESCE(?, mobile),
            profile_photo = COALESCE(?, profile_photo),
            expertise = COALESCE(?, expertise),
            experience = COALESCE(?, experience),
            availability = COALESCE(?, availability),
            status = COALESCE(?, status),
            bio = COALESCE(?, bio)
        WHERE id = ?
    `;

    db.run(query, [name, email, mobile, profile_photo, expertise, experience, availability, status, bio, id], function (err) {
        if (err) return res.status(500).json({ message: 'Error updating mentor: ' + err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Mentor not found' });
        res.json({ message: 'Mentor updated successfully' });
    });
});

// 5. DELETE /api/mentors/:id - Admin: Delete mentor
router.delete('/:id', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM mentors WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ message: 'Error deleting mentor' });
        res.json({ message: 'Mentor deleted successfully' });
    });
});

// 6. PATCH /api/mentors/:id/status - Toggle mentor status
router.patch('/:id/status', verifyToken, verifyRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.run('UPDATE mentors SET status = ? WHERE id = ?', [status, id], function (err) {
        if (err) return res.status(500).json({ message: 'Error toggling mentor status' });
        res.json({ message: 'Mentor status updated to ' + status });
    });
});

// 7. GET /api/mentors/requests - List mentor guidance requests
router.get('/requests', verifyToken, (req, res) => {
    const isAdmin = req.user.role === 'admin';
    let query = `
        SELECT mr.*, m.name as mentor_name_full, m.expertise as mentor_expertise, m.email as mentor_email
        FROM mentor_requests mr
        LEFT JOIN mentors m ON mr.mentor_id = m.id
    `;
    const params = [];

    if (!isAdmin) {
        query += ' WHERE mr.candidate_id = ? OR mr.candidate_email = ?';
        params.push(req.user.id, req.user.email);
    }

    query += ' ORDER BY mr.id DESC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
        res.json(rows || []);
    });
});

// 8. POST /api/mentors/requests - Candidate: Book a guidance session
router.post('/requests', verifyToken, (req, res) => {
    const { mentor_id, topic, notes, session_date } = req.body;
    if (!topic) return res.status(400).json({ message: 'Guidance topic is required' });

    const candidateId = req.user.id;
    const candidateName = req.user.name || req.user.email?.split('@')[0] || 'Candidate';
    const candidateEmail = req.user.email || '';

    // Fetch mentor name if mentor_id provided
    db.get('SELECT name FROM mentors WHERE id = ?', [mentor_id || 0], (mErr, mentor) => {
        const mentorName = mentor?.name || 'Assigned Mentor';

        const query = `
            INSERT INTO mentor_requests (candidate_id, candidate_name, candidate_email, mentor_id, mentor_name, topic, notes, session_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        db.run(
            query,
            [candidateId, candidateName, candidateEmail, mentor_id || null, mentorName, topic, notes || '', session_date || null],
            function (err) {
                if (err) return res.status(500).json({ message: 'Error booking guidance request: ' + err.message });
                res.status(201).json({
                    message: 'Mentor guidance session requested successfully! Our team will confirm the schedule shortly.',
                    id: this.lastID,
                    status: 'pending'
                });
            }
        );
    });
});

// 9. PATCH /api/mentors/requests/:id/status - Admin/Mentor: Update session status
router.patch('/requests/:id/status', verifyToken, (req, res) => {
    const { id } = req.params;
    const { status, session_date, mentor_id } = req.body;

    const query = `
        UPDATE mentor_requests SET
            status = COALESCE(?, status),
            session_date = COALESCE(?, session_date),
            mentor_id = COALESCE(?, mentor_id)
        WHERE id = ?
    `;

    db.run(query, [status, session_date, mentor_id, id], function (err) {
        if (err) return res.status(500).json({ message: 'Error updating request status' });
        res.json({ message: `Session status updated to ${status}` });
    });
});

module.exports = router;
