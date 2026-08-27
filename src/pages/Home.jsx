import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiBriefcase, FiUsers, FiShield, FiTrendingUp, FiCheckCircle, FiMapPin, FiAward, FiStar, FiZap } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import EmployerLoginModal from '../components/company/EmployerLoginModal';
import CandidateAuthModal from '../components/jobseeker/CandidateAuthModal';

export default function Home() {
    const [jobTitle, setJobTitle] = useState('');
    const [location, setLocation] = useState('');
    const [isEmployerModalOpen, setIsEmployerModalOpen] = useState(false);
    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();
    const { t, language } = useLanguage();

    function handleSearch(e) {
        e.preventDefault();
        navigate(`/jobs?keyword=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}`);
    }

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: (i = 0) => ({
            opacity: 1, y: 0,
            transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
        })
    };

    return (
        <>
            {/* Hero Section */}
            <section className="hero">
                <div className="container hero-content">
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(14, 165, 233, 0.12)',
                        color: '#0284c7',
                        padding: '6px 16px',
                        borderRadius: '30px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        marginBottom: '16px'
                    }}>
                        <FiZap /> {t('home.heroTag', 'Connecting Talent with Opportunity')}
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        {t('home.heroTitle', 'Find Your')} <span className="gradient-text">{t('home.heroTitleHighlight', 'Dream Job')}</span><br />
                        {t('home.heroTitleEnd', 'Today')}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        {t('home.heroSubtitle', 'Search thousands of job listings from top companies around the world. Verified employers, instant matching, and dedicated career mentors.')}
                    </motion.p>

                    {/* Search Bar */}
                    <motion.form
                        className="hero-search"
                        onSubmit={handleSearch}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                    >
                        <div className="search-input-wrapper">
                            <FiBriefcase className="search-icon" />
                            <input
                                type="text"
                                placeholder={t('home.searchKeywordPlaceholder', 'Job title, keyword...')}
                                value={jobTitle}
                                onChange={e => setJobTitle(e.target.value)}
                            />
                        </div>
                        <div className="search-input-divider"></div>
                        <div className="search-input-wrapper">
                            <FiMapPin className="search-icon" />
                            <input
                                type="text"
                                placeholder={t('home.searchLocationPlaceholder', 'Location / City')}
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="search-btn">
                            <FiSearch /> {t('home.searchButton', 'Search')}
                        </button>
                    </motion.form>

                    {/* CTA Buttons */}
                    <motion.div
                        className="hero-cta-buttons"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                    >
                        <Link to="/jobs" className="btn btn-white btn-lg hero-cta-search">
                            <FiSearch /> {t('jobs.browseTitle', 'Search Your Desired Job')}
                        </Link>
                    </motion.div>

                    <motion.div
                        className="hero-stats"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.7 }}
                    >
                        <div className="hero-stat">
                            <div className="stat-number">500+</div>
                            <div className="stat-label">{t('home.statsJobs', 'Active Jobs')}</div>
                        </div>
                        <div className="hero-stat">
                            <div className="stat-number">200+</div>
                            <div className="stat-label">{t('home.statsCompanies', 'Top Companies')}</div>
                        </div>
                        <div className="hero-stat">
                            <div className="stat-number">10K+</div>
                            <div className="stat-label">{t('home.statsCandidates', 'Job Seekers')}</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <motion.div
                        className="section-title"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={fadeUp}
                    >
                        <h2>{t('home.whyChooseTitle', 'Why Choose JobConnect?')}</h2>
                        <p>{t('home.heroSubtitle', 'Everything you need to land your next opportunity or find the right hire.')}</p>
                    </motion.div>
                    <div className="features-grid">
                        {[
                            { icon: <FiSearch />, title: t('home.whyChoose1Title', 'Verified Employers Only'), desc: t('home.whyChoose1Desc', 'All companies are strictly vetted with approved access verification.') },
                            { icon: <FiShield />, title: t('home.whyChoose2Title', 'Instant Application Tracking'), desc: t('home.whyChoose2Desc', 'Track your hiring progress from review to offer in real time.') },
                            { icon: <FiUsers />, title: t('home.whyChoose3Title', '1-on-1 Certified Mentors'), desc: t('home.whyChoose3Desc', 'Get resume teardowns and interview coaching from senior leaders.') },
                            { icon: <FiBriefcase />, title: t('employer.workspaceTitle', 'Company Dashboard'), desc: t('candidate.findOpportunity', 'Manage job postings, review candidates, and download resumes all from one place.') },
                            { icon: <FiTrendingUp />, title: t('candidate.appliedJobs', 'Track Applications'), desc: t('candidate.quotaTitle', 'Keep track of all your job applications and their status in your personal dashboard.') },
                            { icon: <FiCheckCircle />, title: t('candidate.mentorDeskTitle', 'Career Mentors & Support'), desc: t('candidate.mentorDeskDesc', 'Book mock interview drills, live resume teardowns, and customized career roadmaps.') },
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                className="feature-card"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                custom={i}
                                variants={fadeUp}
                            >
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted Companies */}
            <section className="trusted-section">
                <div className="container">
                    <motion.p
                        style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        {t('home.featuredJobsSubtitle', 'Trusted by leading companies')}
                    </motion.p>
                    <div className="trusted-logos">
                        {['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro'].map(name => (
                            <span key={name}>{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                    >
                        {t('home.ctaTitle', 'Ready to Start Your Journey?')}
                    </motion.h2>
                    <motion.p
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        custom={1}
                        variants={fadeUp}
                    >
                        {t('home.ctaSubtitle', 'Join thousands of professionals who found their dream job on JobConnect')}
                    </motion.p>
                    <motion.div
                        style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        custom={2}
                        variants={fadeUp}
                    >
                        <button 
                            onClick={() => setIsCandidateModalOpen(true)} 
                            className="btn btn-white btn-lg"
                            style={{ cursor: 'pointer' }}
                        >
                            <FiUsers /> {t('home.ctaCandidateBtn', 'Sign Up as Job Seeker')}
                        </button>
                        <button 
                            onClick={() => setIsEmployerModalOpen(true)} 
                            className="btn btn-outline btn-lg" 
                            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                        >
                            <FiBriefcase /> {t('home.ctaEmployerBtn', 'Register Company')}
                        </button>
                    </motion.div>
                </div>
            </section>

            <EmployerLoginModal isOpen={isEmployerModalOpen} onClose={() => setIsEmployerModalOpen(false)} />
            <CandidateAuthModal isOpen={isCandidateModalOpen} onClose={() => setIsCandidateModalOpen(false)} />
        </>
    );
}
