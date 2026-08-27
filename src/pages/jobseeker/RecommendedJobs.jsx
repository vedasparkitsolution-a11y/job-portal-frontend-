import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOpenJobs } from '../../services/jobService';
import JobCard from '../../components/JobCard';
import CandidateSidebar from '../../components/CandidateSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiZap, FiCheckCircle } from 'react-icons/fi';

export default function RecommendedJobs() {
    const { currentUser, userData } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecommended();
    }, [userData]);

    async function loadRecommended() {
        try {
            const allJobs = await getOpenJobs();
            const candidateSkills = (userData?.skills || '').toLowerCase();
            const candidateCity = (userData?.city || userData?.address || '').toLowerCase();
            const candidatePrefLoc = (userData?.preferences?.preferredLocation || '').toLowerCase();

            const scored = allJobs.map(job => {
                let score = 65; // base score
                const jobSkills = (job.required_skills || job.skills || '').toLowerCase();
                const jobLoc = (job.job_location || job.location || '').toLowerCase();

                if (candidateSkills && jobSkills) {
                    const skList = candidateSkills.split(',').map(s => s.trim()).filter(Boolean);
                    skList.forEach(sk => {
                        if (jobSkills.includes(sk)) score += 10;
                    });
                }

                if (jobLoc && (candidateCity.includes(jobLoc) || candidatePrefLoc.includes(jobLoc))) {
                    score += 15;
                }

                return {
                    ...job,
                    matchScore: Math.min(99, score)
                };
            });

            scored.sort((a, b) => b.matchScore - a.matchScore);
            setJobs(scored);
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
                        <FiZap style={{ color: '#0ea5e9', fontSize: '1.8rem' }} />
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recommended Jobs</h1>
                    </div>
                    <p style={{ color: '#64748b', margin: 0 }}>Jobs matching your skills, experience, location, and career preferences</p>
                </div>

                {jobs.length === 0 ? (
                    <div style={{ background: 'white', padding: '60px', borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <h3>No recommended jobs right now</h3>
                        <p style={{ color: '#64748b' }}>Complete your profile skills and preferences to get AI-powered recommendations.</p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {jobs.map(job => (
                            <div key={job.id || job.job_id} style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 5, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
                                    {job.matchScore || 85}% Match
                                </div>
                                <JobCard job={job} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
