const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all interviews for an employer
router.get('/', verifyToken, (req, res) => {
    const query = `
        SELECT i.*, a.applicantId, u.email as candidateEmail, u.phone as candidatePhone, j.title as jobTitle, 
        (SELECT email FROM users WHERE id = i.candidateId) as candidateNameFallback
        FROM interviews i
        LEFT JOIN applications a ON i.appId = a.id
        LEFT JOIN users u ON i.candidateId = u.id
        LEFT JOIN jobs j ON i.jobId = j.id
        WHERE i.employerId = ?
        ORDER BY i.interviewDate ASC, i.interviewTime ASC
    `;
    
    db.all(query, [req.user.id], (err, interviews) => {
        if (err) return res.status(500).json({ message: 'Error fetching interviews' });
        
        // Enrich data to match frontend expectations
        const enriched = interviews.map(iv => ({
            id: iv.id,
            appId: iv.appId,
            candidateId: iv.candidateId,
            candidateName: iv.candidateNameFallback || `Candidate #${iv.candidateId}`,
            candidateEmail: iv.candidateEmail,
            candidatePhone: iv.candidatePhone,
            jobTitle: iv.jobTitle || 'General Interview',
            date: iv.interviewDate,
            time: iv.interviewTime,
            status: iv.status
        }));
        
        res.json(enriched);
    });
});

// Schedule new interview
router.post('/', verifyToken, (req, res) => {
    const { appId, candidateId, jobId, date, time } = req.body;
    
    if (!candidateId || !date || !time) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    db.run('INSERT INTO interviews (appId, employerId, candidateId, jobId, interviewDate, interviewTime) VALUES (?, ?, ?, ?, ?, ?)',
        [appId || null, req.user.id, candidateId, jobId || null, date, time], function(err) {
            if (err) return res.status(500).json({ message: 'Error scheduling interview' });
            
            // Also update application status if appId is provided
            if (appId) {
                db.run('UPDATE applications SET status = "interview_scheduled" WHERE id = ?', [appId]);
            }
            
            res.json({ message: 'Interview scheduled', interviewId: this.lastID });
        }
    );
});

// Delete interview
router.delete('/:id', verifyToken, (req, res) => {
    db.run('DELETE FROM interviews WHERE id = ? AND employerId = ?', [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: 'Error cancelling interview' });
        res.json({ message: 'Interview cancelled' });
    });
});

module.exports = router;
