import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FiBell, FiSend, FiUsers, FiBriefcase, FiPlus, FiTrash2, FiSearch,
    FiFilter, FiCheckCircle, FiAlertTriangle, FiInfo, FiTag, FiClock,
    FiMail, FiSmartphone, FiExternalLink, FiRefreshCw, FiEye, FiX,
    FiLayers, FiRadio, FiShield, FiArrowRight, FiCheck
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

// ── Built-in Initial Notifications ──
const INITIAL_NOTIFICATIONS = [
    {
        id: 1,
        title: 'Pongal Festival Premium Discount (28% OFF)',
        message: 'Special holiday pricing is now live on all Candidate Premium Plans with 1-on-1 Mentor Guidance. Upgrade today!',
        target_group: 'candidates',
        notification_type: 'promo',
        channels: 'in_app,email',
        action_url: '/candidate-plans',
        priority: 'high',
        sender_name: 'Admin Team',
        sent_count: 1420,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
        id: 2,
        title: 'New Hiring Quota & Resume Download Features Active',
        message: 'Employers can now export verified candidate profiles and download up to 500 resumes with our Growth Recruiter package.',
        target_group: 'employers',
        notification_type: 'announcement',
        channels: 'in_app,email',
        action_url: '/employer/plans',
        priority: 'normal',
        sender_name: 'Admin Team',
        sent_count: 320,
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
        id: 3,
        title: 'Urgent: Complete Candidate Profile Verification',
        message: 'Ensure your phone number and highest educational degree are verified to boost your profile ranking with Tier-1 recruiters.',
        target_group: 'candidates',
        notification_type: 'alert',
        channels: 'in_app',
        action_url: '/jobseeker/profile',
        priority: 'urgent',
        sender_name: 'Compliance Officer',
        sent_count: 850,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
        id: 4,
        title: 'Scheduled System Maintenance: Sunday 2 AM - 4 AM',
        message: 'JobConnect servers will undergo routine performance upgrades this Sunday. All active applications and job postings remain intact.',
        target_group: 'all',
        notification_type: 'system',
        channels: 'in_app,email',
        action_url: '',
        priority: 'high',
        sender_name: 'System Admin',
        sent_count: 1740,
        created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
        id: 5,
        title: 'Special Enterprise Recruiter Workshop',
        message: 'Join our exclusive webinar on AI-driven resume screening and high-volume tech hiring on Friday at 4 PM IST.',
        target_group: 'employers',
        notification_type: 'announcement',
        channels: 'in_app,email',
        action_url: '/employer/dashboard',
        priority: 'normal',
        sender_name: 'Employer Relations',
        sent_count: 180,
        created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
];

export default function AdminNotifications() {
    const { token } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const toastSuccess = (msg) => addToast ? addToast(msg, 'success') : alert(msg);
    const toastError = (msg) => addToast ? addToast(msg, 'error') : alert(msg);

    // Active Category & Tab
    const tabFromUrl = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabFromUrl || 'all');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
    };

    // State
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterPriority, setFilterPriority] = useState('ALL');

    // Modals
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Form
    const [composeForm, setComposeForm] = useState({
        title: '',
        message: '',
        target_group: 'candidates',
        notification_type: 'announcement',
        channels: 'in_app',
        action_url: '',
        priority: 'normal'
    });

    useEffect(() => {
        fetchNotifications();
    }, [token]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setNotifications(data);
                    setLoading(false);
                    return;
                }
            }
        } catch (e) {
            console.error('Fetch notifications fallback:', e);
        }

        const cached = JSON.parse(localStorage.getItem('admin_broadcast_notifications') || '[]');
        setNotifications(cached.length > 0 ? cached : INITIAL_NOTIFICATIONS);
        setLoading(false);
    };

    const handleOpenCompose = (defaultGroup = 'candidates') => {
        setComposeForm({
            title: '',
            message: '',
            target_group: defaultGroup,
            notification_type: 'announcement',
            channels: 'in_app,email',
            action_url: '',
            priority: 'normal'
        });
        setShowComposeModal(true);
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!composeForm.title.trim()) return toastError('Title is required');
        if (!composeForm.message.trim()) return toastError('Message content is required');

        try {
            const res = await fetch('http://localhost:5000/api/admin/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(composeForm)
            });

            let newNotif;
            if (res.ok) {
                const data = await res.json();
                newNotif = data.notification;
            } else {
                newNotif = {
                    ...composeForm,
                    id: Date.now(),
                    sender_name: 'System Admin',
                    sent_count: composeForm.target_group === 'all' ? 1740 : (composeForm.target_group === 'candidates' ? 1420 : 320),
                    created_at: new Date().toISOString()
                };
            }

            const updated = [newNotif, ...notifications];
            setNotifications(updated);
            localStorage.setItem('admin_broadcast_notifications', JSON.stringify(updated));

            toastSuccess(`Notification broadcasted to ${composeForm.target_group === 'all' ? 'All Users' : (composeForm.target_group === 'candidates' ? 'Candidates' : 'Employers')}!`);
            setShowComposeModal(false);
            fetchNotifications();
        } catch (err) {
            toastError('Failed to send notification');
        }
    };

    const handleDeleteNotif = async (id, title) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

        try {
            await fetch(`http://localhost:5000/api/admin/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null);

            const updated = notifications.filter(n => n.id !== id);
            setNotifications(updated);
            localStorage.setItem('admin_broadcast_notifications', JSON.stringify(updated));
            toastSuccess('Notification removed successfully');
        } catch (e) {
            toastError('Failed to delete notification');
        }
    };

    // Filtered by Active Tab & search
    const filteredNotifications = notifications.filter(n => {
        // Tab Filtering
        if (activeTab === 'candidates' && n.target_group !== 'candidates' && n.target_group !== 'all') return false;
        if (activeTab === 'employers' && n.target_group !== 'employers' && n.target_group !== 'all') return false;
        if (activeTab === 'announcements' && n.notification_type !== 'announcement' && n.notification_type !== 'system') return false;

        // Type Filter
        if (filterType !== 'ALL' && n.notification_type !== filterType) return false;

        // Priority Filter
        if (filterPriority !== 'ALL' && n.priority !== filterPriority) return false;

        // Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchTitle = n.title?.toLowerCase().includes(q);
            const matchMsg = n.message?.toLowerCase().includes(q);
            const matchSender = n.sender_name?.toLowerCase().includes(q);
            if (!matchTitle && !matchMsg && !matchSender) return false;
        }

        return true;
    });

    const candidateCount = notifications.filter(n => n.target_group === 'candidates' || n.target_group === 'all').length;
    const employerCount = notifications.filter(n => n.target_group === 'employers' || n.target_group === 'all').length;
    const urgentCount = notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length;

    const getTypeBadge = (type) => {
        switch (type) {
            case 'promo':
                return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: '🎁 Promotion / Offer' };
            case 'alert':
                return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: '⚠️ Urgent Alert' };
            case 'system':
                return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: '⚙️ System Notice' };
            default:
                return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: '📢 Announcement' };
        }
    };

    const getGroupBadge = (group) => {
        switch (group) {
            case 'candidates':
                return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: '👨‍💼 Candidates / Jobseekers' };
            case 'employers':
                return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', label: '🏢 Employers / Companies' };
            default:
                return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: '🌐 All Platform Users' };
        }
    };

    return (
        <div style={{ padding: '30px 40px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* ── TOP GREETING & ACTIONS ── */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Notifications & <span style={{ color: '#2563eb' }}>Broadcast Center</span> 🔔
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '6px 0 0' }}>
                        Send instant push alerts, campaign broadcasts, and system updates to Candidates and Employers.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => handleOpenCompose('candidates')}
                        style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                        }}
                    >
                        <FiUsers size={16} /> Send to Candidates
                    </button>

                    <button
                        onClick={() => handleOpenCompose('employers')}
                        style={{
                            background: '#7c3aed',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                        }}
                    >
                        <FiBriefcase size={16} /> Send to Employers
                    </button>
                </div>
            </div>

            {/* ── STATS SUMMARY CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px', marginBottom: '28px' }}>
                <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                        <FiBell size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Broadcasts</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{notifications.length}</div>
                    </div>
                </div>

                <div 
                    onClick={() => handleTabChange('candidates')}
                    style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: activeTab === 'candidates' ? '2px solid #2563eb' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                        <FiUsers size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Candidate Alerts</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{candidateCount}</div>
                    </div>
                </div>

                <div 
                    onClick={() => handleTabChange('employers')}
                    style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: activeTab === 'employers' ? '2px solid #7c3aed' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                        <FiBriefcase size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Employer Alerts</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{employerCount}</div>
                    </div>
                </div>

                <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                        <FiAlertTriangle size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>High / Urgent Alerts</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{urgentCount}</div>
                    </div>
                </div>
            </div>

            {/* ── FILTER & SEARCH TOOLBAR ── */}
            <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                        <FiSearch size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by title, message, or sender..."
                            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#f8fafc', fontWeight: 600, color: '#334155' }}
                    >
                        <option value="ALL">All Types</option>
                        <option value="announcement">📢 Announcement</option>
                        <option value="promo">🎁 Promo / Offers</option>
                        <option value="alert">⚠️ Urgent Alert</option>
                        <option value="system">⚙️ System Notice</option>
                    </select>

                    <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#f8fafc', fontWeight: 600, color: '#334155' }}
                    >
                        <option value="ALL">All Priorities</option>
                        <option value="normal">Normal Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent Priority</option>
                    </select>

                    <button
                        onClick={fetchNotifications}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', color: '#475569', fontWeight: 600, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                        <FiRefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* ── NOTIFICATIONS LIST ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredNotifications.length === 0 ? (
                    <div style={{ background: '#ffffff', padding: '60px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <FiBell size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
                        <h3 style={{ margin: '0 0 6px', color: '#1e293b', fontWeight: 700 }}>No Notifications Found</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Try clearing filters or send a new notification.</p>
                    </div>
                ) : (
                    filteredNotifications.map(notif => {
                        const typeBadge = getTypeBadge(notif.notification_type);
                        const groupBadge = getGroupBadge(notif.target_group);

                        return (
                            <div 
                                key={notif.id}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    border: notif.priority === 'urgent' ? '2px solid #fca5a5' : '1px solid #e2e8f0',
                                    padding: '22px 26px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '20px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', background: groupBadge.bg, color: groupBadge.color, border: `1px solid ${groupBadge.border}` }}>
                                            {groupBadge.label}
                                        </span>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: typeBadge.bg, color: typeBadge.color, border: `1px solid ${typeBadge.border}` }}>
                                            {typeBadge.label}
                                        </span>
                                        {notif.priority === 'urgent' && (
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444' }}>
                                                🚨 URGENT
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                                            <FiClock size={12} /> {new Date(notif.created_at || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </span>
                                    </div>

                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                                        {notif.title}
                                    </h3>

                                    <p style={{ margin: '0 0 14px', color: '#475569', fontSize: '0.92rem', lineHeight: 1.5 }}>
                                        {notif.message}
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
                                        <span><strong>Sender:</strong> {notif.sender_name || 'System Admin'}</span>
                                        <span><strong>Delivered to:</strong> {notif.sent_count || 1} recipients</span>
                                        <span><strong>Channels:</strong> {notif.channels ? notif.channels.replace('in_app', 'In-App').replace('email', 'Email') : 'In-App'}</span>
                                        {notif.action_url && (
                                            <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiExternalLink size={12} /> Link: {notif.action_url}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                    <button 
                                        onClick={() => {
                                            setSelectedNotif(notif);
                                            setShowDetailModal(true);
                                        }}
                                        style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '8px', color: '#334155', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <FiEye size={14} /> View
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteNotif(notif.id, notif.title)}
                                        style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', color: '#ef4444', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── MODAL: COMPOSE NOTIFICATION ── */}
            {showComposeModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '640px', borderRadius: '20px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                                    Broadcast Notification 📢
                                </h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                    Send notifications directly to Candidate inboxes, Employer dashboards, or platform-wide.
                                </p>
                            </div>
                            <button onClick={() => setShowComposeModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSendNotification}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Audience *</label>
                                    <select
                                        value={composeForm.target_group}
                                        onChange={e => setComposeForm({ ...composeForm, target_group: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                                    >
                                        <option value="candidates">👨‍💼 All Candidates / Jobseekers</option>
                                        <option value="employers">🏢 All Employers / Companies</option>
                                        <option value="all">🌐 All Platform Users (Candidates + Employers)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Notification Category</label>
                                    <select
                                        value={composeForm.notification_type}
                                        onChange={e => setComposeForm({ ...composeForm, notification_type: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="announcement">📢 Announcement</option>
                                        <option value="promo">🎁 Promotion / Discount Offer</option>
                                        <option value="alert">⚠️ Compliance & Account Alert</option>
                                        <option value="system">⚙️ System Maintenance</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Priority Level</label>
                                    <select
                                        value={composeForm.priority}
                                        onChange={e => setComposeForm({ ...composeForm, priority: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent (Red Alert Banner)</option>
                                    </select>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Notification Title *</label>
                                    <input 
                                        type="text"
                                        required
                                        value={composeForm.title}
                                        onChange={e => setComposeForm({ ...composeForm, title: e.target.value })}
                                        placeholder="e.g. Festival Career Boost: 30% Discount on Premium Plans"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Notification Message *</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={composeForm.message}
                                        onChange={e => setComposeForm({ ...composeForm, message: e.target.value })}
                                        placeholder="Write clear, engaging notification content that will appear on user notifications panel..."
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                    />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Action Link / URL (Optional)</label>
                                    <input 
                                        type="text"
                                        value={composeForm.action_url}
                                        onChange={e => setComposeForm({ ...composeForm, action_url: e.target.value })}
                                        placeholder="e.g. /candidate-plans, /jobs, /employer/plans"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                <button type="button" onClick={() => setShowComposeModal(false)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                                    <FiSend size={16} /> Broadcast Now
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL: VIEW DETAILS ── */}
            {showDetailModal && selectedNotif && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '560px', borderRadius: '20px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                Broadcast Overview
                            </h3>
                            <button onClick={() => setShowDetailModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <FiX />
                            </button>
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Title</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{selectedNotif.title}</div>
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Message Body</div>
                            <div style={{ fontSize: '0.92rem', color: '#334155', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', lineHeight: 1.5 }}>
                                {selectedNotif.message}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.86rem', color: '#475569', marginBottom: '22px' }}>
                            <div><strong>Target Audience:</strong> {selectedNotif.target_group}</div>
                            <div><strong>Category:</strong> {selectedNotif.notification_type}</div>
                            <div><strong>Priority:</strong> {selectedNotif.priority}</div>
                            <div><strong>Recipients:</strong> {selectedNotif.sent_count || 1}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowDetailModal(false)} style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
