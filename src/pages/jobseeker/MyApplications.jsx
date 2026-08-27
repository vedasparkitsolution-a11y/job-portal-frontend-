import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getApplicationsByUser, getCandidateNotifications } from '../../services/applicationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CandidateSidebar from '../../components/CandidateSidebar';
import { format } from 'date-fns';
import {
    FiFileText, FiExternalLink, FiCalendar, FiClock, FiVideo,
    FiCheckCircle, FiInfo, FiHelpCircle, FiX, FiCheck
} from 'react-icons/fi';

export default function MyApplications() {
    const { currentUser } = useAuth();
    const [applications, setApplications] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnswersApp, setSelectedAnswersApp] = useState(null);

    useEffect(() => {
        if (currentUser) {
            loadApplications();
        }
    }, [currentUser]);

    async function loadApplications() {
        try {
            const apps = await getApplicationsByUser(currentUser.uid);
            setApplications(apps || []);
            const notifs = getCandidateNotifications(currentUser.uid);
            setNotifications(notifs || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    const getStatusBadge = (status) => {
        const s = (status || 'Applied').toLowerCase();
        if (s === 'shortlisted') return { label: 'Shortlisted', bg: '#dcfce7', color: '#15803d' };
        if (s === 'under review') return { label: 'Under Review', bg: '#fef3c7', color: '#b45309' };
        if (s === 'interview scheduled' || s === 'interview_scheduled') return { label: 'Interview Scheduled', bg: '#f3e8ff', color: '#7e22ce' };
        if (s === 'interview completed' || s === 'interview_completed') return { label: 'Interview Completed', bg: '#e0e7ff', color: '#4338ca' };
        if (s === 'selected' || s === 'hired') return { label: 'Selected 🎉', bg: '#10b981', color: '#ffffff' };
        if (s === 'rejected') return { label: 'Rejected', bg: '#fee2e2', color: '#b91c1c' };
        return { label: 'Applied', bg: '#e0f2fe', color: '#0369a1' };
    };

    if (loading) return <LoadingSpinner />;

    return (
        <CandidateSidebar>
            <div style={{ maxWidth: '1050px', margin: '0 auto', paddingBottom: '60px' }}>
                <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>My Applications</h1>
                    <p style={{ color: '#64748b' }}>Track and manage all job applications submitted through JobConnect</p>
                </div>

                {/* Notifications Alert Banner */}
                {notifications.length > 0 && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                        border: '1px solid #bae6fd', borderRadius: '16px',
                        padding: '16px 20px', marginBottom: '24px'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiInfo /> Application Notifications
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {notifications.slice(0, 3).map(n => (
                                <p key={n.id} style={{ margin: 0, fontSize: '0.88rem', color: '#0c4a6e', fontWeight: 600 }}>
                                    • {n.message} <span style={{ fontSize: '0.75rem', color: '#0284c7', opacity: 0.8 }}>({new Date(n.time).toLocaleDateString()})</span>
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {applications.length === 0 ? (
                    <div style={{
                        background: '#ffffff', borderRadius: '20px', padding: '60px 24px',
                        textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%', background: '#f0f9ff',
                            color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.2rem', margin: '0 auto 16px'
                        }}>
                            <FiFileText />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                            You haven't applied for any jobs yet.
                        </h3>
                        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 24px' }}>
                            Explore thousands of open job opportunities matching your skills and start applying today!
                        </p>
                        <Link to="/jobs" className="btn btn-primary btn-lg">
                            Browse Jobs Now
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {applications.map(app => {
                            const badge = getStatusBadge(app.applicationStatus || app.status);
                            const rawDate = app.appliedDate || app.appliedAt;
                            let appliedStr = 'Recently';
                            try {
                                if (rawDate) {
                                    const d = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
                                    if (!isNaN(d.getTime())) appliedStr = format(d, 'MMM dd, yyyy');
                                }
                            } catch (e) {}

                            const questions = app.applicationQuestions || [];
                            const answers = app.applicationAnswers || {};
                            const hasQuestions = (Array.isArray(questions) && questions.length > 0) || Object.keys(answers).length > 0;

                            return (
                                <div key={app.id || app.applicationId} style={{
                                    background: '#ffffff', borderRadius: '20px', padding: '24px',
                                    border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                                    {app.jobTitle}
                                                </h3>
                                                <span style={{
                                                    background: badge.bg, color: badge.color,
                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800
                                                }}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0ea5e9' }}>
                                                {app.companyName}
                                            </p>
                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#64748b' }}>
                                                <span>Applied on: <strong>{appliedStr}</strong></span>
                                                <span>Application ID: <strong>{app.applicationId || app.id}</strong></span>
                                                {app.joiningAvailability && <span>Joining: <strong>{app.joiningAvailability}</strong></span>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            {hasQuestions && (
                                                <button
                                                    onClick={() => setSelectedAnswersApp(app)}
                                                    className="btn btn-secondary"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                                                >
                                                    <FiHelpCircle /> View My Answers
                                                </button>
                                            )}
                                            <Link to={`/jobs/${app.jobId}`} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                                <FiExternalLink /> View Job Details
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Cover Letter excerpt */}
                                    {app.coverLetter && (
                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '0.88rem', color: '#475569', marginBottom: '12px' }}>
                                            <strong>Cover Letter:</strong> "{app.coverLetter}"
                                        </div>
                                    )}

                                    {/* Interview Scheduled Card */}
                                    {(app.applicationStatus === 'Interview Scheduled' || app.status === 'interview_scheduled' || app.interviewDate) && (
                                        <div style={{
                                            background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
                                            border: '1.5px solid #d8b4fe', borderRadius: '14px', padding: '18px 20px',
                                            marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
                                        }}>
                                            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FiCalendar /> Interview Invitation Details
                                            </h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.88rem', color: '#581c87', fontWeight: 600 }}>
                                                <span><FiCalendar /> Date: <strong>{app.interviewDate || 'To be confirmed'}</strong></span>
                                                <span><FiClock /> Time: <strong>{app.interviewTime || '10:00 AM'}</strong></span>
                                                <span><FiVideo /> Type: <strong>{app.interviewType || 'Online Video Interview'}</strong></span>
                                            </div>
                                            {app.meetingLink && (
                                                <div style={{ marginTop: '6px' }}>
                                                    <a href={app.meetingLink.startsWith('http') ? app.meetingLink : `https://${app.meetingLink}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ background: '#7e22ce', textDecoration: 'none', fontWeight: 700 }}>
                                                        Join Video Meeting
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal to view submitted answers */}
                {selectedAnswersApp && (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, padding: '20px'
                    }}>
                        <div style={{
                            background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '640px',
                            maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                                <div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>Submitted Application Answers</span>
                                    <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                        {selectedAnswersApp.jobTitle} – {selectedAnswersApp.companyName}
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedAnswersApp(null)} style={{ border: 'none', background: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                                    <FiX size={18} />
                                </button>
                            </div>

                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {selectedAnswersApp.applicationQuestions && selectedAnswersApp.applicationQuestions.length > 0 ? (
                                    selectedAnswersApp.applicationQuestions.map((q, idx) => {
                                        const ans = selectedAnswersApp.applicationAnswers ? selectedAnswersApp.applicationAnswers[q.id] : null;
                                        return (
                                            <div key={q.id || idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                                                <p style={{ margin: '0 0 8px 0', fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                                                    <span style={{ color: '#0284c7', marginRight: '6px' }}>Q{idx + 1}:</span>
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
                                                            {ans ? String(ans) : (q.id === 'q_joining' ? selectedAnswersApp.joiningAvailability : q.id === 'q_interview' ? selectedAnswersApp.interviewAvailability : 'Not answered')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>Joining Availability:</span>
                                            <strong style={{ color: '#0369a1' }}>{selectedAnswersApp.joiningAvailability || 'Immediately'}</strong>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>Interview Availability:</span>
                                            <strong style={{ color: '#7c3aed' }}>{selectedAnswersApp.interviewAvailability || 'Anytime'}</strong>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CandidateSidebar>
    );
}
