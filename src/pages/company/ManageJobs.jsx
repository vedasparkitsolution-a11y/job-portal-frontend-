import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getJobsByCompany, deleteJob, updateJobStatus, duplicateJob } from '../../services/jobService';
import { getApplicationsByCompany } from '../../services/applicationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { format } from 'date-fns';
import {
    FiPlus, FiEdit3, FiTrash2, FiEye, FiUsers, FiXCircle,
    FiBriefcase, FiCopy, FiPause, FiPlay, FiAlertCircle, FiClock, FiCheckCircle
} from 'react-icons/fi';

export default function ManageJobs() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(null);
    const [quotaData, setQuotaData] = useState(null);

    useEffect(() => {
        if (currentUser) {
            loadData();
            loadQuota();
        }
    }, [currentUser]);

    async function loadQuota() {
        try {
            const token = localStorage.getItem('mock_current_session') ? JSON.parse(localStorage.getItem('mock_current_session')).token : null;
            const res = await fetch('http://localhost:5000/api/subscriptions/employer-quota', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuotaData(data);
            }
        } catch (e) {}
    }

    async function loadData() {
        try {
            const [data, apps] = await Promise.all([
                getJobsByCompany(currentUser.uid),
                getApplicationsByCompany(currentUser.uid)
            ]);
            setJobs(data || []);
            setApplications(apps || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    async function handleStatusChange(jobId, newStatus) {
        try {
            await updateJobStatus(jobId, newStatus);
            setJobs(prev => prev.map(j => (j.id === jobId || j.jobId === jobId || j.job_id === jobId) ? { ...j, status: newStatus, jobStatus: newStatus } : j));
        } catch (err) {
            console.error(err);
        }
    }

    async function handleDuplicate(jobId) {
        try {
            const newId = await duplicateJob(jobId);
            if (newId) {
                await loadData();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleDelete(jobId) {
        try {
            await deleteJob(jobId);
            setJobs(prev => prev.filter(j => j.id !== jobId && j.jobId !== jobId && j.job_id !== jobId));
            setDeleteModal(null);
        } catch (err) {
            console.error(err);
        }
    }

    const getStatusStyle = (st) => {
        const s = (st || 'active').toLowerCase();
        if (s === 'active' || s === 'open') return { label: 'Active', bg: '#dcfce7', color: '#15803d' };
        if (s === 'draft') return { label: 'Draft', bg: '#f1f5f9', color: '#475569' };
        if (s === 'paused') return { label: 'Paused', bg: '#fef3c7', color: '#b45309' };
        if (s === 'closed') return { label: 'Closed', bg: '#e0e7ff', color: '#4338ca' };
        if (s === 'expired') return { label: 'Expired', bg: '#fee2e2', color: '#b91c1c' };
        return { label: s, bg: '#f1f5f9', color: '#475569' };
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="dashboard" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
            <div className="container" style={{ maxWidth: '1140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingTop: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Manage Job Postings</h1>
                        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.92rem' }}>Manage job statuses, duplicate postings, and track applications</p>
                    </div>
                    <Link to="/company/post-job" className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: 800 }}>
                        <FiPlus /> + Post a Job
                    </Link>
                </div>

                {/* Quota Widget */}
                {quotaData && (
                    <div style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                                <FiBriefcase />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                                    Job Limit: {quotaData.postedCount} / {quotaData.allowedLimit >= 9999 ? 'Unlimited' : quotaData.allowedLimit} Jobs Posted
                                </span>
                                <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b' }}>
                                    Active Plan: <strong>{quotaData.activePlanName}</strong> {!quotaData.isPremium && `(Free Limit: ${quotaData.freeLimit} Jobs)`}
                                </span>
                            </div>
                        </div>

                        <Link
                            to="/company/subscriptions"
                            style={{
                                background: quotaData.canPostMore ? '#f5f3ff' : '#dc2626',
                                color: quotaData.canPostMore ? '#7c3aed' : '#ffffff',
                                border: quotaData.canPostMore ? '1px solid #ddd6fe' : 'none',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            ⚡ {quotaData.canPostMore ? 'Upgrade Quota (20, 50, 100 Jobs)' : 'Limit Reached — Upgrade Now'}
                        </Link>
                    </div>
                )}

                {jobs.length === 0 ? (
                    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '60px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                        <FiBriefcase size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>No jobs found</h3>
                        <p style={{ color: '#64748b' }}>Post a new job to start hiring top talent!</p>
                        <Link to="/company/post-job" className="btn btn-primary" style={{ marginTop: '16px' }}>+ Post a Job</Link>
                    </div>
                ) : (
                    <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={thStyle}>Job & Details</th>
                                    <th style={thStyle}>Type & Location</th>
                                    <th style={thStyle}>Openings</th>
                                    <th style={thStyle}>Applications</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map(job => {
                                    const jobApps = applications.filter(a => a.jobId === job.id || a.jobId === job.jobId || a.jobId === job.job_id);
                                    const totalApps = jobApps.length;
                                    const badge = getStatusStyle(job.status || job.jobStatus);

                                    return (
                                        <tr key={job.id || job.jobId || job.job_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '6px' }}>
                                                        {job.job_id || job.jobId || job.id}
                                                    </span>
                                                    {job.hiring_priority === 'Urgent' && (
                                                        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                                                            🔥 Urgent
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 style={{ margin: '4px 0 2px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                                    {job.job_title || job.title || job.jobTitle}
                                                </h4>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    Deadline: {job.application_deadline || job.deadline || 'No deadline'}
                                                </span>
                                            </td>

                                            <td style={{ padding: '16px 20px', fontSize: '0.88rem', color: '#334155', fontWeight: 600 }}>
                                                <div>{job.job_type || job.jobType || 'Full Time'}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{job.job_location || job.location || 'Remote'}</div>
                                            </td>

                                            <td style={{ padding: '16px 20px', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                                                {job.number_of_openings || 1}
                                            </td>

                                            <td style={{ padding: '16px 20px' }}>
                                                <Link to={`/company/view-applicants/${job.id || job.jobId}`} style={{ textDecoration: 'none', background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    <FiUsers /> {totalApps} Applications
                                                </Link>
                                            </td>

                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, background: badge.bg, color: badge.color }}>
                                                    {badge.label}
                                                </span>
                                            </td>

                                            {/* Action Buttons (Requirement 17) */}
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <Link to={`/jobs/${job.id || job.jobId}`} className="btn btn-sm btn-secondary" title="View Candidate Listing" style={{ padding: '6px 10px' }}>
                                                        <FiEye />
                                                    </Link>

                                                    <button onClick={() => handleDuplicate(job.id || job.jobId)} className="btn btn-sm btn-secondary" title="Duplicate Job" style={{ padding: '6px 10px' }}>
                                                        <FiCopy />
                                                    </button>

                                                    {(job.status === 'active' || job.status === 'open') ? (
                                                        <button onClick={() => handleStatusChange(job.id || job.jobId, 'paused')} className="btn btn-sm btn-secondary" title="Pause Job" style={{ padding: '6px 10px', color: '#b45309' }}>
                                                            <FiPause />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleStatusChange(job.id || job.jobId, 'active')} className="btn btn-sm btn-secondary" title="Activate Job" style={{ padding: '6px 10px', color: '#166534' }}>
                                                            <FiPlay />
                                                        </button>
                                                    )}

                                                    <button onClick={() => handleStatusChange(job.id || job.jobId, 'closed')} className="btn btn-sm btn-secondary" title="Close Job" style={{ padding: '6px 10px', color: '#4338ca' }}>
                                                        <FiXCircle />
                                                    </button>

                                                    <button onClick={() => setDeleteModal(job.id || job.jobId)} className="btn btn-sm btn-danger" title="Delete Job" style={{ padding: '6px 10px' }}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Job Listing">
                    <p style={{ marginBottom: '20px', color: '#64748b' }}>
                        Are you sure you want to delete this job listing? This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
                        <button className="btn btn-danger" onClick={() => handleDelete(deleteModal)}>Delete Job</button>
                    </div>
                </Modal>
            </div>
        </div>
    );
}

const thStyle = {
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase'
};
