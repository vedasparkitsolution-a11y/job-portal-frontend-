import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiBriefcase, FiUsers, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import PremiumPaymentModal from '../components/company/PremiumPaymentModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import SEOHead from '../components/SEOHead';

export default function Pricing() {
    const navigate = useNavigate();
    const { userRole, token } = useAuth();
    const { addToast } = useToast();

    const [activeRoleTab, setActiveRoleTab] = useState(userRole === 'company' ? 'employer' : 'candidate');
    const [plans, setPlans] = useState([]);
    const [subStatus, setSubStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mockPaymentData, setMockPaymentData] = useState(null);

    useEffect(() => {
        fetchPlansAndStatus();
    }, [activeRoleTab, token]);

    const fetchPlansAndStatus = async () => {
        setLoading(true);
        try {
            const [plansRes, statusRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/plans?plan_type=${activeRoleTab}&status=active`),
                token ? fetch(`${API_BASE_URL}/api/subscriptions/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null) : null
            ]);
            if (plansRes && plansRes.ok) {
                const data = await plansRes.json();
                if (Array.isArray(data)) setPlans(data);
            }
            if (statusRes && statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.hasActiveSubscription) {
                    setSubStatus(statusData.subscription);
                } else {
                    setSubStatus(null);
                }
            }
        } catch (e) {
            console.error('Error fetching plans:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (plan) => {
        if (Number(plan.offer_price) === 0) {
            if (activeRoleTab === 'employer') navigate('/company');
            else navigate('/jobseeker');
            return;
        }

        try {
            const orderRes = await fetch(`${API_BASE_URL}/api/subscriptions/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || 'mock_token_admin'}`
                },
                body: JSON.stringify({
                    planId: plan.id,
                    targetRole: activeRoleTab
                })
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.message || 'Failed to create order');

            setMockPaymentData({ plan, orderData });
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Failed to initiate checkout: ' + err.message);
        }
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '70px 20px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            <SEOHead
                title="Employer & Candidate Premium Membership Plans | JobConnect"
                description="Flexible subscription plans for hiring managers, HR recruiters, and candidates. Unlock unlimited job postings, candidate resume views, and AI resume teardowns."
                keywords="job portal pricing, employer membership, job posting plans, candidate premium subscription, hiring packages"
            />
            <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', textAlign: 'center' }}>
                
                {/* ── HEADER ── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <span style={{
                        fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '1px', color: '#b45309', background: '#fef3c7',
                        padding: '4px 14px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px'
                    }}>
                        Simple Transparent Pricing
                    </span>
                    <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                        Choose the Plan That Fits <span style={{ color: '#f59e0b' }}>Your Goals</span>
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '36px', maxWidth: '600px', margin: '0 auto 36px' }}>
                        Whether you are hiring top tech talent or advancing your career, we have the right package for you.
                    </p>
                </motion.div>

                {/* ── ROLE SWITCHER TABS ── */}
                <div style={{ display: 'inline-flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '16px', marginBottom: '48px' }}>
                    <button
                        onClick={() => setActiveRoleTab('employer')}
                        style={{
                            padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
                            background: activeRoleTab === 'employer' ? '#ffffff' : 'transparent',
                            color: activeRoleTab === 'employer' ? '#0f172a' : '#64748b',
                            boxShadow: activeRoleTab === 'employer' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <FiBriefcase /> Employer Hiring Plans
                    </button>
                    <button
                        onClick={() => setActiveRoleTab('candidate')}
                        style={{
                            padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer',
                            background: activeRoleTab === 'candidate' ? '#ffffff' : 'transparent',
                            color: activeRoleTab === 'candidate' ? '#0f172a' : '#64748b',
                            boxShadow: activeRoleTab === 'candidate' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <FiUsers /> Candidate Career Plans
                    </button>
                </div>

                {/* ── CARDS GRID ── */}
                {loading ? (
                    <div style={{ padding: '60px 0' }}><LoadingSpinner /></div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '28px',
                        textAlign: 'left',
                        alignItems: 'stretch'
                    }}>
                        {plans.map(plan => {
                            const isActivePlan = Boolean(subStatus && (
                                String(subStatus.planId) === String(plan.id) ||
                                (subStatus.planName && plan.plan_name && subStatus.planName.trim().toLowerCase() === plan.plan_name.trim().toLowerCase())
                            ));
                            const isPopular = Boolean(plan.popular || plan.is_popular);
                            const isRecommended = Boolean(plan.recommended || plan.is_recommended);
                            const features = plan.features || [];
                            const isFree = Number(plan.offer_price) === 0;

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
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
                                            : (isPopular ? '0 16px 36px rgba(245, 158, 11, 0.18)' : '0 4px 20px rgba(0,0,0,0.03)')
                                    }}
                                >
                                    {(isActivePlan || isPopular || isRecommended || plan.badge_text) && (
                                        <div style={{
                                            position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                            background: isActivePlan 
                                                ? 'linear-gradient(135deg, #10b981, #059669)' 
                                                : (isPopular ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#3b82f6'),
                                            color: '#ffffff', fontSize: '0.74rem', fontWeight: 900, padding: '4px 16px',
                                            borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', textTransform: 'uppercase'
                                        }}>
                                            {isActivePlan ? '✓ CURRENT ACTIVE PLAN' : (plan.badge_text || (isPopular ? 'MOST POPULAR' : 'RECOMMENDED'))}
                                        </div>
                                    )}

                                    <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>{plan.plan_name}</h3>
                                    <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '0.86rem', minHeight: '36px', lineHeight: 1.4 }}>{plan.description}</p>

                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a' }}>
                                            {isFree ? '₹0' : `₹${Number(plan.offer_price).toLocaleString()}`}
                                        </span>
                                        {plan.original_price > plan.offer_price && (
                                            <span style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>
                                                ₹{Number(plan.original_price).toLocaleString()}
                                            </span>
                                        )}
                                        {plan.discount_percentage > 0 && (
                                            <span style={{ fontSize: '0.78rem', fontWeight: 900, background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px' }}>
                                                {plan.discount_percentage}% OFF
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '8px' }}>
                                            🎯 {plan.posting_limit === -1 ? 'Unlimited' : plan.posting_limit} {activeRoleTab === 'employer' ? 'Job Postings' : 'Applications'}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#f8fafc', color: '#475569', padding: '4px 10px', borderRadius: '8px' }}>
                                            ⏰ {plan.duration}
                                        </span>
                                        {activeRoleTab === 'employer' && (plan.candidate_views_limit !== undefined || plan.contact_views !== undefined) && (
                                            <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: '8px' }}>
                                                🎓 {(plan.candidate_views_limit === -1 || plan.candidate_views_limit >= 999999) ? 'Unlimited' : (plan.candidate_views_limit || plan.contact_views || 50)} Student Resumes & Contacts
                                            </span>
                                        )}
                                    </div>

                                    {isActivePlan ? (
                                        <div style={{
                                            width: '100%', padding: '14px', borderRadius: '12px',
                                            border: '2px solid #10b981', background: '#dcfce7', color: '#15803d',
                                            fontWeight: 900, fontSize: '0.96rem', marginBottom: '22px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}>
                                            <FiCheck /> Currently Active Plan
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            style={{
                                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                                background: isFree ? '#f1f5f9' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                color: isFree ? '#334155' : '#0f172a',
                                                fontWeight: 900, fontSize: '0.96rem', cursor: 'pointer',
                                                boxShadow: isFree ? 'none' : '0 4px 16px rgba(245, 158, 11, 0.35)',
                                                marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                            }}
                                        >
                                            {isFree ? 'Get Started Free' : 'Buy Now'} <FiChevronRight />
                                        </button>
                                    )}

                                    <div style={{ flex: 1, borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                        <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>What's Included:</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {features.map((feat, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem' }}>
                                                    {feat.included ? (
                                                        <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontWeight: 900 }}>✕</span>
                                                    )}
                                                    <span style={{ color: feat.included ? '#1e293b' : '#94a3b8', fontWeight: feat.included ? 600 : 400 }}>
                                                        {feat.feature_name}
                                                        {feat.feature_value && (
                                                            <span style={{ marginLeft: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '1px 5px', borderRadius: '4px' }}>
                                                                {feat.feature_value}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* ── UPI / RAZORPAY MODAL ── */}
                {mockPaymentData && (
                    <PremiumPaymentModal
                        isOpen={true}
                        plan={mockPaymentData.plan}
                        orderData={mockPaymentData.orderData}
                        targetRole={activeRoleTab}
                        onClose={() => {
                            setMockPaymentData(null);
                            if (activeRoleTab === 'employer') navigate('/company');
                            else navigate('/jobseeker');
                        }}
                    />
                )}

            </div>
        </div>
    );
}
