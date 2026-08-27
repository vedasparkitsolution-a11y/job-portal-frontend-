import { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    FiGrid, FiUser, FiUpload, FiMessageSquare, FiBell,
    FiBookmark, FiSettings, FiLogOut, FiCheckCircle, FiSearch, 
    FiZap, FiCheckSquare, FiCalendar, FiStar, FiX, FiMoreVertical, FiBriefcase
} from 'react-icons/fi';

export default function CandidateSidebar({ children }) {
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    async function handleLogout() {
        await logout();
        navigate('/');
    }

    const menuItems = [
        { to: '/jobseeker', icon: <FiGrid />, label: 'Dashboard', end: true },
        { to: '/jobseeker/subscriptions', icon: <FiStar style={{ color: '#f59e0b' }} />, label: 'Subscription Plans' },
        { to: '/jobseeker/profile', icon: <FiUser />, label: 'My Profile' },
        { to: '/jobs', icon: <FiSearch />, label: 'Browse Jobs' },
        { to: '/jobseeker/recommended-jobs', icon: <FiZap />, label: 'Recommended Jobs' },
        { to: '/jobseeker/saved-jobs', icon: <FiBookmark />, label: 'Saved Jobs' },
        { to: '/jobseeker/applications', icon: <FiCheckCircle />, label: 'Applied Jobs' },
        { to: '/jobseeker/shortlisted', icon: <FiCheckSquare />, label: 'Shortlisted Jobs' },
        { to: '/jobseeker/interviews', icon: <FiCalendar />, label: 'Interviews' },
        { to: '/jobseeker/messages', icon: <FiMessageSquare />, label: 'Messages' },
        { to: '/jobseeker/job-alerts', icon: <FiBell />, label: 'Notifications' },
        { to: '/jobseeker/resume', icon: <FiUpload />, label: 'Resume' },
        { to: '/jobseeker/settings', icon: <FiSettings />, label: 'Account Settings' },
    ];

    return (
        <div className="candidate-layout">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div 
                    className="dashboard-backdrop d-lg-none" 
                    onClick={() => setSidebarOpen(false)}
                    style={{ display: 'none' }}
                />
            )}

            {/* ── WHITE & SKYBLUE SIDEBAR ── */}
            <div className={`candidate-sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
                <aside className="candidate-sidebar" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
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
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                Job<span style={{ color: '#0ea5e9' }}>Connect</span>
                            </h2>
                            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Candidate Portal
                            </p>
                        </div>

                        {/* Close X Button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
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
                    </div>

                    {/* Navigation Menu */}
                    <nav className="sidebar-nav" style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
                        {menuItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Sidebar Bottom Buttons */}
                    <div style={{ padding: '16px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                        <button
                            onClick={() => navigate('/jobs')}
                            style={{
                                width: '100%',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                color: '#0f172a',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                        >
                            <FiSearch size={16} /> Browse Jobs
                        </button>
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
                                gap: '10px',
                                padding: '10px 14px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                borderRadius: '10px',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <FiLogOut size={16} /> Logout
                        </button>
                    </div>
                </aside>
            </div>

            {/* Main Content Area */}
            <div className="candidate-main">
                {/* Candidate Topbar with Three-Dot Button and Clickable JobConnect Logo (72px) */}
                <header className="candidate-topbar" style={{ height: '72px', padding: '0 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button 
                            onClick={() => setSidebarOpen(prev => !prev)}
                            title={sidebarOpen ? 'Collapse Navigation' : 'Open Navigation'}
                            style={{
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#475569',
                                transition: 'all 0.2s',
                                fontSize: '1.15rem'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#e0f2fe';
                                e.currentTarget.style.borderColor = '#bae6fd';
                                e.currentTarget.style.color = '#0284c7';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.color = '#475569';
                            }}
                        >
                            <FiMoreVertical />
                        </button>
                        <Link 
                            to="/" 
                            title="Go to JobConnect Home"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                fontSize: '1.3rem', 
                                fontWeight: 800, 
                                color: '#0f172a', 
                                textDecoration: 'none',
                                letterSpacing: '-0.02em',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            <FiBriefcase style={{ color: '#0ea5e9', fontSize: '1.5rem' }} />
                            <span>Job<span style={{ color: '#0ea5e9' }}>Connect</span></span>
                        </Link>
                    </div>

                    {/* Candidate User Profile Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Link 
                            to="/jobs" 
                            style={{
                                textDecoration: 'none',
                                color: '#0ea5e9',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            className="d-none d-sm-flex"
                        >
                            <FiSearch /> Browse Jobs
                        </Link>

                        <div style={{ position: 'relative' }} onMouseLeave={() => setDropdownOpen(false)}>
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                onMouseEnter={() => setDropdownOpen(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: '#f8fafc', border: '1px solid #e2e8f0',
                                    padding: '6px 12px', borderRadius: '12px', cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '0.95rem'
                                }}>
                                    {userData?.name ? userData.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div style={{ textAlign: 'left' }} className="d-none d-sm-block">
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                                        {userData?.name || 'Candidate'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#0ea5e9', fontWeight: 700 }}>
                                        Job Seeker
                                    </div>
                                </div>
                            </button>

                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, paddingTop: '8px', zIndex: 1000
                                }}>
                                    <div style={{
                                        width: '180px', background: 'white', borderRadius: '12px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
                                        padding: '8px'
                                    }}>
                                        <Link to="/jobseeker/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', color: '#475569', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <FiUser /> Profile
                                        </Link>
                                        <Link to="/jobseeker/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', color: '#475569', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <FiSettings /> Settings
                                        </Link>
                                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                                        <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <FiLogOut /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="candidate-content" style={{ padding: '28px 36px', overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
