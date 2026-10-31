import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';
import { API_BASE_URL } from '../../config/api';
import { FiLock, FiUnlock, FiMail, FiPhone, FiMapPin, FiBriefcase, FiBook, FiStar, FiFileText, FiDownload, FiCheckCircle } from 'react-icons/fi';

export default function CandidateMatches() {
    const [candidates, setCandidates] = useState([]);
    const [quotaData, setQuotaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unlocking, setUnlocking] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        fetchMatchesAndQuota();
    }, []);

    const fetchMatchesAndQuota = async () => {
        try {
            const [candRes, quotaRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/employer/matched-candidates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),
                fetch(`${API_BASE_URL}/api/subscriptions/employer-quota`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null)
            ]);

            if (candRes && candRes.ok) {
                const data = await candRes.json();
                setCandidates(Array.isArray(data) ? data : []);
            } else {
                setCandidates([]);
            }
            if (quotaRes && quotaRes.ok) {
                const qData = await quotaRes.json();
                setQuotaData(qData);
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
            addToast('error', 'Failed to load candidate matches');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async (candidateId) => {
        setUnlocking(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/employer/unlock-contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ candidateId })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                addToast('success', data.message || 'Student contact details and resume unlocked!');
                fetchMatchesAndQuota();
            } else {
                addToast('error', data.message || 'Failed to unlock contact');
                if (res.status === 403) {
                    navigate('/company/subscriptions');
                }
            }
        } catch (error) {
            console.error('Unlock error:', error);
            addToast('error', 'An error occurred while unlocking contact');
        } finally {
            setUnlocking(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Candidate & Student Matches</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>View candidate profiles, contact details, and download resumes matching your active jobs.</p>
                </div>
                <button 
                    onClick={() => navigate('/company/subscriptions')}
                    style={{
                        padding: '11px 22px',
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)'
                    }}
                >
                    View All Subscription Plans
                </button>
            </div>

            {/* ── UNLOCK QUOTA BANNER ── */}
            {quotaData && (
                <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '16px 22px',
                    marginBottom: '28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            <FiUnlock />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                                Plan: {quotaData.activePlanName}
                            </span>
                            <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.98rem' }}>
                                Student Contact & Resume Unlocks: {quotaData.contactViewLimit === -1 
                                    ? 'Unlimited Unlocks Enabled 🚀' 
                                    : `${quotaData.contactsViewed || 0} of ${quotaData.contactViewLimit || 50} Used (${quotaData.contactsRemaining !== undefined ? quotaData.contactsRemaining : 'N/A'} Remaining)`}
                            </strong>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/company/subscriptions')}
                        style={{
                            background: '#ffffff',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '7px 16px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        {quotaData.contactViewLimit === -1 ? 'Manage Plan' : 'Get More Student Unlocks (100 / Unlimited) →'}
                    </button>
                </div>
            )}

            {(!Array.isArray(candidates) || candidates.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No candidates match your current job postings yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
                    {(Array.isArray(candidates) ? candidates : []).map(candidate => (
                        <div key={candidate.id} style={{
                            background: '#fff',
                            borderRadius: '18px',
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
                        }}>
                            {/* Card Top */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
                                        {candidate.name}
                                    </h3>
                                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FiBriefcase /> {candidate.experience} • <FiMapPin /> {candidate.city}
                                    </p>
                                </div>
                                <div style={{ 
                                    background: candidate.matchPercentage >= 90 ? '#dcfce7' : candidate.matchPercentage >= 75 ? '#fef9c3' : '#f1f5f9',
                                    color: candidate.matchPercentage >= 90 ? '#166534' : candidate.matchPercentage >= 75 ? '#854d0e' : '#475569',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <FiStar /> {candidate.matchPercentage}% Match
                                </div>
                            </div>

                            {/* Skills */}
                            <div style={{ marginBottom: '18px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {candidate.skills.map((skill, i) => (
                                        <span key={i} style={{ 
                                            background: '#f1f5f9', 
                                            color: '#334155', 
                                            padding: '4px 10px', 
                                            borderRadius: '6px', 
                                            fontSize: '0.78rem',
                                            fontWeight: 600
                                        }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Contact & Resume Box */}
                            <div style={{ 
                                background: '#f8fafc', 
                                borderRadius: '14px', 
                                padding: '16px', 
                                marginTop: 'auto',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                                        Student Details & Resume
                                    </h4>
                                    {candidate.isUnlocked && (
                                        <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                            <FiCheckCircle /> Unlocked
                                        </span>
                                    )}
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontSize: '0.92rem' }}>
                                        <FiMail color="#64748b" /> 
                                        <span style={{ filter: !candidate.isUnlocked ? 'blur(5px)' : 'none', userSelect: !candidate.isUnlocked ? 'none' : 'auto' }}>
                                            {candidate.email}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontSize: '0.92rem' }}>
                                        <FiPhone color="#64748b" /> 
                                        <span style={{ filter: !candidate.isUnlocked ? 'blur(5px)' : 'none', userSelect: !candidate.isUnlocked ? 'none' : 'auto' }}>
                                            {candidate.phone}
                                        </span>
                                    </div>
                                </div>

                                {/* Download Resume Button (when unlocked) */}
                                {candidate.isUnlocked && candidate.resume_url && (
                                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                        <a
                                            href={candidate.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '9px 16px',
                                                background: '#0284c7',
                                                color: 'white',
                                                borderRadius: '10px',
                                                textDecoration: 'none',
                                                fontSize: '0.86rem',
                                                fontWeight: 700,
                                                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
                                            }}
                                        >
                                            <FiFileText /> View / Download Student Resume ({candidate.resume_name || 'Resume.pdf'})
                                        </a>
                                    </div>
                                )}

                                {/* Lock Overlay */}
                                {!candidate.isUnlocked && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(255, 255, 255, 0.75)',
                                        backdropFilter: 'blur(2px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '16px'
                                    }}>
                                        <button 
                                            onClick={() => handleUnlock(candidate.id)}
                                            disabled={unlocking}
                                            style={{
                                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 18px',
                                                borderRadius: '10px',
                                                fontWeight: 700,
                                                fontSize: '0.88rem',
                                                cursor: unlocking ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                                            }}
                                        >
                                            <FiLock /> {unlocking ? 'Unlocking...' : 'Unlock Phone & Resume'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
