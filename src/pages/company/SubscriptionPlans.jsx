import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import PremiumPaymentModal from '../../components/company/PremiumPaymentModal';
import { FiBriefcase, FiDatabase, FiDownload, FiCheck, FiStar, FiSend, FiX, FiCheckCircle, FiShield, FiZap, FiChevronRight } from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function SubscriptionPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [mockPaymentData, setMockPaymentData] = useState(null);
    const [subStatus, setSubStatus] = useState(null);
    const [selectedPostingsFilter, setSelectedPostingsFilter] = useState('all');
    const scrollContainerRef = useRef(null);

    const { userData, token, currentUser } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        fetchPlansAndStatus();
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [userData, token]);

    const fetchPlansAndStatus = async () => {
        setLoading(true);
        try {
            const [plansRes, statusRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/plans?plan_type=employer&status=active`).catch(() => null),
                fetch(`${API_BASE_URL}/api/subscriptions/status`, {
                    headers: { 'Authorization': `Bearer ${token || localStorage.getItem('token') || 'mock_token_admin'}` }
                }).catch(() => null)
            ]);

            if (plansRes && plansRes.ok) {
                const data = await plansRes.json();
                if (Array.isArray(data)) {
                    setPlans(data.filter(p => p.plan_type === 'employer' || !p.plan_type));
                }
            }

            if (statusRes && statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.hasActiveSubscription) {
                    setSubStatus(statusData.subscription);
                }
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan) => {
        setProcessing(true);
        try {
            const tokenToUse = token || localStorage.getItem('token') || 'mock_token_admin';
            const res = await fetch(`${API_BASE_URL}/api/subscriptions/activate-instant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenToUse}`
                },
                body: JSON.stringify({ 
                    planId: plan.id,
                    targetRole: 'employer'
                })
            });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Failed to activate plan');
            }

            if (addToast) {
                addToast({
                    type: 'success',
                    title: 'Subscription Activated',
                    message: data.message || `Plan ${plan.plan_name} activated successfully!`
                });
            } else {
                alert(data.message || `Plan ${plan.plan_name} activated successfully!`);
            }

            // Immediately re-fetch plans and active subscription status
            await fetchPlansAndStatus();
        } catch (error) {
            console.error('Activation error:', error);
            alert('Failed to activate plan: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    // Filter plans by posting segment
    const filteredPlans = plans.filter(p => {
        if (selectedPostingsFilter === 'all') return true;
        const limit = p.posting_limit !== undefined ? p.posting_limit : 1;
        if (selectedPostingsFilter === '1') return limit === 1;
        if (selectedPostingsFilter === '2') return limit === 2;
        if (selectedPostingsFilter === '3') return limit === 3;
        if (selectedPostingsFilter === '20') return limit === 20;
        if (selectedPostingsFilter === 'unlimited') return limit === -1 || limit >= 999999;
        if (selectedPostingsFilter === '4+') return limit >= 4 || limit === -1;
        return true;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '36px 24px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* ── HEADER SECTION ── */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#b45309',
                    background: '#fef3c7',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    marginBottom: '10px'
                }}>
                    Employer Hiring Solutions
                </span>
                <h1 style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                    Simple Transparent <span style={{ color: '#f59e0b' }}>Pricing</span>
                </h1>
                <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: '620px', margin: '0 auto' }}>
                    Scale your hiring pipeline with candidate database access, AI recommendations, and verified applicants.
                </p>
            </div>

            {/* ── CURRENT ACTIVE PLAN BANNER ── */}
            {subStatus && (
                <div style={{
                    background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                    border: '1.5px solid #10b981',
                    borderRadius: '20px',
                    padding: '22px 28px',
                    color: '#ffffff',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
                }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#047857', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                            <FiCheckCircle /> Currently Active Subscription
                        </div>
                        <h2 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', textTransform: 'capitalize' }}>
                            {subStatus.planName} Plan Active
                        </h2>
                        <div style={{ fontSize: '0.92rem', color: '#a7f3d0', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <span>💼 Remaining Jobs: <strong>{subStatus.jobsRemaining !== undefined ? subStatus.jobsRemaining : 'Active'}</strong></span>
                            <span>👥 Candidate Contacts: <strong>{subStatus.contactsRemaining !== undefined ? subStatus.contactsRemaining : 'Active'}</strong></span>
                            <span>📅 Valid Until: <strong>{subStatus.expiryDate ? new Date(subStatus.expiryDate).toLocaleDateString('en-GB') : 'Active'}</strong> ({subStatus.remainingDays || 30} days left)</span>
                        </div>
                    </div>
                    <Link to="/company" style={{
                        background: '#ffffff',
                        color: '#065f46',
                        padding: '11px 22px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        Go to Dashboard →
                    </Link>
                </div>
            )}

            {/* ── INTERACTIVE POSTING SELECTOR TABS ── */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
                    How many job postings do you need?
                </div>
                <div style={{ display: 'inline-flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                        { id: 'all', label: 'All Plans' },
                        { id: '20', label: '⭐ 20 Jobs (₹1,500)' },
                        { id: 'unlimited', label: '🚀 Unlimited Jobs (₹5,000)' },
                        { id: '1', label: '1 Posting' },
                        { id: '2', label: '2 Postings' },
                        { id: '3', label: '3 Postings' },
                        { id: '4+', label: '4+ Postings' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedPostingsFilter(tab.id)}
                            style={{
                                padding: '9px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: selectedPostingsFilter === tab.id ? '#ffffff' : 'transparent',
                                color: selectedPostingsFilter === tab.id ? '#0f172a' : '#64748b',
                                boxShadow: selectedPostingsFilter === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── MOBILE SWIPE HELPER INDICATOR ── */}
            <div className="d-block d-md-none" style={{ textAlign: 'center', margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
                👉 Swipe horizontally to compare plans
            </div>

            {/* ── DYNAMIC PLAN CARDS ── */}
            {filteredPlans.length === 0 ? (
                <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1', padding: '50px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                    <FiBriefcase size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 800 }}>No Plans Matching Selected Filter</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '6px 0 16px' }}>Try switching to "All Plans" to view all active employer packages.</p>
                    <button
                        onClick={() => setSelectedPostingsFilter('all')}
                        style={{ background: '#f59e0b', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Show All Plans
                    </button>
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '28px',
                        alignItems: 'stretch',
                        marginBottom: '48px'
                    }}
                >
                    {filteredPlans.map(plan => {
                        const isActivePlan = Boolean(subStatus && (
                            String(subStatus.planId) === String(plan.id) ||
                            (subStatus.planName && plan.plan_name && subStatus.planName.trim().toLowerCase() === plan.plan_name.trim().toLowerCase())
                        ));
                        const isPopular = Boolean(plan.popular || plan.is_popular);
                        const isRecommended = Boolean(plan.recommended || plan.is_recommended);
                        const features = plan.features || [];

                        return (
                            <div
                                key={plan.id}
                                style={{
                                    background: isActivePlan ? '#f0fdf4' : '#ffffff',
                                    borderRadius: '24px',
                                    border: isActivePlan 
                                        ? '2.5px solid #10b981' 
                                        : (isPopular ? '2px solid #f59e0b' : (isRecommended ? '2px solid #3b82f6' : '1px solid #e2e8f0')),
                                    padding: '32px 28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    boxShadow: isActivePlan
                                        ? '0 16px 36px rgba(16, 185, 129, 0.18)'
                                        : (isPopular 
                                            ? '0 16px 36px rgba(245, 158, 11, 0.18)' 
                                            : (isRecommended ? '0 16px 36px rgba(59, 130, 246, 0.14)' : '0 4px 20px rgba(0,0,0,0.03)')),
                                    transform: (isActivePlan || isPopular) ? 'scale(1.02)' : 'none',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}
                            >
                                {/* Top Badge */}
                                {(isActivePlan || isPopular || isRecommended || plan.badge_text) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-14px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: isActivePlan
                                            ? 'linear-gradient(135deg, #10b981, #059669)'
                                            : (isPopular 
                                                ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                                                : (isRecommended ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#0ea5e9')),
                                        color: '#ffffff',
                                        fontSize: '0.74rem',
                                        fontWeight: 900,
                                        letterSpacing: '0.5px',
                                        padding: '4px 16px',
                                        borderRadius: '20px',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                        whiteSpace: 'nowrap',
                                        textTransform: 'uppercase'
                                    }}>
                                        {isActivePlan ? '✓ CURRENT ACTIVE PLAN' : (plan.badge_text || (isPopular ? 'MOST POPULAR' : 'RECOMMENDED'))}
                                    </div>
                                )}

                                {/* Plan Title & Subtitle */}
                                <div style={{ marginBottom: '14px', marginTop: (isActivePlan || isPopular || isRecommended) ? '4px' : '0' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                                        {plan.plan_name}
                                    </h3>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.86rem', lineHeight: 1.4, minHeight: '36px' }}>
                                        {plan.description || 'Flexible hiring package with verified applicants.'}
                                    </p>
                                </div>

                                {/* Price Box */}
                                <div style={{ margin: '12px 0 20px', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>
                                        ₹{Number(plan.offer_price).toLocaleString()}
                                    </span>
                                    {plan.original_price > plan.offer_price && (
                                        <span style={{ fontSize: '1.15rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>
                                            ₹{Number(plan.original_price).toLocaleString()}
                                        </span>
                                    )}
                                    {plan.discount_percentage > 0 && (
                                        <span style={{ fontSize: '0.78rem', fontWeight: 900, background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px' }}>
                                            {plan.discount_percentage}% OFF
                                        </span>
                                    )}
                                </div>

                                {/* Quota & Duration Highlight */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', padding: '5px 12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                        💼 {plan.posting_limit === -1 ? 'Unlimited' : plan.posting_limit} {plan.posting_limit === 1 ? 'Job Posting' : 'Job Postings'}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#f8fafc', color: '#475569', padding: '5px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        ⏰ {plan.duration}
                                    </span>
                                    {(plan.candidate_views_limit !== undefined || plan.contact_views !== undefined) && (
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, background: '#f0fdf4', color: '#15803d', padding: '5px 12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                            🎓 {(plan.candidate_views_limit === -1 || plan.candidate_views_limit >= 999999) ? 'Unlimited' : (plan.candidate_views_limit || plan.contact_views || 50)} Student Details & Resumes
                                        </span>
                                    )}
                                </div>

                                {/* Buy Now CTA Button / Active State */}
                                {isActivePlan ? (
                                    <div style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: '2px solid #10b981',
                                        background: '#dcfce7',
                                        color: '#15803d',
                                        fontWeight: 900,
                                        fontSize: '1rem',
                                        marginBottom: '26px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}>
                                        <FiCheckCircle size={18} color="#16a34a" /> Currently Active Plan
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleUpgrade(plan)}
                                        disabled={processing}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            borderRadius: '14px',
                                            border: 'none',
                                            background: isPopular 
                                                ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                                                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                            color: '#0f172a',
                                            fontWeight: 900,
                                            fontSize: '1rem',
                                            cursor: processing ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
                                            marginBottom: '26px',
                                            transition: 'transform 0.15s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        Buy Now <FiChevronRight />
                                    </button>
                                )}

                                {/* Dynamic Features List (✓ Included / ✕ Not Included) */}
                                <div style={{ flex: 1, borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                                        What's Included:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {features.map((feat, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem' }}>
                                                {feat.included ? (
                                                    <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.15rem', lineHeight: '1.2' }}>✓</span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontWeight: 900, fontSize: '1.15rem', lineHeight: '1.2' }}>✕</span>
                                                )}
                                                <div style={{ flex: 1, color: feat.included ? '#1e293b' : '#94a3b8', fontWeight: feat.included ? 600 : 400, lineHeight: 1.35 }}>
                                                    {feat.feature_name}
                                                    {feat.feature_value && (
                                                        <span style={{
                                                            marginLeft: '6px',
                                                            fontSize: '0.74rem',
                                                            fontWeight: 700,
                                                            color: feat.included ? '#0284c7' : '#94a3b8',
                                                            background: feat.included ? '#e0f2fe' : '#f1f5f9',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            {feat.feature_value}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── ENTERPRISE & CUSTOM TALENT BANNER ── */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '24px',
                padding: '40px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '24px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)'
            }}>
                <div style={{ maxWidth: '650px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#f59e0b', color: '#0f172a', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                        Enterprise Custom
                    </span>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '10px 0 6px', color: '#ffffff' }}>
                        Need High-Volume Custom Candidate Sourcing?
                    </h3>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                        Get dedicated tech recruiters, unlimited candidate profile exports, customized skill assessment tests, and ATS API integration.
                    </p>
                </div>
                <div>
                    <a
                        href="mailto:sales@jobportal.com?subject=Enterprise%20Hiring%20Plan%20Inquiry"
                        style={{
                            display: 'inline-block',
                            padding: '14px 28px',
                            borderRadius: '12px',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontWeight: 800,
                            textDecoration: 'none',
                            fontSize: '0.94rem',
                            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15)'
                        }}
                    >
                        Contact Enterprise Sales
                    </a>
                </div>
            </div>

            {/* ── UPI / RAZORPAY PAYMENT MODAL ── */}
            {mockPaymentData && (
                <PremiumPaymentModal
                    isOpen={true}
                    plan={mockPaymentData.plan}
                    orderData={mockPaymentData.orderData}
                    targetRole="employer"
                    onClose={() => {
                        setMockPaymentData(null);
                        fetchPlansAndStatus();
                    }}
                />
            )}

        </div>
    );
}
