import { useState, useEffect } from 'react';
import { getPendingJobs, approveJob, rejectJob } from '../../services/jobService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiCheck, FiX, FiBriefcase } from 'react-icons/fi';
import { format } from 'date-fns';

export default function JobApprovals() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPendingJobs();
    }, []);

    async function loadPendingJobs() {
        setLoading(true);
        try {
            const pendingJobs = await getPendingJobs();
            setJobs(pendingJobs);
        } catch (err) {
            console.error('Failed to load pending jobs', err);
        }
        setLoading(false);
    }

    async function handleApprove(jobId) {
        if (!window.confirm('Are you sure you want to approve this job?')) return;
        try {
            await approveJob(jobId);
            setJobs(jobs.filter(j => j.id !== jobId));
        } catch (err) {
            console.error('Error approving job', err);
        }
    }

    async function handleReject(jobId) {
        if (!window.confirm('Are you sure you want to reject this job?')) return;
        try {
            await rejectJob(jobId);
            setJobs(jobs.filter(j => j.id !== jobId));
        } catch (err) {
            console.error('Error rejecting job', err);
        }
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '24px', color: '#1e293b' }}>Job Approvals</h1>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Review and approve new job postings before they go live on the platform.</p>

            {jobs.length === 0 ? (
                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <FiBriefcase size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                    <h3 style={{ color: '#475569', margin: 0 }}>No Pending Approvals</h3>
                    <p style={{ color: '#94a3b8', marginTop: '8px' }}>You're all caught up!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {jobs.map(job => (
                        <div key={job.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', margin: '0 0 8px 0' }}>{job.title}</h3>
                                <p style={{ color: '#64748b', margin: '0 0 12px 0', fontSize: '0.9rem' }}>
                                    <strong>{job.companyName}</strong> &bull; {job.location} &bull; {job.jobType}
                                </p>
                                <p style={{ color: '#475569', margin: 0, fontSize: '0.85rem' }}>
                                    Posted: {format(new Date(job.createdAt), 'MMM dd, yyyy')} &bull; Salary: {job.salaryRange}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => handleApprove(job.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    <FiCheck /> Approve
                                </button>
                                <button 
                                    onClick={() => handleReject(job.id)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    <FiX /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
