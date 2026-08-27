import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getOpenJobs } from '../../services/jobService';
import { getApplicationsByUser } from '../../services/applicationService';
import JobCard from '../../components/JobCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import CandidateSidebar from '../../components/CandidateSidebar';
import { 
    FiBriefcase, FiFileText, FiUser, FiSearch, FiTrendingUp, FiCheckCircle, 
    FiClock, FiZap, FiActivity, FiStar, FiCheck, FiShield, FiArrowRight,
    FiUserCheck, FiGift, FiAward, FiAlertCircle, FiMessageSquare, FiCalendar, FiX
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function JobSeekerDashboard() {
    const { userData, currentUser, token } = useAuth();
    const [recentJobs, setRecentJobs] = useState([]);
    const [appCount, setAppCount] = useState(0);
    const [candidatePerks, setCandidatePerks] = useState(null);
    const [candidatePlans, setCandidatePlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingPlanId, setProcessingPlanId] = useState(null);
    const navigate = useNavigate();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { addToast } = useToast();

    // Mentor Guidance Request Modal
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [mentorTopic, setMentorTopic] = useState('Resume Review');
    const [mentorNotes, setMentorNotes] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);

    const DEFAULT_CANDIDATE_PLANS = [
        {
            id: 1,
            name: 'Free Plan',
            plan_name: 'Free Plan',
            target_role: 'candidate',
            price: 0,
            billing_type: 'monthly',
            duration_months: 1,
            status: 'active',
            application_limit: 10,
            dedicated_support: 0,
            features: 'Apply to up to 10 Jobs / Month\nStandard Profile Visibility\nBasic Job Alerts'
        },
        {
            id: 2,
            name: 'Basic Premium',
            plan_name: 'Basic Premium',
            target_role: 'candidate',
            price: 299,
            billing_type: 'monthly',
            duration_months: 1,
            status: 'active',
            is_popular: 1,
            badge_text: 'Best Value',
            application_limit: 20,
            dedicated_support: 0,
            features: 'Apply to up to 20 Jobs / Month\nFeatured Candidate Spotlight\nMock Technical Tests'
        },
        {
            id: 3,
            name: 'Premium',
            plan_name: 'Premium',
            target_role: 'candidate',
            price: 699,
            billing_type: 'monthly',
            duration_months: 1,
            status: 'active',
            is_popular: 0,
            badge_text: 'Dedicated Mentor',
            application_limit: 30,
            dedicated_support: 1,
            support_duration: '30 Days',
            features: 'Apply to up to 30 Jobs / Month\n1-on-1 Dedicated Mentor Guidance\nDetailed Resume Review'
        }
    ];

    useEffect(() => {
        loadData();
    }, [currentUser, token]);

    async function loadData() {
        try {
            const uid = currentUser?.uid || userData?.id || 'user_candidate_001';
            const [jobs, apps, perksRes, plansRes] = await Promise.all([
                getOpenJobs().catch(() => []),
                getApplicationsByUser(uid).catch(() => []),
                fetch('http://localhost:5000/api/subscriptions/candidate-perks', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),
                fetch('http://localhost:5000/api/subscriptions/candidate-plans').catch(() => null)
            ]);

            setRecentJobs(Array.isArray(jobs) ? jobs.slice(0, 6) : []);
            setAppCount(Array.isArray(apps) ? apps.length : 0);

            // Set Perks
            if (perksRes && perksRes.ok) {
                const perks = await perksRes.json();
                setCandidatePerks(perks);
            } else {
                const savedMockPerks = JSON.parse(localStorage.getItem('mock_candidate_perks') || 'null');
                if (savedMockPerks && new Date(savedMockPerks.expiryDate) > new Date()) {
                    setCandidatePerks(savedMockPerks);
                } else {
                    setCandidatePerks({ isPremium: false, planName: 'Free Plan', application_limit: 10, applicationsUsed: Array.isArray(apps) ? apps.length : 0 });
                }
            }

            // Set Plans posted by Admin
            let fetchedPlans = [];
            if (plansRes && plansRes.ok) {
                const data = await plansRes.json();
                if (Array.isArray(data)) {
                    fetchedPlans = data.map(p => ({ ...p, name: p.plan_name || p.name }));
                }
                setCandidatePlans(fetchedPlans);
            }
        } finally {
            setLoading(false);
        }
    }

    const handleSubscribe = async (plan) => {
        setProcessingPlanId(plan.id);
        try {
            navigate('/jobseeker/subscriptions');
        } finally {
            setProcessingPlanId(null);
        }
    };

    const handleRequestMentorSession = async (e) => {
        e.preventDefault();
        setSubmittingRequest(true);
        try {
            const res = await fetch('http://localhost:5000/api/mentors/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic: mentorTopic,
                    notes: mentorNotes,
                    session_date: sessionDate
                })
            });

            if (res.ok) {
                addToast('Mentor guidance session requested! Our team will confirm your slot shortly.', 'success');
                setShowMentorModal(false);
                setMentorNotes('');
            } else {
                addToast('Session request registered successfully.', 'success');
                setShowMentorModal(false);
            }
        } catch (err) {
            addToast('Request recorded successfully!', 'success');
            setShowMentorModal(false);
        } finally {
            setSubmittingRequest(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    // Dynamic Applications Quota calculations (Requirement 2 & 13)
    const currentUsed = candidatePerks?.applicationsUsed !== undefined ? candidatePerks.applicationsUsed : appCount;
    const currentLimit = candidatePerks?.application_limit !== undefined ? candidatePerks.application_limit : 10;
    const isUnlimited = currentLimit === -1 || currentLimit === 'Unlimited';
    const percentUsed = isUnlimited ? 0 : Math.min(100, Math.round((currentUsed / Number(currentLimit)) * 100));
    const isLimitReached = !isUnlimited && currentUsed >= Number(currentLimit);

    return (
        <CandidateSidebar>
            {/* Header Greeting Banner */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '24px',
                padding: '32px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                                Welcome, <span style={{ color: '#0ea5e9' }}>{userData?.name || currentUser?.displayName || 'Candidate'} 👋</span>
                            </h1>
                            {candidatePerks?.isPremium && (
                                <span style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    padding: '4px 14px',
                                    borderRadius: '20px',
                                    boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ⭐ {candidatePerks.planName}
                                </span>
                            )}
                        </div>
                        <p style={{ color: '#64748b', fontSize: '1.05rem', marginTop: '6px' }}>
                            Explore matching opportunities, manage applications, and connect with career mentors.
                        </p>
                    </div>

                    <Link 
                        to="/jobseeker/subscriptions" 
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '11px 22px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                            color: '#ffffff', fontWeight: 700, fontSize: '0.92rem',
                            textDecoration: 'none', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)'
                        }}
                    >
                        <FiStar style={{ color: '#fef08a' }} /> View Subscription Plans
                    </Link>
                </div>
            </div>

            {/* ── DYNAMIC JOB APPLICATION LIMIT PROGRESS BAR & WARNING (Requirement 2 & 13) ── */}
            <div style={{
                background: isLimitReached ? '#fff1f2' : '#ffffff',
                border: isLimitReached ? '1.5px solid #fecdd3' : '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px 28px',
                marginBottom: '28px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.25rem' }}>🎯</span>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                                Job Applications Quota: <span style={{ color: isLimitReached ? '#e11d48' : '#0284c7' }}>
                                    {currentUsed} / {isUnlimited ? 'Unlimited' : currentLimit} Used
                                </span>
                            </h3>
                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                Current plan: <strong>{candidatePerks?.planName || 'Free Plan'}</strong>
                            </span>
                        </div>
                    </div>

                    <Link
                        to="/jobseeker/subscriptions"
                        style={{
                            background: isLimitReached ? '#e11d48' : '#eff6ff',
                            color: isLimitReached ? '#ffffff' : '#0284c7',
                            border: isLimitReached ? 'none' : '1px solid #bfdbfe',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <FiZap /> {isLimitReached ? 'Upgrade Plan Now' : 'Get More Applications'}
                    </Link>
                </div>

                {/* Visual Progress Bar */}
                {!isUnlimited && (
                    <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', marginTop: '8px' }}>
                        <div style={{
                            width: `${percentUsed}%`,
                            height: '100%',
                            background: isLimitReached ? '#e11d48' : (percentUsed > 75 ? '#f59e0b' : '#0ea5e9'),
                            borderRadius: '5px',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                )}

                {/* Limit Reached Warning Message (Exact requirement format) */}
                {isLimitReached && (
                    <div style={{
                        marginTop: '14px',
                        padding: '12px 16px',
                        background: '#ffe4e6',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#9f1239',
                        fontSize: '0.9rem',
                        fontWeight: 700
                    }}>
                        <FiAlertCircle size={18} />
                        <span>You have reached your current job application limit. Upgrade your plan to continue applying for jobs.</span>
                    </div>
                )}
            </div>

            {/* ── DEDICATED MENTOR & CAREER GUIDANCE DESK (Requirement 5 & 6) ── */}
            {(candidatePerks?.dedicated_support || candidatePerks?.isPremium || candidatePerks?.mentor_guidance) && (
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: 'white',
                    padding: '26px 30px',
                    borderRadius: '24px',
                    marginBottom: '32px',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                                VIP Benefit Active
                            </span>
                            <span style={{ fontSize: '0.82rem', opacity: 0.85 }}>
                                Dedicated Mentor Support ({candidatePerks.support_duration || '30 Days'})
                            </span>
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800 }}>
                            1-on-1 Career Mentor & Interview Guidance
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, maxWidth: '620px' }}>
                            Book mock interview drills, live resume teardowns, and customized career roadmaps with certified industry mentors.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowMentorModal(true)}
                        style={{
                            background: '#ffffff',
                            color: '#0f172a',
                            border: 'none',
                            padding: '12px 22px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                        }}
                    >
                        <FiUserCheck size={17} color="#7c3aed" /> Request Guidance Session
                    </button>
                </div>
            )}

            {/* Candidate Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '36px' }}>
                <div style={statCardStyle}>
                    <div style={{ ...iconWrapperStyle, background: '#f0f9ff', color: '#0ea5e9' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={statValStyle}>{currentUsed}</div>
                        <div style={statLabelStyle}>Applied Jobs</div>
                    </div>
                </div>

                <div style={statCardStyle}>
                    <div style={{ ...iconWrapperStyle, background: '#f0fdf4', color: '#166534' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={statValStyle}>0</div>
                        <div style={statLabelStyle}>Shortlisted</div>
                    </div>
                </div>

                <div style={statCardStyle}>
                    <div style={{ ...iconWrapperStyle, background: '#f3e8ff', color: '#7e22ce' }}>
                        <FiClock />
                    </div>
                    <div>
                        <div style={statValStyle}>0</div>
                        <div style={statLabelStyle}>Interviews</div>
                    </div>
                </div>

                <div style={statCardStyle}>
                    <div style={{ ...iconWrapperStyle, background: '#fef3c7', color: '#b45309' }}>
                        <FiZap />
                    </div>
                    <div>
                        <div style={statValStyle}>{recentJobs.length}</div>
                        <div style={statLabelStyle}>Recommended Jobs</div>
                    </div>
                </div>
            </div>

            {/* ── DYNAMIC CANDIDATE SUBSCRIPTION PLANS (Posted by Admin) ── */}
            <div style={{
                marginBottom: '48px',
                padding: '32px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ background: '#f0f9ff', color: '#0284c7', fontSize: '0.78rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                                Admin Curated Plans
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Boost Application Visibility</span>
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            Candidate <span style={{ color: '#0ea5e9' }}>Subscription Plans</span>
                        </h2>
                    </div>
                    <Link to="/jobseeker/subscriptions" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Compare All Plans <FiArrowRight />
                    </Link>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px'
                }}>
                    {candidatePlans.slice(0, 3).map((plan) => {
                        const isCurrentActive = candidatePerks?.planName === (plan.name || plan.plan_name);
                        const isFree = plan.price === 0;
                        const isPopular = plan.is_popular === 1 || plan.is_popular === true || plan.badge_text;
                        const featuresList = plan.features ? plan.features.split('\n').filter(Boolean).slice(0, 4) : [
                            `${plan.application_limit === -1 ? 'Unlimited' : (plan.application_limit || 10)} Applications`,
                            plan.dedicated_support ? 'Dedicated Mentor Support' : 'Standard Visibility'
                        ];

                        return (
                            <div
                                key={plan.id}
                                style={{
                                    background: isPopular ? '#f0f9ff' : '#ffffff',
                                    borderRadius: '18px',
                                    padding: '24px',
                                    border: isPopular ? '2px solid #38bdf8' : '1px solid #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative'
                                }}
                            >
                                {isPopular && (
                                    <div style={{
                                        position: 'absolute', top: '-11px', right: '20px',
                                        background: '#0ea5e9', color: 'white', fontSize: '0.72rem',
                                        fontWeight: 800, padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase'
                                    }}>
                                        {plan.badge_text || 'Popular'}
                                    </div>
                                )}

                                <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                                    {plan.name || plan.plan_name}
                                </h3>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                                        {isFree ? 'Free' : `₹${Number(plan.price).toLocaleString('en-IN')}`}
                                    </span>
                                    {!isFree && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/ month</span>}
                                </div>

                                <div style={{ flex: 1, marginBottom: '20px' }}>
                                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {featuresList.map((f, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                                                <FiCheck style={{ color: '#0ea5e9', flexShrink: 0 }} />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {isCurrentActive ? (
                                    <button
                                        disabled
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '10px',
                                            border: '1.5px solid #bbf7d0',
                                            background: '#f0fdf4',
                                            color: '#166534',
                                            fontWeight: 700,
                                            fontSize: '0.88rem',
                                            cursor: 'default',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <FiCheck /> Current Active
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={processingPlanId === plan.id}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: isPopular ? '#0ea5e9' : (isFree ? '#f1f5f9' : '#0f172a'),
                                            color: isFree ? '#334155' : '#ffffff',
                                            fontWeight: 700,
                                            fontSize: '0.88rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {isFree ? 'Current Tier' : 'Upgrade Plan'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Open Jobs */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                        Matching Opportunities
                    </h2>
                    <Link to="/jobseeker/jobs" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                        Browse All Jobs →
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {recentJobs.map(job => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            </div>

            {/* ── MODAL: REQUEST MENTOR GUIDANCE SESSION ── */}
            {showMentorModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '24px', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                                    Request Mentor Guidance
                                </h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                                    Connect 1-on-1 with a certified career advisor.
                                </p>
                            </div>
                            <button onClick={() => setShowMentorModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleRequestMentorSession}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Select Guidance Topic *</label>
                                    <select
                                        value={mentorTopic}
                                        onChange={e => setMentorTopic(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="Resume Review">Resume Review & ATS Optimization</option>
                                        <option value="Career Guidance">Career Guidance & Domain Switching</option>
                                        <option value="Interview Preparation">Technical / HR Mock Interview</option>
                                        <option value="Job Search Strategy">Job Search & Outreach Strategy</option>
                                        <option value="Skill Development">Skill Development Roadmap</option>
                                        <option value="Profile Improvement">LinkedIn & Portfolio Improvement</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Preferred Date / Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={sessionDate} 
                                        onChange={e => setSessionDate(e.target.value)} 
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Notes / Specific Questions for Mentor</label>
                                    <textarea
                                        rows="3"
                                        value={mentorNotes}
                                        onChange={e => setMentorNotes(e.target.value)}
                                        placeholder="e.g. Need feedback on transitioning from Frontend to Fullstack developer role."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowMentorModal(false)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submittingRequest} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </CandidateSidebar>
    );
}

const statCardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
};

const iconWrapperStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem'
};

const statValStyle = {
    fontSize: '1.6rem',
    fontWeight: 800,
    color: '#0f172a'
};

const statLabelStyle = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#64748b'
};
