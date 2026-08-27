import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getJobsByCompany } from '../../services/jobService';
import { getApplicationsByCompany } from '../../services/applicationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
    FiPlus, FiList, FiUsers, FiClock, FiTrendingUp, FiActivity, 
    FiBriefcase, FiZap, FiCreditCard, FiCheck, FiStar, FiArrowRight, FiShield, FiFileText 
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function CompanyDashboard() {
    const { currentUser, userData, token } = useAuth();
    const [stats, setStats] = useState({ jobs: 0, apps: 0, active: 0, short: 0, hired: 0, interviews: 0 });
    const [recentJobs, setRecentJobs] = useState([]);
    const [recentApps, setRecentApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [employerPlans, setEmployerPlans] = useState([]);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const DEFAULT_EMPLOYER_PLANS = [
        {
            id: 'emp_plan_1',
            name: 'Starter Employer',
            target_role: 'employer',
            price: 0,
            billing_type: 'monthly',
            duration_months: 1,
            status: 'active',
            job_limit: 3,
            contact_views: 10,
            resume_downloads: 5,
            data_request_limit: 0,
            features: 'Post up to 3 Active Jobs\nView 10 Candidate Profiles\n5 Resume Downloads\nStandard Email Support'
        },
        {
            id: 'emp_plan_2',
            name: 'Growth Recruiter',
            target_role: 'employer',
            price: 4999,
            billing_type: 'monthly',
            duration_months: 1,
            status: 'active',
            is_popular: 1,
            badge_text: 'Most Popular',
            job_limit: 25,
            contact_views: 100,
            resume_downloads: 100,
            data_request_limit: 50,
            features: 'Post up to 25 Active Jobs\n100 Contact Views & Resumes\n50 Candidate Data Exports\nAutomated Screening Questions\nPriority SLA Support'
        },
        {
            id: 'emp_plan_3',
            name: 'Enterprise Scale',
            target_role: 'employer',
            price: 19999,
            billing_type: 'monthly',
            duration_months: 1,
            status: 'active',
            is_popular: 0,
            badge_text: 'Enterprise',
            job_limit: 100,
            contact_views: 500,
            resume_downloads: 500,
            data_request_limit: 250,
            features: 'Post up to 100 Active Jobs\n500 Resume Downloads\n250 Candidate Data Exports\nDedicated Account Manager\nCustom Hiring Pipeline'
        }
    ];

    useEffect(() => {
        loadData();
    }, [currentUser, token]);

    async function loadData() {
        try {
            const uid = currentUser?.uid || 'user_company_001';
            const compId = userData?.company_id || userData?.companyId || '';

            const [jobs, apps, subRes, plansRes] = await Promise.all([
                getJobsByCompany(uid).catch(() => []),
                getApplicationsByCompany(uid).catch(() => []),
                fetch('http://localhost:5000/api/subscriptions/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.ok ? res.json() : null).catch(() => null),
                fetch(`http://localhost:5000/api/subscriptions/plans?target_role=employer&company_id=${compId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.ok ? res.json() : null).catch(() => null)
            ]);
            
            if (subRes && subRes.hasActiveSubscription) {
                setSubscription(subRes);
            } else {
                // Check mock subscription in localStorage
                const mockCompanySub = JSON.parse(localStorage.getItem('mock_company_subscription') || 'null');
                if (mockCompanySub && new Date(mockCompanySub.expiryDate) > new Date()) {
                    setSubscription({ hasActiveSubscription: true, subscription: mockCompanySub });
                }
            }

            // Set Employer Plans (from Admin)
            let fetchedPlans = [];
            if (plansRes && Array.isArray(plansRes)) {
                fetchedPlans = plansRes.filter(p => p.target_role === 'employer' || p.role === 'company');
            }
            setEmployerPlans(fetchedPlans);
            
            const employerJobs = (jobs || []).filter(j => j.companyId === uid || j.employerId === uid);
            const employerApps = (apps || []).filter(a => a.companyId === uid || a.employerId === uid);

            setStats({
                jobs: employerJobs.length,
                active: employerJobs.filter(j => j.status === 'open' || j.jobStatus === 'open').length,
                apps: employerApps.length,
                newApps: employerApps.filter(a => (a.applicationStatus || a.status || '').toLowerCase() === 'applied' || (a.applicationStatus || a.status || '').toLowerCase() === 'pending').length,
                suitable: employerApps.filter(a => (a.matchScore || a.aiMatch || 0) >= 75).length,
                short: employerApps.filter(a => (a.applicationStatus || a.status || '').toLowerCase() === 'shortlisted').length,
                interviews: employerApps.filter(a => (a.applicationStatus || a.status || '').toLowerCase().includes('interview')).length,
                hired: employerApps.filter(a => (a.applicationStatus || a.status || '').toLowerCase() === 'selected' || (a.applicationStatus || a.status || '').toLowerCase() === 'hired').length,
                rejected: employerApps.filter(a => (a.applicationStatus || a.status || '').toLowerCase() === 'rejected').length
            });
            setRecentJobs(employerJobs.slice(0, 5));
            setRecentApps(employerApps.slice(0, 5));
        } catch (err) {
            console.error('CompanyDashboard loadData error:', err);
            setEmployerPlans(DEFAULT_EMPLOYER_PLANS);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                
                {/* ── HEADER ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', paddingTop: '28px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
                                Hello, <span style={{ color: '#7c3aed' }}>{userData?.companyName || 'Company'} 👋</span>
                            </h1>
                            {subscription?.hasActiveSubscription && (
                                <span style={{
                                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                    color: 'white',
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    padding: '4px 14px',
                                    borderRadius: '20px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    ⭐ {subscription.subscription.planName || 'Active Pro'}
                                </span>
                            )}
                        </div>
                        <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>Monitor your hiring pipeline, candidate applications, and active subscription</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link to="/company/subscriptions" style={{
                            textDecoration: 'none',
                            background: '#f5f3ff', color: '#7c3aed', border: '1.5px solid #ddd6fe',
                            padding: '11px 20px', borderRadius: '12px', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <FiCreditCard /> Subscription Plans
                        </Link>
                        <Link to="/company/post-job" style={{
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            color: 'white', textDecoration: 'none',
                            padding: '11px 22px', borderRadius: '12px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 8px 18px rgba(124, 58, 237, 0.25)'
                        }}>
                            <FiPlus /> Post New Job
                        </Link>
                    </div>
                </div>

                {/* Active Subscription Banner */}
                {subscription?.hasActiveSubscription ? (
                    <div style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        color: 'white',
                        borderRadius: '20px',
                        padding: '24px 28px',
                        marginBottom: '36px',
                        border: '1px solid #334155',
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                                    Active Plan
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                                    Expires on {subscription.subscription.expiryDate ? new Date(subscription.subscription.expiryDate).toLocaleDateString('en-GB') : 'Active'} ({subscription.subscription.remainingDays || 30} days left)
                                </span>
                            </div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                                {subscription.subscription.planName} Plan Active
                            </h3>
                            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.88rem' }}>
                                🔓 {subscription.subscription.contactsRemaining !== undefined ? subscription.subscription.contactsRemaining : 'Unlimited'} Contact Views Remaining • {subscription.subscription.jobsRemaining !== undefined ? subscription.subscription.jobsRemaining : 'Active'} Job Postings
                            </p>
                        </div>
                        <Link to="/company/subscriptions" style={{
                            padding: '10px 22px', background: '#7c3aed', border: 'none',
                            borderRadius: '10px', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem'
                        }}>
                            Manage Subscription
                        </Link>
                    </div>
                ) : (
                    <div style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        borderRadius: '20px',
                        padding: '24px 28px',
                        marginBottom: '36px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'white',
                        border: '1px solid #334155',
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div>
                            <span style={{ background: '#7c3aed', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '6px' }}>
                                Recruiter Upgrade
                            </span>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800 }}>Unlock Full Candidate Profiles & Direct Contacts 🚀</h3>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem' }}>Subscribe to an employer plan to unlock candidate resumes, phone numbers, and export candidate lists.</p>
                        </div>
                        <Link to="/company/subscriptions" style={{
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            border: 'none', textDecoration: 'none', padding: '12px 24px',
                            borderRadius: '12px', fontWeight: 700, color: 'white', fontSize: '0.92rem',
                            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                        }}>
                            View All Plans
                        </Link>
                    </div>
                )}

                {/* ── STATS GRID ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                    {[
                        { label: 'Total Jobs', value: stats.jobs, color: '#64748b', icon: <FiBriefcase /> },
                        { label: 'Active Jobs', value: stats.active, color: '#7c3aed', icon: <FiBriefcase /> },
                        { label: 'Total Applications', value: stats.apps, color: '#3b82f6', icon: <FiUsers /> },
                        { label: 'New Applications', value: stats.newApps || 0, color: '#0ea5e9', icon: <FiClock /> },
                        { label: 'Suitable Candidates', value: stats.suitable || 0, color: '#059669', icon: <FiZap /> },
                        { label: 'Shortlisted', value: stats.short, color: '#8b5cf6', icon: <FiTrendingUp /> },
                        { label: 'Interviews', value: stats.interviews, color: '#f59e0b', icon: <FiClock /> },
                        { label: 'Selected', value: stats.hired, color: '#10b981', icon: <FiActivity /> },
                        { label: 'Rejected', value: stats.rejected || 0, color: '#ef4444', icon: <FiActivity /> },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'white', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ color: s.color, fontSize: '1.3rem', marginBottom: '12px' }}>{s.icon}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginTop: '8px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── DYNAMIC EMPLOYER SUBSCRIPTION PLANS (Posted by Admin) ── */}
                <div style={{
                    marginBottom: '44px',
                    padding: '32px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                                    Admin Posted Packages
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Hiring & Contact Quota Plans</span>
                            </div>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                Employer <span style={{ color: '#7c3aed' }}>Subscription Plans</span>
                            </h2>
                        </div>
                        <Link to="/company/subscriptions" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Compare All Plans & Quotas <FiArrowRight />
                        </Link>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '20px'
                    }}>
                        {employerPlans.slice(0, 3).map((plan) => {
                            const isCurrentActive = subscription?.hasActiveSubscription && (subscription.subscription.planName === plan.name || subscription.subscription.planId === plan.id);
                            const isFree = Number(plan.price) === 0;
                            const isPopular = plan.is_popular === 1 || plan.is_popular === true || plan.badge_text;
                            const featuresList = plan.features ? plan.features.split('\n').filter(Boolean).slice(0, 4) : [
                                `${plan.job_limit === -1 ? 'Unlimited' : (plan.job_limit || 20)} Job Postings`,
                                `${plan.contact_views === -1 ? 'Unlimited' : (plan.contact_views || 50)} Candidate Contact Views`,
                                `${plan.resume_downloads === -1 ? 'Unlimited' : (plan.resume_downloads || 25)} Resume Downloads`
                            ];

                            return (
                                <div
                                    key={plan.id}
                                    style={{
                                        background: isPopular ? '#faf5ff' : '#ffffff',
                                        borderRadius: '18px',
                                        padding: '24px',
                                        border: isPopular ? '2px solid #a855f7' : '1px solid #e2e8f0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative'
                                    }}
                                >
                                    {isPopular && (
                                        <div style={{
                                            position: 'absolute', top: '-11px', right: '20px',
                                            background: '#7c3aed', color: 'white', fontSize: '0.72rem',
                                            fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase'
                                        }}>
                                            {plan.badge_text || 'Most Popular'}
                                        </div>
                                    )}

                                    <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                                        {plan.name}
                                    </h3>

                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                                            {isFree ? 'Free' : `₹${Number(plan.price).toLocaleString('en-IN')}`}
                                        </span>
                                        {!isFree && (
                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                                /{plan.billing_type || 'mo'}
                                            </span>
                                        )}
                                    </div>

                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {featuresList.map((feat, idx) => (
                                            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                                                <FiCheck style={{ color: '#16a34a', flexShrink: 0 }} />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrentActive ? (
                                        <div style={{
                                            padding: '10px', borderRadius: '10px', background: '#f3e8ff',
                                            color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}>
                                            <FiCheck /> Current Active Plan
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => navigate('/company/subscriptions')}
                                            style={{
                                                padding: '10px', borderRadius: '10px',
                                                background: isPopular ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : '#0f172a',
                                                color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.88rem',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: isPopular ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none'
                                            }}
                                        >
                                            {isFree ? 'Select Free Tier' : `Upgrade to ${plan.name.replace(' Employer', '')}`}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── RECENT JOBS & APPLICANTS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {/* Recent Jobs */}
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Recent Postings</h3>
                            <Link to="/company/manage-jobs" style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
                        </div>
                        {recentJobs.length === 0 ? <p style={{ color: '#94a3b8' }}>No jobs posted yet.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {recentJobs.map(job => (
                                    <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{job.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{job.jobType} • {job.location}</div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', background: job.status === 'open' ? '#f0fdf4' : '#fef2f2', color: job.status === 'open' ? '#16a34a' : '#dc2626', fontWeight: 700, textTransform: 'capitalize' }}>
                                            {job.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Latest Applicants */}
                    <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Latest Applicants</h3>
                            <Link to="/company/applicants" style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
                        </div>
                        {recentApps.length === 0 ? <p style={{ color: '#94a3b8' }}>No applicants yet.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {recentApps.map(app => (
                                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{app.applicantName || 'Candidate'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{app.jobTitle}</div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '20px', backgroundColor: app.status === 'shortlisted' ? '#f5f3ff' : app.status === 'hired' ? '#f0fdf4' : '#f8fafc', color: app.status === 'shortlisted' ? '#7c3aed' : app.status === 'hired' ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                                            {app.status || 'pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── BOTTOM ACTION BUTTONS ── */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '32px' }}>
                    <Link to="/company/manage-jobs" style={{
                        background: 'white', color: '#1e293b', textDecoration: 'none',
                        padding: '14px 28px', borderRadius: '16px', border: '1px solid #e2e8f0',
                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                    }}>
                        <FiList /> Manage Active Jobs
                    </Link>
                    <Link to="/company/analytics" style={{
                        background: 'white', color: '#1e293b', textDecoration: 'none',
                        padding: '14px 28px', borderRadius: '16px', border: '1px solid #e2e8f0',
                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                    }}>
                        <FiTrendingUp /> Recruitment Analytics
                    </Link>
                </div>
            </div>
        </div>
    );
}
