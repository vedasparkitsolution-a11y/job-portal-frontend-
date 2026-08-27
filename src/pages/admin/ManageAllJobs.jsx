import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllJobs, deleteJob, closeJob, approveJob, rejectJob, updateJobStatus } from '../../services/jobService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { format } from 'date-fns';
import { 
    FiTrash2, FiXCircle, FiEye, FiBriefcase, FiCheckCircle, 
    FiClock, FiAlertCircle, FiSearch, FiCheck, FiX, FiRefreshCw,
    FiPlusCircle, FiCalendar, FiMapPin, FiDollarSign
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function ManageAllJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();

    // Active status filter from URL parameter (e.g. via sidebar navigation) or default 'all'
    const activeTab = searchParams.get('status') || 'all';

    useEffect(() => {
        loadJobs();
    }, []);

    async function loadJobs() {
        setLoading(true);
        try {
            const data = await getAllJobs();
            setJobs(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    async function handleDelete(jobId) {
        await deleteJob(jobId);
        setJobs(prev => prev.filter(j => j.id !== jobId && j.job_id !== jobId && j.jobId !== jobId));
        setDeleteModal(null);
        if (addToast) addToast('success', 'Job listing removed permanently.');
    }

    async function handleApprove(jobId) {
        try {
            await approveJob(jobId);
            setJobs(prev => prev.map(j => (j.id === jobId || j.job_id === jobId || j.jobId === jobId) ? { ...j, status: 'active', jobStatus: 'active' } : j));
            if (addToast) addToast('success', 'Job posting approved and is now active.');
        } catch (e) {
            if (addToast) addToast('error', 'Failed to approve job.');
        }
    }

    async function handleReject(jobId) {
        try {
            await rejectJob(jobId);
            setJobs(prev => prev.map(j => (j.id === jobId || j.job_id === jobId || j.jobId === jobId) ? { ...j, status: 'rejected', jobStatus: 'rejected' } : j));
            if (addToast) addToast('error', 'Job posting rejected.');
        } catch (e) {
            if (addToast) addToast('error', 'Failed to reject job.');
        }
    }

    async function handleClose(jobId) {
        try {
            await closeJob(jobId);
            setJobs(prev => prev.map(j => (j.id === jobId || j.job_id === jobId || j.jobId === jobId) ? { ...j, status: 'expired', jobStatus: 'expired' } : j));
            if (addToast) addToast('info', 'Job marked as expired/closed.');
        } catch (e) {
            if (addToast) addToast('error', 'Failed to close job.');
        }
    }

    async function handleReactivate(jobId) {
        try {
            await updateJobStatus(jobId, 'active');
            setJobs(prev => prev.map(j => (j.id === jobId || j.job_id === jobId || j.jobId === jobId) ? { ...j, status: 'active', jobStatus: 'active' } : j));
            if (addToast) addToast('success', 'Job re-activated successfully.');
        } catch (e) {
            if (addToast) addToast('error', 'Failed to re-activate job.');
        }
    }

    // Determine normalized status of job
    const getJobCategory = (job) => {
        const s = (job.status || job.jobStatus || '').toLowerCase();
        if (s === 'pending') return 'pending';
        if (s === 'approved') return 'approved';
        if (s === 'rejected') return 'rejected';
        if (s === 'expired' || s === 'closed') return 'expired';
        return 'active';
    };

    // Filter list according to active status and search keyword
    const filteredJobs = jobs.filter(job => {
        const cat = getJobCategory(job);
        
        if (activeTab === 'active' && cat !== 'active') return false;
        if (activeTab === 'pending' && cat !== 'pending') return false;
        if (activeTab === 'approved' && cat !== 'approved' && cat !== 'active') return false;
        if (activeTab === 'expired' && cat !== 'expired') return false;
        if (activeTab === 'rejected' && cat !== 'rejected') return false;

        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            const title = (job.title || job.job_title || '').toLowerCase();
            const company = (job.companyName || job.company_name || '').toLowerCase();
            const location = (job.location || job.job_location || '').toLowerCase();
            const skills = (job.skills || job.required_skills || '').toLowerCase();
            return title.includes(s) || company.includes(s) || location.includes(s) || skills.includes(s);
        }

        return true;
    });

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Manage Jobs
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.92rem' }}>
                        Review, approve, close, filter, or remove job listings across the platform.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link 
                        to="/admin/post-job" 
                        style={{
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: 'white',
                            textDecoration: 'none',
                            padding: '9px 16px',
                            borderRadius: '9px',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                        }}
                    >
                        <FiPlusCircle size={15} /> Post Admin Job
                    </Link>
                </div>
            </div>

            {/* Search Bar & Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} size={15} />
                    <input
                        type="text"
                        placeholder="Search by job title, company, skills..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '9px 12px 9px 36px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                            boxSizing: 'border-box',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Showing <strong style={{ color: '#2563eb' }}>{filteredJobs.length}</strong> jobs
                </div>
            </div>

            {/* Jobs Table */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                <th style={{ padding: '12px 16px' }}>Job Info</th>
                                <th style={{ padding: '12px 16px' }}>Employer</th>
                                <th style={{ padding: '12px 16px' }}>Location & Type</th>
                                <th style={{ padding: '12px 16px' }}>Deadline</th>
                                <th style={{ padding: '12px 16px' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>No Jobs Found</div>
                                        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
                                            There are currently no jobs matching your criteria.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map(job => {
                                    const jobCat = getJobCategory(job);
                                    let deadlineDate = 'Rolling';
                                    try {
                                        const d = job.application_deadline || job.applicationDeadline || job.deadline;
                                        if (d) {
                                            const dObj = d.toDate ? d.toDate() : new Date(d);
                                            if (!isNaN(dObj.getTime())) deadlineDate = format(dObj, 'MMM dd, yyyy');
                                        }
                                    } catch (e) {}

                                    let badgeBg = '#f0fdf4';
                                    let badgeColor = '#16a34a';
                                    let badgeLabel = 'ACTIVE';

                                    if (jobCat === 'pending') {
                                        badgeBg = '#fffbeb'; badgeColor = '#b45309'; badgeLabel = 'PENDING';
                                    } else if (jobCat === 'rejected') {
                                        badgeBg = '#f3f4f6'; badgeColor = '#4b5563'; badgeLabel = 'REJECTED';
                                    } else if (jobCat === 'expired') {
                                        badgeBg = '#fef2f2'; badgeColor = '#dc2626'; badgeLabel = 'EXPIRED';
                                    } else if (jobCat === 'approved') {
                                        badgeBg = '#eff6ff'; badgeColor = '#2563eb'; badgeLabel = 'APPROVED';
                                    }

                                    // Format clean salary text without undefined
                                    const cleanSalary = (job.salary && !String(job.salary).includes('undefined')) ? job.salary : (job.salaryRange && !String(job.salaryRange).includes('undefined') ? job.salaryRange : null);

                                    return (
                                        <tr key={job.id || job.job_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                    {job.title || job.job_title}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>
                                                    ID: <span style={{ fontFamily: 'monospace' }}>{job.job_id || job.jobId || job.id}</span>
                                                    {cleanSalary ? ` • ${cleanSalary}` : ''}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 500, color: '#334155' }}>
                                                    {job.companyName || job.company_name || 'Verified Employer'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ color: '#475569', fontSize: '0.82rem' }}>
                                                    {job.location || job.job_location || 'Remote / Hybrid'}
                                                </div>
                                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                    {job.jobType || job.job_type || 'Full Time'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.82rem' }}>
                                                {deadlineDate}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    padding: '3px 9px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 700,
                                                    background: badgeBg,
                                                    color: badgeColor
                                                }}>
                                                    {badgeLabel}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px', alignItems: 'center' }}>
                                                    {/* View Job Link */}
                                                    <Link 
                                                        to={`/jobs/${job.job_id || job.jobId || job.id}`} 
                                                        target="_blank"
                                                        title="Preview Job Page"
                                                        style={{
                                                            background: '#eff6ff',
                                                            border: '1px solid #bfdbfe',
                                                            color: '#2563eb',
                                                            padding: '4px 9px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        <FiEye size={12} /> View
                                                    </Link>

                                                    {/* Approve Button */}
                                                    {(jobCat === 'pending' || jobCat === 'rejected') && (
                                                        <button
                                                            onClick={() => handleApprove(job.id || job.job_id)}
                                                            title="Approve Job"
                                                            style={{
                                                                background: '#f0fdf4',
                                                                border: '1px solid #bbf7d0',
                                                                color: '#16a34a',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px'
                                                            }}
                                                        >
                                                            <FiCheck size={12} /> Approve
                                                        </button>
                                                    )}

                                                    {/* Reject Button */}
                                                    {(jobCat === 'pending' || jobCat === 'active') && (
                                                        <button
                                                            onClick={() => handleReject(job.id || job.job_id)}
                                                            title="Reject Job"
                                                            style={{
                                                                background: '#fef2f2',
                                                                border: '1px solid #fecaca',
                                                                color: '#dc2626',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px'
                                                            }}
                                                        >
                                                            <FiX size={12} /> Reject
                                                        </button>
                                                    )}

                                                    {/* Close / Expire button */}
                                                    {(jobCat === 'active' || jobCat === 'approved') && (
                                                        <button
                                                            onClick={() => handleClose(job.id || job.job_id)}
                                                            title="Expire / Close Job"
                                                            style={{
                                                                background: '#fffbeb',
                                                                border: '1px solid #fde68a',
                                                                color: '#b45309',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px'
                                                            }}
                                                        >
                                                            <FiXCircle size={12} /> Close
                                                        </button>
                                                    )}

                                                    {/* Re-activate if expired */}
                                                    {jobCat === 'expired' && (
                                                        <button
                                                            onClick={() => handleReactivate(job.id || job.job_id)}
                                                            title="Reactivate Job"
                                                            style={{
                                                                background: '#eff6ff',
                                                                border: '1px solid #bfdbfe',
                                                                color: '#2563eb',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px'
                                                            }}
                                                        >
                                                            <FiRefreshCw size={11} /> Activate
                                                        </button>
                                                    )}

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => setDeleteModal(job.id || job.job_id)}
                                                        title="Delete Job"
                                                        style={{
                                                            background: '#ffffff',
                                                            border: '1px solid #e2e8f0',
                                                            color: '#64748b',
                                                            padding: '4px 7px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <FiTrash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Confirm Job Removal">
                <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    Are you sure you want to permanently delete this job posting? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(deleteModal)}>Confirm Delete</button>
                </div>
            </Modal>

        </div>
    );
}
