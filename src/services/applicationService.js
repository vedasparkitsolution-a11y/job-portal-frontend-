// REST Application Service — interacts purely with MySQL Backend API

import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api/applications`;

function getAuthHeader() {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const session = JSON.parse(localStorage.getItem('mock_current_session') || '{}');
        if (session && (session.role === 'jobseeker' || session.data?.role === 'jobseeker')) {
            headers['x-candidate-id'] = session.uid || session.data?.candidate_id || '';
            headers['x-candidate-email'] = session.email || session.data?.email || '';
            headers['x-candidate-name'] = session.data?.name || session.data?.full_name || 'Candidate';
            headers['x-user-role'] = 'jobseeker';
        }
    } catch (e) {}
    return headers;
}

function normalizeApplication(a) {
    if (!a) return null;
    const appId = a.applicationId || a.application_id || String(a.id);
    return {
        ...a,
        id: appId,
        applicationId: appId,
        jobId: a.jobId || a.job_id,
        employerId: a.employerId || a.employer_id || a.companyId,
        companyId: a.companyId || a.employerId || a.employer_id,
        candidateId: a.candidateId || a.candidate_id || a.applicantId,
        applicantId: a.applicantId || a.candidate_id || a.candidateId,
        candidateName: a.candidateName || a.candidate_name || a.applicantName || 'Candidate',
        applicantName: a.applicantName || a.candidate_name || a.candidateName || 'Candidate',
        profilePhoto: a.profilePhoto || a.profile_photo || '',
        education: a.education || 'Graduate',
        skills: a.skills || '',
        experience: a.experience || 'Fresher',
        joiningAvailability: a.joiningAvailability || a.joining_availability || 'Immediately',
        interviewAvailability: a.interviewAvailability || a.interview_availability || 'Anytime',
        applicationQuestions: typeof a.application_questions === 'string' ? (a.application_questions ? JSON.parse(a.application_questions) : []) : (a.applicationQuestions || []),
        applicationAnswers: typeof a.application_answers === 'string' ? (a.application_answers ? JSON.parse(a.application_answers) : {}) : (a.applicationAnswers || {}),
        resumeUrl: a.resume_url || a.resumeUrl || a.resumeURL || '',
        resumeURL: a.resume_url || a.resumeUrl || a.resumeURL || '',
        coverLetter: a.cover_letter || a.coverLetter || '',
        appliedDate: a.applied_date || a.appliedAt || a.appliedDate || new Date().toISOString(),
        appliedAt: a.appliedAt || a.applied_date || a.appliedDate || new Date().toISOString(),
        applicationStatus: a.status || a.applicationStatus || 'Applied',
        status: a.status || a.applicationStatus || 'Applied',
        matchScore: typeof a.matchScore === 'number' ? a.matchScore : 85,
        updatedAt: a.updatedAt || a.updated_at || new Date().toISOString()
    };
}

export async function createApplication(appData) {
    try {
        const res = await fetch(`${API_BASE}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(appData)
        });
        if (res.ok) {
            const data = await res.json();
            return data.applicationId || data.id;
        } else {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to submit application');
        }
    } catch (e) {
        console.error('Error submitting application:', e);
        throw e;
    }
}

export async function getApplicationsByJob(jobId) {
    try {
        const res = await fetch(`${API_BASE}/job/${jobId}`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
                return rows.map(normalizeApplication);
            }
        }
    } catch (e) {
        console.error(`Error fetching applications for job ${jobId}:`, e);
    }
    return [];
}

export async function getApplicationsByUser(userId, userEmail) {
    try {
        const queryParams = new URLSearchParams();
        if (userId) queryParams.append('userId', userId);
        if (userEmail) queryParams.append('email', userEmail);
        const url = `${API_BASE}/my-applications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const res = await fetch(url, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
                return rows.map(normalizeApplication);
            }
        }
    } catch (e) {
        console.error('Error fetching candidate applications:', e);
    }
    return [];
}

export async function hasUserApplied(userId, jobId, userEmail) {
    if (!jobId) return false;
    
    // Resolve candidate identity
    let finalUserId = userId;
    let finalEmail = userEmail;
    if (!finalUserId && !finalEmail) {
        try {
            const session = JSON.parse(localStorage.getItem('mock_current_session') || '{}');
            if (session && (session.role === 'jobseeker' || session.data?.role === 'jobseeker')) {
                finalUserId = session.uid || session.data?.candidate_id;
                finalEmail = session.email || session.data?.email;
            }
        } catch (e) {}
    }

    if (!finalUserId && !finalEmail) {
        return false;
    }

    try {
        const queryParams = new URLSearchParams();
        if (finalUserId) queryParams.append('userId', finalUserId);
        if (finalEmail) queryParams.append('email', finalEmail);
        const res = await fetch(`${API_BASE}/check-applied/${jobId}?${queryParams.toString()}`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const data = await res.json();
            return !!data.applied;
        }
    } catch (e) {
        console.error('Error checking application status:', e);
    }
    return false;
}

export async function getApplicationsByCompany(companyId, companyName) {
    try {
        const queryParams = new URLSearchParams();
        if (companyId) queryParams.append('companyId', companyId);
        if (companyName) queryParams.append('companyName', companyName);
        const url = `${API_BASE}/company${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const res = await fetch(url, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
                return rows.map(normalizeApplication);
            }
        }
    } catch (e) {
        console.error('Error fetching company applications:', e);
    }
    return [];
}

export async function getAllApplications() {
    return getApplicationsByUser();
}

export async function updateApplicationStatus(appId, newStatus, extraData = {}) {
    try {
        const res = await fetch(`${API_BASE}/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ applicationId: appId, status: newStatus, ...extraData })
        });
        return res.ok;
    } catch (e) {
        console.error(`Error updating status for application ${appId}:`, e);
        return false;
    }
}

export async function addEmployerNotification(employerId, type, message) {
    // Employer notifications recorded via backend activity
}

export async function addCandidateNotification(candidateId, type, message) {
    // Candidate notifications recorded via backend activity
}

export async function getCandidateNotifications(candidateId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/candidate/notifications`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) return rows;
        }
    } catch (e) {}
    return [];
}

export function getApplications() {
    return [];
}
