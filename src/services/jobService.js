// REST Job Service — interacts purely with MySQL Backend API

import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api/jobs`;

function getAuthHeader() {
    let token = localStorage.getItem('token');
    if (!token) {
        try {
            const sess = JSON.parse(localStorage.getItem('mock_current_session') || '{}');
            token = sess?.token;
        } catch (e) {}
    }
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function normalizeJob(j) {
    if (!j) return null;
    const normId = j.job_id || j.jobId || String(j.id);
    const title = j.job_title || j.title || j.jobTitle || 'Untitled Job';
    const companyName = j.company_name || j.companyName || 'Verified Employer';
    const companyLogo = j.company_logo || j.companyLogo || getCompanyLogoSvg(companyName);
    
    let parsedQuestions = j.application_questions || j.applicationQuestions || [];
    if (typeof parsedQuestions === 'string' && parsedQuestions.trim().startsWith('[')) {
        try { parsedQuestions = JSON.parse(parsedQuestions); } catch(e){}
    }

    return {
        ...j,
        id: normId,
        jobId: normId,
        job_id: normId,
        employer_id: j.employer_id || j.employerId || j.companyId || '',
        employerId: j.employerId || j.employer_id || j.companyId || '',
        company_id: j.company_id || j.companyId || j.employerId || '',
        companyId: j.companyId || j.company_id || j.employerId || '',
        company_name: companyName,
        companyName: companyName,
        job_title: title,
        title: title,
        jobTitle: title,
        job_description: j.job_description || j.description || j.jobDescription || '',
        description: j.description || j.job_description || j.jobDescription || '',
        job_location: j.job_location || j.location || 'Location Provided Upon Application',
        location: j.location || j.job_location || 'Location Provided Upon Application',
        job_type: j.job_type || j.jobType || 'Full Time',
        jobType: j.jobType || j.job_type || 'Full Time',
        skills: j.skills || j.required_skills || '',
        required_skills: j.required_skills || j.skills || '',
        qualification: j.qualification || j.education || 'Graduate',
        education: j.education || j.qualification || 'Graduate',
        experience: j.experience || (j.minimum_experience ? `${j.minimum_experience}-${j.maximum_experience || '3'} Years` : 'Any Experience'),
        salary: j.salary || j.salaryRange || (j.minimum_salary ? `₹${j.minimum_salary} - ₹${j.maximum_salary}` : 'Competitive Salary'),
        salaryRange: j.salaryRange || j.salary || '',
        application_deadline: j.application_deadline || j.applicationDeadline || '2026-12-31',
        applicationDeadline: j.applicationDeadline || j.application_deadline || '2026-12-31',
        application_questions: parsedQuestions,
        applicationQuestions: parsedQuestions,
        status: j.status || 'active',
        jobStatus: j.status || 'active',
        company_logo: companyLogo,
        companyLogo: companyLogo,
        createdAt: j.createdAt || j.posted_at || new Date().toISOString(),
        posted_at: j.posted_at || j.createdAt || new Date().toISOString()
    };
}

function getCompanyLogoSvg(companyName = 'Company') {
    const safeName = typeof companyName === 'string' && companyName.trim() ? companyName.trim() : 'Company';
    const words = safeName.split(/\s+/).filter(Boolean);
    const initials = (words.map(w => w[0]).join('').substring(0, 2) || 'CO').toUpperCase();
    const bgGradients = [
        'linear-gradient(135deg, #0ea5e9, #0284c7)',
        'linear-gradient(135deg, #6366f1, #4f46e5)',
        'linear-gradient(135deg, #10b981, #059669)',
        'linear-gradient(135deg, #f59e0b, #d97706)',
        'linear-gradient(135deg, #8b5cf6, #6d28d9)'
    ];
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    const bg = bgGradients[Math.abs(hash) % bgGradients.length];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0ea5e9"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <rect width="60" height="60" rx="14" fill="url(#grad)"/>
      <text x="50%" y="54%" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function createJob(jobData) {
    try {
        const res = await fetch(`${API_BASE}/post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(jobData)
        });
        if (res.ok) {
            const data = await res.json();
            return data.jobId || data.id;
        } else {
            const errData = await res.json();
            throw new Error(errData.message || 'Failed to post job');
        }
    } catch (e) {
        console.error('Error creating job:', e);
        throw e;
    }
}

export async function getJob(jobId) {
    if (!jobId) return null;
    try {
        const res = await fetch(`${API_BASE}/${jobId}`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const data = await res.json();
            return normalizeJob(data);
        }
    } catch (e) {
        console.error(`Error fetching job ${jobId}:`, e);
    }
    return null;
}

export async function getOpenJobs() {
    try {
        const res = await fetch(`${API_BASE}/all`);
        if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
                return rows.map(normalizeJob);
            }
        }
    } catch (e) {
        console.error('Error fetching open jobs:', e);
    }
    return [];
}

export async function getAllJobs() {
    return getOpenJobs();
}

export async function getPendingJobs() {
    try {
        const jobs = await getOpenJobs();
        return jobs.filter(j => j.status === 'pending' || j.jobStatus === 'pending');
    } catch (e) {
        return [];
    }
}

export async function approveJob(jobId) {
    await updateJobStatus(jobId, 'active');
}

export async function rejectJob(jobId) {
    await updateJobStatus(jobId, 'rejected');
}

export async function getJobsByCompany(companyId, companyName) {
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
                return rows.map(normalizeJob);
            }
        }
    } catch (e) {
        console.error('Error fetching company jobs:', e);
    }
    return [];
}

export async function incrementJobViews(jobId) {
    // Analytics view increment placeholder
}

export async function updateJob(jobId, data) {
    try {
        const res = await fetch(`${API_BASE}/${jobId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) {
        console.error(`Error updating job ${jobId}:`, e);
        return false;
    }
}

export async function updateJobStatus(jobId, status) {
    try {
        const res = await fetch(`${API_BASE}/${jobId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ status })
        });
        return res.ok;
    } catch (e) {
        console.error(`Error updating job status ${jobId}:`, e);
        return false;
    }
}

export async function duplicateJob(jobId) {
    const existing = await getJob(jobId);
    if (!existing) return null;

    const duplicated = {
        ...existing,
        job_title: `${existing.job_title || existing.title || 'Job'} (Copy)`,
        title: `${existing.title || existing.job_title || 'Job'} (Copy)`,
        status: 'draft',
        jobStatus: 'draft'
    };

    return await createJob(duplicated);
}

export async function deleteJob(jobId) {
    return await updateJobStatus(jobId, 'deleted');
}

export async function closeJob(jobId) {
    return await updateJobStatus(jobId, 'closed');
}

export async function createJobByAdmin(jobData) {
    return await createJob({
        ...jobData,
        status: 'active',
        jobStatus: 'active',
        postedByAdmin: true
    });
}
