import { useState } from 'react';
import { FiLogOut, FiMenu, FiSettings, FiUser, FiMoreVertical, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import NotificationsPanel from './NotificationsPanel';

export default function CompanyHeader({ toggleSidebar, isSidebarOpen }) {
    const { userData, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header style={{
            height: '72px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button 
                    onClick={toggleSidebar}
                    title={isSidebarOpen ? 'Collapse Navigation' : 'Open Navigation'}
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
                        e.currentTarget.style.background = '#ede9fe';
                        e.currentTarget.style.borderColor = '#c4b5fd';
                        e.currentTarget.style.color = '#7c3aed';
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <NotificationsPanel companyId={userData?.uid} />
                
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
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '1rem', overflow: 'hidden', border: '1px solid #ddd6fe'
                        }}>
                            {userData?.logoURL || userData?.companyLogo ? (
                                <img src={userData.logoURL || userData.companyLogo} alt={userData?.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                userData?.companyName?.charAt(0)?.toUpperCase() || 'C'
                            )}
                        </div>
                        <div style={{ textAlign: 'left' }} className="d-none d-sm-block">
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{userData?.companyName || 'Company'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{userData?.contactPersonName || userData?.hrName || 'Employer'}</div>
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
                                <Link to="/company/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', color: '#475569', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <FiUser /> Profile
                                </Link>
                                <Link to="/company/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', color: '#475569', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
    );
}

