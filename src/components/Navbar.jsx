import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { FiBriefcase, FiMenu, FiX, FiUser, FiLogOut, FiGrid, FiChevronDown, FiCheckCircle, FiShield, FiBookmark, FiSettings, FiFileText } from 'react-icons/fi';

import EmployerLoginModal from './company/EmployerLoginModal';
import CandidateAuthModal from './jobseeker/CandidateAuthModal';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
    const { currentUser, userRole, userData, logout } = useAuth();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [isEmployerModalOpen, setIsEmployerModalOpen] = useState(false);
    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isCandidateActive = userRole === 'jobseeker' || location.search.includes('role=jobseeker') || location.pathname.startsWith('/jobseeker');
    const isEmployerActive = userRole === 'company' || location.search.includes('role=company') || location.pathname.startsWith('/company');

    // Calculate candidate profile strength dynamically
    const computeProfileStrength = () => {
        if (!userData) return 0;
        let score = 0;
        if (userData?.name && (userData?.phone || userData?.mobile_number)) score += 20;
        else if (userData?.name || userData?.phone) score += 10;
        
        if (userData?.education?.length > 0 || userData?.department || userData?.college) score += 20;
        if (userData?.skills) score += 15;
        if (userData?.preferences?.preferredLocation || userData?.city || userData?.address) score += 10;
        if (userData?.internships?.length > 0 || userData?.projects?.length > 0 || userData?.total_experience) score += 15;
        if (userData?.resumeURL || userData?.resume_url) score += 10;
        if (userData?.languages?.length > 0) score += 5;
        if (userData?.summaryText || userData?.professional_headline) score += 5;

        return Math.min(100, score > 0 ? score : (userData.profile_completion_percentage || 10));
    };
    const profileStrength = computeProfileStrength();

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const activeBtnStyle = {
        background: '#0ea5e9', color: 'white', textDecoration: 'none',
        padding: '8px 20px', borderRadius: '10px', fontWeight: 700,
        fontSize: '0.92rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)',
        transition: 'all 0.2s', border: '2px solid #0ea5e9', display: 'inline-flex', alignItems: 'center', gap: '6px'
    };
    
    const inactiveBtnStyle = {
        color: '#0ea5e9', fontWeight: 700, textDecoration: 'none', background: 'transparent',
        fontSize: '0.92rem', padding: '8px 20px', borderRadius: '10px',
        border: '2px solid #0ea5e9', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px'
    };

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isAdmin = userRole === 'admin';
    const isCandidate = currentUser && (userRole === 'jobseeker' || userRole === 'candidate');
    const isEmployer = currentUser && (userRole === 'company' || userRole === 'employer');

    async function handleLogout() {
        setProfileDropdownOpen(false);
        await logout();
        navigate('/');
    }

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: scrolled ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
            backdropFilter: scrolled ? 'blur(10px)' : 'none',
            borderBottom: '1px solid #e2e8f0',
            height: '72px', display: 'flex', alignItems: 'center',
            transition: 'all 0.3s ease'
        }}>
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', textDecoration: 'none' }}>
                    <FiBriefcase style={{ color: '#0ea5e9', fontSize: '1.8rem' }} />
                    <span>Job<span style={{ color: '#0ea5e9' }}>Connect</span></span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Multi-Language Switcher (English / Tamil / Hindi) */}
                    <LanguageSwitcher compact={true} />

                    <div className="d-none d-lg-flex" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        
                        {/* 1. CANDIDATE BUTTON */}
                        {isCandidate ? (
                            <Link to="/jobseeker" style={isCandidateActive ? activeBtnStyle : inactiveBtnStyle}>
                                {t('nav.candidateLogin', 'Candidate Login')}
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsCandidateModalOpen(true)}
                                style={{ ...activeBtnStyle, cursor: 'pointer' }}
                            >
                                {t('nav.candidateLogin', 'Candidate Login')}
                            </button>
                        )}

                        {/* 2. EMPLOYER BUTTON */}
                        {isEmployer ? (
                            <Link to="/company" style={isEmployerActive ? activeBtnStyle : inactiveBtnStyle}>
                                {t('nav.employerLogin', 'Employer Login')}
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsEmployerModalOpen(true)}
                                style={{ ...inactiveBtnStyle, cursor: 'pointer' }}
                            >
                                {t('nav.employerLogin', 'Employer Login')}
                            </button>
                        )}

                        {/* 3. ADMIN BUTTON */}
                        {isAdmin && (
                            <Link to="/admin" style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 18px', borderRadius: '10px',
                                background: '#fef3c7', color: '#d97706',
                                textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem'
                            }}>
                                <FiShield /> {t('nav.adminPortal', 'Admin')}
                            </Link>
                        )}
                    </div>

                    {/* CANDIDATE PROFILE ICON - ONLY WHEN CANDIDATE IS LOGGED IN */}
                    {isCandidate && (
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: profileDropdownOpen ? '#f0f9ff' : '#f8fafc',
                                    border: '1.5px solid #38bdf8',
                                    padding: '5px 12px 5px 6px',
                                    borderRadius: '30px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: profileDropdownOpen ? '0 0 0 3px rgba(14, 165, 233, 0.2)' : 'none'
                                }}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                    color: 'white', fontWeight: 800, fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', border: '2px solid #ffffff',
                                    boxShadow: '0 2px 6px rgba(14, 165, 233, 0.3)'
                                }}>
                                    {userData?.profilePictureURL ? (
                                        <img src={userData.profilePictureURL} alt="User Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        (userData?.name || currentUser?.email || 'U').charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
                                        {userData?.name ? (userData.name.length > 12 ? userData.name.substring(0, 12) + '...' : userData.name) : 'My Profile'}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <FiCheckCircle size={10} /> Profile {profileStrength}%
                                    </span>
                                </div>
                                <FiChevronDown style={{ color: '#64748b', fontSize: '1rem', transform: profileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>

                            {/* DROPDOWN MENU */}
                            {profileDropdownOpen && (
                                <div style={{
                                    position: 'absolute', top: '50px', right: 0,
                                    width: '280px', background: '#ffffff', borderRadius: '16px',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid #e2e8f0', padding: '16px', zIndex: 1100,
                                    animation: 'fadeIn 0.2s ease'
                                }}>
                                    {/* Header user overview */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                            color: 'white', fontWeight: 800, fontSize: '1.2rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                        }}>
                                            {userData?.profilePictureURL ? (
                                                <img src={userData.profilePictureURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                (userData?.name || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {userData?.name || 'Candidate'}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {userData?.email || currentUser?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Profile Strength Progress Bar */}
                                    <div style={{ margin: '12px 0', padding: '10px 12px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                            <span style={{ color: '#0ea5e9' }}>Profile Completion</span>
                                            <span style={{ color: '#0284c7' }}>{profileStrength}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#e0f2fe', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${profileStrength}%`, height: '100%', background: '#0ea5e9', borderRadius: '10px', transition: 'width 0.5s' }} />
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <Link 
                                            to="/jobseeker/profile" 
                                            onClick={() => setProfileDropdownOpen(false)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', borderRadius: '8px',
                                                color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                                                background: location.pathname === '/jobseeker/profile' ? '#f1f5f9' : 'transparent',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = location.pathname === '/jobseeker/profile' ? '#f1f5f9' : 'transparent'}
                                        >
                                            <FiUser style={{ color: '#0ea5e9' }} /> View & Edit Profile
                                        </Link>
                                        <Link 
                                            to="/jobseeker/applications" 
                                            onClick={() => setProfileDropdownOpen(false)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', borderRadius: '8px',
                                                color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FiFileText style={{ color: '#64748b' }} /> My Applications
                                        </Link>
                                        <Link 
                                            to="/jobseeker/saved-jobs" 
                                            onClick={() => setProfileDropdownOpen(false)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', borderRadius: '8px',
                                                color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FiBookmark style={{ color: '#64748b' }} /> Saved Jobs
                                        </Link>
                                        <Link 
                                            to="/jobseeker/settings" 
                                            onClick={() => setProfileDropdownOpen(false)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', borderRadius: '8px',
                                                color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FiSettings style={{ color: '#64748b' }} /> Account Settings
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 12px', borderRadius: '8px', border: 'none',
                                                color: '#ef4444', background: 'transparent', fontWeight: 600, fontSize: '0.9rem',
                                                cursor: 'pointer', marginTop: '6px', borderTop: '1px solid #f1f5f9',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <FiLogOut /> Log Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button className="d-lg-none" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#0f172a' }}>
                        {menuOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>
            
            {/* Mobile Menu */}
            {menuOpen && (
                <div style={{
                    position: 'absolute', top: '72px', left: 0, right: 0,
                    background: 'white', borderBottom: '1px solid #e2e8f0',
                    padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                    zIndex: 999, boxShadow: '0 10px 15px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                            {t('common.language', 'Language')}
                        </div>
                        <LanguageSwitcher compact={false} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                        {isCandidate && (
                            <Link 
                                to="/jobseeker/profile" 
                                onClick={() => setMenuOpen(false)} 
                                style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <FiUser /> {t('nav.profile', 'My Profile')} ({userData?.name || 'Candidate'})
                            </Link>
                        )}
                        <Link 
                            to={isCandidate ? '/jobseeker' : '#'} 
                            onClick={(e) => { 
                                setMenuOpen(false); 
                                if (!isCandidate) {
                                    e.preventDefault();
                                    setIsCandidateModalOpen(true);
                                }
                            }} 
                            style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}
                        >
                            {t('nav.candidateLogin', 'Candidate Login')}
                        </Link>
                        <Link 
                            to={isEmployer ? '/company' : '#'} 
                            onClick={(e) => { 
                                setMenuOpen(false); 
                                if (!isEmployer) {
                                    e.preventDefault();
                                    setIsEmployerModalOpen(true);
                                }
                            }} 
                            style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}
                        >
                            {t('nav.employerLogin', 'Employer Login')}
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ color: '#d97706', fontWeight: 700, textDecoration: 'none' }}>
                                <FiShield /> {t('nav.adminPortal', 'Admin Panel')}
                            </Link>
                        )}
                        {currentUser && (
                            <button onClick={handleLogout} style={{ color: '#ef4444', background: 'none', border: 'none', textAlign: 'left', padding: '8px 0', fontWeight: 700, cursor: 'pointer' }}>
                                {t('nav.logout', 'Log Out')}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <EmployerLoginModal isOpen={isEmployerModalOpen} onClose={() => setIsEmployerModalOpen(false)} />
            <CandidateAuthModal isOpen={isCandidateModalOpen} onClose={() => setIsCandidateModalOpen(false)} />
        </nav>
    );
}
