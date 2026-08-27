const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// CREATE Assessment (Employer only)
router.post('/create', verifyToken, (req, res) => {
    if (req.user.role !== 'company') {
        return res.status(403).json({ message: 'Only companies can create assessments' });
    }
    
    // Check if premium
    db.get('SELECT isPremium FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user || !user.isPremium) {
            return res.status(403).json({ message: 'Only premium companies can access assessments' });
        }

        const { title, type, timer, passingMarks, questions } = req.body;
        
        db.run(
            'INSERT INTO assessments (companyId, title, type, timer, passingMarks) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, title, type, timer, passingMarks],
            function(err) {
                if (err) return res.status(500).json({ message: 'Error creating assessment' });
                
                const assessmentId = this.lastID;
                
                if (questions && questions.length > 0) {
                    const stmt = db.prepare('INSERT INTO assessment_questions (assessmentId, questionData, answer, language) VALUES (?, ?, ?, ?)');
                    questions.forEach(q => {
                        stmt.run(assessmentId, JSON.stringify(q.data), q.answer, q.language || '');
                    });
                    stmt.finalize();
                }

                res.status(201).json({ message: 'Assessment created successfully', id: assessmentId });
            }
        );
    });
});

// GET Company Assessments
router.get('/company', verifyToken, (req, res) => {
    if (req.user.role !== 'company') return res.status(403).json({ message: 'Forbidden' });
    
    db.all('SELECT * FROM assessments WHERE companyId = ? ORDER BY createdAt DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching assessments' });
        res.json(rows);
    });
});

// GET Available Assessments for Candidate
router.get('/available', verifyToken, (req, res) => {
    if (req.user.role !== 'jobseeker') return res.status(403).json({ message: 'Forbidden' });
    
    // For demo, just showing all active assessments from premium companies
    db.all(`
        SELECT a.id, a.title, a.type, a.timer, a.passingMarks, u.companyName 
        FROM assessments a
        JOIN users u ON a.companyId = u.id
        WHERE a.status = 'active'
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching assessments' });
        res.json(rows);
    });
});

// GET Assessment Details with Questions
router.get('/:id', verifyToken, (req, res) => {
    db.get('SELECT * FROM assessments WHERE id = ?', [req.params.id], (err, assessment) => {
        if (err || !assessment) return res.status(404).json({ message: 'Assessment not found' });
        
        db.all('SELECT id, questionData, language FROM assessment_questions WHERE assessmentId = ?', [req.params.id], (err, questions) => {
            if (err) return res.status(500).json({ message: 'Error fetching questions' });
            
            // Parse questionData JSON
            const formattedQuestions = questions.map(q => ({
                id: q.id,
                language: q.language,
                ...JSON.parse(q.questionData || '{}')
            }));
            
            res.json({ ...assessment, questions: formattedQuestions });
        });
    });
});

// SUBMIT Assessment Attempt
router.post('/submit', verifyToken, (req, res) => {
    if (req.user.role !== 'jobseeker') return res.status(403).json({ message: 'Forbidden' });
    
    const { assessmentId, score, details } = req.body;
    
    db.run(
        'INSERT INTO assessment_attempts (assessmentId, candidateId, score, details) VALUES (?, ?, ?, ?)',
        [assessmentId, req.user.id, score, JSON.stringify(details)],
        function(err) {
            if (err) return res.status(500).json({ message: 'Error submitting attempt' });
            res.json({ message: 'Attempt submitted', attemptId: this.lastID });
        }
    );
});

// GET Attempt Results for a specific assessment (Employer view)
router.get('/results/:assessmentId', verifyToken, (req, res) => {
    if (req.user.role !== 'company') return res.status(403).json({ message: 'Forbidden' });
    
    db.all(`
        SELECT aa.id, aa.score, aa.details, aa.createdAt, u.email as candidateEmail
        FROM assessment_attempts aa
        JOIN users u ON aa.candidateId = u.id
        WHERE aa.assessmentId = ?
        ORDER BY aa.createdAt DESC
    `, [req.params.assessmentId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching results' });
        
        // Parse details JSON
        const formattedRows = rows.map(r => ({
            ...r,
            details: JSON.parse(r.details || '{}')
        }));
        
        res.json(formattedRows);
    });
});

// GET All Assessments (Admin View)
router.get('/admin/all', verifyToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    db.all(`
        SELECT a.id, a.title, a.type, a.status, u.companyName,
               (SELECT COUNT(*) FROM assessment_attempts aa WHERE aa.assessmentId = a.id) as attemptCount
        FROM assessments a
        JOIN users u ON a.companyId = u.id
        ORDER BY a.createdAt DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Error fetching global assessments' });
        res.json(rows);
    });
});

module.exports = router;
