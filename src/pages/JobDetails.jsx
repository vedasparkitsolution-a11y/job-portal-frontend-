import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getJob } from '../services/jobService';
import { createApplication, hasUserApplied } from '../services/applicationService';
import { sendApplicationNotification } from '../services/emailService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import { format } from 'date-fns';
import {
    FiMapPin, FiBriefcase, FiDollarSign, FiClock, FiCalendar,
    FiMail, FiArrowLeft, FiSend, FiUsers, FiGlobe, FiCheckCircle,
    FiPhone, FiCheck, FiTag, FiAward, FiExternalLink, FiInfo
} from 'react-icons/fi';

// Helper to safely convert comma-separated string or array into array of strings
function parseArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
    if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [String(val)];
}

import ApplicationQuestionsModal from '../components/ApplicationQuestionsModal';

function JobDetailsContent() {
    const { id } = useParams();
    const { currentUser, userRole, userData, refreshUserData } = useAuth();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applied, setApplied] = useState(false);
    const [applying, setApplying] = useState(false);
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
    const [coverMessage, setCoverMessage] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadJob();
    }, [id]);

    async function loadJob() {
        setLoading(true);
        try {
            const data = await getJob(id);
            setJob(data);
            if (currentUser && userRole === 'jobseeker' && data) {
                const alreadyApplied = await hasUserApplied(currentUser.uid, data.id || data.job_id || id);
                setApplied(alreadyApplied);
            }
        } catch (err) {
            console.error('Failed to load job:', err);
        }
        setLoading(false);
    }

    // Step 1: Candidate clicks Apply Now -> Open Questions Modal (Requirement 1, 4, 11)
    function handleApplyClick(e) {
        if (e) e.preventDefault();
        if (!currentUser) {
            navigate(`/login?redirect=/jobs/${id}`);
            return;
        }

        if (userRole === 'company') {
            alert('You are currently logged in as an Employer. Please log in as a Job Seeker to apply for jobs.');
            return;
        }

        // Open application screening questions modal
        setIsQuestionsModalOpen(true);
    }

    // Step 2: Handle Question Submission & Save Application
    async function handleQuestionsSubmit(submissionData) {
        setApplying(true);
        try {
            const finalCandidateName = userData?.name || userData?.full_name || 'DIVYABHARATHI R';
            const finalEdu = userData?.department || userData?.qualification || 'B.Tech / B.E.';
            const finalSkills = userData?.skills || job?.required_skills || 'Relevant Domain Skills';
            const finalExp = (userData?.internships && userData.internships.length > 0) 
                ? `${userData.internships[0].company} (${userData.internships[0].role})` 
                : (userData?.experience || 'Fresher');

            await createApplication({
                jobId: job.id || job.job_id || id,
                jobTitle: job.job_title || job.title || job.jobTitle || 'Position',
                companyId: job.company_id || job.companyId || job.employer_id,
                employerId: job.employer_id || job.employerId || job.companyId,
                companyName: job.company_name || job.companyName || 'Company',
                candidateId: currentUser.uid,
                applicantId: currentUser.uid,
                candidateName: finalCandidateName,
                applicantName: finalCandidateName,
                candidateEmail: userData?.email || currentUser.email,
                applicantEmail: userData?.email || currentUser.email,
                candidatePhone: userData?.phone || userData?.mobile_number || '',
                candidateLocation: userData?.address || userData?.city || 'Chennai, India',
                education: finalEdu,
                skills: finalSkills,
                experience: finalExp,
                resumeURL: userData?.resumeURL || userData?.resumeUrl || '',
                resumeUrl: userData?.resumeURL || userData?.resumeUrl || '',
                coverMessage,
                coverLetter: coverMessage,
                applicationQuestions: submissionData.applicationQuestions || [],
                applicationAnswers: submissionData.applicationAnswers || {},
                joiningAvailability: submissionData.joiningAvailability || 'Immediately',
                interviewAvailability: submissionData.interviewAvailability || 'Anytime'
            });

            await refreshUserData();

            await sendApplicationNotification({
                companyEmail: job.company_email || job.contactEmail,
                companyName: job.company_name || job.companyName,
                applicantName: finalCandidateName,
                jobTitle: job.job_title || job.title
            });

            setApplied(true);
            setMessage('🎉 Application submitted successfully!');
        } catch (err) {
            setMessage(err.message || 'Failed to submit application. Please try again.');
            throw err;
        } finally {
            setApplying(false);
        }
    }

    async function handleExternalApply(e) {
        if (e) e.preventDefault();
        if (job?.application_method === 'External Application Link' && (job?.application_url || job?.googleFormLink)) {
            const url = job.application_url || job.googleFormLink;
            window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
        }
    }

    if (loading) return <LoadingSpinner />;
    if (!job) {
        return (
            <div style={{ background: '#f8fafc', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ background: 'white', padding: '40px 32px', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '480px' }}>
                    <FiInfo size={48} style={{ color: '#0ea5e9', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Job Posting Not Found</h3>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>The job listing you are looking for might have been closed, expired, or removed.</p>
                    <Link to="/jobs" className="btn btn-primary">Browse All Jobs</Link>
                </div>
            </div>
        );
    }

    // Status check
    const jobStatus = (job.status || job.jobStatus || 'active').toLowerCase();
    const isJobActive = jobStatus === 'active' || jobStatus === 'open';

    let deadline = null;
    let isExpired = jobStatus === 'expired';
    const rawDeadline = job.application_deadline || job.deadline;

    if (rawDeadline) {
        try {
            deadline = rawDeadline?.toDate ? rawDeadline.toDate() : new Date(rawDeadline);
            if (isNaN(deadline.getTime())) {
                deadline = null;
            } else {
                const deadlineDate = new Date(deadline);
                deadlineDate.setHours(23, 59, 59, 999);
                if (deadlineDate < new Date()) {
                    isExpired = true;
                }
            }
        } catch (e) {
            deadline = null;
        }
    }

    // Parse Responsibilities
    let responsibilitiesList = [];
    if (job.responsibilities) {
        try {
            if (typeof job.responsibilities === 'string' && job.responsibilities.trim().startsWith('[')) {
                responsibilitiesList = JSON.parse(job.responsibilities);
            } else if (typeof job.responsibilities === 'string') {
                responsibilitiesList = job.responsibilities.split('\n').map(s => s.trim()).filter(Boolean);
            } else if (Array.isArray(job.responsibilities)) {
                responsibilitiesList = job.responsibilities;
            }
        } catch (e) {
            responsibilitiesList = [String(job.responsibilities)];
        }
    }

    const requiredSkillsList = parseArray(job.required_skills || job.skills);
    const preferredSkillsList = parseArray(job.preferred_skills);
    const benefitsList = parseArray(job.benefits);
    const companyInitial = String(job.company_name || job.companyName || 'C').charAt(0).toUpperCase();

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '30px 20px 80px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Back Button */}
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <FiArrowLeft /> Back to Jobs
                </button>

                {/* MAIN JOB HEADER CARD */}
                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '76px', height: '76px', borderRadius: '20px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.8rem', overflow: 'hidden', border: '1px solid #ddd6fe', flexShrink: 0 }}>
                                {job.company_logo || job.companyLogo ? (
                                    <img src={job.company_logo || job.companyLogo} alt={job.company_name || job.companyName || 'Company'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    companyInitial
                                )}
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                                        {job.job_title || job.title || job.jobTitle || 'Job Opening'}
                                    </h1>
                                    {(job.hiring_priority === 'Urgent' || job.hiringPriority === 'Urgent') && (
                                        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '3px 12px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 800 }}>
                                            🔥 Urgent Hiring
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{job.company_name || job.companyName || 'Verified Company'}</span>
                                    {job.company_website || job.companyWebsite ? (
                                        <a href={job.company_website || job.companyWebsite} target="_blank" rel="noreferrer" style={{ color: '#64748b', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                            <FiGlobe /> Website <FiExternalLink size={12} />
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <span style={{ padding: '6px 16px', borderRadius: '20px', background: '#f5f3ff', color: '#7c3aed', fontWeight: 800, fontSize: '0.88rem', border: '1px solid #ddd6fe' }}>
                            {job.job_type || job.jobType || 'Full Time'}
                        </span>
                    </div>

                    {/* TOP SUMMARY TILES GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <div>
                            <span style={tileLabelStyle}><FiMapPin style={{ color: '#0ea5e9' }} /> Location & Mode</span>
                            <div style={tileValStyle}>{job.job_location || job.location || 'Remote'} ({job.location_type || 'On-site'})</div>
                        </div>
                        <div>
                            <span style={tileLabelStyle}><FiBriefcase style={{ color: '#6366f1' }} /> Total Experience</span>
                            <div style={tileValStyle}>{job.experience || job.experience_type || 'Any Experience'}</div>
                        </div>
                        <div>
                            <span style={tileLabelStyle}><FiDollarSign style={{ color: '#10b981' }} /> Salary Range</span>
                            <div style={tileValStyle}>{job.salary || job.salaryRange || 'Competitive'}</div>
                        </div>
                        <div>
                            <span style={tileLabelStyle}><FiUsers style={{ color: '#8b5cf6' }} /> Openings</span>
                            <div style={tileValStyle}>{job.number_of_openings || 1} Position(s)</div>
                        </div>
                        <div>
                            <span style={tileLabelStyle}><FiCalendar style={{ color: '#f59e0b' }} /> Application Deadline</span>
                            <div style={tileValStyle}>{deadline ? format(deadline, 'MMM dd, yyyy') : 'Open Position'}</div>
                        </div>
                    </div>

                    {/* KEY DETAILS BADGES */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {job.education && (
                            <span style={badgeStyle('#e0f2fe', '#0369a1')}>🎓 Qualification: {job.education}</span>
                        )}
                        {job.gender_preference && job.gender_preference !== 'Any' && (
                            <span style={badgeStyle('#fbcfe8', '#9d174d')}>👤 Gender: {job.gender_preference}</span>
                        )}
                        {job.notice_period && (
                            <span style={badgeStyle('#fef3c7', '#b45309')}>⏳ Notice Period: {job.notice_period}</span>
                        )}
                        {job.joining_date && (
                            <span style={badgeStyle('#dcfce7', '#15803d')}>📅 Joining Date: {job.joining_date}</span>
                        )}
                        {job.hiring_timeline && (
                            <span style={badgeStyle('#f3e8ff', '#7e22ce')}>⚡ Timeline: {job.hiring_timeline}</span>
                        )}
                    </div>
                </div>

                {message && (
                    <div style={{ padding: '16px 20px', borderRadius: '16px', background: message.includes('success') || message.includes('🎉') ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${message.includes('success') || message.includes('🎉') ? '#86efac' : '#fca5a5'}`, color: message.includes('success') || message.includes('🎉') ? '#166534' : '#991b1b', fontWeight: 700, marginBottom: '24px' }}>
                        {message}
                    </div>
                )}

                {/* 1. REQUIRED SKILLS & PREFERRED SKILLS */}
                {(requiredSkillsList.length > 0 || preferredSkillsList.length > 0) && (
                    <div style={sectionCardStyle}>
                        <h3 style={sectionTitleStyle}><FiTag style={{ color: '#7c3aed' }} /> Skills Required</h3>
                        
                        {requiredSkillsList.length > 0 && (
                            <div style={{ marginBottom: preferredSkillsList.length > 0 ? '16px' : 0 }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Must-have Skills:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {requiredSkillsList.map((skill, i) => (
                                        <span key={i} style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {preferredSkillsList.length > 0 && (
                            <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>Preferred Skills:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {preferredSkillsList.map((skill, i) => (
                                        <span key={i} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. JOB DESCRIPTION & KEY RESPONSIBILITIES */}
                <div style={sectionCardStyle}>
                    <h3 style={sectionTitleStyle}><FiBriefcase style={{ color: '#7c3aed' }} /> Job Description</h3>
                    <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line', margin: '0 0 24px' }}>
                        {job.job_description || job.description || job.jobDescription || 'No description provided.'}
                    </p>

                    {responsibilitiesList.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Key Responsibilities:</h4>
                            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                {responsibilitiesList.map((resp, i) => (
                                    <li key={i} style={{ marginBottom: '8px', fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, fontWeight: 600 }}>
                                        {resp}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* 3. JOB TIMINGS & SHIFT */}
                {(job.working_days || job.shift_type || job.start_time || job.working_hours) && (
                    <div style={sectionCardStyle}>
                        <h3 style={sectionTitleStyle}><FiClock style={{ color: '#7c3aed' }} /> Job Timings & Work Shift</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {job.working_days && (
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Working Days</span>
                                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{job.working_days}</p>
                                </div>
                            )}
                            {(job.start_time || job.end_time) && (
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Working Hours / Timing</span>
                                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                                        {job.start_time} - {job.end_time} ({job.working_hours || '8 hours/day'})
                                    </p>
                                </div>
                            )}
                            {job.shift_type && (
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Shift Type</span>
                                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{job.shift_type}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. PERKS & BENEFITS */}
                {benefitsList.length > 0 && (
                    <div style={sectionCardStyle}>
                        <h3 style={sectionTitleStyle}><FiAward style={{ color: '#7c3aed' }} /> Perks & Benefits</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {benefitsList.map((ben, i) => (
                                <span key={i} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <FiCheckCircle style={{ color: '#16a34a' }} /> {ben}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. JOB LOCATION / OFFICE ADDRESS */}
                {(job.building_name || job.street || job.city) && (
                    <div style={sectionCardStyle}>
                        <h3 style={sectionTitleStyle}><FiMapPin style={{ color: '#7c3aed' }} /> Office Address & Location</h3>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', fontWeight: 600, lineHeight: 1.6 }}>
                            {[job.door_number, job.building_name, job.street, job.area, job.city, job.district, job.state, job.country, job.pincode].filter(Boolean).join(', ')}
                        </p>
                    </div>
                )}

                {/* 6. ABOUT COMPANY */}
                <div style={{ ...sectionCardStyle, background: '#faf5ff', border: '2px solid #ddd6fe' }}>
                    <h3 style={sectionTitleStyle}><FiBriefcase style={{ color: '#7c3aed' }} /> About {job.company_name || job.companyName || 'Company'}</h3>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', overflow: 'hidden', flexShrink: 0 }}>
                            {job.company_logo || job.companyLogo ? (
                                <img src={job.company_logo || job.companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                companyInitial
                            )}
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{job.company_name || job.companyName || 'Verified Employer'}</h4>
                            {job.contact_person_name && (
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>Contact Person: <strong>{job.contact_person_name}</strong></p>
                            )}
                        </div>
                    </div>
                    {job.about_company && (
                        <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569', lineHeight: 1.6 }}>{job.about_company}</p>
                    )}
                </div>

                {/* 7. CANDIDATE APPLICATION ACTION BAR */}
                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginTop: '32px' }}>
                    {isExpired ? (
                        <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '14px', fontWeight: 700, textAlign: 'center' }}>
                            The application deadline for this job has passed. It is no longer accepting new applications.
                        </div>
                    ) : !isJobActive ? (
                        <div style={{ padding: '16px', background: '#f1f5f9', color: '#475569', borderRadius: '14px', fontWeight: 700, textAlign: 'center' }}>
                            This job listing is currently not active.
                        </div>
                    ) : applied ? (
                        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>You have applied for this position ✓</h4>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#15803d' }}>Your application has been received and is under recruiter review.</p>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/jobseeker/applications')} style={{ fontWeight: 700 }}>
                                View My Applications
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                                Interested in this job opening?
                            </h3>
                            <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.92rem' }}>
                                Submit your application directly to {job.company_name || job.companyName || 'employer'} recruiters.
                            </p>

                            {job.application_method === 'External Application Link' && (job.application_url || job.googleFormLink) ? (
                                <button onClick={handleExternalApply} className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 36px', fontSize: '1rem', fontWeight: 800 }}>
                                    <FiExternalLink /> Apply via External Link
                                </button>
                            ) : job.application_method === 'Company Email' && job.application_email ? (
                                <a href={`mailto:${job.application_email}?subject=Application for ${encodeURIComponent(job.job_title || job.title)}`} className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 36px', fontSize: '1rem', fontWeight: 800, textDecoration: 'none' }}>
                                    <FiMail /> Apply via Email ({job.application_email})
                                </a>
                            ) : (
                                <button
                                    onClick={handleApplyClick}
                                    disabled={applying || applied}
                                    className="btn btn-primary btn-lg"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '14px 36px',
                                        fontSize: '1rem',
                                        fontWeight: 800,
                                        cursor: applied ? 'default' : 'pointer'
                                    }}
                                >
                                    {applied ? (
                                        <>
                                            <FiCheck /> Already Applied
                                        </>
                                    ) : (
                                        <>
                                            <FiSend /> {applying ? 'Submitting Application...' : 'Apply Now'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Question Screening Modal */}
                <ApplicationQuestionsModal
                    job={job}
                    isOpen={isQuestionsModalOpen}
                    onClose={() => setIsQuestionsModalOpen(false)}
                    onSubmit={handleQuestionsSubmit}
                    isSubmitting={applying}
                />

            </div>
        </div>
    );
}

export default function JobDetails() {
    return (
        <ErrorBoundary>
            <JobDetailsContent />
        </ErrorBoundary>
    );
}

// Inline Styling Helpers
const sectionCardStyle = {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '32px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    marginBottom: '28px'
};

const sectionTitleStyle = {
    margin: '0 0 20px',
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
};

const tileLabelStyle = {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
};

const tileValStyle = {
    margin: '4px 0 0',
    fontWeight: 800,
    fontSize: '0.92rem',
    color: '#0f172a'
};

const badgeStyle = (bg, color) => ({
    background: bg,
    color: color,
    padding: '6px 14px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '0.82rem'
});
