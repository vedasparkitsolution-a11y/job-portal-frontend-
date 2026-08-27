import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiBriefcase, FiShield, FiArrowRight, FiLogIn, FiSearch, FiZap } from 'react-icons/fi';

export default function DashboardSelection() {
    const { currentUser, userData, userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser && userRole) {
            if (userRole === 'admin') navigate('/admin');
            else if (userRole === 'company') navigate('/company');
            else if (userRole === 'jobseeker') navigate('/jobseeker');
        }
    }, [currentUser, userRole, navigate]);

    const isAdmin = userRole === 'admin';
    const isLoggedIn = !!currentUser;
    const userName = userData?.name || userData?.companyName || userData?.hrName || 'User';

    const item = {
        hidden: { opacity: 0, y: 40, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: 'easeOut' } }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 20px',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #0ea5e915 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #0ea5e910 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* ── TOP QUICK ACTION BUTTONS ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}
            >
                <Link to="/jobs" style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 22px', borderRadius: '50px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    color: '#475569', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                }}
                >
                    <FiSearch /> Browse Jobs
                </Link>
                {!isLoggedIn && (
                    <Link to="/login" style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 22px', borderRadius: '50px',
                        background: '#0ea5e9',
                        border: 'none', color: 'white', textDecoration: 'none',
                        fontSize: '0.88rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    >
                        <FiLogIn /> Sign In
                    </Link>
                )}
            </motion.div>

            {/* ── HEADER ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center', marginBottom: '56px' }}
            >
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#0f172a',
                    margin: '0 0 12px', letterSpacing: '-0.5px'
                }}>
                    {isLoggedIn ? `Welcome, ${userName} 👋` : 'Choose Your Dashboard 👋'}
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>
                    Select your portal to continue your recruitment journey
                </p>
            </motion.div>

            {/* ── DASHBOARD CARDS ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
                gap: '32px',
                width: '100%',
                maxWidth: isAdmin ? '1100px' : '800px',
                marginBottom: '60px'
            }}>
                {/* ── CANDIDATE CARD ── */}
                <motion.div variants={item} initial="hidden" animate="visible">
                    <Link to={isLoggedIn ? '/jobseeker' : '/login'} style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            border: '1px solid #f1f5f9',
                            height: '100%'
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(14, 165, 233, 0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)'; }}
                        >
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: '#f0f9ff', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', color: '#0ea5e9'
                            }}>
                                <FiUser />
                            </div>

                            <div>
                                <h2 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700 }}>
                                    Candidate
                                </h2>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    Apply for jobs, manage your resume, and track your applications.
                                </p>
                            </div>

                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: '#f8fafc', borderRadius: '12px',
                                padding: '12px 16px', marginTop: 'auto'
                            }}>
                                <span style={{ color: '#0ea5e9', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Enter Dashboard
                                </span>
                                <FiArrowRight color="#0ea5e9" />
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* ── EMPLOYER CARD ── */}
                <motion.div variants={item} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
                    <Link to={isLoggedIn ? '/company' : '/login'} style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            border: '1px solid #f1f5f9',
                            height: '100%'
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(14, 165, 233, 0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)'; }}
                        >
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: '#f0f9ff', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', color: '#0ea5e9'
                            }}>
                                <FiBriefcase />
                            </div>

                            <div>
                                <h2 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700 }}>
                                    Employer
                                </h2>
                                <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    Post vacancies, manage candidates, and hire top talent.
                                </p>
                            </div>

                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: '#f8fafc', borderRadius: '12px',
                                padding: '12px 16px', marginTop: 'auto'
                            }}>
                                <span style={{ color: '#0ea5e9', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Enter Dashboard
                                </span>
                                <FiArrowRight color="#0ea5e9" />
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* ── ADMIN CARD (Visible only to Admin) ── */}
                {isAdmin && (
                    <motion.div variants={item} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                        <Link to="/admin" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#f0f9ff',
                                borderRadius: '24px',
                                padding: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                boxShadow: '0 10px 30px rgba(14, 165, 233, 0.1)',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                border: '2px solid #bae6fd',
                                height: '100%'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = '#0ea5e9'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#bae6fd'; }}
                            >
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    background: '#0ea5e9', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem', color: 'white'
                                }}>
                                    <FiShield />
                                </div>

                                <div>
                                    <h2 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800 }}>
                                        Admin Panel
                                    </h2>
                                    <p style={{ color: '#475569', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                                        System management, user verification, and platform oversight.
                                    </p>
                                </div>

                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: 'white', borderRadius: '12px',
                                    padding: '12px 16px', marginTop: 'auto'
                                }}>
                                    <span style={{ color: '#0ea5e9', fontWeight: 800, fontSize: '0.9rem' }}>
                                        Control Center
                                    </span>
                                    <FiArrowRight color="#0ea5e9" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* ── BOTTOM ACTION BUTTONS ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}
            >
                <Link to="/register/jobseeker" style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '14px 32px', borderRadius: '14px',
                    background: '#0ea5e9',
                    color: 'white', textDecoration: 'none', fontWeight: 700,
                    fontSize: '1rem', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                    transition: 'all 0.25s'
                }}>
                    Join as Candidate
                </Link>

                <Link to="/register/company" style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '14px 32px', borderRadius: '14px',
                    background: 'white',
                    color: '#0ea5e9', textDecoration: 'none', fontWeight: 700,
                    fontSize: '1rem', border: '2px solid #0ea5e9',
                    transition: 'all 0.25s'
                }}>
                    Post a Job
                </Link>
            </motion.div>
        </div>
    );
}
