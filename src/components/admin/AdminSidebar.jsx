import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FiHome, FiBriefcase, FiUsers, FiSettings, FiLogOut, FiShield,
    FiCheckCircle, FiFileText, FiStar, FiBell, FiDollarSign,
    FiChevronDown, FiChevronUp, FiSend, FiLayers, FiCircle,
    FiClock, FiXCircle, FiCheck, FiAlertTriangle, FiActivity,
    FiLock, FiMail, FiPhone, FiCreditCard, FiList, FiX
} from 'react-icons/fi';

export default function AdminSidebar({ onClose }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Collapsible accordion states
    const [openMenus, setOpenMenus] = useState({
        users: location.pathname.includes('/admin/users'),
        employers: location.pathname.includes('/admin/companies'),
        payments: location.pathname.includes('/admin/payments'),
        premium: location.pathname.includes('/admin/premium-plans'),
        jobs: location.pathname.includes('/admin/jobs') || location.pathname.includes('/admin/approvals'),
        reports: location.pathname.includes('/admin/reports'),
        notifications: location.pathname.includes('/admin/notifications'),
        settings: location.pathname.includes('/admin/settings')
    });

    useEffect(() => {
        if (location.pathname.includes('/admin/users')) setOpenMenus(p => ({ ...p, users: true }));
        if (location.pathname.includes('/admin/companies')) setOpenMenus(p => ({ ...p, employers: true }));
        if (location.pathname.includes('/admin/payments')) setOpenMenus(p => ({ ...p, payments: true }));
        if (location.pathname.includes('/admin/premium-plans')) setOpenMenus(p => ({ ...p, premium: true }));
        if (location.pathname.includes('/admin/jobs') || location.pathname.includes('/admin/approvals')) setOpenMenus(p => ({ ...p, jobs: true }));
        if (location.pathname.includes('/admin/reports')) setOpenMenus(p => ({ ...p, reports: true }));
        if (location.pathname.includes('/admin/notifications')) setOpenMenus(p => ({ ...p, notifications: true }));
        if (location.pathname.includes('/admin/settings')) setOpenMenus(p => ({ ...p, settings: true }));
    }, [location.pathname, location.search]);

    const toggleMenu = (menuKey) => {
        setOpenMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
    };

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    const currentSearch = new URLSearchParams(location.search);
    const jobStatusParam = currentSearch.get('status');
    const userFilterParam = currentSearch.get('filter');
    const userActionParam = currentSearch.get('action');
    const employerFilterParam = currentSearch.get('filter');
    const employerActionParam = currentSearch.get('action');
    const paymentStatusParam = currentSearch.get('status');
    const reportTabParam = currentSearch.get('tab');
    const notifTabParam = currentSearch.get('tab');
    const settingsTabParam = currentSearch.get('tab');

    // Helper for rendering sub-navigation links in White + Blue theme
    const renderSubItem = (label, isSelected, onClick, Icon = null) => (
        <button
            key={label}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '7px 11px',
                borderRadius: '7px',
                background: isSelected ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                color: isSelected ? '#ffffff' : '#475569',
                border: 'none',
                fontSize: '0.83rem',
                fontWeight: isSelected ? 700 : 600,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
                if (!isSelected) {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.color = '#1d4ed8';
                }
            }}
            onMouseLeave={e => {
                if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#475569';
                }
            }}
        >
            {Icon ? (
                <Icon size={13} style={{ color: isSelected ? '#ffffff' : '#2563eb' }} />
            ) : (
                <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSelected ? '#ffffff' : '#2563eb',
                    opacity: isSelected ? 1 : 0.7
                }} />
            )}
            <span>{label}</span>
        </button>
    );

    return (
        <aside style={{
            width: '265px',
            minWidth: '265px',
            background: '#ffffff',
            color: '#334155',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
            borderRight: '1px solid #e2e8f0',
            boxSizing: 'border-box',
            fontFamily: 'Inter, -apple-system, sans-serif',
            boxShadow: '1px 0 8px rgba(0,0,0,0.03)'
        }}>
            {/* Header Brand */}
            <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}>
                            <FiLayers />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.18rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                Job<span style={{ color: '#2563eb' }}>Connect</span>
                            </h2>
                            <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                Admin Console
                            </span>
                        </div>
                    </div>

                    {onClose && (
                        <button
                            onClick={onClose}
                            title="Close Navigation Panel"
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#64748b',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#fef2f2';
                                e.currentTarget.style.color = '#dc2626';
                                e.currentTarget.style.borderColor = '#fecaca';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.color = '#64748b';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <FiX size={17} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Menu List */}
            <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                
                {/* 1. Dashboard */}
                <NavLink 
                    to="/admin" 
                    end
                    style={({isActive}) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '11px',
                        padding: '10px 14px',
                        borderRadius: '9px',
                        textDecoration: 'none',
                        fontSize: '0.88rem',
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? '#ffffff' : '#334155',
                        background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                        boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                    })}
                >
                    <FiHome size={17} />
                    <span>Dashboard</span>
                </NavLink>

                {/* 2. Manage Jobs */}
                <div>
                    <button
                        onClick={() => toggleMenu('jobs')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: (location.pathname.includes('/admin/jobs') || location.pathname.includes('/admin/approvals')) ? '#eff6ff' : 'transparent',
                            color: (location.pathname.includes('/admin/jobs') || location.pathname.includes('/admin/approvals')) ? '#1d4ed8' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <FiBriefcase size={17} color={(location.pathname.includes('/admin/jobs') || location.pathname.includes('/admin/approvals')) ? '#2563eb' : '#64748b'} />
                            <span>Manage Jobs</span>
                        </div>
                        {openMenus.jobs ? <FiChevronUp size={15} color="#2563eb" /> : <FiChevronDown size={15} color="#64748b" />}
                    </button>

                    {openMenus.jobs && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            padding: '6px 8px',
                            margin: '3px 0 5px 12px',
                            borderLeft: '2px solid #bfdbfe',
                            background: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            {[
                                { label: 'Active Jobs', status: 'active' },
                                { label: 'Pending Jobs', status: 'pending' },
                                { label: 'Approved Jobs', status: 'approved' },
                                { label: 'Expired Jobs', status: 'expired' },
                                { label: 'Rejected Jobs', status: 'rejected' },
                                { label: 'All Jobs', status: 'all' }
                            ].map(sub => {
                                const isSelected = location.pathname === '/admin/jobs' && (jobStatusParam === sub.status || (!jobStatusParam && sub.status === 'active'));
                                return renderSubItem(sub.label, isSelected, () => navigate(`/admin/jobs?status=${sub.status}`));
                            })}
                        </div>
                    )}
                </div>

                {/* 3. Manage Users */}
                <div>
                    <button
                        onClick={() => toggleMenu('users')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: location.pathname.includes('/admin/users') ? '#eff6ff' : 'transparent',
                            color: location.pathname.includes('/admin/users') ? '#1d4ed8' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <FiUsers size={17} color={location.pathname.includes('/admin/users') ? '#2563eb' : '#64748b'} />
                            <span>Manage Users</span>
                        </div>
                        {openMenus.users ? <FiChevronUp size={15} color="#2563eb" /> : <FiChevronDown size={15} color="#64748b" />}
                    </button>

                    {openMenus.users && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            padding: '6px 8px',
                            margin: '3px 0 5px 12px',
                            borderLeft: '2px solid #bfdbfe',
                            background: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            {[
                                { label: 'Active Users', filter: 'active' },
                                { label: 'Banned Users', filter: 'banned' },
                                { label: 'Email Unverified', filter: 'email_unverified' },
                                { label: 'Mobile Unverified', filter: 'mobile_unverified' },
                                { label: 'All Users', filter: 'all' },
                                { label: 'Send Notification', action: 'send_notification', isAction: true }
                            ].map(sub => {
                                let isSelected = false;
                                if (sub.isAction) {
                                    isSelected = location.pathname === '/admin/users' && userActionParam === 'send_notification';
                                } else {
                                    isSelected = location.pathname === '/admin/users' && !userActionParam && (userFilterParam === sub.filter || (!userFilterParam && sub.filter === 'all'));
                                }
                                return renderSubItem(
                                    sub.label,
                                    isSelected,
                                    () => {
                                        if (sub.isAction) {
                                            navigate('/admin/users?action=send_notification');
                                        } else {
                                            navigate(`/admin/users?filter=${sub.filter}`);
                                        }
                                    },
                                    sub.isAction ? FiSend : null
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 4. Manage Employers */}
                <div>
                    <button
                        onClick={() => toggleMenu('employers')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: location.pathname.includes('/admin/companies') ? '#eff6ff' : 'transparent',
                            color: location.pathname.includes('/admin/companies') ? '#1d4ed8' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <FiBriefcase size={17} color={location.pathname.includes('/admin/companies') ? '#2563eb' : '#64748b'} />
                            <span>Manage Employers</span>
                        </div>
                        {openMenus.employers ? <FiChevronUp size={15} color="#2563eb" /> : <FiChevronDown size={15} color="#64748b" />}
                    </button>

                    {openMenus.employers && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            padding: '6px 8px',
                            margin: '3px 0 5px 12px',
                            borderLeft: '2px solid #bfdbfe',
                            background: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            {[
                                { label: 'Active Employers', filter: 'active' },
                                { label: 'Banned Employers', filter: 'banned' },
                                { label: 'Email Unverified', filter: 'email_unverified' },
                                { label: 'Mobile Unverified', filter: 'mobile_unverified' },
                                { label: 'With Balance', filter: 'with_balance' },
                                { label: 'All Employers', filter: 'all' },
                                { label: 'Send Notification', action: 'send_notification', isAction: true }
                            ].map(sub => {
                                let isSelected = false;
                                if (sub.isAction) {
                                    isSelected = location.pathname === '/admin/companies' && employerActionParam === 'send_notification';
                                } else {
                                    isSelected = location.pathname === '/admin/companies' && !employerActionParam && (employerFilterParam === sub.filter || (!employerFilterParam && sub.filter === 'all'));
                                }
                                return renderSubItem(
                                    sub.label,
                                    isSelected,
                                    () => {
                                        if (sub.isAction) {
                                            navigate('/admin/companies?action=send_notification');
                                        } else {
                                            navigate(`/admin/companies?filter=${sub.filter}`);
                                        }
                                    },
                                    sub.isAction ? FiSend : null
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 5. Payments */}
                <div>
                    <button
                        onClick={() => toggleMenu('payments')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: location.pathname.includes('/admin/payments') ? '#eff6ff' : 'transparent',
                            color: location.pathname.includes('/admin/payments') ? '#1d4ed8' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <FiDollarSign size={17} color={location.pathname.includes('/admin/payments') ? '#2563eb' : '#64748b'} />
                            <span>Payments</span>
                        </div>
                        {openMenus.payments ? <FiChevronUp size={15} color="#2563eb" /> : <FiChevronDown size={15} color="#64748b" />}
                    </button>

                    {openMenus.payments && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            padding: '6px 8px',
                            margin: '3px 0 5px 12px',
                            borderLeft: '2px solid #bfdbfe',
                            background: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            {[
                                { label: 'All Payments', status: 'all' },
                                { label: 'Pending Payments', status: 'pending' },
                                { label: 'Approved Payment', status: 'approved' },
                                { label: 'Successful Payment', status: 'successful' },
                                { label: 'Rejected Payment', status: 'rejected' },
                                { label: 'Initial Payment', status: 'initiated' }
                            ].map(sub => {
                                const isSelected = location.pathname === '/admin/payments' && (paymentStatusParam === sub.status || (!paymentStatusParam && sub.status === 'all'));
                                return renderSubItem(sub.label, isSelected, () => navigate(`/admin/payments?status=${sub.status}`));
                            })}
                        </div>
                    )}
                </div>

                {/* 6. Premium Plans */}
                <div>
                    <button
                        onClick={() => toggleMenu('premium')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: location.pathname.includes('/admin/premium-plans') ? '#eff6ff' : 'transparent',
                            color: location.pathname.includes('/admin/premium-plans') ? '#1d4ed8' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <FiStar size={17} color={location.pathname.includes('/admin/premium-plans') ? '#2563eb' : '#64748b'} />
                            <span>Premium Plans</span>
                        </div>
                        {openMenus.premium ? <FiChevronUp size={15} color="#2563eb" /> : <FiChevronDown size={15} color="#64748b" />}
                    </button>

                    {openMenus.premium && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            padding: '6px 8px',
                            margin: '3px 0 5px 12px',
                            borderLeft: '2px solid #bfdbfe',
                            background: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            {[
                                { label: 'Employer Plans', tab: 'employer_plans' },
                                { label: 'Candidate Plans', tab: 'candidate_plans' },
                                { label: 'Company-Specific Plans', tab: 'company_plans' },
                                { label: 'Enterprise High-Volume', tab: 'enterprise_plans' },
                                { label: 'Premium Subscribers', tab: 'subscriptions' },
                                { label: 'Custom Data Requests', tab: 'data_requests' },
                                { label: 'Plan Analytics', tab: 'analytics' },
                                { label: 'Audit Logs', tab: 'audit_logs' },
                            ].map(sub => {
                                const active = location.pathname === '/admin/premium-plans' && (location.search.includes(`tab=${sub.tab}`) || (!location.search && sub.tab === 'employer_plans'));
                                return renderSubItem(sub.label, active, () => navigate(`/admin/premium-plans?tab=${sub.tab}`));
                            })}
                        </div>
                    )}
                </div>

                {/* 7. Reports */}
                <div>
                    <button
                        onClick={() => toggleMenu('reports')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: location.pathname.includes('/admin/reports') ? '#eff6ff' : 'transparent',
                            color: location.pathname.includes('/admin/reports') ? '#1d4ed8' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <FiFileText size={17} color={location.pathname.includes('/admin/reports') ? '#2563eb' : '#64748b'} />
                            <span>Reports</span>
                        </div>
                        {openMenus.reports ? <FiChevronUp size={15} color="#2563eb" /> : <FiChevronDown size={15} color="#64748b" />}
                    </button>

                    {openMenus.reports && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            padding: '6px 8px',
                            margin: '3px 0 5px 12px',
                            borderLeft: '2px solid #bfdbfe',
                            background: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            {[
                                { label: 'Transaction History', tab: 'transactions', icon: FiCreditCard },
                                { label: 'Login History', tab: 'logins', icon: FiActivity },
                                { label: 'Notification History', tab: 'notifications', icon: FiBell }
                            ].map(sub => {
                                const isSelected = location.pathname === '/admin/reports' && (reportTabParam === sub.tab || (!reportTabParam && sub.tab === 'transactions'));
                                return renderSubItem(sub.label, isSelected, () => navigate(`/admin/reports?tab=${sub.tab}`), sub.icon);
                            })}
                        </div>
                    )}
                </div>

                {/* 8. Notifications */}
                <div>
                    <button
                        onClick={() => toggleMenu('notifications')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: location.pathname.includes('/admin/notifications') ? '#eff6ff' : 'transparent',
                            color: location.pathname.includes('/admin/notifications') ? '#1d4ed8' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <FiBell size={17} color={location.pathname.includes('/admin/notifications') ? '#2563eb' : '#64748b'} />
                            <span>Notifications</span>
                        </div>
                        {openMenus.notifications ? <FiChevronUp size={15} color="#2563eb" /> : <FiChevronDown size={15} color="#64748b" />}
                    </button>

                    {openMenus.notifications && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            padding: '6px 8px',
                            margin: '3px 0 5px 12px',
                            borderLeft: '2px solid #bfdbfe',
                            background: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            {[
                                { label: 'All Notifications', tab: 'all', icon: FiBell },
                                { label: 'Candidate Alerts', tab: 'candidates', icon: FiUsers },
                                { label: 'Employer Alerts', tab: 'employers', icon: FiBriefcase },
                                { label: 'System Notices', tab: 'announcements', icon: FiShield }
                            ].map(sub => {
                                const isSelected = location.pathname === '/admin/notifications' && (notifTabParam === sub.tab || (!notifTabParam && sub.tab === 'all'));
                                return renderSubItem(sub.label, isSelected, () => navigate(`/admin/notifications?tab=${sub.tab}`), sub.icon);
                            })}
                        </div>
                    )}
                </div>

                {/* 9. System Settings (19 Options) */}
                <div>
                    <button
                        onClick={() => toggleMenu('settings')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '9px',
                            background: location.pathname.includes('/admin/settings') ? '#eff6ff' : 'transparent',
                            color: location.pathname.includes('/admin/settings') ? '#1d4ed8' : '#334155',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                            <FiSettings size={17} color={location.pathname.includes('/admin/settings') ? '#2563eb' : '#64748b'} />
                            <span>System Settings</span>
                        </div>
                        {openMenus.settings ? <FiChevronUp size={15} color="#2563eb" /> : <FiChevronDown size={15} color="#64748b" />}
                    </button>

                    {openMenus.settings && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            padding: '6px 8px',
                            margin: '3px 0 5px 12px',
                            borderLeft: '2px solid #bfdbfe',
                            background: '#f8fafc',
                            borderRadius: '8px'
                        }}>
                            {[
                                { label: '1. General Setting', tab: 'general' },
                                { label: '2. Profile Update', tab: 'profile_update' },
                                { label: '3. Logo & Favicon', tab: 'logo_favicon' },
                                { label: '4. System Config', tab: 'system_config' },
                                { label: '5. Notification Setting', tab: 'notifications' },
                                { label: '6. Payment Gateways', tab: 'payment_gateways' },
                                { label: '7. SEO Configuration', tab: 'seo_config' },
                                { label: '8. Manage Frontend', tab: 'frontend' },
                                { label: '9. Manage Pages', tab: 'pages' },
                                { label: '10. Social Login', tab: 'social_login' },
                                { label: '11. Language', tab: 'language' },
                                { label: '12. Extensions', tab: 'extensions' },
                                { label: '13. Cron Job Setting', tab: 'cron_jobs' },
                                { label: '14. Policy Pages', tab: 'policy_pages' },
                                { label: '15. Maintenance Mode', tab: 'maintenance_mode' },
                                { label: '16. GDPR Cookie', tab: 'gdpr_cookie' },
                                { label: '17. Custom CSS', tab: 'custom_css' },
                                { label: '18. Sitemap XML', tab: 'sitemap_xml' },
                                { label: '19. Robots txt', tab: 'robots_txt' },
                                { label: '20. Geo-Tag Location', tab: 'geotag_location' }
                            ].map(sub => {
                                const isSelected = location.pathname === '/admin/settings' && (settingsTabParam === sub.tab || (!settingsTabParam && sub.tab === 'general'));
                                return renderSubItem(sub.label, isSelected, () => navigate(`/admin/settings?tab=${sub.tab}`));
                            })}
                        </div>
                    )}
                </div>

            </nav>

            {/* Logout footer */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9' }}>
                <button 
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        fontSize: '0.83rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#fef2f2';
                        e.currentTarget.style.color = '#dc2626';
                        e.currentTarget.style.borderColor = '#fecaca';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.color = '#64748b';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                >
                    <FiLogOut size={14} /> Sign Out
                </button>
            </div>
        </aside>
    );
}
