import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJob } from '../../services/jobService';
import { getApplicationsByJob, updateApplicationStatus } from '../../services/applicationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import {
    FiArrowLeft, FiDownload, FiUsers, FiFilter,
    FiCalendar, FiEye, FiSearch, FiCheck, FiVideo,
    FiFileText, FiMapPin, FiClock, FiHelpCircle, FiShield, FiX, FiCheckCircle,
    FiLock, FiUnlock, FiPhone, FiMail
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function ViewApplicants() {
    const { currentUser, userData, token } = useAuth();
    const { addToast } = useToast();

    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quotaData, setQuotaData] = useState(null);
    const [unlockingId, setUnlockingId] = useState(null);

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [experienceFilter, setExperienceFilter] = useState('');
    const [joiningFilter, setJoiningFilter] = useState('');
    const [interviewFilter, setInterviewFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, match_desc, exp_desc

    // Modals
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [interviewModal, setInterviewModal] = useState(null);
    const [interviewData, setInterviewData] = useState({ date: '', time: '', type: 'Online Video Interview', link: '', notes: '' });
    const [recruiterNote, setRecruiterNote] = useState('');

    useEffect(() => {
        loadData();
    }, [jobId]);

    useEffect(() => {
        applyFiltersAndSort();
    }, [searchQuery, statusFilter, experienceFilter, joiningFilter, interviewFilter, sortBy, applicants]);

    async function loadData() {
        try {
            const authToken = token || localStorage.getItem('token');
            const [jobData, apps, quotaRes] = await Promise.all([
                getJob(jobId),
                getApplicationsByJob(jobId),
                fetch('http://localhost:5000/api/subscriptions/employer-quota', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                }).catch(() => null)
            ]);
            setJob(jobData);

            if (quotaRes && quotaRes.ok) {
                const qData = await quotaRes.json();
                setQuotaData(qData);
            }

            if (jobData && userData && userData.role === 'company') {
                const currentCompName = (userData.companyName || '').toLowerCase().trim();
                const currentCompId = String(userData.company_id || userData.companyId || currentUser?.uid || '').trim();
                const jobCompName = (jobData.company_name || jobData.companyName || '').toLowerCase().trim();
                const jobCompId = String(jobData.company_id || jobData.companyId || '').trim();
                const jobEmpId = String(jobData.employer_id || jobData.employerId || '').trim();

                const isOwner = Boolean(currentCompName && jobCompName === currentCompName) ||
                                Boolean(currentCompId && (jobCompId === currentCompId || jobEmpId === currentCompId));
                if (!isOwner) {
                    addToast('error', 'Access Denied: This job belongs to another company.');
                    navigate('/company/manage-jobs');
                    return;
                }
            }

            const jobApps = (apps || []).map(app => {
                let parsedQuestions = app.applicationQuestions || [];
                let parsedAnswers = app.applicationAnswers || {};

                if (typeof parsedQuestions === 'string') {
                    try { parsedQuestions = JSON.parse(parsedQuestions); } catch (e) {}
                }
                if (typeof parsedAnswers === 'string') {
                    try { parsedAnswers = JSON.parse(parsedAnswers); } catch (e) {}
                }

                return {
                    ...app,
                    id: app.id || app.applicationId,
                    applicationId: app.applicationId || app.id,
                    matchScore: typeof app.matchScore === 'number' ? app.matchScore : 85,
                    skills: app.skills || app.candidateSkills || 'Relevant Skills',
                    experience: app.experience || 'Fresher',
                    education: app.education || app.qualification || 'Graduate',
                    status: app.applicationStatus || app.status || 'Applied',
                    joiningAvailability: app.joiningAvailability || parsedAnswers['q_joining'] || 'Immediately',
                    interviewAvailability: app.interviewAvailability || parsedAnswers['q_interview'] || 'Anytime',
                    applicationQuestions: parsedQuestions,
                    applicationAnswers: parsedAnswers
                };
            });

            setApplicants(jobApps);
            setFiltered(jobApps);
        } catch (err) {
            console.error('Failed to load job applicants', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUnlockCandidate(targetCandId) {
        if (!targetCandId) return;
        setUnlockingId(targetCandId);
        try {
            const authToken = token || localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/employer/unlock-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ candidateId: targetCandId })
            });
            const data = await res.json();
            if (res.ok) {
                addToast('success', data.message || '🎉 Candidate contact details & resume unlocked!');
                await loadData();
                if (selectedCandidate) {
                    setSelectedCandidate(prev => ({
                        ...prev,
                        isUnlocked: true,
                        isContactPrivate: false,
                        email: data.candidate?.email || prev.email,
                        phone: data.candidate?.phone || prev.phone,
                        address: data.candidate?.address || prev.address,
                        resumeUrl: data.candidate?.resume_url || prev.resumeUrl,
                        resumeURL: data.candidate?.resume_url || prev.resumeURL
                    }));
                }
            } else {
                addToast('error', data.message || 'Failed to unlock contact');
                if (res.status === 403 && data.requiresUpgrade) {
                    navigate('/company/subscriptions');
                }
            }
        } catch (err) {
            console.error('Error unlocking contact:', err);
            addToast('error', 'Error unlocking candidate contact');
        } finally {
            setUnlockingId(null);
        }
    }

    function applyFiltersAndSort() {
        let result = [...applicants];

        // Search by candidate name, skills
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(a =>
                (a.candidateName || a.applicantName || '').toLowerCase().includes(q) ||
                (a.skills || '').toLowerCase().includes(q) ||
                (a.education || '').toLowerCase().includes(q)
            );
        }

        // Status Filter
        if (statusFilter) {
            result = result.filter(a => (a.status || a.applicationStatus || '').toLowerCase() === statusFilter.toLowerCase());
        }

        // Experience Filter
        if (experienceFilter) {
            result = result.filter(a => (a.experience || '').toLowerCase().includes(experienceFilter.toLowerCase()));
        }

        // Joining Availability Filter
        if (joiningFilter) {
            result = result.filter(a => (a.joiningAvailability || '').toLowerCase().includes(joiningFilter.toLowerCase()));
        }

        // Interview Availability Filter
        if (interviewFilter) {
            result = result.filter(a => (a.interviewAvailability || '').toLowerCase().includes(interviewFilter.toLowerCase()));
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'match_desc') return (b.matchScore || 0) - (a.matchScore || 0);
            if (sortBy === 'newest') return new Date(b.appliedDate || b.appliedAt) - new Date(a.appliedDate || a.appliedAt);
            if (sortBy === 'oldest') return new Date(a.appliedDate || a.appliedAt) - new Date(b.appliedDate || b.appliedAt);
            return 0;
        });

        setFiltered(result);
    }

    // Status Update Action (Requirement 8 & 11)
    async function handleStatusChange(appId, newStatus, extra = {}) {
        try {
            await updateApplicationStatus(appId, newStatus, extra);
            setApplicants(prev => prev.map(a => 
                (a.id === appId || a.applicationId === appId) 
                    ? { ...a, applicationStatus: newStatus, status: newStatus, ...extra } 
                    : a
            ));
            if (selectedCandidate && (selectedCandidate.id === appId || selectedCandidate.applicationId === appId)) {
                setSelectedCandidate(prev => ({ ...prev, applicationStatus: newStatus, status: newStatus, ...extra }));
            }
            if (addToast) addToast('success', `Status updated to ${newStatus}`);
        } catch (e) {
            console.error('Failed to update status', e);
        }
    }

    // Save Recruiter Note
    async function handleSaveNote(appId) {
        if (!recruiterNote.trim()) return;
        try {
            await handleStatusChange(appId, selectedCandidate?.status || 'Applied', { recruiterNotes: recruiterNote });
            setRecruiterNote('');
            if (addToast) addToast('success', 'Internal note saved');
        } catch (e) {
            console.error(e);
        }
    }

    // Interview Schedule Confirmation
    async function handleConfirmInterview() {
        if (!interviewModal || !interviewData.date || !interviewData.time) return;
        try {
            const extra = {
                interviewDate: interviewData.date,
                interviewTime: interviewData.time,
                interviewType: interviewData.type,
                meetingLink: interviewData.link,
                recruiterNotes: interviewData.notes
            };
            await handleStatusChange(interviewModal.id || interviewModal.applicationId, 'Interview Scheduled', extra);
            setInterviewModal(null);
            setInterviewData({ date: '', time: '', type: 'Online Video Interview', link: '', notes: '' });
        } catch (e) {
            console.error(e);
        }
    }

    const getStatusStyle = (st) => {
        const s = (st || 'Applied').toLowerCase();
        if (s === 'shortlisted') return { label: 'Shortlisted', bg: '#dcfce7', color: '#15803d' };
        if (s === 'under review') return { label: 'Under Review', bg: '#fef3c7', color: '#b45309' };
        if (s === 'interview scheduled') return { label: 'Interview Scheduled', bg: '#f3e8ff', color: '#7e22ce' };
        if (s === 'selected' || s === 'hired') return { label: 'Selected 🎉', bg: '#10b981', color: '#ffffff' };
        if (s === 'rejected') return { label: 'Rejected', bg: '#fee2e2', color: '#b91c1c' };
        return { label: 'New / Applied', bg: '#e0f2fe', color: '#0369a1' };
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Top Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/company/manage-jobs')}
                    style={{
                        background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px',
                        padding: '8px 16px', fontWeight: 600, color: '#475569', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <FiArrowLeft /> Back to Manage Jobs
                </button>
            </div>

            {/* Header Card */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#ffffff', borderRadius: '24px', padding: '32px',
                marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <span style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, display: 'inline-block', marginBottom: '8px' }}>
                            Job Applications Dashboard
                        </span>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800 }}>
                            {job?.job_title || job?.title || 'Job Opening'}
                        </h1>
                        <p style={{ margin: 0, opacity: 0.85, fontSize: '0.95rem' }}>
                            📍 {job?.job_location || job?.location || 'Location'} • {job?.job_type || job?.jobType || 'Full Time'} • ID: <strong>{job?.job_id || job?.id || jobId}</strong>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 20px', borderRadius: '16px', textAlign: 'center', minWidth: '100px' }}>
                            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{applicants.length}</span>
                            <span style={{ display: 'block', fontSize: '0.78rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Total Applicants</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '12px 20px', borderRadius: '16px', textAlign: 'center', minWidth: '100px' }}>
                            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4ade80' }}>
                                {applicants.filter(a => (a.status || a.applicationStatus) === 'Shortlisted').length}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.78rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Shortlisted</span>
                        </div>
                    </div>
                </div>

                {/* Student Contact & Resume Unlock Quota Banner */}
                {quotaData && (
                    <div style={{
                        marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                                <FiUnlock />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                                    Active Plan: {quotaData.activePlanName}
                                </span>
                                <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.92rem' }}>
                                    Student Contact & Resume Unlocks: {quotaData.contactViewLimit === -1 
                                        ? 'Unlimited Unlocks Enabled 🚀' 
                                        : `${quotaData.contactsViewed || 0} of ${quotaData.contactViewLimit || 4} Used (${quotaData.contactsRemaining !== undefined ? quotaData.contactsRemaining : 'N/A'} Remaining)`}
                                </strong>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/company/subscriptions')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            {quotaData.contactViewLimit === -1 ? 'Manage Plan' : 'Get More Unlocks (100 / Unlimited) →'}
                        </button>
                    </div>
                )}
            </div>

            {/* Filter and Search Bar */}
            <div style={{
                background: '#ffffff', borderRadius: '20px', padding: '24px',
                border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search candidates by name, skills, qualification..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
                                border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.92rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={filterSelectStyle}
                        >
                            <option value="">Status: All</option>
                            <option value="Applied">New / Applied</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                        <select
                            value={joiningFilter}
                            onChange={e => setJoiningFilter(e.target.value)}
                            style={filterSelectStyle}
                        >
                            <option value="">Joining: All</option>
                            <option value="Immediately">Immediately</option>
                            <option value="7 days">Within 7 days</option>
                            <option value="15 days">Within 15 days</option>
                            <option value="30 days">Within 30 days</option>
                        </select>

                        <select
                            value={interviewFilter}
                            onChange={e => setInterviewFilter(e.target.value)}
                            style={filterSelectStyle}
                        >
                            <option value="">Interview: All</option>
                            <option value="Anytime">Anytime</option>
                            <option value="7 days">Within 7 days</option>
                            <option value="15 days">Within 15 days</option>
                            <option value="advance notice">Need advance notice</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={filterSelectStyle}
                        >
                            <option value="newest">Sort: Newest First</option>
                            <option value="oldest">Sort: Oldest First</option>
                            <option value="match_desc">Sort: Highest Match</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Applicants List Table / Card View */}
            {filtered.length === 0 ? (
                <div style={{
                    background: '#ffffff', borderRadius: '20px', padding: '60px 20px',
                    textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', background: '#f0f9ff',
                        color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', margin: '0 auto 16px'
                    }}>
                        <FiUsers />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                        {applicants.length === 0 ? 'No applications received yet.' : 'No candidates match the selected filters.'}
                    </h3>
                    <p style={{ color: '#64748b' }}>
                        {applicants.length === 0 ? 'Applications from job seekers will appear here as soon as candidates submit.' : 'Try adjusting your filters or search keywords.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filtered.map(app => {
                        const badge = getStatusStyle(app.status || app.applicationStatus);
                        const appliedDateStr = app.appliedDate ? format(new Date(app.appliedDate), 'MMM dd, yyyy') : 'Recent';
                        const candidateInitials = (app.candidateName || 'C').substring(0, 2).toUpperCase();

                        return (
                            <div key={app.id || app.applicationId} style={{
                                background: '#ffffff', borderRadius: '20px', padding: '24px',
                                border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flex: 1, minWidth: '300px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                        color: '#ffffff', fontWeight: 800, fontSize: '1.3rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        {candidateInitials}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                                                {app.candidateName}
                                            </h3>
                                            <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800 }}>
                                                {badge.label}
                                            </span>
                                            <span style={{
                                                background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800
                                            }}>
                                                Match: {app.matchScore}%
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>
                                            <span>🎓 <strong>Education:</strong> {app.education || 'Graduate'}</span>
                                            <span>💼 <strong>Experience:</strong> {app.experience || 'Fresher'}</span>
                                            <span>⚡ <strong>Joining:</strong> {app.joiningAvailability}</span>
                                            <span>📅 <strong>Interview:</strong> {app.interviewAvailability}</span>
                                        </div>

                                        {/* Key Skills */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                            {(typeof app.skills === 'string' ? app.skills.split(',') : (app.skills || [])).map((s, idx) => (
                                                <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '3px 9px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600 }}>
                                                    {String(s).trim()}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Contact Status Badge */}
                                        <div>
                                            {app.isUnlocked ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    <FiCheckCircle size={13} /> Contact & Resume Unlocked: {app.phone || app.email || 'Visible'}
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    <FiLock size={13} /> Contact & Resume Locked (1 Credit to Unlock)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {!app.isUnlocked && (
                                        <button
                                            onClick={() => handleUnlockCandidate(app.candidateId || app.candidate_id || app.userId || app.email || app.id)}
                                            disabled={unlockingId === (app.candidateId || app.candidate_id || app.userId || app.email || app.id)}
                                            style={{
                                                padding: '10px 16px',
                                                borderRadius: '10px',
                                                border: '1px solid #f59e0b',
                                                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                                                color: '#b45309',
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)'
                                            }}
                                        >
                                            <FiUnlock size={14} />
                                            {unlockingId === (app.candidateId || app.candidate_id || app.userId || app.email || app.id) ? 'Unlocking...' : 'Unlock Contact'}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setSelectedCandidate(app)}
                                        className="btn btn-primary"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', padding: '10px 18px', fontWeight: 800 }}
                                    >
                                        <FiEye /> View Details & Answers
                                    </button>

                                    <button
                                        onClick={() => handleStatusChange(app.id || app.applicationId, 'Shortlisted')}
                                        style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                                    >
                                        Shortlist
                                    </button>

                                    <button
                                        onClick={() => setInterviewModal(app)}
                                        style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#f3e8ff', color: '#7e22ce', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                                    >
                                        Interview
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── CANDIDATE APPLICATION DETAILS MODAL (Requirement 5, 6, 7, 10) ── */}
            {selectedCandidate && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1100, padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '780px',
                        maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                            <div>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>Candidate Application</span>
                                <h3 style={{ margin: '2px 0 0', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                                    {selectedCandidate.candidateName}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedCandidate(null)} style={{ border: 'none', background: '#ffffff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                                <FiX size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* ── CONTACT & RESUME ACCESS BOX (Dynamic based on Subscription Unlock) ── */}
                            {selectedCandidate.isUnlocked ? (
                                <div style={{
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                    border: '1.5px solid #86efac',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1px solid #bbf7d0', paddingBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FiCheckCircle size={16} />
                                            </div>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14532d' }}>
                                                Candidate Contact & Resume Unlocked
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.78rem', background: '#16a34a', color: '#ffffff', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>
                                            Plan Credit Used ✓
                                        </span>
                                    </div>

                                    {/* Unlocked Contact Details Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                                        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                            <span style={{ ...labelStyle, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FiPhone size={14} /> Phone Number
                                            </span>
                                            <a href={`tel:${selectedCandidate.phone || ''}`} style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#047857', textDecoration: 'none' }}>
                                                {selectedCandidate.phone || 'Available Upon Request'}
                                            </a>
                                        </div>

                                        <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                            <span style={{ ...labelStyle, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FiMail size={14} /> Email Address
                                            </span>
                                            <a href={`mailto:${selectedCandidate.email || ''}`} style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#047857', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                {selectedCandidate.email || 'Available Upon Request'}
                                            </a>
                                        </div>

                                        {selectedCandidate.address && (
                                            <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                                <span style={{ ...labelStyle, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <FiMapPin size={14} /> Location / Address
                                                </span>
                                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#047857' }}>
                                                    {selectedCandidate.address}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                    border: '1.5px solid #fde68a',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FiLock size={16} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#78350f' }}>
                                                    Candidate Contact & Resume Details Locked
                                                </h4>
                                                <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#92400e' }}>
                                                    {quotaData && quotaData.contactsLimit ? (
                                                        <span>
                                                            Your active plan allows viewing candidate contacts & resumes. You have <strong>{quotaData.contactsRemaining} credits left</strong> ({quotaData.contactsViewed}/{quotaData.contactsLimit} used).
                                                        </span>
                                                    ) : (
                                                        <span>Unlock this applicant using 1 Student Details & Resume credit from your subscription.</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {quotaData && quotaData.contactsRemaining > 0 ? (
                                            <button
                                                onClick={() => handleUnlockCandidate(selectedCandidate.candidateId || selectedCandidate.candidate_id || selectedCandidate.userId || selectedCandidate.email || selectedCandidate.id)}
                                                disabled={unlockingId === (selectedCandidate.candidateId || selectedCandidate.candidate_id || selectedCandidate.userId || selectedCandidate.email || selectedCandidate.id)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    padding: '10px 20px',
                                                    borderRadius: '10px',
                                                    fontWeight: 800,
                                                    fontSize: '0.88rem',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)'
                                                }}
                                            >
                                                <FiUnlock size={16} />
                                                {unlockingId === (selectedCandidate.candidateId || selectedCandidate.candidate_id || selectedCandidate.userId || selectedCandidate.email || selectedCandidate.id) ? 'Unlocking...' : 'Unlock Contact & Resume (1 Credit)'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate('/company/subscriptions')}
                                                style={{
                                                    background: '#d97706',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    padding: '10px 18px',
                                                    borderRadius: '10px',
                                                    fontWeight: 800,
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Upgrade Plan to Unlock
                                            </button>
                                        )}
                                    </div>

                                    {/* Masked Preview */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px dashed #fcd34d' }}>
                                            <span style={{ ...labelStyle, color: '#a16207', fontSize: '0.78rem' }}>Phone Number</span>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.5px' }}>••••••••••</p>
                                        </div>
                                        <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px dashed #fcd34d' }}>
                                            <span style={{ ...labelStyle, color: '#a16207', fontSize: '0.78rem' }}>Email Address</span>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.5px' }}>••••••@•••••.com</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Candidate Snapshot Box */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <span style={labelStyle}>Education / Qualification</span>
                                    <p style={valueStyle}>{selectedCandidate.education || 'Graduate'}</p>
                                </div>
                                <div>
                                    <span style={labelStyle}>Total Experience</span>
                                    <p style={valueStyle}>{selectedCandidate.experience || 'Fresher'}</p>
                                </div>
                                <div>
                                    <span style={labelStyle}>Expected Joining</span>
                                    <p style={{ ...valueStyle, color: '#0284c7' }}>{selectedCandidate.joiningAvailability}</p>
                                </div>
                                <div>
                                    <span style={labelStyle}>Interview Availability</span>
                                    <p style={{ ...valueStyle, color: '#7c3aed' }}>{selectedCandidate.interviewAvailability}</p>
                                </div>
                            </div>

                            {/* Skills */}
                            <div>
                                <span style={labelStyle}>Candidate Skills</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                                    {(typeof selectedCandidate.skills === 'string' ? selectedCandidate.skills.split(',') : (selectedCandidate.skills || [])).map((s, i) => (
                                        <span key={i} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700 }}>
                                            {String(s).trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* ── JOB-SPECIFIC APPLICATION ANSWERS (Requirement 2 & 5) ── */}
                            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '20px' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiHelpCircle style={{ color: '#0284c7' }} /> Candidate's Application Answers
                                </h4>

                                {selectedCandidate.applicationQuestions && selectedCandidate.applicationQuestions.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {selectedCandidate.applicationQuestions.map((q, qIdx) => {
                                            const ans = selectedCandidate.applicationAnswers ? selectedCandidate.applicationAnswers[q.id] : null;
                                            return (
                                                <div key={q.id || qIdx} style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                                                        <span style={{ color: '#0284c7', marginRight: '6px' }}>Q{qIdx + 1}:</span>
                                                        {q.question}
                                                    </p>
                                                    <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                        {Array.isArray(ans) ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                {ans.map((item, itemIdx) => (
                                                                    <span key={itemIdx} style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                                                                        ✓ {item}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0369a1' }}>
                                                                {ans ? String(ans) : (q.id === 'q_joining' ? selectedCandidate.joiningAvailability : q.id === 'q_interview' ? selectedCandidate.interviewAvailability : 'Not specified')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                                            <span style={labelStyle}>Joining Availability:</span>
                                            <strong style={{ color: '#0369a1' }}>{selectedCandidate.joiningAvailability}</strong>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                                            <span style={labelStyle}>Interview Availability:</span>
                                            <strong style={{ color: '#7c3aed' }}>{selectedCandidate.interviewAvailability}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Resume & Attachments */}
                            <div>
                                <span style={labelStyle}>Candidate Resume</span>
                                {selectedCandidate.isUnlocked ? (
                                    (selectedCandidate.resumeUrl || selectedCandidate.resumeURL || selectedCandidate.resume_url) ? (
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                            <a href={selectedCandidate.resumeUrl || selectedCandidate.resumeURL || selectedCandidate.resume_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                                <FiEye /> View Full Resume
                                            </a>
                                            <a href={selectedCandidate.resumeUrl || selectedCandidate.resumeURL || selectedCandidate.resume_url} download className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                                <FiDownload /> Download Resume
                                            </a>
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, color: '#16a34a', fontWeight: 700, fontSize: '0.88rem' }}>✓ Digital profile and application answers available above.</p>
                                    )
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                                        <div style={{ background: '#f1f5f9', color: '#64748b', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FiLock size={14} /> Resume document hidden until contact is unlocked
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Internal Recruiter Notes */}
                            <div>
                                <span style={labelStyle}>Internal Recruiter Notes</span>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                    <input
                                        style={{ flex: 1, ...inputStyle }}
                                        value={recruiterNote}
                                        onChange={e => setRecruiterNote(e.target.value)}
                                        placeholder={selectedCandidate.recruiterNotes || "Add private notes about this applicant..."}
                                    />
                                    <button onClick={() => handleSaveNote(selectedCandidate.id || selectedCandidate.applicationId)} className="btn btn-secondary">
                                        Save Note
                                    </button>
                                </div>
                            </div>

                            {/* Status Update Actions (Requirement 8) */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <span style={{ ...labelStyle, marginBottom: '12px' }}>Update Application Stage</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    <button onClick={() => handleStatusChange(selectedCandidate.id || selectedCandidate.applicationId, 'Under Review')} style={actionBtnStyle('#fffbeb', '#b45309')}>
                                        Under Review
                                    </button>
                                    <button onClick={() => handleStatusChange(selectedCandidate.id || selectedCandidate.applicationId, 'Shortlisted')} style={actionBtnStyle('#dcfce7', '#15803d')}>
                                        Shortlist Candidate
                                    </button>
                                    <button onClick={() => { setInterviewModal(selectedCandidate); setSelectedCandidate(null); }} style={actionBtnStyle('#f3e8ff', '#7e22ce')}>
                                        Schedule Interview
                                    </button>
                                    <button onClick={() => handleStatusChange(selectedCandidate.id || selectedCandidate.applicationId, 'Selected')} style={actionBtnStyle('#10b981', '#ffffff')}>
                                        Select (Hire Candidate)
                                    </button>
                                    <button onClick={() => handleStatusChange(selectedCandidate.id || selectedCandidate.applicationId, 'Rejected')} style={actionBtnStyle('#fee2e2', '#b91c1c')}>
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── INTERVIEW SCHEDULING MODAL ── */}
            {interviewModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1200, padding: '20px'
                }}>
                    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>📅 Schedule Interview</h3>
                        <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
                            Scheduling interview for <strong>{interviewModal.candidateName}</strong>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={labelStyle}>Interview Date *</label>
                                <input type="date" style={inputStyle} value={interviewData.date} onChange={e => setInterviewData({ ...interviewData, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label style={labelStyle}>Interview Time *</label>
                                <input type="time" style={inputStyle} value={interviewData.time} onChange={e => setInterviewData({ ...interviewData, time: e.target.value })} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Interview Type</label>
                                <select style={inputStyle} value={interviewData.type} onChange={e => setInterviewData({ ...interviewData, type: e.target.value })}>
                                    <option value="Online Video Interview">Online Video Interview</option>
                                    <option value="In-Person Office Interview">In-Person Office Interview</option>
                                    <option value="Telephonic Screening">Telephonic Screening</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Meeting Link / Office Location</label>
                                <input style={inputStyle} value={interviewData.link} onChange={e => setInterviewData({ ...interviewData, link: e.target.value })} placeholder="e.g. Google Meet link or office address" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setInterviewModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleConfirmInterview} disabled={!interviewData.date || !interviewData.time}>
                                Schedule & Notify Candidate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const filterSelectStyle = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#334155',
    outline: 'none',
    cursor: 'pointer'
};

const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '0.82rem',
    fontWeight: 700,
    color: '#64748b'
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    boxSizing: 'border-box'
};

const valueStyle = {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#0f172a'
};

const actionBtnStyle = (bg, color) => ({
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: bg,
    color: color,
    fontWeight: 800,
    fontSize: '0.85rem',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
});
