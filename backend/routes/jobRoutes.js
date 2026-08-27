const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// Haversine formula to calculate distance in km between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const p1 = parseFloat(lat1);
    const l1 = parseFloat(lon1);
    const p2 = parseFloat(lat2);
    const l2 = parseFloat(lon2);
    if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) return null;

    const R = 6371; // Earth's radius in kilometers
    const dLat = (p2 - p1) * Math.PI / 180;
    const dLon = (l2 - l1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1 * Math.PI / 180) * Math.cos(p2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // distance rounded to 1 decimal
}

// Fallback coordinate lookup for known cities if job doesn't have exact GPS
const CITY_COORDINATES = {
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'bengaluru': { lat: 12.9716, lng: 77.5946 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'new delhi': { lat: 28.6139, lng: 77.2090 },
    'noida': { lat: 28.5355, lng: 77.3910 },
    'gurgaon': { lat: 28.4595, lng: 77.0266 },
    'gurugram': { lat: 28.4595, lng: 77.0266 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'chandigarh': { lat: 30.7333, lng: 76.7794 },
    'kochi': { lat: 9.9312, lng: 76.2673 },
    'coimbatore': { lat: 11.0168, lng: 76.9558 },
    'indore': { lat: 22.7196, lng: 75.8577 },
    'surat': { lat: 21.1702, lng: 72.8311 }
};

// Helper to auto-expire jobs whose deadline has passed
function autoExpireJobs(callback) {
    const today = new Date().toISOString().split('T')[0];
    db.run(
        `UPDATE jobs SET status = 'expired' WHERE (status = 'active' OR status = 'open') AND application_deadline IS NOT NULL AND application_deadline != '' AND application_deadline < ?`,
        [today],
        (err) => {
            if (callback) callback();
        }
    );
}

// Post a New Job (with Geo-Tagging support)
router.post('/post', verifyToken, (req, res) => {
    if (req.user.role !== 'company' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only recruiters can post jobs' });
    }

    const body = req.body;
    const jobIdStr = body.job_id || body.jobId || `JOB-${Date.now()}`;
    const status = body.status || 'active';
    const employerId = req.user.id || body.employer_id;
    const companyId = body.company_id || req.user.id;

    // Coordinate resolution
    let lat = body.latitude || body.lat || '';
    let lng = body.longitude || body.lng || '';
    if ((!lat || !lng) && body.city) {
        const cityKey = body.city.toLowerCase().trim();
        if (CITY_COORDINATES[cityKey]) {
            lat = String(CITY_COORDINATES[cityKey].lat);
            lng = String(CITY_COORDINATES[cityKey].lng);
        }
    }

    const query = `
        INSERT INTO jobs (
            job_id, employer_id, company_id, companyId, title, job_title, description, job_description,
            location, job_location, location_type, number_of_openings, experience_type, minimum_experience,
            maximum_experience, experience, education, skills, required_skills, preferred_skills, gender_preference,
            minimum_age, maximum_age, salary, minimum_salary, maximum_salary, salary_type, salary_negotiable,
            responsibilities, working_days, start_time, end_time, shift_type, working_hours, company_name,
            company_logo, contact_person_name, company_phone, company_email, company_website, about_company,
            hiring_timeline, hiring_frequency, hiring_priority, building_name, door_number, street, area,
            city, district, state, country, pincode, benefits, notice_period, joining_date, application_method,
            application_url, application_email, application_deadline, jobType, googleFormLink, cgpa, application_questions,
            latitude, longitude, geo_address, geo_radius, status
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    `;

    const questionsJson = body.application_questions || body.applicationQuestions
        ? (typeof (body.application_questions || body.applicationQuestions) === 'object' ? JSON.stringify(body.application_questions || body.applicationQuestions) : (body.application_questions || body.applicationQuestions))
        : '';

    const params = [
        jobIdStr,
        employerId,
        companyId,
        req.user.id,
        body.job_title || body.title || 'Untitled Role',
        body.job_title || body.title || 'Untitled Role',
        body.job_description || body.description || '',
        body.job_description || body.description || '',
        body.job_location || body.location || '',
        body.job_location || body.location || '',
        body.location_type || 'On-site',
        body.number_of_openings || 1,
        body.experience_type || 'Any Experience',
        body.minimum_experience || '',
        body.maximum_experience || '',
        body.experience || '',
        body.education || '',
        body.required_skills || body.skills || '',
        body.required_skills || body.skills || '',
        body.preferred_skills || '',
        body.gender_preference || 'Any',
        body.minimum_age || '',
        body.maximum_age || '',
        body.salary || '',
        body.minimum_salary || '',
        body.maximum_salary || '',
        body.salary_type || 'Monthly',
        body.salary_negotiable ? 1 : 0,
        body.responsibilities || '',
        body.working_days || '',
        body.start_time || '',
        body.end_time || '',
        body.shift_type || 'Day Shift',
        body.working_hours || '8 hours/day',
        body.company_name || body.companyName || '',
        body.company_logo || body.companyLogo || '',
        body.contact_person_name || '',
        body.company_phone || '',
        body.company_email || '',
        body.company_website || '',
        body.about_company || '',
        body.hiring_timeline || '',
        body.hiring_frequency || '',
        body.hiring_priority || 'Normal',
        body.building_name || '',
        body.door_number || '',
        body.street || '',
        body.area || '',
        body.city || '',
        body.district || '',
        body.state || '',
        body.country || '',
        body.pincode || '',
        body.benefits || '',
        body.notice_period || '',
        body.joining_date || '',
        body.application_method || 'Job Portal',
        body.application_url || '',
        body.application_email || '',
        body.application_deadline || '',
        body.job_type || body.jobType || 'Full Time',
        body.googleFormLink || '',
        body.cgpa || '',
        questionsJson,
        lat,
        lng,
        body.geo_address || body.job_location || body.location || '',
        body.geo_radius || 25,
        status
    ];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Error inserting job into DB:', err.message);
            return res.status(500).json({ message: 'Error posting job: ' + err.message });
        }
        res.status(201).json({
            message: status === 'draft' ? 'Draft saved successfully' : 'Job posted with Geo-Tag successfully!',
            jobId: jobIdStr,
            id: this.lastID,
            latitude: lat,
            longitude: lng
        });
    });
});

// Update Job Details (with Geo-Tagging support)
router.put('/:id', verifyToken, (req, res) => {
    const jobId = req.params.id;
    const body = req.body;

    const questionsJson = body.application_questions || body.applicationQuestions
        ? (typeof (body.application_questions || body.applicationQuestions) === 'object' ? JSON.stringify(body.application_questions || body.applicationQuestions) : (body.application_questions || body.applicationQuestions))
        : '';

    let lat = body.latitude || body.lat || '';
    let lng = body.longitude || body.lng || '';
    if ((!lat || !lng) && body.city) {
        const cityKey = body.city.toLowerCase().trim();
        if (CITY_COORDINATES[cityKey]) {
            lat = String(CITY_COORDINATES[cityKey].lat);
            lng = String(CITY_COORDINATES[cityKey].lng);
        }
    }

    const query = `
        UPDATE jobs SET
            job_title = ?, title = ?, job_description = ?, description = ?, job_location = ?, location = ?,
            location_type = ?, number_of_openings = ?, experience_type = ?, minimum_experience = ?, maximum_experience = ?,
            experience = ?, education = ?, required_skills = ?, skills = ?, preferred_skills = ?, gender_preference = ?,
            minimum_age = ?, maximum_age = ?, minimum_salary = ?, maximum_salary = ?, salary = ?, salary_type = ?,
            salary_negotiable = ?, responsibilities = ?, working_days = ?, start_time = ?, end_time = ?, shift_type = ?,
            working_hours = ?, hiring_timeline = ?, hiring_frequency = ?, hiring_priority = ?, building_name = ?,
            door_number = ?, street = ?, area = ?, city = ?, district = ?, state = ?, country = ?, pincode = ?,
            benefits = ?, notice_period = ?, joining_date = ?, application_method = ?, application_url = ?,
            application_email = ?, application_deadline = ?, job_type = ?, jobType = ?, application_questions = ?,
            latitude = ?, longitude = ?, geo_address = ?, geo_radius = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE (id = ? OR job_id = ?) AND (companyId = ? OR employer_id = ? OR ? = 'admin')
    `;

    const params = [
        body.job_title || body.title, body.job_title || body.title,
        body.job_description || body.description, body.job_description || body.description,
        body.job_location || body.location, body.job_location || body.location,
        body.location_type || 'On-site', body.number_of_openings || 1,
        body.experience_type || 'Any Experience', body.minimum_experience || '', body.maximum_experience || '',
        body.experience || '', body.education || '', body.required_skills || body.skills || '', body.required_skills || body.skills || '',
        body.preferred_skills || '', body.gender_preference || 'Any', body.minimum_age || '', body.maximum_age || '',
        body.minimum_salary || '', body.maximum_salary || '', body.salary || '', body.salary_type || 'Monthly',
        body.salary_negotiable ? 1 : 0, body.responsibilities || '', body.working_days || '', body.start_time || '',
        body.end_time || '', body.shift_type || 'Day Shift', body.working_hours || '8 hours/day',
        body.hiring_timeline || '', body.hiring_frequency || '', body.hiring_priority || 'Normal',
        body.building_name || '', body.door_number || '', body.street || '', body.area || '',
        body.city || '', body.district || '', body.state || '', body.country || '', body.pincode || '',
        body.benefits || '', body.notice_period || '', body.joining_date || '', body.application_method || 'Job Portal',
        body.application_url || '', body.application_email || '', body.application_deadline || '',
        body.job_type || body.jobType || 'Full Time', body.job_type || body.jobType || 'Full Time',
        questionsJson,
        lat, lng, body.geo_address || body.job_location || body.location || '', body.geo_radius || 25,
        body.status || 'active',
        jobId, jobId, req.user.id, req.user.id, req.user.role
    ];

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ message: 'Error updating job: ' + err.message });
        res.json({ message: 'Job updated successfully', latitude: lat, longitude: lng });
    });
});

// Update Job Status (Pause, Activate, Close, Draft)
router.put('/:id/status', verifyToken, (req, res) => {
    const { status } = req.body;
    db.run(
        `UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE (id = ? OR job_id = ?) AND (companyId = ? OR employer_id = ? OR ? = 'admin')`,
        [status, req.params.id, req.params.id, req.user.id, req.user.id, req.user.role],
        function (err) {
            if (err) return res.status(500).json({ message: 'Error updating job status' });
            res.json({ message: `Job status updated to ${status}` });
        }
    );
});

// Get All Public Active Jobs with optional Geo-Radius filter & distance calculation
router.get('/all', (req, res) => {
    const { lat, lng, radius, search, city } = req.query;

    autoExpireJobs(() => {
        let query = `
            SELECT * FROM jobs 
            WHERE (status = 'active' OR status = 'open')
        `;
        const params = [];

        if (city) {
            query += ` AND (city LIKE ? OR job_location LIKE ? OR location LIKE ?)`;
            const c = `%${city}%`;
            params.push(c, c, c);
        }

        query += ` ORDER BY posted_at DESC, createdAt DESC`;

        db.all(query, params, (err, rows) => {
            if (err) return res.status(500).json({ message: 'Error fetching jobs' });

            let result = (rows || []).map(j => {
                let jobLat = j.latitude;
                let jobLng = j.longitude;

                // City fallback if not geo-tagged
                if ((!jobLat || !jobLng) && j.city) {
                    const ck = j.city.toLowerCase().trim();
                    if (CITY_COORDINATES[ck]) {
                        jobLat = CITY_COORDINATES[ck].lat;
                        jobLng = CITY_COORDINATES[ck].lng;
                    }
                }

                let distance_km = null;
                if (lat && lng && jobLat && jobLng) {
                    distance_km = calculateDistance(lat, lng, jobLat, jobLng);
                }

                return {
                    ...j,
                    latitude: jobLat || null,
                    longitude: jobLng || null,
                    distance_km: distance_km
                };
            });

            // If radius filter is applied
            if (lat && lng && radius && !isNaN(parseFloat(radius))) {
                const maxR = parseFloat(radius);
                result = result.filter(j => j.distance_km !== null && j.distance_km <= maxR);
                // Sort by distance (nearest first)
                result.sort((a, b) => (a.distance_km || 99999) - (b.distance_km || 99999));
            } else if (lat && lng) {
                // If user provided location, sort with geo-tagged jobs nearest first
                result.sort((a, b) => {
                    if (a.distance_km !== null && b.distance_km !== null) return a.distance_km - b.distance_km;
                    if (a.distance_km !== null) return -1;
                    if (b.distance_km !== null) return 1;
                    return 0;
                });
            }

            res.json(result);
        });
    });
});

// Dedicated Geo-Location Nearby Jobs API
router.get('/nearby', (req, res) => {
    const { lat, lng, radius = 25 } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and Longitude parameters are required for nearby job lookup' });
    }

    autoExpireJobs(() => {
        db.all("SELECT * FROM jobs WHERE status = 'active' OR status = 'open'", [], (err, rows) => {
            if (err) return res.status(500).json({ message: 'Error querying nearby jobs' });

            const maxR = parseFloat(radius);
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);

            let nearby = (rows || []).map(j => {
                let jobLat = j.latitude;
                let jobLng = j.longitude;

                if ((!jobLat || !jobLng) && j.city) {
                    const ck = j.city.toLowerCase().trim();
                    if (CITY_COORDINATES[ck]) {
                        jobLat = CITY_COORDINATES[ck].lat;
                        jobLng = CITY_COORDINATES[ck].lng;
                    }
                }

                const dist = calculateDistance(userLat, userLng, jobLat, jobLng);
                return {
                    ...j,
                    latitude: jobLat || null,
                    longitude: jobLng || null,
                    distance_km: dist
                };
            }).filter(j => j.distance_km !== null && j.distance_km <= maxR);

            nearby.sort((a, b) => a.distance_km - b.distance_km);

            res.json({
                userCoordinates: { latitude: userLat, longitude: userLng },
                radiusKm: maxR,
                totalFound: nearby.length,
                jobs: nearby
            });
        });
    });
});

// Get Employer Jobs (Requirement 17)
router.get('/company', verifyToken, (req, res) => {
    autoExpireJobs(() => {
        const query = `
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applications a WHERE a.jobId = j.id OR a.jobId = j.job_id) as application_count
            FROM jobs j 
            WHERE j.companyId = ? OR j.employer_id = ?
            ORDER BY j.createdAt DESC
        `;
        db.all(query, [req.user.id, req.user.id], (err, rows) => {
            if (err) return res.status(500).json({ message: 'Error fetching company jobs' });
            res.json(rows);
        });
    });
});

// Get Single Job by ID (candidate view)
router.get('/:id', (req, res) => {
    const jobId = req.params.id;
    db.get('SELECT * FROM jobs WHERE id = ? OR job_id = ? OR CAST(id AS TEXT) = ?', [jobId, jobId, String(jobId)], (err, row) => {
        if (err || !row) return res.status(404).json({ message: 'Job not found' });
        res.json(row);
    });
});

module.exports = router;
