// Mock & REST Job Service — supports SQLite API and localStorage fallback

const JOBS_KEY = 'mock_jobs';

const DEFAULT_SAMPLE_JOBS = [
    {
        id: 'JOB-10001',
        job_id: 'JOB-10001',
        jobId: 'JOB-10001',
        title: 'Sales Executive',
        job_title: 'Sales Executive',
        jobTitle: 'Sales Executive',
        companyName: 'Acme Innovations Pvt Ltd',
        company_name: 'Acme Innovations Pvt Ltd',
        location: 'Chennai, Tamil Nadu',
        job_location: 'Chennai, Tamil Nadu',
        jobType: 'Full Time',
        job_type: 'Full Time',
        workMode: 'On-site',
        experience: '1-3 Years',
        experience_type: 'Experienced Only',
        minimum_experience: '1',
        maximum_experience: '3',
        salary: '₹25,000 - ₹45,000 / monthly',
        salaryRange: '₹25,000 - ₹45,000 / monthly',
        description: 'We are seeking an ambitious Sales Executive to expand our client reach, drive corporate sales, generate qualified leads, and build strong business relationships.',
        job_description: 'We are seeking an ambitious Sales Executive to expand our client reach, drive corporate sales, generate qualified leads, and build strong business relationships.',
        skills: 'B2B Sales, Lead Generation, Client Relations, Communication, Negotiation',
        required_skills: 'B2B Sales, Lead Generation, Client Relations, Communication, Negotiation',
        education: 'Bachelor\'s Degree',
        qualification: 'Bachelor\'s Degree',
        status: 'active',
        jobStatus: 'active',
        applicationDeadline: '2026-12-31',
        application_deadline: '2026-12-31',
        createdAt: new Date().toISOString(),
        posted_at: new Date().toISOString()
    },
    {
        id: 'JOB-10002',
        job_id: 'JOB-10002',
        jobId: 'JOB-10002',
        title: 'Digital Marketing Specialist',
        job_title: 'Digital Marketing Specialist',
        jobTitle: 'Digital Marketing Specialist',
        companyName: 'TechVision Global',
        company_name: 'TechVision Global',
        location: 'Bangalore, Karnataka',
        job_location: 'Bangalore, Karnataka',
        jobType: 'Full Time',
        job_type: 'Full Time',
        workMode: 'Hybrid',
        experience: '0-1 Years',
        experience_type: 'Fresher / Entry Level',
        minimum_experience: '0',
        maximum_experience: '1',
        salary: '₹30,000 - ₹50,000 / monthly',
        salaryRange: '₹30,000 - ₹50,000 / monthly',
        description: 'Join our marketing team to manage digital campaigns, SEO, Google Ads, social media channels, and content strategy to drive user acquisition.',
        job_description: 'Join our marketing team to manage digital campaigns, SEO, Google Ads, social media channels, and content strategy to drive user acquisition.',
        skills: 'SEO, Google Ads, Social Media Marketing, Content Strategy, Google Analytics',
        required_skills: 'SEO, Google Ads, Social Media Marketing, Content Strategy, Google Analytics',
        education: 'Bachelor\'s Degree',
        qualification: 'Bachelor\'s Degree',
        status: 'active',
        jobStatus: 'active',
        applicationDeadline: '2026-12-31',
        application_deadline: '2026-12-31',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        posted_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'JOB-10003',
        job_id: 'JOB-10003',
        jobId: 'JOB-10003',
        title: 'Senior Frontend Developer (React)',
        job_title: 'Senior Frontend Developer (React)',
        jobTitle: 'Senior Frontend Developer (React)',
        companyName: 'CloudScale Technologies',
        company_name: 'CloudScale Technologies',
        location: 'Remote',
        job_location: 'Remote',
        jobType: 'Full Time',
        job_type: 'Full Time',
        workMode: 'Remote',
        experience: '3-5 Years',
        experience_type: 'Experienced Only',
        minimum_experience: '3',
        maximum_experience: '5',
        salary: '₹80,000 - ₹1,20,000 / monthly',
        salaryRange: '₹80,000 - ₹1,20,000 / monthly',
        description: 'Seeking an expert Frontend Engineer skilled in React.js, Redux, and modern Web APIs to build scalable web applications.',
        job_description: 'Seeking an expert Frontend Engineer skilled in React.js, Redux, and modern Web APIs to build scalable web applications.',
        skills: 'React.js, JavaScript, HTML5, CSS3, Redux, REST APIs',
        required_skills: 'React.js, JavaScript, HTML5, CSS3, Redux, REST APIs',
        education: 'B.E. / B.Tech / MCA',
        qualification: 'B.E. / B.Tech / MCA',
        status: 'active',
        jobStatus: 'active',
        applicationDeadline: '2026-12-31',
        application_deadline: '2026-12-31',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        posted_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: 'JOB-10004',
        job_id: 'JOB-10004',
        jobId: 'JOB-10004',
        title: 'HR Executive / Recruiter',
        job_title: 'HR Executive / Recruiter',
        jobTitle: 'HR Executive / Recruiter',
        companyName: 'PeopleFirst Solutions',
        company_name: 'PeopleFirst Solutions',
        location: 'Hyderabad, Telangana',
        job_location: 'Hyderabad, Telangana',
        jobType: 'Full Time',
        job_type: 'Full Time',
        workMode: 'On-site',
        experience: '1-3 Years',
        experience_type: 'Experienced Only',
        minimum_experience: '1',
        maximum_experience: '3',
        salary: '₹28,000 - ₹42,000 / monthly',
        salaryRange: '₹28,000 - ₹42,000 / monthly',
        description: 'Responsible for end-to-end recruitment, sourcing candidates, conducting interviews, onboarding, and managing employee relations.',
        job_description: 'Responsible for end-to-end recruitment, sourcing candidates, conducting interviews, onboarding, and managing employee relations.',
        skills: 'Talent Acquisition, Interviewing, Screening, Employee Engagement',
        required_skills: 'Talent Acquisition, Interviewing, Screening, Employee Engagement',
        education: 'MBA / BBA in HR',
        qualification: 'MBA / BBA in HR',
        status: 'active',
        jobStatus: 'active',
        applicationDeadline: '2026-12-31',
        application_deadline: '2026-12-31',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        posted_at: new Date(Date.now() - 10800000).toISOString()
    }
];

function getJobs() {
    let raw = [];
    try {
        const stored = localStorage.getItem(JOBS_KEY);
        if (stored) {
            raw = JSON.parse(stored);
        } else {
            // Seed initial sample jobs if localStorage is empty
            raw = DEFAULT_SAMPLE_JOBS;
            localStorage.setItem(JOBS_KEY, JSON.stringify(DEFAULT_SAMPLE_JOBS));
        }
    } catch (e) {
        raw = DEFAULT_SAMPLE_JOBS;
    }

    if (!Array.isArray(raw) || raw.length === 0) {
        raw = DEFAULT_SAMPLE_JOBS;
        try { localStorage.setItem(JOBS_KEY, JSON.stringify(DEFAULT_SAMPLE_JOBS)); } catch(e){}
    }

    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    } catch (e) {}

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    return raw.map((j, idx) => {
        const customJobId = j.job_id || j.jobId || j.id || `JOB-${10001 + idx}`;
        
        // Check auto expiry safely using Date objects
        let curStatus = j.status || j.jobStatus || 'active';
        const deadlineStr = j.application_deadline || j.applicationDeadline || j.deadline;
        if ((curStatus === 'active' || curStatus === 'open') && deadlineStr) {
            const dDate = new Date(deadlineStr);
            if (!isNaN(dDate.getTime()) && dDate < todayDate) {
                curStatus = 'expired';
            }
        }

        // Find matching company user to retrieve companyLogo if uploaded
        const companyUser = users.find(u => 
            (u.id && u.id === (j.companyId || j.employerId || j.company_id || j.employer_id)) || 
            (u.uid && u.uid === (j.companyId || j.employerId || j.company_id || j.employer_id)) ||
            (u.companyName && (j.companyName || j.company_name) && String(u.companyName).toLowerCase() === String(j.companyName || j.company_name).toLowerCase())
        );

        const companyName = j.company_name || j.companyName || companyUser?.companyName || 'Verified Employer';
        const companyLogo = j.company_logo || j.companyLogo || companyUser?.logoURL || companyUser?.logo || getCompanyLogoSvg(companyName);
        const title = j.job_title || j.title || j.jobTitle || 'Job Role';

        let parsedQuestions = j.application_questions || j.applicationQuestions || [];
        if (typeof parsedQuestions === 'string' && parsedQuestions.trim().startsWith('[')) {
            try { parsedQuestions = JSON.parse(parsedQuestions); } catch(e){}
        }

        return {
            ...j,
            job_id: customJobId,
            jobId: customJobId,
            id: j.id || customJobId,
            employer_id: j.employer_id || j.employerId || j.companyId || 'company-default',
            employerId: j.employerId || j.employer_id || j.companyId || 'company-default',
            company_id: j.company_id || j.companyId || j.employerId || 'company-default',
            companyId: j.companyId || j.company_id || j.employerId || 'company-default',
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
            application_deadline: deadlineStr || '2026-12-31',
            applicationDeadline: deadlineStr || '2026-12-31',
            application_questions: parsedQuestions,
            applicationQuestions: parsedQuestions,
            status: curStatus,
            jobStatus: curStatus,
            company_logo: companyLogo,
            companyLogo: companyLogo,
            createdAt: j.createdAt || j.posted_at || new Date().toISOString(),
            posted_at: j.posted_at || j.createdAt || new Date().toISOString()
        };
    });
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

function saveJobs(jobs) {
    try {
        localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    } catch (e) {
        console.warn('localStorage quota warning while saving jobs', e);
    }
}

function generateId() {
    const jobs = JSON.parse(localStorage.getItem(JOBS_KEY) || '[]');
    const nextNum = 10001 + jobs.length;
    return `JOB-${nextNum}`;
}

export async function createJob(jobData) {
    const formattedId = jobData.job_id || jobData.jobId || generateId();
    let backendJobId = null;

    // Try posting to backend REST API
    try {
        const token = localStorage.getItem('mock_current_session') ? JSON.parse(localStorage.getItem('mock_current_session')).token : null;
        const res = await fetch('http://localhost:5000/api/jobs/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...jobData, job_id: formattedId })
        });
        if (res.ok) {
            const data = await res.json();
            backendJobId = data.jobId;
        }
    } catch (e) {
        console.warn('Backend job post failed, relying on localStorage', e);
    }

    const rawJobs = JSON.parse(localStorage.getItem(JOBS_KEY) || '[]');
    const finalJobId = backendJobId || formattedId;
    const newJob = {
        id: finalJobId,
        job_id: finalJobId,
        jobId: finalJobId,
        employer_id: jobData.employer_id || jobData.employerId || jobData.companyId || 'company-1',
        employerId: jobData.employerId || jobData.employer_id || jobData.companyId || 'company-1',
        company_id: jobData.company_id || jobData.companyId || jobData.employerId || 'company-1',
        companyId: jobData.companyId || jobData.company_id || jobData.employerId || 'company-1',
        company_name: jobData.company_name || jobData.companyName || 'Hiring Company',
        companyName: jobData.companyName || jobData.company_name || 'Hiring Company',
        job_title: jobData.job_title || jobData.title || jobData.jobTitle || 'Job Role',
        title: jobData.title || jobData.job_title || jobData.jobTitle || 'Job Role',
        jobTitle: jobData.jobTitle || jobData.job_title || jobData.title || 'Job Role',
        job_description: jobData.job_description || jobData.description || jobData.jobDescription || '',
        description: jobData.description || jobData.job_description || jobData.jobDescription || '',
        skills: jobData.required_skills || jobData.skills || '',
        required_skills: jobData.required_skills || jobData.skills || '',
        preferred_skills: jobData.preferred_skills || '',
        qualification: jobData.education || jobData.qualification || 'Graduate',
        education: jobData.education || jobData.qualification || 'Graduate',
        experience: jobData.experience || (jobData.minimum_experience ? `${jobData.minimum_experience}-${jobData.maximum_experience || '3'} Years` : 'Any Experience'),
        salary: jobData.salary || jobData.salaryRange || '',
        salaryRange: jobData.salaryRange || jobData.salary || '',
        location: jobData.job_location || jobData.location || 'Chennai, Tamil Nadu',
        job_location: jobData.job_location || jobData.location || 'Chennai, Tamil Nadu',
        job_type: jobData.job_type || jobData.jobType || 'Full Time',
        jobType: jobData.jobType || jobData.job_type || 'Full Time',
        application_deadline: jobData.application_deadline || jobData.applicationDeadline || jobData.deadline || '2026-12-31',
        applicationDeadline: jobData.applicationDeadline || jobData.application_deadline || jobData.deadline || '2026-12-31',
        status: jobData.status || 'active',
        jobStatus: jobData.status || 'active',
        posted_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        viewsCount: 0,
        ...jobData
    };

    rawJobs.unshift(newJob);
    saveJobs(rawJobs);
    return finalJobId;
}

export async function getJob(jobId) {
    if (!jobId) return null;
    const target = String(jobId);

    // Try backend REST endpoint first
    try {
        const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`);
        if (res.ok) {
            const data = await res.json();
            if (data && (data.id || data.job_id || data.jobId)) {
                const normId = data.job_id || data.jobId || String(data.id);
                return {
                    ...data,
                    id: normId,
                    jobId: normId,
                    job_id: normId,
                    title: data.job_title || data.title || data.jobTitle,
                    jobTitle: data.job_title || data.title || data.jobTitle,
                    description: data.job_description || data.description,
                    location: data.job_location || data.location,
                    salary: data.salary || data.salaryRange,
                    companyName: data.company_name || data.companyName,
                    companyLogo: data.company_logo || data.companyLogo
                };
            }
        }
    } catch (e) {}

    // Fallback to localStorage mock
    const jobs = getJobs();
    return jobs.find(j => 
        String(j.id) === target || 
        String(j.jobId) === target || 
        String(j.job_id) === target
    ) || null;
}

export async function getAllJobs() {
    return getJobs().sort((a, b) => new Date(b.createdAt || b.posted_at) - new Date(a.createdAt || a.posted_at));
}

export async function getOpenJobs() {
    let apiJobs = [];
    try {
        const res = await fetch('http://localhost:5000/api/jobs/all');
        if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
                apiJobs = rows.map((j, idx) => {
                    const normId = j.job_id || j.jobId || String(j.id);
                    return {
                        ...j,
                        id: normId,
                        jobId: normId,
                        job_id: normId,
                        title: j.job_title || j.title || j.jobTitle,
                        jobTitle: j.job_title || j.title || j.jobTitle,
                        job_title: j.job_title || j.title || j.jobTitle,
                        description: j.job_description || j.description || j.jobDescription,
                        job_description: j.job_description || j.description || j.jobDescription,
                        location: j.job_location || j.location,
                        job_location: j.job_location || j.location,
                        jobType: j.jobType || j.job_type || 'Full Time',
                        job_type: j.job_type || j.jobType || 'Full Time',
                        salary: j.salary || j.salaryRange,
                        companyName: j.company_name || j.companyName || 'Verified Employer',
                        company_name: j.company_name || j.companyName || 'Verified Employer',
                        companyLogo: j.company_logo || j.companyLogo || getCompanyLogoSvg(j.company_name || j.companyName || 'Company'),
                        status: j.status || 'active',
                        jobStatus: j.status || 'active',
                        createdAt: j.createdAt || j.posted_at || new Date().toISOString(),
                        posted_at: j.posted_at || j.createdAt || new Date().toISOString()
                    };
                });
            }
        }
    } catch (e) {}

    const localJobs = getJobs().filter(j => j.status === 'active' || j.status === 'open' || j.jobStatus === 'active' || j.jobStatus === 'open');

    // Combine API jobs and Local jobs, removing duplicates by ID/jobId
    const combinedMap = new Map();
    [...apiJobs, ...localJobs].forEach(job => {
        const key = String(job.job_id || job.jobId || job.id);
        if (!combinedMap.has(key)) {
            combinedMap.set(key, job);
        }
    });

    const allCombined = Array.from(combinedMap.values());
    
    // Sort by latest posted date
    return allCombined
        .filter(j => j.status === 'active' || j.status === 'open' || j.jobStatus === 'active' || j.jobStatus === 'open')
        .sort((a, b) => new Date(b.createdAt || b.posted_at || 0) - new Date(a.createdAt || a.posted_at || 0));
}


export async function getPendingJobs() {
    return getJobs()
        .filter(j => j.status === 'pending' || j.jobStatus === 'pending')
        .sort((a, b) => new Date(b.createdAt || b.posted_at) - new Date(a.createdAt || a.posted_at));
}

export async function approveJob(jobId) {
    await updateJob(jobId, { status: 'active', jobStatus: 'active' });
}

export async function rejectJob(jobId) {
    await updateJob(jobId, { status: 'rejected', jobStatus: 'rejected' });
}

export async function getJobsByCompany(companyId) {
    return getJobs()
        .filter(j => j.companyId === companyId || j.employerId === companyId || j.company_id === companyId || j.employer_id === companyId)
        .sort((a, b) => new Date(b.createdAt || b.posted_at) - new Date(a.createdAt || a.posted_at));
}

export async function incrementJobViews(jobId) {
    const jobs = getJobs();
    const index = jobs.findIndex(j => j.id === jobId || j.jobId === jobId || j.job_id === jobId);
    if (index !== -1) {
        jobs[index].viewsCount = (jobs[index].viewsCount || 0) + 1;
        saveJobs(jobs);
    }
}

export async function updateJob(jobId, data) {
    const jobs = getJobs();
    const index = jobs.findIndex(j => j.id === jobId || j.jobId === jobId || j.job_id === jobId);
    if (index !== -1) {
        jobs[index] = { ...jobs[index], ...data, updated_at: new Date().toISOString() };
        saveJobs(jobs);
    }
}

export async function updateJobStatus(jobId, status) {
    await updateJob(jobId, { status, jobStatus: status });

    // Sync with backend API
    try {
        const token = localStorage.getItem('mock_current_session') ? JSON.parse(localStorage.getItem('mock_current_session')).token : null;
        await fetch(`http://localhost:5000/api/jobs/${jobId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
    } catch (e) {}
}

export async function duplicateJob(jobId) {
    const existing = await getJob(jobId);
    if (!existing) return null;

    const newId = generateId();
    const duplicated = {
        ...existing,
        id: newId,
        job_id: newId,
        jobId: newId,
        job_title: `${existing.job_title || existing.title || 'Job'} (Copy)`,
        title: `${existing.title || existing.job_title || 'Job'} (Copy)`,
        status: 'draft',
        jobStatus: 'draft',
        posted_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        viewsCount: 0
    };

    const jobs = getJobs();
    jobs.unshift(duplicated);
    saveJobs(jobs);
    return newId;
}

export async function deleteJob(jobId) {
    const jobs = getJobs().filter(j => j.id !== jobId && j.jobId !== jobId && j.job_id !== jobId);
    saveJobs(jobs);
}

export async function closeJob(jobId) {
    await updateJobStatus(jobId, 'closed');
}

export async function createJobByAdmin(jobData) {
    return await createJob({
        ...jobData,
        status: 'active',
        jobStatus: 'active',
        postedByAdmin: true
    });
}

