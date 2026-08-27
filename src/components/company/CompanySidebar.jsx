import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FiHome, FiPlusSquare, FiBriefcase, 
    FiUsers, FiMessageSquare, FiPieChart, 
    FiSettings, FiCalendar, FiUser, FiLogOut, FiPlus, FiCheckCircle, FiStar, FiCreditCard, FiZap, FiX
} from 'react-icons/fi';

export default function CompanySidebar({ onClose }) {
    const { logout, userData } = useAuth();
    const navigate = useNavigate();

    const navLinks = [
        { to: '/company', label: 'Dashboard', icon: <FiHome />, end: true },
        { to: '/company/subscriptions', label: 'Subscription Plans', icon: <FiStar style={{ color: '#f59e0b' }} /> },
        { to: '/company/profile', label: 'Company Profile', icon: <FiUser /> },
        { to: '/company/post-job', label: 'Post a Job', icon: <FiPlusSquare /> },
        { to: '/company/manage-jobs', label: 'Manage Jobs', icon: <FiBriefcase /> },
        { to: '/company/applicants', label: 'Applications', icon: <FiUsers /> },
        { to: '/company/candidate-matches', label: 'Shortlisted Candidates', icon: <FiCheckCircle /> },
        { to: '/company/interviews', label: 'Interviews', icon: <FiCalendar /> },
        { to: '/company/messages', label: 'Messages', icon: <FiMessageSquare /> },
        { to: '/company/assessments', label: 'Candidate Search', icon: <FiUsers /> },
        { to: '/company/payment-history', label: 'Payment History', icon: <FiCreditCard /> },
        { to: '/company/settings', label: 'Settings', icon: <FiSettings /> },
    ];

    async function handleLogout() {
        await logout();
        navigate('/');
    }

    return (
        <aside style={{
            width: '280px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
            boxSizing: 'border-box'
        }}>
            {/* Header Brand (72px aligned with Topbar) */}
            <div style={{
                height: '72px',
                padding: '0 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                boxSizing: 'border-box'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#1e293b', letterSpacing: '-0.02em' }}>
                        <span style={{ color: '#7c3aed' }}>Job</span>Connect
                    </h2>
                    <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Employer Portal
                    </p>
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

            {/* Scrollable Container for Actions & Navigation */}
            <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <button 
                        onClick={() => navigate('/company/post-job')}
                        style={{
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '11px',
                            color: 'white',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.88rem',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <FiPlus size={16} /> Post New Job
                    </button>

                    {/* Prominent Subscription Plans Button */}
                    <button 
                        onClick={() => navigate('/company/subscriptions')}
                        style={{
                            background: '#f5f3ff',
                            border: '1.5px solid #ddd6fe',
                            borderRadius: '10px',
                            padding: '10px',
                            color: '#7c3aed',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.88rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#ede9fe';
                            e.currentTarget.style.borderColor = '#c4b5fd';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#f5f3ff';
                            e.currentTarget.style.borderColor = '#ddd6fe';
                        }}
                    >
                        <FiZap style={{ color: '#f59e0b' }} /> Subscription Plans
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {navLinks.map(link => (
                        <NavLink 
                            key={link.to}
                            to={link.to} 
                            end={link.end}
                            style={({isActive}) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: isActive ? '#7c3aed' : '#64748b',
                                background: isActive ? '#f5f3ff' : 'transparent',
                                transition: 'all 0.2s'
                            })}
                        >
                            <span style={{ fontSize: '1.15rem' }}>{link.icon}</span>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                <button 
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '9px 12px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '10px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <FiLogOut /> Logout
                </button>
            </div>
        </aside>
    );
}
