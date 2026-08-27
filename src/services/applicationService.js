// Application Service with SQLite REST API integration & localStorage fallback

const APPLICATIONS_KEY = 'mock_applications';
const CANDIDATE_NOTIFS_KEY = 'candidate_notifications';
const COMPANY_NOTIFS_KEY = 'company_notifications';

function getSessionToken() {
    try {
        const session = localStorage.getItem('mock_current_session');
        if (session) {
            const parsed = JSON.parse(session);
            return parsed.token || null;
        }
    } catch (e) {}
    return null;
}

export function getApplications() {
    const raw = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    return raw.map((a, idx) => ({
        ...a,
        applicationId: a.applicationId || a.id || `APP-${10001 + idx}`,
        id: a.id || a.applicationId || `APP-${10001 + idx}`,
        jobId: a.jobId,
        employerId: a.employerId || a.companyId,
        companyId: a.companyId || a.employerId,
        candidateId: a.candidateId || a.applicantId,
        applicantId: a.applicantId || a.candidateId,
        candidateName: a.candidateName || a.applicantName || 'Candidate',
        applicantName: a.applicantName || a.candidateName || 'Candidate',
        profilePhoto: a.profilePhoto || a.photoURL || '',
        education: a.education || a.qualification || 'Graduate',
        skills: a.skills || '',
        experience: a.experience || 'Fresher',
        joiningAvailability: a.joiningAvailability || 'Immediately',
        interviewAvailability: a.interviewAvailability || 'Anytime',
        applicationQuestions: a.applicationQuestions || [],
        applicationAnswers: a.applicationAnswers || {},
        // Raw private fields stored locally for candidate's own view
        candidateEmail: a.candidateEmail || a.applicantEmail || '',
        applicantEmail: a.applicantEmail || a.candidateEmail || '',
        candidatePhone: a.candidatePhone || a.phone || '',
        candidateLocation: a.candidateLocation || a.address || a.location || 'Location Not Specified',
        resumeUrl: a.resumeUrl || a.resumeURL || '',
        resumeURL: a.resumeURL || a.resumeUrl || '',
        coverLetter: a.coverLetter || a.coverMessage || '',
        coverMessage: a.coverMessage || a.coverLetter || '',
        appliedDate: a.appliedDate || a.appliedAt || new Date().toISOString(),
        appliedAt: a.appliedAt || a.appliedDate || new Date().toISOString(),
        applicationStatus: a.applicationStatus || a.status || 'Applied',
        status: a.status || a.applicationStatus || 'Applied',
        matchScore: typeof a.matchScore === 'number' ? a.matchScore : (a.aiMatch || 85),
        recruiterNotes: a.recruiterNotes || '',
        interviewDate: a.interviewDate || '',
        interviewTime: a.interviewTime || '',
        interviewType: a.interviewType || 'Online Interview',
        meetingLink: a.meetingLink || '',
        updatedAt: a.updatedAt || new Date().toISOString()
    }));
}

function saveApplications(apps) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

function generateAppId() {
    const apps = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    return `APP-${10001 + apps.length}`;
}

// Notification Helpers
export function addEmployerNotification(employerId, type, message) {
    const stored = JSON.parse(localStorage.getItem(COMPANY_NOTIFS_KEY) || '[]');
    stored.unshift({
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        employerId,
        type,
        message,
        read: false,
        time: new Date().toISOString()
    });
    localStorage.setItem(COMPANY_NOTIFS_KEY, JSON.stringify(stored.slice(0, 50)));
}

export function addCandidateNotification(candidateId, type, message) {
    const stored = JSON.parse(localStorage.getItem(CANDIDATE_NOTIFS_KEY) || '[]');
    stored.unshift({
        id: 'cnotif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        candidateId,
        type,
        message,
        read: false,
        time: new Date().toISOString()
    });
    localStorage.setItem(CANDIDATE_NOTIFS_KEY, JSON.stringify(stored.slice(0, 50)));
}

export function getCandidateNotifications(candidateId) {
    const stored = JSON.parse(localStorage.getItem(CANDIDATE_NOTIFS_KEY) || '[]');
    return stored.filter(n => !n.candidateId || n.candidateId === candidateId);
}

// Create Application with Screening Answers & Candidate snapshot
export async function createApplication(appData) {
    const apps = getApplications();
    const candidateId = appData.candidateId || appData.applicantId;
    const jobId = appData.jobId;

    // Check duplicate
    const existing = apps.find(a => 
        (String(a.candidateId) === String(candidateId) || String(a.applicantId) === String(candidateId)) && 
        (String(a.jobId) === String(jobId))
    );
    
    if (existing) {
        throw new Error('You have already applied for this job.');
    }

    let backendAppId = null;
    const token = getSessionToken();

    if (token) {
        try {
            const res = await fetch('http://localhost:5000/api/applications/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    jobId: appData.jobId,
                    companyId: appData.companyId,
                    employerId: appData.employerId,
                    candidateName: appData.candidateName || appData.applicantName,
                    education: appData.education,
                    skills: appData.skills,
                    experience: appData.experience,
                    resumeUrl: appData.resumeUrl || appData.resumeURL,
                    coverLetter: appData.coverLetter || appData.coverMessage,
                    applicationQuestions: appData.applicationQuestions || [],
                    applicationAnswers: appData.applicationAnswers || {},
                    joiningAvailability: appData.joiningAvailability || 'Immediately',
                    interviewAvailability: appData.interviewAvailability || 'Anytime'
                })
            });

            if (res.ok) {
                const data = await res.json();
                backendAppId = data.applicationId;
            } else {
                const errData = await res.json().catch(() => ({}));
                if (errData.message && errData.message.includes('already applied')) {
                    throw new Error(errData.message);
                }
            }
        } catch (e) {
            if (e.message && e.message.includes('already applied')) {
                throw e;
            }
            console.warn('Backend application submission error:', e);
        }
    }

    const appId = backendAppId || generateAppId();
    const newApp = {
        id: appId,
        applicationId: appId,
        jobId,
        employerId: appData.employerId || appData.companyId,
        companyId: appData.companyId || appData.employerId,
        candidateId,
        applicantId: candidateId,
        candidateName: appData.candidateName || appData.applicantName || 'Candidate',
        applicantName: appData.applicantName || appData.candidateName || 'Candidate',
        profilePhoto: appData.profilePhoto || '',
        education: appData.education || 'Graduate',
        skills: appData.skills || '',
        experience: appData.experience || 'Fresher',
        joiningAvailability: appData.joiningAvailability || 'Immediately',
        interviewAvailability: appData.interviewAvailability || 'Anytime',
        applicationQuestions: appData.applicationQuestions || [],
        applicationAnswers: appData.applicationAnswers || {},
        candidateEmail: appData.candidateEmail || appData.applicantEmail || '',
        applicantEmail: appData.applicantEmail || appData.candidateEmail || '',
        candidatePhone: appData.candidatePhone || appData.phone || '',
        candidateLocation: appData.candidateLocation || appData.location || '',
        resumeUrl: appData.resumeUrl || appData.resumeURL || '',
        resumeURL: appData.resumeURL || appData.resumeUrl || '',
        coverLetter: appData.coverLetter || appData.coverMessage || '',
        coverMessage: appData.coverMessage || appData.coverLetter || '',
        appliedDate: new Date().toISOString(),
        appliedAt: new Date().toISOString(),
        applicationStatus: 'Applied',
        status: 'Applied',
        matchScore: typeof appData.matchScore === 'number' ? appData.matchScore : 85,
        recruiterNotes: '',
        interviewDate: '',
        interviewTime: '',
        interviewType: 'Online Interview',
        meetingLink: '',
        updatedAt: new Date().toISOString(),
        jobTitle: appData.jobTitle || 'Position',
        companyName: appData.companyName || 'Company'
    };

    apps.unshift(newApp);
    saveApplications(apps);

    // Notify Employer
    addEmployerNotification(
        newApp.employerId,
        'application',
        `New application received for ${newApp.jobTitle} from ${newApp.candidateName}.`
    );

    return appId;
}

// Get Applications for a Job (Strictly sanitize candidate contact details for Employer privacy)
export async function getApplicationsByJob(jobId) {
    const token = getSessionToken();
    if (token) {
        try {
            const res = await fetch(`http://localhost:5000/api/applications/job/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('Failed to fetch applications from backend API:', e);
        }
    }

    // Fallback to localStorage with Strict Privacy Protection applied
    const apps = getApplications();
    const jobApps = apps.filter(a => String(a.jobId) === String(jobId));

    return jobApps.map(a => ({
        ...a,
        isContactPrivate: true,
        // Hide private fields by default
        candidateEmail: '[Hidden for Privacy]',
        applicantEmail: '[Hidden for Privacy]',
        candidatePhone: '[Hidden for Privacy]',
        phone: '[Hidden for Privacy]',
        candidateLocation: a.candidateLocation ? a.candidateLocation.split(',')[0] : 'Location Protected',
        email: '[Hidden for Privacy]'
    }));
}

// Get Applications for a candidate
export async function getApplicationsByUser(userId) {
    const token = getSessionToken();
    if (token) {
        try {
            const res = await fetch('http://localhost:5000/api/applications/my-applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    return data.map(item => ({
                        ...item,
                        id: item.id || item.application_id,
                        applicationId: item.application_id || item.id,
                        jobTitle: item.jobTitle || item.title || 'Position',
                        companyName: item.companyName || 'Company',
                        status: item.status || 'Applied',
                        applicationStatus: item.status || 'Applied',
                        appliedDate: item.applied_date || item.appliedAt,
                        applicationQuestions: typeof item.application_questions === 'string' ? (item.application_questions ? JSON.parse(item.application_questions) : []) : (item.application_questions || []),
                        applicationAnswers: typeof item.application_answers === 'string' ? (item.application_answers ? JSON.parse(item.application_answers) : {}) : (item.application_answers || {})
                    }));
                }
            }
        } catch (e) {}
    }

    const apps = getApplications();
    return apps.filter(a => String(a.candidateId) === String(userId) || String(a.applicantId) === String(userId));
}

// Check if candidate already applied
export async function hasUserApplied(userId, jobId) {
    const apps = getApplications();
    const localMatch = apps.some(a => 
        (String(a.candidateId) === String(userId) || String(a.applicantId) === String(userId)) && 
        (String(a.jobId) === String(jobId))
    );
    if (localMatch) return true;

    const token = getSessionToken();
    if (token && jobId) {
        try {
            const res = await fetch(`http://localhost:5000/api/applications/check-applied/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                return data.applied;
            }
        } catch (e) {}
    }

    return false;
}

export async function getApplicationsByCompany(companyId) {
    const apps = getApplications();
    return apps.filter(a => String(a.companyId) === String(companyId) || String(a.employerId) === String(companyId));
}

export async function getAllApplications() {
    return getApplications().sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
}

// Update Application Status & Notify candidate
export async function updateApplicationStatus(appId, newStatus, extraData = {}) {
    const token = getSessionToken();
    if (token) {
        try {
            await fetch('http://localhost:5000/api/applications/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ applicationId: appId, status: newStatus, ...extraData })
            });
        } catch (e) {}
    }

    const apps = getApplications();
    const index = apps.findIndex(a => a.id === appId || a.applicationId === appId);
    if (index !== -1) {
        const app = apps[index];
        apps[index] = {
            ...app,
            applicationStatus: newStatus,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            ...extraData
        };
        saveApplications(apps);

        // Send Candidate Notification
        if (newStatus === 'Shortlisted') {
            addCandidateNotification(app.candidateId, 'status', `Your application for ${app.jobTitle} has been shortlisted.`);
        } else if (newStatus === 'Rejected') {
            addCandidateNotification(app.candidateId, 'status', `Your application status for ${app.jobTitle} has been updated to Rejected.`);
        } else if (newStatus === 'Interview Scheduled') {
            addCandidateNotification(app.candidateId, 'status', `Interview scheduled for ${app.jobTitle}.`);
        } else if (newStatus === 'Selected') {
            addCandidateNotification(app.candidateId, 'status', `Congratulations! You have been selected for ${app.jobTitle}.`);
        } else {
            addCandidateNotification(app.candidateId, 'status', `Application status for ${app.jobTitle} changed to ${newStatus}.`);
        }
    }
}
