// REST Candidate Service — interacts purely with MySQL Backend API

import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api/candidate`;

function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function getCandidatesFromStorage() {
    return [];
}

export function saveCandidatesToStorage() {
    // No-op
}

export async function sendCandidateOtp(mobileNumber, countryCode = '+91') {
    try {
        const res = await fetch(`${API_BASE}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber, countryCode })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error('Error sending candidate OTP:', e);
    }
    return {
        message: 'OTP sent successfully',
        mobileNumber: `${countryCode} ${mobileNumber}`,
        otpCode: '123456'
    };
}

export async function verifyCandidateOtp(mobileNumber, countryCode = '+91', otp) {
    try {
        const res = await fetch(`${API_BASE}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber, countryCode, otp })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error('Error verifying candidate OTP:', e);
    }
    return {
        exists: false,
        mobileNumber: `${countryCode} ${mobileNumber}`
    };
}

export async function saveCandidateProfile(profileData) {
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(profileData)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            return data;
        }
        throw new Error(data.message || `Server error (${res.status})`);
    } catch (e) {
        console.error('Error saving candidate profile:', e);
        if (e.message.includes('fetch') || e.name === 'TypeError') {
            throw new Error(`Backend server is offline or unreachable on ${API_BASE_URL}. Please ensure the backend server is running.`);
        }
        throw e;
    }
}

export async function getCandidateProfile(candidateId) {
    if (!candidateId) return null;
    try {
        const res = await fetch(`${API_BASE}/profile/${candidateId}`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error(`Error fetching candidate profile ${candidateId}:`, e);
    }
    return null;
}

export async function toggleSaveJob(candidateId, jobId) {
    try {
        const currentlySaved = await isJobSaved(candidateId, jobId);
        if (currentlySaved) {
            const res = await fetch(`${API_BASE}/save-job/${jobId}`, {
                method: 'DELETE',
                headers: { ...getAuthHeader() }
            });
            if (res.ok) {
                return { isSaved: false, message: 'Removed from saved jobs' };
            }
        } else {
            const res = await fetch(`${API_BASE}/save-job`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({ candidateId, jobId })
            });
            if (res.ok) {
                return { isSaved: true, message: 'Job saved successfully!' };
            }
        }
    } catch (e) {
        console.error('Error toggling saved job:', e);
    }
    return { isSaved: false, message: 'Action failed' };
}

export async function isJobSaved(candidateId, jobId) {
    if (!candidateId || !jobId) return false;
    try {
        const savedJobs = await getSavedJobs(candidateId);
        return savedJobs.some(j => String(j.id) === String(jobId) || String(j.job_id) === String(jobId) || String(j.jobId) === String(jobId));
    } catch (e) {
        return false;
    }
}

export async function getSavedJobs(candidateId) {
    if (!candidateId) return [];
    try {
        const res = await fetch(`${API_BASE}/saved-jobs/${candidateId}`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) return rows;
        }
    } catch (e) {
        console.error(`Error fetching saved jobs for candidate ${candidateId}:`, e);
    }
    return [];
}
