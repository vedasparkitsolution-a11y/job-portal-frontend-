// Candidate Service — Manages Candidate Auth, Profile, Saved Jobs & Recommendations

const CANDIDATES_KEY = 'mock_candidates';
const SAVED_JOBS_KEY = 'mock_saved_jobs';

function safeSetLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`LocalStorage quota exceeded for ${key}`);
    }
}

export function getCandidatesFromStorage() {
    return JSON.parse(localStorage.getItem(CANDIDATES_KEY) || '[]');
}

export function saveCandidatesToStorage(candidates) {
    safeSetLocalStorage(CANDIDATES_KEY, JSON.stringify(candidates));
}

// 1. Send OTP for candidate
export async function sendCandidateOtp(mobileNumber, countryCode = '+91') {
    try {
        const res = await fetch('http://localhost:5000/api/candidate/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber, countryCode })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {}

    // Fallback
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    return {
        message: 'OTP sent successfully',
        mobileNumber: `${countryCode} ${mobileNumber}`,
        otpCode
    };
}

// 2. Verify OTP for candidate
export async function verifyCandidateOtp(mobileNumber, countryCode = '+91', otp) {
    try {
        const res = await fetch('http://localhost:5000/api/candidate/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber, countryCode, otp })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {}

    // Fallback LocalStorage check
    const fullMobile = `${countryCode} ${mobileNumber.trim()}`;
    const candidates = getCandidatesFromStorage();
    const existing = candidates.find(c => c.mobile_number === fullMobile || c.mobile_number === mobileNumber);

    if (existing) {
        return {
            exists: true,
            candidate: existing,
            token: 'mock_token_' + Date.now()
        };
    } else {
        return {
            exists: false,
            mobileNumber: fullMobile
        };
    }
}

// 3. Save Candidate Profile (Multi-step)
export async function saveCandidateProfile(profileData) {
    try {
        const res = await fetch('http://localhost:5000/api/candidate/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        if (res.ok) {
            const data = await res.json();
            // Sync with local storage
            updateLocalStorageCandidate(data.candidate_id || profileData.candidate_id, profileData);
            return data;
        }
    } catch (e) {}

    // Fallback LocalStorage
    const candidates = getCandidatesFromStorage();
    const candidateId = profileData.candidate_id || `CAND-${10001 + candidates.length}`;
    const index = candidates.findIndex(c => c.candidate_id === candidateId || c.mobile_number === profileData.mobile_number);

    const fullProfile = {
        candidate_id: candidateId,
        mobile_verified: 1,
        profile_completed: 1,
        profile_completion_percentage: profileData.profile_completion_percentage || 85,
        updated_at: new Date().toISOString(),
        ...profileData
    };

    if (index !== -1) {
        candidates[index] = { ...candidates[index], ...fullProfile };
    } else {
        candidates.unshift(fullProfile);
    }
    saveCandidatesToStorage(candidates);

    return {
        message: '🎉 Your Profile Has Been Created Successfully!',
        candidate_id: candidateId,
        candidate: fullProfile,
        profile_completion_percentage: fullProfile.profile_completion_percentage,
        token: 'mock_token_' + Date.now()
    };
}

function updateLocalStorageCandidate(candidateId, profileData) {
    const candidates = getCandidatesFromStorage();
    const index = candidates.findIndex(c => c.candidate_id === candidateId || c.mobile_number === profileData.mobile_number);
    if (index !== -1) {
        candidates[index] = { ...candidates[index], ...profileData };
    } else {
        candidates.unshift({ candidate_id: candidateId, ...profileData });
    }
    saveCandidatesToStorage(candidates);
}

// 4. Get Candidate Profile
export async function getCandidateProfile(candidateId) {
    try {
        const res = await fetch(`http://localhost:5000/api/candidate/profile/${candidateId}`);
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {}

    const candidates = getCandidatesFromStorage();
    return candidates.find(c => c.candidate_id === candidateId || c.email === candidateId || c.mobile_number === candidateId) || null;
}

// 5. Save Job / Unsave Job
export async function toggleSaveJob(candidateId, jobId) {
    const saved = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]');
    const index = saved.findIndex(s => (s.candidate_id === candidateId || s.candidateId === candidateId) && (s.job_id === jobId || s.jobId === jobId));

    if (index !== -1) {
        // Unsave
        saved.splice(index, 1);
        safeSetLocalStorage(SAVED_JOBS_KEY, JSON.stringify(saved));
        try {
            await fetch(`http://localhost:5000/api/candidate/save-job/${jobId}`, { method: 'DELETE' });
        } catch (e) {}
        return { isSaved: false, message: 'Removed from saved jobs' };
    } else {
        // Save
        saved.unshift({ candidate_id: candidateId, job_id: jobId, saved_at: new Date().toISOString() });
        safeSetLocalStorage(SAVED_JOBS_KEY, JSON.stringify(saved));
        try {
            await fetch('http://localhost:5000/api/candidate/save-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId, jobId })
            });
        } catch (e) {}
        return { isSaved: true, message: 'Job saved successfully!' };
    }
}

export async function isJobSaved(candidateId, jobId) {
    const saved = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]');
    return saved.some(s => (s.candidate_id === candidateId || s.candidateId === candidateId) && (s.job_id === jobId || s.jobId === jobId));
}

export async function getSavedJobs(candidateId) {
    const saved = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]');
    const userSaved = saved.filter(s => s.candidate_id === candidateId || s.candidateId === candidateId);
    const savedJobIds = userSaved.map(s => s.job_id || s.jobId);

    const jobs = JSON.parse(localStorage.getItem('mock_jobs') || '[]');
    return jobs.filter(j => savedJobIds.includes(j.id) || savedJobIds.includes(j.job_id) || savedJobIds.includes(j.jobId));
}
