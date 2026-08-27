import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import CandidateSidebar from '../../components/CandidateSidebar';
import PremiumPaymentModal from '../../components/company/PremiumPaymentModal';
import { 
    FiCheck, FiStar, FiZap, FiShield, FiTrendingUp, FiAward, 
    FiUserCheck, FiMessageSquare, FiFileText, FiClock, FiCheckCircle, FiX,
    FiGift, FiTag, FiCalendar, FiArrowRight, FiChevronRight, FiBriefcase
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function CandidateSubscriptions() {
    const [plans, setPlans] = useState([]);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingPlanId, setProcessingPlanId] = useState(null);
    const [activePerks, setActivePerks] = useState(null);
    const [mockPaymentData, setMockPaymentData] = useState(null);
    const [selectedAppFilter, setSelectedAppFilter] = useState('all');
    const scrollRef = useRef(null);

    const { userData, token, currentUser } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        fetchPlansAndPerks();
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

    const fetchPlansAndPerks = async () => {
        setLoading(true);
        try {
            const [plansRes, offersRes, perksRes] = await Promise.all([
                fetch('http://localhost:5000/api/plans?plan_type=candidate&status=active').catch(() => null),
                fetch('http://localhost:5000/api/subscriptions/offers').catch(() => null),
                fetch('http://localhost:5000/api/subscriptions/candidate-perks', {
                    headers: { 'Authorization': `Bearer ${token || 'mock_token_admin'}` }
                }).catch(() => null)
            ]);

            if (plansRes && plansRes.ok) {
                const data = await plansRes.json();
                if (Array.isArray(data)) {
                    setPlans(data.filter(p => p.plan_type === 'candidate'));
                }
            }

            if (offersRes && offersRes.ok) {
                const oData = await offersRes.json();
                if (Array.isArray(oData)) {
                    setOffers(oData.filter(o => o.is_currently_active || o.status === 'active' || o.computedStatus === 'active'));
                }
            }

            if (perksRes && perksRes.ok) {
                const perks = await perksRes.json();
                setActivePerks(perks);
            }
        } catch (e) {
            console.error('Error loading subscription data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (plan, offer = null) => {
        setProcessingPlanId(plan.id);
        try {
            const finalPrice = offer ? offer.offer_price : (plan.offer_price !== undefined ? plan.offer_price : plan.price);

            // Free plan instant activation
            if (Number(finalPrice) === 0) {
                const res = await fetch('http://localhost:5000/api/subscriptions/verify-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token || 'mock_token_admin'}`
                    },
                    body: JSON.stringify({
                        planId: plan.id,
                        targetRole: 'candidate',
                        razorpay_payment_id: 'free_plan_activation',
                        razorpay_order_id: 'free_order',
                        razorpay_signature: 'free_sig'
                    })
                });

                if (res.ok) {
                    addToast('success', `${plan.plan_name || plan.name} activated successfully!`);
                    await fetchPlansAndPerks();
                }
                setProcessingPlanId(null);
                return;
            }

            // Paid plan order creation
            const orderRes = await fetch('http://localhost:5000/api/subscriptions/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || 'mock_token_admin'}`
                },
                body: JSON.stringify({
                    planId: plan.id,
                    targetRole: 'candidate',
                    offerId: offer ? offer.id : null
                })
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.message || 'Failed to create order');

            // Open UPI QR Scanner modal
            setMockPaymentData({ plan, orderData, offer });
            setProcessingPlanId(null);
        } catch (err) {
            console.error('Order creation error:', err);
            alert('Failed to initiate checkout: ' + err.message);
            setProcessingPlanId(null);
        }
    };

    // Filter plans by application segment
    const filteredPlans = plans.filter(p => {
        if (selectedAppFilter === 'all') return true;
        const limit = p.posting_limit !== undefined ? p.posting_limit : (p.application_limit || 10);
        if (selectedAppFilter === '10') return limit === 10;
        if (selectedAppFilter === '20') return limit === 20;
        if (selectedAppFilter === '50') return limit === 50;
        if (selectedAppFilter === 'unlimited') return limit === -1 || limit >= 100;
        return true;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            <CandidateSidebar />

            <div style={{ flex: 1, padding: '36px 40px', maxWidth: '1360px', margin: '0 auto', overflowX: 'hidden' }}>
                
                {/* ── TOP HEADER ── */}
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
                        Candidate Career Acceleration
                    </span>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                        Simple Transparent <span style={{ color: '#f59e0b' }}>Pricing</span>
                    </h1>
                    <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
                        Boost your job search visibility, get 1-on-1 mentor guidance, and apply to unlimited premium tech roles.
                    </p>
                </div>

                {/* ── INTERACTIVE APPLICATION FILTER TABS ── */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
                        How many job applications do you need?
                    </div>
                    <div style={{ display: 'inline-flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {[
                            { id: '10', label: '10 Applications' },
                            { id: '20', label: '20 Applications' },
                            { id: '50', label: '50 Applications' },
                            { id: 'unlimited', label: 'Unlimited' },
                            { id: 'all', label: 'All Plans' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedAppFilter(tab.id)}
                                style={{
                                    padding: '9px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: selectedAppFilter === tab.id ? '#ffffff' : 'transparent',
                                    color: selectedAppFilter === tab.id ? '#0f172a' : '#64748b',
                                    boxShadow: selectedAppFilter === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
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

                {/* ── DYNAMIC CANDIDATE PLAN CARDS ── */}
                {filteredPlans.length === 0 ? (
                    <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1', padding: '50px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                        <FiAward size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 800 }}>No Plans Match This Quota</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '6px 0 16px' }}>Switch to "All Plans" to view all available candidate memberships.</p>
                        <button
                            onClick={() => setSelectedAppFilter('all')}
                            style={{ background: '#f59e0b', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Show All Plans
                        </button>
                    </div>
                ) : (
                    <div
                        ref={scrollRef}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '28px',
                            alignItems: 'stretch',
                            marginBottom: '48px'
                        }}
                    >
                        {filteredPlans.map(plan => {
                            const isPopular = Boolean(plan.popular || plan.is_popular);
                            const isRecommended = Boolean(plan.recommended || plan.is_recommended);
                            const features = plan.features || [];
                            const isFree = Number(plan.offer_price) === 0;

                            return (
                                <div
                                    key={plan.id}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: '24px',
                                        border: isPopular ? '2px solid #f59e0b' : (isRecommended ? '2px solid #3b82f6' : '1px solid #e2e8f0'),
                                        padding: '32px 28px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        boxShadow: isPopular 
                                            ? '0 16px 36px rgba(245, 158, 11, 0.18)' 
                                            : (isRecommended ? '0 16px 36px rgba(59, 130, 246, 0.14)' : '0 4px 20px rgba(0,0,0,0.03)'),
                                        transform: isPopular ? 'scale(1.02)' : 'none',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                    }}
                                >
                                    {/* Top Badge */}
                                    {(isPopular || isRecommended || plan.badge_text) && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-14px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: isPopular 
                                                ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                                                : (isRecommended ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#0ea5e9'),
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
                                            {plan.badge_text || (isPopular ? 'MOST POPULAR' : 'RECOMMENDED')}
                                        </div>
                                    )}

                                    {/* Plan Title & Subtitle */}
                                    <div style={{ marginBottom: '14px', marginTop: (isPopular || isRecommended) ? '4px' : '0' }}>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                                            {plan.plan_name}
                                        </h3>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.86rem', lineHeight: 1.4, minHeight: '36px' }}>
                                            {plan.description || 'Verified job applications and career guidance.'}
                                        </p>
                                    </div>

                                    {/* Price Box */}
                                    <div style={{ margin: '12px 0 20px', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>
                                            {isFree ? '₹0' : `₹${Number(plan.offer_price).toLocaleString()}`}
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
                                            🎯 {plan.posting_limit === -1 ? 'Unlimited' : plan.posting_limit} Applications / Month
                                        </span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#f8fafc', color: '#475569', padding: '5px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            ⏰ {plan.duration}
                                        </span>
                                    </div>

                                    {/* Buy Now / Activate CTA Button */}
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={processingPlanId === plan.id}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            borderRadius: '14px',
                                            border: 'none',
                                            background: isFree 
                                                ? '#f1f5f9' 
                                                : (isPopular ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)'),
                                            color: isFree ? '#334155' : '#0f172a',
                                            fontWeight: 900,
                                            fontSize: '1rem',
                                            cursor: processingPlanId === plan.id ? 'not-allowed' : 'pointer',
                                            boxShadow: isFree ? 'none' : '0 4px 16px rgba(245, 158, 11, 0.35)',
                                            marginBottom: '26px',
                                            transition: 'transform 0.15s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {isFree ? 'Current / Free Plan' : 'Buy Now'} <FiChevronRight />
                                    </button>

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

                {/* ── UPI / RAZORPAY PAYMENT MODAL ── */}
                {mockPaymentData && (
                    <PremiumPaymentModal
                        isOpen={true}
                        plan={mockPaymentData.plan}
                        orderData={mockPaymentData.orderData}
                        appliedOffer={mockPaymentData.offer}
                        targetRole="candidate"
                        onClose={() => {
                            setMockPaymentData(null);
                            fetchPlansAndPerks();
                        }}
                    />
                )}

            </div>
        </div>
    );
}
