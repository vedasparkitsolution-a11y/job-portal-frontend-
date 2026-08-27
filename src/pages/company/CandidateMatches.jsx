import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';
import { FiLock, FiUnlock, FiMail, FiPhone, FiMapPin, FiBriefcase, FiBook, FiStar } from 'react-icons/fi';

export default function CandidateMatches() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unlocking, setUnlocking] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/employer/matched-candidates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCandidates(data);
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
            const res = await fetch('http://localhost:5000/api/employer/unlock-contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ candidateId })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                addToast('success', data.message || 'Contact unlocked!');
                // Refresh list to show unlocked details
                fetchMatches();
            } else {
                addToast('error', data.message || 'Failed to unlock contact');
                if (res.status === 403) {
                    // Redirect to pricing or show upgrade modal
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
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>Candidate Matches</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>AI-powered matches based on your active job postings.</p>
                </div>
                <button 
                    onClick={() => navigate('/company/subscriptions')}
                    style={{
                        padding: '10px 20px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    View Subscription Plans
                </button>
            </div>

            {candidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No candidates match your current job postings yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {candidates.map(candidate => (
                        <div key={candidate.id} style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: '#1e293b' }}>
                                        {candidate.name}
                                    </h3>
                                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FiBriefcase /> {candidate.experience} | <FiMapPin /> {candidate.city}
                                    </p>
                                </div>
                                <div style={{ 
                                    background: candidate.matchPercentage >= 90 ? '#dcfce7' : candidate.matchPercentage >= 75 ? '#fef9c3' : '#f1f5f9',
                                    color: candidate.matchPercentage >= 90 ? '#166534' : candidate.matchPercentage >= 75 ? '#854d0e' : '#475569',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <FiStar /> {candidate.matchPercentage}% Match
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {candidate.skills.map((skill, i) => (
                                        <span key={i} style={{ 
                                            background: '#f8fafc', 
                                            color: '#475569', 
                                            padding: '4px 10px', 
                                            borderRadius: '6px', 
                                            fontSize: '0.8rem',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ 
                                background: '#f8fafc', 
                                borderRadius: '12px', 
                                padding: '16px', 
                                marginTop: 'auto',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Contact Details</h4>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontSize: '0.95rem' }}>
                                        <FiMail color="#64748b" /> 
                                        <span style={{ filter: !candidate.isUnlocked ? 'blur(4px)' : 'none', transition: 'filter 0.3s' }}>
                                            {candidate.email}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontSize: '0.95rem' }}>
                                        <FiPhone color="#64748b" /> 
                                        <span style={{ filter: !candidate.isUnlocked ? 'blur(4px)' : 'none', transition: 'filter 0.3s' }}>
                                            {candidate.phone}
                                        </span>
                                    </div>
                                </div>

                                {!candidate.isUnlocked && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        backdropFilter: 'blur(1px)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <button 
                                            onClick={() => handleUnlock(candidate.id)}
                                            disabled={unlocking}
                                            style={{
                                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                cursor: unlocking ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 4px 6px rgba(124, 58, 237, 0.2)'
                                            }}
                                        >
                                            <FiLock /> {unlocking ? 'Unlocking...' : 'Unlock Contact'}
                                        </button>
                                    </div>
                                )}
                                {candidate.isUnlocked && (
                                    <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                                        <FiUnlock /> Unlocked
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
