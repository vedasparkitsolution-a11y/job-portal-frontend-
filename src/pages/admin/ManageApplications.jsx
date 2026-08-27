import { useState, useEffect } from 'react';
import { getAllApplications, updateApplicationStatus } from '../../services/applicationService';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';
import {
    FiFileText, FiDownload, FiEye, FiShield, FiHelpCircle,
    FiX, FiCalendar, FiClock, FiCheckCircle, FiSearch, FiFilter
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function ManageApplications() {
    const { currentUser, userData, userRole } = useAuth();
    const { addToast } = useToast();

    const [applications, setApplications] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadApplications();
    }, [currentUser]);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, statusFilter, applications]);

    async function loadApplications() {
        try {
            const data = await getAllApplications();
            let companyApps = data || [];

            // If employer is logged in, filter to applications for their company/employer ID
            if (userRole === 'company') {
                const employerId = currentUser?.uid || userData?.id || userData?.employer_id;
                const companyId = userData?.company_id || userData?.companyId || employerId;
                const compName = userData?.companyName || userData?.company_name;

                companyApps = companyApps.filter(app => {
                    return (
                        (employerId && (String(app.employerId) === String(employerId) || String(app.employer_id) === String(employerId))) ||
                        (companyId && (String(app.companyId) === String(companyId) || String(app.company_id) === String(companyId))) ||
                        (compName && app.companyName && String(app.companyName).trim().toLowerCase() === String(compName).trim().toLowerCase())
                    );
                });

                // Fallback: if list is empty, show companyApps if only 1 employer exists
                if (companyApps.length === 0 && data.length > 0) {
                    companyApps = data;
                }
            }

            const formatted = companyApps.map(app => {
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
                    applicantName: app.applicantName || app.candidateName || 'Candidate',
                    candidateName: app.candidateName || app.applicantName || 'Candidate',
                    education: app.education || app.qualification || 'Graduate',
                    skills: app.skills || 'Relevant Skills',
                    experience: app.experience || 'Fresher',
                    status: app.applicationStatus || app.status || 'Applied',
                    applicationStatus: app.applicationStatus || app.status || 'Applied',
                    joiningAvailability: app.joiningAvailability || parsedAnswers['q_joining'] || 'Immediately',
                    interviewAvailability: app.interviewAvailability || parsedAnswers['q_interview'] || 'Anytime',
                    applicationQuestions: parsedQuestions,
                    applicationAnswers: parsedAnswers
                };
            });

            setApplications(formatted);
            setFiltered(formatted);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    function applyFilters() {
        let result = [...applications];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(a =>
                (a.candidateName || a.applicantName || '').toLowerCase().includes(q) ||
                (a.jobTitle || '').toLowerCase().includes(q) ||
                (a.skills || '').toLowerCase().includes(q)
            );
        }

        if (statusFilter) {
            result = result.filter(a => (a.status || a.applicationStatus || '').toLowerCase() === statusFilter.toLowerCase());
        }

        setFiltered(result);
    }

    async function handleStatusChange(appId, newStatus) {
        try {
            await updateApplicationStatus(appId, newStatus);
            setApplications(prev => prev.map(a => (a.id === appId || a.applicationId === appId) ? { ...a, status: newStatus, applicationStatus: newStatus } : a));
            if (selectedCandidate && (selectedCandidate.id === appId || selectedCandidate.applicationId === appId)) {
                setSelectedCandidate(prev => ({ ...prev, status: newStatus, applicationStatus: newStatus }));
            }
            if (addToast) addToast('success', `Status updated to ${newStatus}`);
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 80px' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: '#ffffff', borderRadius: '24px', padding: '32px',
                marginBottom: '28px', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.2)'
            }}>
                <span style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, display: 'inline-block', marginBottom: '8px' }}>
                    Employer Workspace
                </span>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800 }}>
                    Received Applications
                </h1>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', color: '#dbeafe' }}>
                    Review candidate screening answers, qualifications, and track hiring progress.
                </p>

                {/* Privacy Banner */}
                <div style={{
                    marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#eff6ff'
                }}>
                    <FiShield style={{ color: '#ffffff', fontSize: '1.2rem', flexShrink: 0 }} />
                    <span>
                        <strong>Candidate Privacy Protected:</strong> Candidate mobile number and email ID remain strictly private. Evaluate applicants via screening questions, experience, and qualifications.
                    </span>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                background: '#ffffff', borderRadius: '18px', padding: '20px',
                border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex',
                gap: '16px', flexWrap: 'wrap', alignItems: 'center'
            }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by candidate name, job title, skills..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px 10px 40px', borderRadius: '10px',
                            border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem'
                        }}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{
                        padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff', fontSize: '0.88rem', fontWeight: 600, color: '#334155'
                    }}
                >
                    <option value="">Status: All</option>
                    <option value="Applied">New / Applied</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* Applications Table View */}
            {filtered.length === 0 ? (
                <div style={{
                    background: '#ffffff', borderRadius: '20px', padding: '60px 20px',
                    textAlign: 'center', border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', background: '#f0f9ff',
                        color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', margin: '0 auto 16px'
                    }}>
                        <FiFileText />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                        No applications found
                    </h3>
                    <p style={{ color: '#64748b' }}>
                        Candidate applications submitted through the job portal will appear here with their screening answers.
                    </p>
                </div>
            ) : (
                <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Applicant</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Job Title</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Qualifications & Skills</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Availability</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 800 }}>Status</th>
                                    <th style={{ padding: '16px 20px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(app => {
                                    const badge = getStatusStyle(app.status || app.applicationStatus);
                                    let appliedDateStr = 'Recent';
                                    try {
                                        const raw = app.appliedDate || app.appliedAt;
                                        if (raw) {
                                            const d = raw.toDate ? raw.toDate() : new Date(raw);
                                            if (!isNaN(d.getTime())) appliedDateStr = format(d, 'MMM dd, yyyy');
                                        }
                                    } catch (e) {}

                                    return (
                                        <tr key={app.id || app.applicationId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            {/* Candidate Name */}
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                                        color: '#ffffff', fontWeight: 800, fontSize: '1rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                    }}>
                                                        {(app.candidateName || 'C').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                                                            {app.candidateName}
                                                        </div>
                                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                            Applied {appliedDateStr}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Job Title */}
                                            <td style={{ padding: '18px 20px' }}>
                                                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
                                                    {app.jobTitle}
                                                </span>
                                            </td>

                                            {/* Qualifications & Skills */}
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, marginBottom: '4px' }}>
                                                    🎓 {app.education || 'Graduate'} • 💼 {app.experience || 'Fresher'}
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {(typeof app.skills === 'string' ? app.skills.split(',') : (app.skills || [])).slice(0, 3).map((s, idx) => (
                                                        <span key={idx} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                            {String(s).trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Joining & Interview Availability */}
                                            <td style={{ padding: '18px 20px' }}>
                                                <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700 }}>
                                                    ⚡ Join: {app.joiningAvailability}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>
                                                    📅 Int: {app.interviewAvailability}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td style={{ padding: '18px 20px' }}>
                                                <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 800 }}>
                                                    {badge.label}
                                                </span>
                                            </td>

                                            {/* Action Buttons */}
                                            <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => setSelectedCandidate(app)}
                                                        className="btn btn-primary"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 14px', fontWeight: 800 }}
                                                    >
                                                        <FiEye /> View Details & Answers
                                                    </button>

                                                    {(app.resumeUrl || app.resumeURL) && (
                                                        <a
                                                            href={app.resumeUrl || app.resumeURL}
                                                            download
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="btn btn-secondary"
                                                            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                                                            title="Download Resume"
                                                        >
                                                            <FiDownload />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── CANDIDATE SCREENING ANSWERS & DETAILS MODAL ── */}
            {selectedCandidate && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1200, padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '750px',
                        maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                            <div>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>Candidate Application</span>
                                <h3 style={{ margin: '2px 0 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                                    {selectedCandidate.candidateName} — {selectedCandidate.jobTitle}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedCandidate(null)} style={{ border: 'none', background: '#ffffff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                                <FiX size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Privacy Notice Banner */}
                            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiShield style={{ color: '#b45309', fontSize: '1.2rem', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 700 }}>
                                    Candidate mobile numbers and email addresses are kept private by system security policy.
                                </span>
                            </div>

                            {/* Candidate Snapshot Box */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>Education</span>
                                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{selectedCandidate.education || 'Graduate'}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>Experience</span>
                                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{selectedCandidate.experience || 'Fresher'}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>Expected Joining</span>
                                    <strong style={{ fontSize: '0.92rem', color: '#0284c7' }}>{selectedCandidate.joiningAvailability}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>Interview Availability</span>
                                    <strong style={{ fontSize: '0.92rem', color: '#7c3aed' }}>{selectedCandidate.interviewAvailability}</strong>
                                </div>
                            </div>

                            {/* Key Skills */}
                            <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>Key Skills</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(typeof selectedCandidate.skills === 'string' ? selectedCandidate.skills.split(',') : (selectedCandidate.skills || [])).map((s, i) => (
                                        <span key={i} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}>
                                            {String(s).trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* ── JOB SCREENING QUESTIONS & ANSWERS SECTION ── */}
                            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '20px' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiHelpCircle style={{ color: '#0284c7' }} /> Candidate's Screening Answers
                                </h4>

                                {selectedCandidate.applicationQuestions && selectedCandidate.applicationQuestions.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {selectedCandidate.applicationQuestions.map((q, qIdx) => {
                                            const ans = selectedCandidate.applicationAnswers ? selectedCandidate.applicationAnswers[q.id] : null;
                                            return (
                                                <div key={q.id || qIdx} style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
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
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>Joining Availability:</span>
                                            <strong style={{ color: '#0369a1' }}>{selectedCandidate.joiningAvailability}</strong>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block' }}>Interview Availability:</span>
                                            <strong style={{ color: '#7c3aed' }}>{selectedCandidate.interviewAvailability}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Resume Download */}
                            {(selectedCandidate.resumeUrl || selectedCandidate.resumeURL) && (
                                <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>Resume</span>
                                    <a
                                        href={selectedCandidate.resumeUrl || selectedCandidate.resumeURL}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-secondary btn-sm"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <FiDownload /> View / Download Candidate Resume
                                    </a>
                                </div>
                            )}

                            {/* Status Update Actions */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '10px' }}>Update Application Stage</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    <button onClick={() => handleStatusChange(selectedCandidate.id || selectedCandidate.applicationId, 'Under Review')} style={actionBtnStyle('#fffbeb', '#b45309')}>
                                        Under Review
                                    </button>
                                    <button onClick={() => handleStatusChange(selectedCandidate.id || selectedCandidate.applicationId, 'Shortlisted')} style={actionBtnStyle('#dcfce7', '#15803d')}>
                                        Shortlist Candidate
                                    </button>
                                    <button onClick={() => handleStatusChange(selectedCandidate.id || selectedCandidate.applicationId, 'Selected')} style={actionBtnStyle('#10b981', '#ffffff')}>
                                        Select (Hire)
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
        </div>
    );
}

const actionBtnStyle = (bg, color) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: bg,
    color: color,
    fontWeight: 800,
    fontSize: '0.82rem',
    cursor: 'pointer'
});
