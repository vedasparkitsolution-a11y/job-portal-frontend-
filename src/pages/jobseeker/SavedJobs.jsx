import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSavedJobs, toggleSaveJob } from '../../services/candidateService';
import JobCard from '../../components/JobCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiBookmark, FiSearch } from 'react-icons/fi';

export default function SavedJobs() {
    const { currentUser } = useAuth();
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadSaved();
        }
    }, [currentUser]);

    async function loadSaved() {
        try {
            const data = await getSavedJobs(currentUser.uid);
            setSavedJobs(data || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '30px 20px 60px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <FiBookmark style={{ color: '#0ea5e9', fontSize: '1.8rem' }} />
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Saved Jobs</h1>
                    </div>
                    <p style={{ color: '#64748b', margin: 0 }}>Jobs you have bookmarked to review or apply later</p>
                </div>

                {savedJobs.length === 0 ? (
                    <div style={{ background: 'white', padding: '60px 20px', borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <FiBookmark size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>No saved jobs yet</h3>
                        <p style={{ color: '#64748b', marginBottom: '20px' }}>Bookmark job openings while browsing to keep track of deadlines.</p>
                        <Link to="/jobs" className="btn btn-primary">
                            <FiSearch /> Browse Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {savedJobs.map(job => (
                            <JobCard key={job.id || job.job_id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
