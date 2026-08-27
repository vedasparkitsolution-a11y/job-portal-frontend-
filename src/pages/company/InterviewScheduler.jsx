import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiUser, FiBriefcase, FiTrash2, FiMail } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function InterviewScheduler() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchInterviews();
    }, []);

    async function fetchInterviews() {
        try {
            const res = await fetch('http://localhost:5000/api/interviews', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInterviews(data);
            }
        } catch (e) {
            console.error('Error fetching interviews:', e);
        } finally {
            setLoading(false);
        }
    }

    async function deleteInterview(id) {
        try {
            const res = await fetch(`http://localhost:5000/api/interviews/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setInterviews(prev => prev.filter(i => i.id !== id));
            }
        } catch (e) {
            console.error('Error deleting interview:', e);
        }
    }

    const now = new Date();
    const upcoming = interviews.filter(i => new Date(i.date + 'T' + i.time) >= now);
    const past = interviews.filter(i => new Date(i.date + 'T' + i.time) < now);

    const InterviewCard = ({ iv, isPast }) => (
        <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${isPast ? 'var(--border)' : '#8b5cf644'}`,
            borderLeft: `4px solid ${isPast ? 'var(--border)' : '#8b5cf6'}`,
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            opacity: isPast ? 0.6 : 1,
            flexWrap: 'wrap'
        }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: isPast ? '#64748b33' : '#8b5cf622', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiUser style={{ color: isPast ? '#64748b' : '#8b5cf6', fontSize: '1.2rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
                <strong style={{ fontSize: '1rem', display: 'block' }}>{iv.candidateName}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><FiBriefcase style={{ marginRight: 4 }} />{iv.jobTitle}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCalendar style={{ color: '#8b5cf6' }} />
                    {new Date(iv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiClock /> {iv.time}
                </span>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: isPast ? '#64748b22' : '#8b5cf622', color: isPast ? '#64748b' : '#8b5cf6' }}>
                {isPast ? 'Completed' : 'Upcoming'}
            </span>
            {!isPast && (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {iv.candidateEmail && (
                        <a 
                            href={`mailto:${iv.candidateEmail}?subject=Interview Confirmation: ${iv.jobTitle}&body=Hi ${iv.candidateName},%0D%0A%0D%0AThis is to confirm your interview for the ${iv.jobTitle} position on ${iv.date} at ${iv.time}.%0D%0A%0D%0ALooking forward to speaking with you!`}
                            style={{ background: '#0ea5e922', color: '#0ea5e9', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                            <FiMail /> Send Invite
                        </a>
                    )}
                    <button onClick={() => deleteInterview(iv.id)} style={{ background: '#ef444422', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}>
                        <FiTrash2 />
                    </button>
                </div>
            )}
        </div>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="dashboard">
            <div className="container">
                <div className="dashboard-header">
                    <h1>📅 Interview Schedule</h1>
                    <p>Manage all scheduled candidate interviews</p>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Interviews', count: interviews.length, color: '#6366f1' },
                        { label: 'Upcoming', count: upcoming.length, color: '#8b5cf6' },
                        { label: 'Completed', count: past.length, color: '#22c55e' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 24px', textAlign: 'center', minWidth: '120px' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.count}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {interviews.length === 0 ? (
                    <div className="empty-state">
                        <FiCalendar />
                        <h3>No interviews scheduled</h3>
                        <p>Schedule interviews from the Applicants page</p>
                    </div>
                ) : (
                    <>
                        {upcoming.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ marginBottom: '16px', color: '#8b5cf6' }}>🔜 Upcoming ({upcoming.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {upcoming.map(iv => <InterviewCard key={iv.id} iv={iv} isPast={false} />)}
                                </div>
                            </div>
                        )}
                        {past.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>✅ Past Interviews ({past.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {past.map(iv => <InterviewCard key={iv.id} iv={iv} isPast={true} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
