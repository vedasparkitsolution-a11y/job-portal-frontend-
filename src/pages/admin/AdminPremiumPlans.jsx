import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FiPlus, FiEdit2, FiTrash2, FiCheck, FiSettings, FiBriefcase, FiTag,
    FiSave, FiUsers, FiStar, FiDatabase, FiCreditCard, FiActivity, FiShield,
    FiDownload, FiSend, FiCopy, FiClock, FiCalendar, FiDollarSign, FiSearch,
    FiCheckCircle, FiX, FiSliders, FiFileText, FiZap, FiTrendingUp, FiLayers,
    FiGift, FiAward, FiMessageSquare, FiUserCheck, FiBookOpen, FiRefreshCw,
    FiFilter, FiInfo, FiCode, FiEye, FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';

// ── Preset Suggested Features for Fast Admin Addition ──
const EMPLOYER_FEATURE_PRESETS = [
    'Job Postings',
    '30 Day Job Validity',
    'Unlimited Candidate Applications',
    'Job Featured on Top',
    'Candidate Database Access',
    'Screened Candidate Leads',
    'WhatsApp Boosting Alerts',
    'AI Candidate Recommendations',
    'Candidate Contact Details',
    'Candidate Resume Download',
    'Interview Scheduling',
    'Candidate Chat & Messaging',
    'Priority SLA Support',
    'Dedicated Account Manager',
    'Company Branding & Logo',
    'Excel Candidate Export'
];

const CANDIDATE_FEATURE_PRESETS = [
    'Monthly Job Applications',
    'Standard Profile Search Visibility',
    'Featured Candidate Spotlight',
    'AI Resume Score & Optimization',
    'AI Job Recommendations',
    'WhatsApp Instant Job Alerts',
    'Direct Recruiter Contact',
    '1-on-1 Dedicated Mentor Guidance',
    'Live Mock Interview & Feedback',
    'Skill Assessment Tests',
    'Priority Application Review',
    'Direct Recruiter Messaging'
];

export default function AdminPremiumPlans() {
    const { token } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const tabFromUrl = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabFromUrl || 'employer_plans');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    // Data States
    const [plans, setPlans] = useState([]);
    const [offers, setOffers] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [mentorRequests, setMentorRequests] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    // Modal State
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [previewPlan, setPreviewPlan] = useState(null);

    // Dynamic Plan Form State
    const initialForm = {
        plan_type: 'employer',
        plan_name: '',
        description: '',
        original_price: '',
        offer_price: '',
        discount_percentage: 0,
        duration: '30 Days',
        duration_days: 30,
        posting_limit: 1,
        application_limit: 10,
        popular: false,
        recommended: false,
        status: 'active',
        badge_text: '',
        features: [
            { feature_name: 'Unlimited Candidate Applications', included: true, feature_value: 'Unlimited' },
            { feature_name: '30 Day Job Validity', included: true, feature_value: '30 Days' },
            { feature_name: 'Email Job Notifications', included: true, feature_value: 'Instant' },
            { feature_name: 'Job Featured on Top', included: false, feature_value: '' },
            { feature_name: 'Screened Leads', included: false, feature_value: '' },
            { feature_name: 'Database Access', included: false, feature_value: '' }
        ]
    };
    const [planForm, setPlanForm] = useState(initialForm);

    // Offers & Mentors Modals
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [offerForm, setOfferForm] = useState({
        offer_name: '', plan_id: '', offer_type: 'festival', original_price: '', offer_price: '',
        discount_value: '', extra_applications: 0, extra_features: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        priority: 1, status: 'active', description: ''
    });

    const [showMentorModal, setShowMentorModal] = useState(false);
    const [editingMentor, setEditingMentor] = useState(null);
    const [mentorForm, setMentorForm] = useState({
        name: '', email: '', mobile: '', profile_photo: '', expertise: '',
        experience: '', availability: 'Weekdays & Weekends', status: 'active', bio: ''
    });

    useEffect(() => {
        loadAllData();
    }, [token]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchPlans(),
                fetchOffers(),
                fetchMentors(),
                fetchMentorRequests(),
                fetchSubscriptions(),
                fetchAuditLogs()
            ]);
        } catch (e) {
            console.error('Error loading admin data:', e);
        } finally {
            setLoading(false);
        }
    };

    // ── 1. Fetch Dynamic Plans ──
    const fetchPlans = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/plans');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPlans(data);
                }
            }
        } catch (e) {
            console.error('Failed to fetch plans:', e);
        }
    };

    // ── 2. Other Auxiliary Data ──
    const fetchOffers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/subscriptions/offers');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setOffers(data);
            }
        } catch (e) {}
    };

    const fetchMentors = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/mentors/all', {
                headers: { 'Authorization': `Bearer ${token || 'mock_token_admin'}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setMentors(data);
            }
        } catch (e) {}
    };

    const fetchMentorRequests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/mentors/requests', {
                headers: { 'Authorization': `Bearer ${token || 'mock_token_admin'}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setMentorRequests(data);
            }
        } catch (e) {}
    };

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/subscriptions/active-list', {
                headers: { 'Authorization': `Bearer ${token || 'mock_token_admin'}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setSubscriptions(data);
            }
        } catch (e) {}
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/audit-logs', {
                headers: { 'Authorization': `Bearer ${token || 'mock_token_admin'}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setAuditLogs(data);
            }
        } catch (e) {}
    };

    const toastSuccess = (msg) => addToast ? addToast('success', msg) : null;
    const toastError = (msg) => addToast ? addToast('error', msg) : null;

    // ── Open Plan Modal (Create or Edit) ──
    const handleOpenPlanModal = (plan = null, defaultType = 'employer') => {
        if (plan) {
            setEditingPlan(plan);
            setPlanForm({
                plan_type: plan.plan_type || 'employer',
                plan_name: plan.plan_name || plan.name || '',
                description: plan.description || '',
                original_price: plan.original_price !== undefined ? plan.original_price : plan.price || '',
                offer_price: plan.offer_price !== undefined ? plan.offer_price : plan.price || '',
                discount_percentage: plan.discount_percentage || 0,
                duration: plan.duration || '30 Days',
                duration_days: plan.duration_days || 30,
                posting_limit: plan.posting_limit !== undefined ? plan.posting_limit : (plan.job_limit || 1),
                application_limit: plan.posting_limit !== undefined ? plan.posting_limit : (plan.application_limit || 10),
                popular: Boolean(plan.popular || plan.is_popular),
                recommended: Boolean(plan.recommended || plan.is_recommended),
                status: plan.status || 'active',
                badge_text: plan.badge_text || '',
                features: (plan.features && plan.features.length > 0)
                    ? plan.features.map(f => ({
                        feature_name: f.feature_name || f.name,
                        included: f.included !== undefined ? Boolean(f.included) : true,
                        feature_value: f.feature_value || f.value || ''
                    }))
                    : [
                        { feature_name: 'Full Feature Access', included: true, feature_value: '' }
                    ]
            });
        } else {
            setEditingPlan(null);
            const isEmp = defaultType === 'employer';
            setPlanForm({
                plan_type: defaultType,
                plan_name: '',
                description: '',
                original_price: isEmp ? 2499 : 499,
                offer_price: isEmp ? 1999 : 299,
                discount_percentage: isEmp ? 20 : 40,
                duration: '30 Days',
                duration_days: 30,
                posting_limit: isEmp ? 1 : 20,
                application_limit: isEmp ? 1 : 20,
                popular: false,
                recommended: false,
                status: 'active',
                badge_text: '',
                features: isEmp ? [
                    { feature_name: 'Unlimited Candidate Applications', included: true, feature_value: 'Unlimited' },
                    { feature_name: '30 Day Job Validity', included: true, feature_value: '30 Days' },
                    { feature_name: 'Job Notifications', included: true, feature_value: 'Instant' },
                    { feature_name: 'Job Featured on Top', included: false, feature_value: '' },
                    { feature_name: 'Screened Leads', included: false, feature_value: '' },
                    { feature_name: 'Candidate Database Access', included: false, feature_value: '' },
                    { feature_name: 'WhatsApp Alerts', included: false, feature_value: '' },
                    { feature_name: 'AI Profile Recommendation', included: false, feature_value: '' }
                ] : [
                    { feature_name: 'Monthly Job Applications', included: true, feature_value: '20 Apps' },
                    { feature_name: 'Standard Profile Visibility', included: true, feature_value: 'Active' },
                    { feature_name: 'AI Resume Score & Optimization', included: true, feature_value: 'Enabled' },
                    { feature_name: 'Featured Candidate Spotlight', included: false, feature_value: '' },
                    { feature_name: 'Direct Recruiter Contact', included: false, feature_value: '' },
                    { feature_name: '1-on-1 Dedicated Mentor Guidance', included: false, feature_value: '' }
                ]
            });
        }
        setShowPlanModal(true);
    };

    // ── Handle Dynamic Price & Discount Calculation ──
    const handlePriceChange = (field, val) => {
        const numVal = val === '' ? '' : Math.max(0, Number(val));
        const updated = { ...planForm, [field]: numVal };

        const orig = field === 'original_price' ? numVal : planForm.original_price;
        const off = field === 'offer_price' ? numVal : planForm.offer_price;

        if (orig > 0 && off !== '' && off < orig) {
            updated.discount_percentage = Math.round(((orig - off) / orig) * 100);
        } else {
            updated.discount_percentage = 0;
        }

        setPlanForm(updated);
    };

    // ── Dynamic Feature Operations ──
    const handleAddFeatureRow = (name = '', included = true, value = '') => {
        setPlanForm(prev => ({
            ...prev,
            features: [
                ...prev.features,
                { feature_name: name, included: included, feature_value: value }
            ]
        }));
    };

    const handleUpdateFeature = (index, field, value) => {
        setPlanForm(prev => {
            const nextFeatures = [...prev.features];
            nextFeatures[index] = { ...nextFeatures[index], [field]: value };
            return { ...prev, features: nextFeatures };
        });
    };

    const handleDeleteFeature = (index) => {
        setPlanForm(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    // ── Save Plan (Create or Update) ──
    const handleSavePlan = async (e) => {
        e.preventDefault();

        // Validation
        if (!planForm.plan_name.trim()) return toastError('Plan name is required.');
        if (planForm.original_price === '' || isNaN(Number(planForm.original_price)) || Number(planForm.original_price) < 0) {
            return toastError('Please enter a valid original price.');
        }
        if (planForm.offer_price === '' || isNaN(Number(planForm.offer_price)) || Number(planForm.offer_price) < 0) {
            return toastError('Please enter a valid offer price.');
        }
        if (Number(planForm.offer_price) > Number(planForm.original_price) && Number(planForm.original_price) > 0) {
            return toastError('Offer price cannot be greater than original price.');
        }
        if (!planForm.features || planForm.features.length === 0) {
            return toastError('Please add at least one feature to the plan.');
        }

        // Validate feature names
        for (let i = 0; i < planForm.features.length; i++) {
            if (!planForm.features[i].feature_name.trim()) {
                return toastError(`Feature row #${i + 1} has an empty feature name.`);
            }
        }

        // Check duplicates
        const featureNames = planForm.features.map(f => f.feature_name.trim().toLowerCase());
        const hasDuplicates = featureNames.some((val, idx) => featureNames.indexOf(val) !== idx);
        if (hasDuplicates) {
            return toastError('Duplicate feature names found within this plan. Please make each feature name unique.');
        }

        try {
            const url = editingPlan
                ? `http://localhost:5000/api/plans/${editingPlan.id}`
                : 'http://localhost:5000/api/plans';
            const method = editingPlan ? 'PUT' : 'POST';

            const payload = {
                ...planForm,
                posting_limit: planForm.plan_type === 'candidate' ? Number(planForm.application_limit) : Number(planForm.posting_limit)
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || 'mock_token_admin'}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to save plan');
            }

            toastSuccess(editingPlan ? `Plan "${planForm.plan_name}" updated successfully!` : `Plan "${planForm.plan_name}" created successfully!`);
            setShowPlanModal(false);
            await fetchPlans();
            fetchAuditLogs();
        } catch (err) {
            console.error('Save plan error:', err);
            toastError(err.message || 'Failed to save plan');
        }
    };

    // ── Delete Plan Permanently ──
    const handleDeletePlan = async (planId, planName) => {
        if (!window.confirm(`Are you sure you want to permanently delete plan "${planName}"? This action cannot be undone.`)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/plans/${planId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token || 'mock_token_admin'}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete plan');
            }

            toastSuccess(`Plan "${planName}" deleted permanently.`);
            await fetchPlans();
            fetchAuditLogs();
        } catch (err) {
            console.error('Delete error:', err);
            toastError(err.message || 'Failed to delete plan');
        }
    };

    // ── Duplicate Plan ──
    const handleDuplicatePlan = async (planId, planName) => {
        try {
            const res = await fetch(`http://localhost:5000/api/plans/${planId}/duplicate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token || 'mock_token_admin'}` }
            });

            if (!res.ok) throw new Error('Failed to duplicate plan');

            toastSuccess(`Duplicated plan "${planName}".`);
            await fetchPlans();
            fetchAuditLogs();
        } catch (err) {
            toastError(err.message || 'Failed to duplicate plan');
        }
    };

    // ── Toggle Plan Status ──
    const handleToggleStatus = async (plan) => {
        const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
        try {
            const res = await fetch(`http://localhost:5000/api/plans/${plan.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || 'mock_token_admin'}`
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');

            toastSuccess(`Plan "${plan.plan_name}" marked as ${nextStatus}.`);
            await fetchPlans();
            fetchAuditLogs();
        } catch (err) {
            toastError(err.message || 'Failed to update plan status');
        }
    };

    // Filtering Plans
    const employerPlansList = plans.filter(p => p.plan_type === 'employer');
    const candidatePlansList = plans.filter(p => p.plan_type === 'candidate');

    return (
        <div style={{ padding: '32px 40px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* ── TOP HEADER & ACTIONS ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Premium Plans <span style={{ color: '#f59e0b' }}>⚡</span>
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.96rem', margin: '6px 0 0' }}>
                        Create and dynamically customize employer hiring tiers and candidate career packages with real-time feature builders.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => handleOpenPlanModal(null, activeTab === 'candidate_plans' ? 'candidate' : 'employer')}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '11px 22px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                            transition: 'transform 0.15s ease'
                        }}
                    >
                        <FiPlus size={18} /> Create Plan
                    </button>
                    <button
                        onClick={() => { fetchPlans(); toastSuccess('Plans refreshed'); }}
                        style={{
                            background: '#ffffff',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '11px 16px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <FiRefreshCw size={15} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── NAVIGATION TABS ── */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '28px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                    onClick={() => { setActiveTab('employer_plans'); setSearchParams({ tab: 'employer_plans' }); }}
                    style={{
                        padding: '12px 24px',
                        fontWeight: 800,
                        fontSize: '0.94rem',
                        border: 'none',
                        borderBottom: activeTab === 'employer_plans' ? '3px solid #f59e0b' : '3px solid transparent',
                        background: 'transparent',
                        color: activeTab === 'employer_plans' ? '#d97706' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FiBriefcase /> Employer Plans ({employerPlansList.length})
                </button>

                <button
                    onClick={() => { setActiveTab('candidate_plans'); setSearchParams({ tab: 'candidate_plans' }); }}
                    style={{
                        padding: '12px 24px',
                        fontWeight: 800,
                        fontSize: '0.94rem',
                        border: 'none',
                        borderBottom: activeTab === 'candidate_plans' ? '3px solid #f59e0b' : '3px solid transparent',
                        background: 'transparent',
                        color: activeTab === 'candidate_plans' ? '#d97706' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FiUsers /> Candidate Plans ({candidatePlansList.length})
                </button>

                <button
                    onClick={() => { setActiveTab('subscriptions'); setSearchParams({ tab: 'subscriptions' }); }}
                    style={{
                        padding: '12px 20px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        border: 'none',
                        borderBottom: activeTab === 'subscriptions' ? '3px solid #f59e0b' : '3px solid transparent',
                        background: 'transparent',
                        color: activeTab === 'subscriptions' ? '#d97706' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FiActivity /> Active Subscriptions ({subscriptions.length})
                </button>
            </div>

            {/* ── TAB 1: EMPLOYER PLANS ── */}
            {activeTab === 'employer_plans' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>Employer Hiring Packages</h3>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                                Dynamic packages configured with custom job posting limits, database view quotas, and recruiter privileges.
                            </p>
                        </div>
                        <button
                            onClick={() => handleOpenPlanModal(null, 'employer')}
                            style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <FiPlus /> Add Employer Plan
                        </button>
                    </div>

                    {employerPlansList.length === 0 ? (
                        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1', padding: '60px 20px', textAlign: 'center' }}>
                            <FiBriefcase size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 700 }}>No Employer Plans Created Yet</h4>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '6px auto 20px' }}>Click below to create your first dynamic employer hiring plan.</p>
                            <button
                                onClick={() => handleOpenPlanModal(null, 'employer')}
                                style={{ background: '#f59e0b', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                + Create Employer Plan
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '26px' }}>
                            {employerPlansList.map(plan => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    onEdit={() => handleOpenPlanModal(plan, 'employer')}
                                    onDuplicate={() => handleDuplicatePlan(plan.id, plan.plan_name)}
                                    onToggleStatus={() => handleToggleStatus(plan)}
                                    onDelete={() => handleDeletePlan(plan.id, plan.plan_name)}
                                    onPreview={() => setPreviewPlan(plan)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 2: CANDIDATE PLANS ── */}
            {activeTab === 'candidate_plans' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>Candidate Premium Packages</h3>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                                Dynamic candidate tiers offering job application quotas, AI resume review, mentor guidance, and visibility boosts.
                            </p>
                        </div>
                        <button
                            onClick={() => handleOpenPlanModal(null, 'candidate')}
                            style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <FiPlus /> Add Candidate Plan
                        </button>
                    </div>

                    {candidatePlansList.length === 0 ? (
                        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1', padding: '60px 20px', textAlign: 'center' }}>
                            <FiUsers size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 700 }}>No Candidate Plans Created Yet</h4>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '6px auto 20px' }}>Click below to create your first dynamic candidate career plan.</p>
                            <button
                                onClick={() => handleOpenPlanModal(null, 'candidate')}
                                style={{ background: '#f59e0b', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                            >
                                + Create Candidate Plan
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '26px' }}>
                            {candidatePlansList.map(plan => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    onEdit={() => handleOpenPlanModal(plan, 'candidate')}
                                    onDuplicate={() => handleDuplicatePlan(plan.id, plan.plan_name)}
                                    onToggleStatus={() => handleToggleStatus(plan)}
                                    onDelete={() => handleDeletePlan(plan.id, plan.plan_name)}
                                    onPreview={() => setPreviewPlan(plan)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB 3: ACTIVE SUBSCRIBERS ── */}
            {activeTab === 'subscriptions' && (
                <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '24px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>Subscribers & Plan Usage</h3>
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '12px 16px' }}>Subscriber</th>
                                    <th style={{ padding: '12px 16px' }}>Plan Name</th>
                                    <th style={{ padding: '12px 16px' }}>Amount</th>
                                    <th style={{ padding: '12px 16px' }}>Expiry Date</th>
                                    <th style={{ padding: '12px 16px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No active subscriptions recorded yet.</td>
                                    </tr>
                                ) : (
                                    subscriptions.map(sub => (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{sub.companyName || sub.employerName || sub.userEmail}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.userEmail}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#d97706' }}>{sub.plan_name}</td>
                                            <td style={{ padding: '14px 16px', fontWeight: 800 }}>₹{sub.amount || 0}</td>
                                            <td style={{ padding: '14px 16px', color: '#475569' }}>{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('en-GB') : 'Active'}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}>
                                                    {sub.effectiveStatus || 'active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                MODAL: CREATE / EDIT DYNAMIC PLAN (WITH FEATURE BUILDER)
               ══════════════════════════════════════════════════════════ */}
            {showPlanModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1100, padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff', width: '100%', maxWidth: '860px',
                        borderRadius: '24px', padding: '32px', maxHeight: '92vh',
                        overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                        border: '1px solid #e2e8f0'
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
                                    {editingPlan ? `Edit ${planForm.plan_name}` : `Create New ${planForm.plan_type === 'candidate' ? 'Candidate' : 'Employer'} Plan`}
                                </h2>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                                    Configure pricing, duration, job limits, and build dynamic features (✓ Included / ✕ Not Included).
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPlanModal(false)}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePlan}>
                            
                            {/* ── SECTION 1: BASIC PLAN DETAILS ── */}
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiTag color="#f59e0b" /> Basic Plan Details
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                                    {/* Plan Type */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Plan Type *</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => setPlanForm(prev => ({ ...prev, plan_type: 'employer' }))}
                                                style={{
                                                    flex: 1, padding: '9px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                                    border: planForm.plan_type === 'employer' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                                                    background: planForm.plan_type === 'employer' ? '#fef3c7' : '#ffffff',
                                                    color: planForm.plan_type === 'employer' ? '#b45309' : '#475569'
                                                }}
                                            >
                                                🏢 Employer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPlanForm(prev => ({ ...prev, plan_type: 'candidate' }))}
                                                style={{
                                                    flex: 1, padding: '9px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                                    border: planForm.plan_type === 'candidate' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                                                    background: planForm.plan_type === 'candidate' ? '#fef3c7' : '#ffffff',
                                                    color: planForm.plan_type === 'candidate' ? '#b45309' : '#475569'
                                                }}
                                            >
                                                🎓 Candidate
                                            </button>
                                        </div>
                                    </div>

                                    {/* Plan Name */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Plan Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={planForm.plan_name}
                                            onChange={e => setPlanForm({ ...planForm, plan_name: e.target.value })}
                                            placeholder="e.g. Basic, Silver, Gold, VIP Pro"
                                            style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    {/* Original Price */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Original Price (₹) *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={planForm.original_price}
                                            onChange={e => handlePriceChange('original_price', e.target.value)}
                                            placeholder="e.g. 2299"
                                            style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    {/* Offer Price & Auto Discount */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Offer Price (₹) *</label>
                                            {planForm.discount_percentage > 0 && (
                                                <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px' }}>
                                                    {planForm.discount_percentage}% OFF
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={planForm.offer_price}
                                            onChange={e => handlePriceChange('offer_price', e.target.value)}
                                            placeholder="e.g. 1899"
                                            style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Plan Duration *</label>
                                        <select
                                            value={planForm.duration}
                                            onChange={e => {
                                                const dur = e.target.value;
                                                let days = 30;
                                                if (dur.includes('7')) days = 7;
                                                else if (dur.includes('15')) days = 15;
                                                else if (dur.includes('30')) days = 30;
                                                else if (dur.includes('60')) days = 60;
                                                else if (dur.includes('90')) days = 90;
                                                else if (dur.includes('180')) days = 180;
                                                else if (dur.includes('365')) days = 365;
                                                setPlanForm({ ...planForm, duration: dur, duration_days: days });
                                            }}
                                            style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        >
                                            <option value="7 Days">7 Days</option>
                                            <option value="15 Days">15 Days</option>
                                            <option value="30 Days">30 Days</option>
                                            <option value="60 Days">60 Days</option>
                                            <option value="90 Days">90 Days</option>
                                            <option value="180 Days">180 Days (6 Months)</option>
                                            <option value="365 Days">365 Days (1 Year)</option>
                                            <option value="Custom Duration">Custom Duration</option>
                                        </select>
                                    </div>

                                    {/* Job Limit or Application Limit */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                                            {planForm.plan_type === 'employer' ? 'Job Postings Limit (-1 for Unlimited)' : 'Monthly Applications Limit (-1 for Unlimited)'}
                                        </label>
                                        <input
                                            type="number"
                                            value={planForm.plan_type === 'employer' ? planForm.posting_limit : planForm.application_limit}
                                            onChange={e => {
                                                const v = Number(e.target.value);
                                                if (planForm.plan_type === 'employer') {
                                                    setPlanForm({ ...planForm, posting_limit: v });
                                                } else {
                                                    setPlanForm({ ...planForm, application_limit: v });
                                                }
                                            }}
                                            style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Short Description</label>
                                    <textarea
                                        rows={2}
                                        value={planForm.description}
                                        onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                                        placeholder="Brief value proposition (e.g. Best suited for startups and growing teams...)"
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'vertical' }}
                                    />
                                </div>

                                {/* Toggles: Popular, Recommended, Status, Badge */}
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={planForm.popular}
                                            onChange={e => setPlanForm({ ...planForm, popular: e.target.checked })}
                                            style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                                        />
                                        🔥 Most Popular Plan
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 700, color: '#1e293b' }}>
                                        <input
                                            type="checkbox"
                                            checked={planForm.recommended}
                                            onChange={e => setPlanForm({ ...planForm, recommended: e.target.checked })}
                                            style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                                        />
                                        ⭐ Recommended Plan
                                    </label>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Status:</span>
                                        <select
                                            value={planForm.status}
                                            onChange={e => setPlanForm({ ...planForm, status: e.target.value })}
                                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>

                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                        <input
                                            type="text"
                                            value={planForm.badge_text}
                                            onChange={e => setPlanForm({ ...planForm, badge_text: e.target.value })}
                                            placeholder="Custom Badge (e.g. BEST VALUE)"
                                            style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── SECTION 2: DYNAMIC FEATURE BUILDER (✓ / ✕) ── */}
                            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiSliders color="#f59e0b" /> Dynamic Feature Builder
                                        </h4>
                                        <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                                            Add unlimited features. Toggle ✓ (Included) or ✕ (Unavailable) and assign custom limits.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleAddFeatureRow('', true, '')}
                                        style={{
                                            background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a',
                                            padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.84rem',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        <FiPlus /> Add Feature Row
                                    </button>
                                </div>

                                {/* Preset Suggestion Chips */}
                                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Quick Add:</span>
                                    {(planForm.plan_type === 'employer' ? EMPLOYER_FEATURE_PRESETS : CANDIDATE_FEATURE_PRESETS).slice(0, 7).map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAddFeatureRow(preset, true, '')}
                                            style={{
                                                background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 10px',
                                                borderRadius: '20px', fontSize: '0.76rem', fontWeight: 600, color: '#334155',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            + {preset}
                                        </button>
                                    ))}
                                </div>

                                {/* Features Table */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {planForm.features.map((feat, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 140px 140px 42px',
                                                gap: '10px',
                                                alignItems: 'center',
                                                background: feat.included ? '#f0fdf4' : '#f8fafc',
                                                padding: '10px 14px',
                                                borderRadius: '12px',
                                                border: feat.included ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {/* 1. Feature Name */}
                                            <div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={feat.feature_name}
                                                    onChange={e => handleUpdateFeature(idx, 'feature_name', e.target.value)}
                                                    placeholder={`Feature #${idx + 1} (e.g. Job Featured on Top)`}
                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff', fontWeight: 600 }}
                                                />
                                            </div>

                                            {/* 2. Included Toggle Button (✓ / ✕) */}
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateFeature(idx, 'included', !feat.included)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 10px',
                                                        borderRadius: '8px',
                                                        fontWeight: 800,
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        border: feat.included ? '1px solid #86efac' : '1px solid #fca5a5',
                                                        background: feat.included ? '#dcfce7' : '#fee2e2',
                                                        color: feat.included ? '#15803d' : '#b91c1c'
                                                    }}
                                                >
                                                    {feat.included ? '✓ Included' : '✕ Not Included'}
                                                </button>
                                            </div>

                                            {/* 3. Optional Value / Limit */}
                                            <div>
                                                <input
                                                    type="text"
                                                    value={feat.feature_value}
                                                    onChange={e => handleUpdateFeature(idx, 'feature_value', e.target.value)}
                                                    placeholder="Value (e.g. 30 Days)"
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
                                                />
                                            </div>

                                            {/* 4. Delete Row */}
                                            <div style={{ textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteFeature(idx)}
                                                    title="Delete this feature"
                                                    style={{
                                                        background: '#fef2f2',
                                                        border: '1px solid #fecaca',
                                                        color: '#ef4444',
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <FiTrash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleAddFeatureRow('', true, '')}
                                        style={{
                                            background: '#ffffff',
                                            border: '2px dashed #cbd5e1',
                                            padding: '10px 24px',
                                            borderRadius: '12px',
                                            fontWeight: 700,
                                            fontSize: '0.86rem',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            width: '100%'
                                        }}
                                    >
                                        + Click to Add Another Feature
                                    </button>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPlanModal(false)}
                                    style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 28px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        fontSize: '0.94rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                                    }}
                                >
                                    {editingPlan ? 'Save Changes' : 'Create Plan'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                MODAL: LIVE CARD PREVIEW MODAL
               ══════════════════════════════════════════════════════════ */}
            {previewPlan && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '24px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}>
                        <button
                            onClick={() => setPreviewPlan(null)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <FiX />
                        </button>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Customer Preview
                            </span>
                            <h3 style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{previewPlan.plan_name}</h3>
                        </div>

                        <div style={{ textAlign: 'center', margin: '14px 0 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a' }}>
                                    ₹{Number(previewPlan.offer_price).toLocaleString()}
                                </span>
                                {previewPlan.original_price > previewPlan.offer_price && (
                                    <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '1.1rem', fontWeight: 600 }}>
                                        ₹{Number(previewPlan.original_price).toLocaleString()}
                                    </span>
                                )}
                            </div>
                            {previewPlan.discount_percentage > 0 && (
                                <span style={{ display: 'inline-block', marginTop: '6px', background: '#fef3c7', color: '#b45309', fontSize: '0.78rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' }}>
                                    {previewPlan.discount_percentage}% OFF • {previewPlan.duration}
                                </span>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '24px', maxHeight: '280px', overflowY: 'auto' }}>
                            {(previewPlan.features || []).map((feat, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', fontSize: '0.88rem' }}>
                                    {feat.included ? (
                                        <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.1rem', lineHeight: '1' }}>✓</span>
                                    ) : (
                                        <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.1rem', lineHeight: '1' }}>✕</span>
                                    )}
                                    <span style={{ color: feat.included ? '#1e293b' : '#94a3b8', fontWeight: feat.included ? 600 : 400, textDecoration: feat.included ? 'none' : 'none' }}>
                                        {feat.feature_name}
                                        {feat.feature_value && (
                                            <span style={{ marginLeft: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                                                {feat.feature_value}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff',
                                fontWeight: 800, fontSize: '1rem', cursor: 'pointer'
                            }}
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

// ── Subcomponent: Dynamic Plan Card in Admin Panel ──
function PlanCard({ plan, onEdit, onDuplicate, onToggleStatus, onDelete, onPreview }) {
    const isPopular = Boolean(plan.popular || plan.is_popular);
    const isRecommended = Boolean(plan.recommended || plan.is_recommended);
    const features = plan.features || [];

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: isPopular ? '2px solid #f59e0b' : (isRecommended ? '2px solid #3b82f6' : '1px solid #e2e8f0'),
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: isPopular ? '0 12px 30px rgba(245, 158, 11, 0.15)' : '0 2px 10px rgba(0,0,0,0.03)'
        }}>
            {/* Top Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                    fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                    padding: '3px 8px', borderRadius: '6px',
                    background: plan.status === 'active' ? '#dcfce7' : '#fee2e2',
                    color: plan.status === 'active' ? '#15803d' : '#b91c1c'
                }}>
                    ● {plan.status}
                </span>

                {(isPopular || isRecommended || plan.badge_text) && (
                    <div style={{
                        background: isPopular ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#3b82f6',
                        color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px',
                        borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        {plan.badge_text || (isPopular ? 'MOST POPULAR' : 'RECOMMENDED')}
                    </div>
                )}
            </div>

            {/* Plan Name & Short Description */}
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                {plan.plan_name}
            </h3>
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.84rem', minHeight: '36px', lineHeight: 1.4 }}>
                {plan.description || 'Standard hiring and access package.'}
            </p>

            {/* Price Row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a' }}>
                    ₹{Number(plan.offer_price).toLocaleString()}
                </span>
                {plan.original_price > plan.offer_price && (
                    <span style={{ fontSize: '1.05rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>
                        ₹{Number(plan.original_price).toLocaleString()}
                    </span>
                )}
                {plan.discount_percentage > 0 && (
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px' }}>
                        {plan.discount_percentage}% OFF
                    </span>
                )}
            </div>

            {/* Quota Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#f8fafc', color: '#334155', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    ⏰ {plan.duration}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    🎯 {plan.posting_limit === -1 ? 'Unlimited' : plan.posting_limit} {plan.plan_type === 'employer' ? 'Job Postings' : 'Applications'}
                </span>
            </div>

            {/* Features List (✓ and ✕) */}
            <div style={{ flex: 1, borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Configured Features ({features.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {features.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem' }}>
                            {feat.included ? (
                                <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1rem' }}>✓</span>
                            ) : (
                                <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1rem' }}>✕</span>
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <button
                    onClick={onEdit}
                    style={{ flex: 1, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '8px', borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                    <FiEdit2 size={13} /> Edit
                </button>
                <button
                    onClick={onDuplicate}
                    title="Duplicate Plan"
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer' }}
                >
                    <FiCopy size={14} />
                </button>
                <button
                    onClick={onPreview}
                    title="Live Preview"
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer' }}
                >
                    <FiEye size={14} />
                </button>
                <button
                    onClick={onToggleStatus}
                    title={plan.status === 'active' ? 'Deactivate' : 'Activate'}
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: plan.status === 'active' ? '#15803d' : '#64748b', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer' }}
                >
                    {plan.status === 'active' ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                </button>
                <button
                    onClick={onDelete}
                    title="Delete Permanently"
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer' }}
                >
                    <FiTrash2 size={14} />
                </button>
            </div>
        </div>
    );
}
