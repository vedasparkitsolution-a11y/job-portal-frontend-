import { Link } from 'react-router-dom';
import { FiMapPin, FiBriefcase, FiDollarSign, FiCalendar, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

function parseArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
    if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [String(val)];
}

export default function JobCard({ job }) {
    if (!job) return null;

    let deadline = null;
    let isExpired = false;
    try {
        if (job.deadline || job.application_deadline) {
            const dlStr = job.application_deadline || job.deadline;
            deadline = dlStr?.toDate ? dlStr.toDate() : new Date(dlStr);
            isExpired = deadline < new Date() && !isNaN(deadline.getTime());
        }
    } catch {
        deadline = null;
    }

    const skillsList = parseArray(job.required_skills || job.skills);
    const companyInitial = String(job.companyName || job.company_name || 'C').charAt(0).toUpperCase();
    const jobIdTarget = job.job_id || job.jobId || job.id;

    return (
        <div className="job-card">
            <div className="job-card-header">
                <div className="job-card-company">
                    {job.companyLogo || job.company_logo ? (
                        <img
                            src={job.companyLogo || job.company_logo}
                            alt={job.companyName || job.company_name || 'Company'}
                            className="job-card-logo"
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                objectFit: 'contain',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div
                        className="job-card-logo-placeholder"
                        style={{
                            display: (job.companyLogo || job.company_logo) ? 'none' : 'flex',
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            alignItems: 'center',
                            justify: 'center'
                        }}
                    >
                        {companyInitial}
                    </div>
                    <div>
                        <h3 className="job-card-title">{job.title || job.jobTitle || job.job_title || 'Job Title'}</h3>
                        <p className="job-card-company-name">{job.companyName || job.company_name || 'Company'}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {(job.hiring_priority === 'Urgent' || job.hiringPriority === 'Urgent') && (
                        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                            🔥 Urgent
                        </span>
                    )}
                    <span className={`job-type-badge ${(job.jobType || job.job_type || 'fulltime')?.toLowerCase().replace(/[\s-]/g, '')}`}>
                        {job.jobType || job.job_type || 'Full Time'}
                    </span>
                </div>
            </div>

            <div className="job-card-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span className="meta-pill"><FiMapPin style={{ color: '#0ea5e9' }} /> {job.location || job.job_location || 'Location Not Specified'}</span>
                {job.distance_km !== undefined && job.distance_km !== null && (
                    <span className="meta-pill" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 700 }}>
                        <FiMapPin style={{ color: '#2563eb' }} /> {job.distance_km === 0 ? '📍 Nearby (< 1 km)' : `📍 ${job.distance_km} km away`}
                    </span>
                )}
                <span className="meta-pill"><FiBriefcase style={{ color: '#6366f1' }} /> {job.experience || job.experience_type || 'Any Experience'}</span>
                <span className="meta-pill"><FiDollarSign style={{ color: '#10b981' }} /> {job.salary || job.salaryRange || 'Competitive Salary'}</span>
            </div>

            {skillsList.length > 0 && (
                <div className="job-card-skills">
                    {skillsList.slice(0, 4).map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                    ))}
                </div>
            )}

            <div className="job-card-footer">
                <span className={`job-card-deadline ${isExpired ? 'expired-text' : ''}`}>
                    <FiCalendar style={{ color: isExpired ? '#ef4444' : '#0ea5e9' }} />
                    {!deadline ? 'Open Position' : isExpired ? 'Expired' : `Deadline: ${format(deadline, 'MMM dd, yyyy')}`}
                </span>
                <Link to={`/jobs/${jobIdTarget}`} className="btn btn-sm btn-primary view-details-btn">
                    View Details
                </Link>
            </div>
        </div>
    );
}
