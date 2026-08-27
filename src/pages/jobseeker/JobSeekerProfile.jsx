import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../services/userService';
import { uploadResume, uploadProfilePicture } from '../../services/storageService';
import CandidateSidebar from '../../components/CandidateSidebar';
import ProfileEditModal from '../../components/jobseeker/ProfileEditModal';
import {
    FiUser, FiMail, FiPhone, FiUpload, FiSave, FiEdit2, FiX, FiDownload, FiEye,
    FiMapPin, FiAward, FiBook, FiCode, FiCheckCircle, FiPlus, FiBriefcase,
    FiTrendingUp, FiFileText, FiGlobe, FiFolder, FiCheck, FiChevronRight, FiBarChart2
} from 'react-icons/fi';
import { parseResume } from '../../utils/resumeParser';

export default function JobSeekerProfile() {
    const { currentUser, userData, fetchUserData, refreshUserData } = useAuth();

    // Active tab: 'view_edit' or 'activity'
    const [activeTab, setActiveTab] = useState('view_edit');
    const [activeQuickLink, setActiveQuickLink] = useState('preference');

    // Modals
    const [modalConfig, setModalConfig] = useState({ isOpen: false, key: '', title: '', data: null });

    // Processing states
    const [loading, setLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [message, setMessage] = useState('');
    const [profilePicFile, setProfilePicFile] = useState(null);

    // Initial default seed profile data if fields are blank (matching user images)
    const profile = {
        name: userData?.name || 'DIVYABHARATHI R',
        department: userData?.department || 'B.Tech / B.E.',
        college: userData?.college || 'TJS Engineering college, Thiruvallur',
        address: userData?.address || 'Chennai',
        gender: userData?.gender || 'Female',
        dob: userData?.dob || '31st May 2005',
        phone: userData?.phone || '8148389347',
        email: userData?.email || currentUser?.email || 'rdivyabharathi2005@gmail.com',
        profilePictureURL: userData?.profilePictureURL || '',
        resumeURL: userData?.resumeURL || '',

        // Career Preferences
        preferences: userData?.preferences || {
            preferredJobType: 'Jobs, Internships',
            preferredLocation: 'Chennai',
            availability: 'Immediate (0-15 days)'
        },

        // Education Array
        education: userData?.education || [
            { id: 'edu_1', title: 'B.Tech / B.E.', institution: 'TJS Engineering college, Thiruvallur', year: 'Graduated in 2026, Full Time', grade: 'CGPA 8.4' },
            { id: 'edu_2', title: 'Class XII', institution: 'Tamil Nadu Board, English Medium', year: 'Passed out in 2022', grade: 'Scored 80%' },
            { id: 'edu_3', title: 'Class X', institution: 'Tamil Nadu Board, English Medium', year: 'Passed out in 2020', grade: 'Scored 75%' }
        ],

        // Key Skills
        skills: userData?.skills || 'Computer Engineer, React.js, JavaScript, HTML5, CSS3, Python, Data Structures',

        // Languages
        languages: userData?.languages || [
            { id: 'lang_1', language: 'English', proficiency: 'Can speak, read and write' },
            { id: 'lang_2', language: 'Tamil', proficiency: 'Can speak, read and write (Native)' }
        ],

        // Internships
        internships: userData?.internships || [
            { id: 'intern_1', company: 'Hams Technologies Pvt Ltd', role: 'Software Intern', duration: 'Dec\'25 to Mar\'26', description: 'Worked on front-end features, API integration, and user interface enhancements.' }
        ],

        // Projects
        projects: userData?.projects || [
            { id: 'proj_1', title: 'Job Portal Office Web Application', description: 'Built an interactive recruitment portal with candidate profiles, company dashboard, and career analysis tools.', link: 'https://github.com' }
        ],

        // Summary
        summaryText: userData?.summaryText || 'To work in an environment which encourage me to succeed and grow professionally where I can utilise my skills and knowledge appropriately. I consider my self a responsible and orderly person looking for my first work experience.',

        // Accomplishments
        accomplishments: userData?.accomplishments || [
            { id: 'acc_1', title: 'Full Stack Web Development Certification', issuer: 'NPTEL / Coursera', details: 'Completed with 85% distinction score in 2025' }
        ],

        // Competitive Exams
        competitiveExams: userData?.competitiveExams || [],

        // Employment
        employment: userData?.employment || [],

        // Academic Achievements
        academicAchievements: userData?.academicAchievements || [
            { id: 'ach_1', title: 'Academic Excellence Award', details: 'Secured top 5% rank in B.Tech Computer Engineering department.' }
        ]
    };

    // Calculate Completion Percentage
    const sectionsStatus = [
        { name: 'Basic Info', filled: !!profile.name && !!profile.phone, weight: 20 },
        { name: 'Education', filled: profile.education.length > 0, weight: 20 },
        { name: 'Key Skills', filled: !!profile.skills, weight: 15 },
        { name: 'Preferences', filled: !!profile.preferences?.preferredLocation, weight: 10 },
        { name: 'Internships/Projects', filled: profile.internships.length > 0 || profile.projects.length > 0, weight: 15 },
        { name: 'Resume', filled: !!profile.resumeURL, weight: 10 },
        { name: 'Languages', filled: profile.languages.length > 0, weight: 5 },
        { name: 'Summary', filled: !!profile.summaryText, weight: 5 },
    ];
    const totalPercentage = sectionsStatus.reduce((acc, curr) => acc + (curr.filled ? curr.weight : 0), 0);

    // Missing Items calculation for top-right widget
    const missingItems = [
        { key: 'competitiveExams', title: 'Add competitive exam', boost: '+6%', id: 'competitiveExams' },
        { key: 'projects', title: 'Add project', boost: '+7%', id: 'projects' },
        { key: 'accomplishments', title: 'Add certificates', boost: '+5%', id: 'accomplishments' },
    ].filter(item => {
        if (item.key === 'competitiveExams') return profile.competitiveExams.length === 0;
        if (item.key === 'projects') return profile.projects.length === 0;
        if (item.key === 'accomplishments') return profile.accomplishments.length === 0;
        return false;
    });

    const handleQuickLinkClick = (id) => {
        setActiveQuickLink(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Modal Triggers
    const openModal = (key, title, data = null) => {
        setModalConfig({ isOpen: true, key, title, data });
    };

    const closeModal = () => {
        setModalConfig({ isOpen: false, key: '', title: '', data: null });
    };

    // Save Section Updates
    const handleSaveSection = async (sectionKey, formData) => {
        let updatedProfile = { ...profile };

        if (sectionKey === 'personal') {
            updatedProfile = { ...updatedProfile, ...formData };
        } else if (sectionKey === 'preference') {
            updatedProfile.preferences = { ...updatedProfile.preferences, ...formData };
        } else if (sectionKey === 'skills') {
            updatedProfile.skills = formData.skillsString || formData.skills || '';
        } else if (sectionKey === 'summary') {
            updatedProfile.summaryText = formData.summaryText || '';
        } else if (['education', 'languages', 'internships', 'projects', 'accomplishments', 'competitiveExams', 'employment', 'academicAchievements'].includes(sectionKey)) {
            const currentArray = [...(updatedProfile[sectionKey] || [])];
            if (formData.id) {
                // Edit existing
                const index = currentArray.findIndex(item => item.id === formData.id);
                if (index !== -1) currentArray[index] = formData;
            } else {
                // Add new
                currentArray.push({ ...formData, id: `${sectionKey}_${Date.now()}` });
            }
            updatedProfile[sectionKey] = currentArray;
        }

        try {
            setLoading(true);
            await updateUserProfile(currentUser?.uid || 'user_candidate_001', updatedProfile);
            await refreshUserData();
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3500);
        } catch (err) {
            console.error('Failed to update profile section', err);
            setMessage('Failed to update section.');
        } finally {
            setLoading(false);
        }
    };

    // Delete item from list
    const handleDeleteItem = async (sectionKey, itemId) => {
        const currentArray = [...(profile[sectionKey] || [])];
        const filtered = currentArray.filter(item => item.id !== itemId);
        const updatedProfile = { ...profile, [sectionKey]: filtered };
        
        try {
            await updateUserProfile(currentUser?.uid || 'user_candidate_001', updatedProfile);
            await refreshUserData();
        } catch (err) {
            console.error('Failed to delete item', err);
        }
    };

    // Handle Profile Picture Change
    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setProfilePicFile(file);
        
        try {
            setLoading(true);
            const picUrl = await uploadProfilePicture(file, currentUser?.uid || 'user_candidate_001');
            await updateUserProfile(currentUser?.uid || 'user_candidate_001', { profilePictureURL: picUrl });
            await refreshUserData();
            setMessage('Profile photo updated successfully!');
            setTimeout(() => setMessage(''), 3500);
        } catch (err) {
            console.error('Photo upload error', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle Resume Upload & Auto-fill
    const handleResumeChange = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return;

        setIsParsing(true);
        try {
            const parsedData = await parseResume(file);
            const url = await uploadResume(file, currentUser?.uid || 'user_candidate_001');

            const updatedProfile = {
                ...profile,
                resumeURL: url,
                name: parsedData.name || profile.name,
                phone: parsedData.phone || profile.phone,
                skills: parsedData.skills ? `${profile.skills}, ${parsedData.skills}` : profile.skills
            };

            await updateUserProfile(currentUser?.uid || 'user_candidate_001', updatedProfile);
            await refreshUserData();
            setMessage('Resume uploaded and parsed successfully!');
            setTimeout(() => setMessage(''), 3500);
        } catch (err) {
            console.error('Resume upload error', err);
        } finally {
            setIsParsing(false);
        }
    };

    const quickLinks = [
        { id: 'preference', label: 'Preference' },
        { id: 'education', label: 'Education' },
        { id: 'skills', label: 'Key skills' },
        { id: 'languages', label: 'Languages' },
        { id: 'internships', label: 'Internships' },
        { id: 'projects', label: 'Projects' },
        { id: 'summary', label: 'Profile summary' },
        { id: 'accomplishments', label: 'Accomplishments' },
        { id: 'competitiveExams', label: 'Competitive exams' },
        { id: 'employment', label: 'Employment' },
        { id: 'academicAchievements', label: 'Academic achievements' },
        { id: 'resume', label: 'Resume' },
    ];

    return (
        <CandidateSidebar>
            <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '60px' }}>
                
                {/* ── TOP HEADER CARD (PROFILE HERO) ── */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '28px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    border: '1px solid #e2e8f0',
                    marginBottom: '24px',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '24px',
                    alignItems: 'center'
                }}>

                    {/* Circular Avatar + SVG Progress Ring */}
                    <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                            <circle
                                cx="60" cy="60" r="52" fill="none"
                                stroke="#f59e0b" strokeWidth="8"
                                strokeDasharray={326}
                                strokeDashoffset={326 - (326 * totalPercentage) / 100}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                            />
                        </svg>

                        <div style={{
                            position: 'absolute',
                            width: '94px', height: '94px',
                            borderRadius: '50%',
                            background: '#1e293b',
                            color: '#ffffff',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', cursor: 'pointer'
                        }}>
                            {profile.profilePictureURL ? (
                                <img src={profile.profilePictureURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>+</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Add photo</span>
                                </>
                            )}
                            <input
                                type="file" accept="image/*"
                                onChange={handleProfilePicUpload}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                        </div>

                        {/* Completion Badge Percentage under avatar */}
                        <div style={{
                            position: 'absolute', bottom: '-4px',
                            background: '#ffffff', border: '1px solid #e2e8f0',
                            borderRadius: '12px', padding: '2px 8px',
                            fontSize: '0.72rem', fontWeight: 800, color: '#d97706',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            {totalPercentage}%
                        </div>
                    </div>

                    {/* Candidate Central Info */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{profile.name}</h2>
                            <button
                                onClick={() => openModal('personal', 'Personal Details', { name: profile.name, department: profile.department, college: profile.college, address: profile.address, gender: profile.gender, dob: profile.dob, phone: profile.phone })}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                            >
                                <FiEdit2 size={16} />
                            </button>
                        </div>

                        <p style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: '#334155' }}>
                            {profile.department}
                        </p>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#64748b' }}>
                            {profile.college}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: '#475569' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiMapPin style={{ color: '#0ea5e9' }} /> {profile.address}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiUser style={{ color: '#0ea5e9' }} /> {profile.gender}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiBook style={{ color: '#0ea5e9' }} /> {profile.dob}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', marginTop: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 600 }}>
                                <FiPhone style={{ color: '#64748b' }} /> {profile.phone}
                                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}>
                                    <FiCheckCircle /> Verified
                                </span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 600 }}>
                                <FiMail style={{ color: '#64748b' }} /> {profile.email}
                                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}>
                                    <FiCheckCircle /> Verified
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Right Side: Missing Details Widget */}
                    <div style={{
                        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        border: '1px solid #fde68a',
                        minWidth: '260px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {missingItems.length > 0 ? (
                                missingItems.map(item => (
                                    <div
                                        key={item.key}
                                        onClick={() => openModal(item.key, item.title)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                    >
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#78350f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FiPlus size={14} /> {item.title}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: '#ffffff', padding: '2px 6px', borderRadius: '6px' }}>
                                            {item.boost}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f', fontWeight: 600 }}>🎉 Your candidate profile is fully complete!</p>
                            )}

                            <button
                                onClick={() => openModal('competitiveExams', 'Missing Details')}
                                style={{
                                    marginTop: '6px',
                                    background: '#ea580c',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '24px',
                                    padding: '8px 16px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Add missing details
                            </button>
                        </div>
                    </div>
                </div>

                {message && (
                    <div style={{
                        padding: '12px 20px', borderRadius: '12px', marginBottom: '20px',
                        backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 600,
                        border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <FiCheckCircle /> {message}
                    </div>
                )}

                {/* ── PROFILE TAB BAR ── */}
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
                    <button
                        onClick={() => setActiveTab('view_edit')}
                        style={{
                            padding: '12px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'view_edit' ? '3px solid #0ea5e9' : '3px solid transparent',
                            color: activeTab === 'view_edit' ? '#0ea5e9' : '#64748b',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        View & Edit
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        style={{
                            padding: '12px 24px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'activity' ? '3px solid #0ea5e9' : '3px solid transparent',
                            color: activeTab === 'activity' ? '#0ea5e9' : '#64748b',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        Activity insights
                    </button>
                </div>

                {/* ── TAB 1: VIEW & EDIT ── */}
                {activeTab === 'view_edit' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px', alignItems: 'start' }}>

                        {/* STICKY QUICK LINKS SIDEBAR */}
                        <div style={{
                            position: 'sticky',
                            top: '90px',
                            background: '#ffffff',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                        }}>
                            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Quick links</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {quickLinks.map(link => (
                                    <button
                                        key={link.id}
                                        onClick={() => handleQuickLinkClick(link.id)}
                                        style={{
                                            textAlign: 'left',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: activeQuickLink === link.id ? '#f0f9ff' : 'transparent',
                                            color: activeQuickLink === link.id ? '#0ea5e9' : '#475569',
                                            fontWeight: activeQuickLink === link.id ? 700 : 500,
                                            fontSize: '0.88rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}
                                    >
                                        <span>{link.label}</span>
                                        {activeQuickLink === link.id && <FiChevronRight size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT SECTION CARDS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* 1. CAREER PREFERENCE */}
                            <div id="preference" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Your career preferences</h3>
                                    <button onClick={() => openModal('preference', 'Preferences', profile.preferences)} style={editBtnStyle}>
                                        <FiEdit2 size={16} />
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <span style={labelSubStyle}>Preferred job type</span>
                                        <p style={valueStyle}>{profile.preferences?.preferredJobType || 'Jobs, Internships'}</p>
                                    </div>
                                    <div>
                                        <span style={labelSubStyle}>Preferred location</span>
                                        <p style={valueStyle}>{profile.preferences?.preferredLocation || 'Chennai'}</p>
                                    </div>
                                    <div>
                                        <span style={labelSubStyle}>Availability to work</span>
                                        <p style={valueStyle}>{profile.preferences?.availability || 'Immediate'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. EDUCATION */}
                            <div id="education" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Education</h3>
                                    <button onClick={() => openModal('education', 'Education')} style={addBtnStyle}>
                                        Add
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {profile.education.map(edu => (
                                        <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                                                    {edu.title} from {edu.institution}
                                                </h4>
                                                <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#64748b' }}>
                                                    {edu.year}
                                                </p>
                                                {edu.grade && (
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                                                        {edu.grade}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => openModal('education', 'Education', edu)} style={iconBtnStyle}><FiEdit2 size={14} /></button>
                                                <button onClick={() => handleDeleteItem('education', edu.id)} style={{ ...iconBtnStyle, color: '#ef4444' }}><FiX size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. KEY SKILLS */}
                            <div id="skills" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Key skills</h3>
                                    <button onClick={() => openModal('skills', 'Key Skills', { skillsString: profile.skills })} style={editBtnStyle}>
                                        <FiEdit2 size={16} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {profile.skills.split(',').map((skill, index) => (
                                        <span key={index} style={{
                                            background: '#f1f5f9',
                                            color: '#334155',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            border: '1px solid #cbd5e1'
                                        }}>
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 4. LANGUAGES */}
                            <div id="languages" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Languages</h3>
                                    <button onClick={() => openModal('languages', 'Language')} style={addBtnStyle}>
                                        Add
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {profile.languages.map(lang => (
                                        <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{lang.language}</h4>
                                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>{lang.proficiency}</p>
                                            </div>
                                            <button onClick={() => handleDeleteItem('languages', lang.id)} style={{ ...iconBtnStyle, color: '#ef4444' }}><FiX size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 5. INTERNSHIPS */}
                            <div id="internships" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Internships</h3>
                                    <button onClick={() => openModal('internships', 'Internship')} style={addBtnStyle}>
                                        Add
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {profile.internships.map(intern => (
                                        <div key={intern.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                                                    {intern.company} <span style={{ fontWeight: 500, color: '#64748b' }}>({intern.role})</span>
                                                </h4>
                                                <button onClick={() => handleDeleteItem('internships', intern.id)} style={{ ...iconBtnStyle, color: '#ef4444' }}><FiX size={14} /></button>
                                            </div>
                                            <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#0ea5e9', fontWeight: 600 }}>{intern.duration}</p>
                                            {intern.description && <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>{intern.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 6. PROJECTS */}
                            <div id="projects" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Projects</h3>
                                    <button onClick={() => openModal('projects', 'Project')} style={addBtnStyle}>
                                        Add
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {profile.projects.map(proj => (
                                        <div key={proj.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{proj.title}</h4>
                                                <button onClick={() => handleDeleteItem('projects', proj.id)} style={{ ...iconBtnStyle, color: '#ef4444' }}><FiX size={14} /></button>
                                            </div>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#475569' }}>{proj.description}</p>
                                            {proj.link && (
                                                <a href={proj.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}>
                                                    🔗 View Project Link
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 7. PROFILE SUMMARY */}
                            <div id="summary" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Profile Summary</h3>
                                    <button onClick={() => openModal('summary', 'Profile Summary', { summaryText: profile.summaryText })} style={editBtnStyle}>
                                        <FiEdit2 size={16} />
                                    </button>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
                                    {profile.summaryText || 'Talk about your career objectives, skills, and values.'}
                                </p>
                            </div>

                            {/* 8. ACCOMPLISHMENTS */}
                            <div id="accomplishments" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Accomplishments & Certifications</h3>
                                    <button onClick={() => openModal('accomplishments', 'Certification / Accomplishment')} style={addBtnStyle}>
                                        Add
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {profile.accomplishments.map(acc => (
                                        <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{acc.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>{acc.issuer} • {acc.details}</p>
                                            </div>
                                            <button onClick={() => handleDeleteItem('accomplishments', acc.id)} style={{ ...iconBtnStyle, color: '#ef4444' }}><FiX size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 9. COMPETITIVE EXAMS */}
                            <div id="competitiveExams" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Competitive exams</h3>
                                    <button onClick={() => openModal('competitiveExams', 'Competitive Exam')} style={addBtnStyle}>
                                        Add
                                    </button>
                                </div>
                                {profile.competitiveExams.length > 0 ? (
                                    profile.competitiveExams.map(exam => (
                                        <div key={exam.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 700 }}>{exam.examName}</h4>
                                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Score: {exam.score} ({exam.year})</p>
                                            </div>
                                            <button onClick={() => handleDeleteItem('competitiveExams', exam.id)} style={{ ...iconBtnStyle, color: '#ef4444' }}><FiX size={14} /></button>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>Talk about any competitive exam that you appeared for and rank received.</p>
                                )}
                            </div>

                            {/* 10. EMPLOYMENT */}
                            <div id="employment" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Employment</h3>
                                    <button onClick={() => openModal('employment', 'Employment Record')} style={addBtnStyle}>
                                        Add
                                    </button>
                                </div>
                                {profile.employment.length > 0 ? (
                                    profile.employment.map(emp => (
                                        <div key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 700 }}>{emp.designation} - {emp.company}</h4>
                                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>{emp.duration}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>Talk about the company you worked at, your designation and work details.</p>
                                )}
                            </div>

                            {/* 11. ACADEMIC ACHIEVEMENTS */}
                            <div id="academicAchievements" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Academic achievements</h3>
                                    <button onClick={() => openModal('academicAchievements', 'Academic Achievement')} style={addBtnStyle}>
                                        Add
                                    </button>
                                </div>
                                {profile.academicAchievements.map(ach => (
                                    <div key={ach.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{ach.title}</h4>
                                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>{ach.details}</p>
                                        </div>
                                        <button onClick={() => handleDeleteItem('academicAchievements', ach.id)} style={{ ...iconBtnStyle, color: '#ef4444' }}><FiX size={14} /></button>
                                    </div>
                                ))}
                            </div>

                            {/* 12. RESUME */}
                            <div id="resume" style={cardStyle}>
                                <div style={cardHeaderStyle}>
                                    <h3 style={cardTitleStyle}>Resume</h3>
                                </div>
                                <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#64748b' }}>
                                    Resume is the first impression you make on potential employers. Craft it carefully to secure your desired job.
                                </p>

                                {profile.resumeURL ? (
                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justify: 'space-between'
                                    }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                                                📄 {profile.name}_Resume.pdf
                                            </h4>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Uploaded on active account</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <a href={profile.resumeURL} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                                <FiEye /> View
                                            </a>
                                            <a href={profile.resumeURL} download className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                                <FiDownload /> Download
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ border: '2px dashed #0ea5e9', borderRadius: '12px', padding: '24px', textAlign: 'center', background: '#f0f9ff' }}>
                                        <FiUpload size={28} style={{ color: '#0ea5e9', marginBottom: '8px' }} />
                                        <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#0f172a' }}>Upload PDF Resume</p>
                                        <input type="file" accept=".pdf" onChange={handleResumeChange} disabled={isParsing} style={{ display: 'block', margin: '0 auto' }} />
                                        {isParsing && <p style={{ color: '#0ea5e9', fontWeight: 700, marginTop: '8px' }}>Parsing resume skills and auto-filling profile...</p>}
                                    </div>
                                )}

                                {profile.resumeURL && (
                                    <div style={{ marginTop: '14px', textAlign: 'right' }}>
                                        <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '0.88rem' }}>
                                            <FiUpload /> Update resume
                                            <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleResumeChange} />
                                        </label>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* ── TAB 2: ACTIVITY INSIGHTS ── */}
                {activeTab === 'activity' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <div style={statCardStyle}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Profile Views</span>
                                <h3 style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#0ea5e9' }}>148</h3>
                                <small style={{ color: '#10b981', fontWeight: 700 }}>↑ +24% this week</small>
                            </div>
                            <div style={statCardStyle}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Search Appearances</span>
                                <h3 style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>312</h3>
                                <small style={{ color: '#10b981', fontWeight: 700 }}>↑ Top 5% in Chennai</small>
                            </div>
                            <div style={statCardStyle}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Recruiter Actions</span>
                                <h3 style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>12</h3>
                                <small style={{ color: '#64748b' }}>Profile saved by recruiters</small>
                            </div>
                            <div style={statCardStyle}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Applications Sent</span>
                                <h3 style={{ margin: '8px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>8</h3>
                                <small style={{ color: '#64748b' }}>3 shortlists in progress</small>
                            </div>
                        </div>

                        <div style={cardStyle}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Recruiter Engagement Activity</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Companies looking for computer engineers in Chennai have viewed your profile 148 times over the last 30 days.</p>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT DIALOG */}
                <ProfileEditModal
                    isOpen={modalConfig.isOpen}
                    onClose={closeModal}
                    sectionKey={modalConfig.key}
                    sectionTitle={modalConfig.title}
                    initialData={modalConfig.data}
                    onSave={handleSaveSection}
                />
            </div>
        </CandidateSidebar>
    );
}

// STYLES
const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
};

const cardHeaderStyle = {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
};

const cardTitleStyle = {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#0f172a'
};

const editBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#0ea5e9',
    cursor: 'pointer',
    padding: '4px'
};

const addBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#0ea5e9',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    padding: '4px 8px'
};

const iconBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px'
};

const labelSubStyle = {
    display: 'block',
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: 600,
    marginBottom: '2px'
};

const valueStyle = {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#0f172a'
};

const statCardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
};
