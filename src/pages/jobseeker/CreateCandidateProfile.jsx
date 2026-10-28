import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { saveCandidateProfile } from '../../services/candidateService';
import {
    FiUser, FiBookOpen, FiBriefcase, FiCheckCircle, FiFileText,
    FiPlus, FiTrash2, FiEdit3, FiUploadCloud, FiAward, FiArrowLeft,
    FiArrowRight, FiCheck, FiLock, FiStar, FiMapPin, FiCalendar,
    FiEye, FiEyeOff, FiChevronDown
} from 'react-icons/fi';

const SKILL_CATEGORIES = {
    Technical: ['Python', 'JavaScript', 'React.js', 'Node.js', 'HTML5', 'CSS3', 'SQL', 'Git', 'Java', 'C++', 'Data Structures', 'TypeScript'],
    SoftSkills: ['Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Time Management', 'Adaptability', 'Critical Thinking']
};

const INDIAN_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
];

export default function CreateCandidateProfile() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser, userData, setVerifiedMobile, candidateLogin } = useAuth();

    const initialPhone = searchParams.get('phone') 
        || sessionStorage.getItem('verified_candidate_phone') 
        || userData?.phone 
        || userData?.mobile_number 
        || '';

    // Step state: 1 to 6
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // STEP 1: Personal Information & Password Creation
    const [fullName, setFullName] = useState(userData?.name || userData?.full_name || '');
    const [profilePhoto, setProfilePhoto] = useState(userData?.profile_photo || '');
    const [email, setEmail] = useState(userData?.email || currentUser?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mobileNumber, setMobileNumber] = useState(initialPhone);
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('Male');
    const [city, setCity] = useState(userData?.city || '');
    const [state, setState] = useState(userData?.state || '');
    const [country, setCountry] = useState(userData?.country || 'India');
    const [pincode, setPincode] = useState(userData?.pincode || '');
    const [address, setAddress] = useState(userData?.address || '');

    // STEP 2: Professional Information
    const [experienceType, setExperienceType] = useState('Fresher'); // 'Fresher' or 'Experienced'
    const [isFresher, setIsFresher] = useState(true);
    const [fresherStatus, setFresherStatus] = useState('Final Year Student');
    const [targetRole, setTargetRole] = useState('');
    const [currentTitle, setCurrentTitle] = useState('');
    const [currentCompany, setCurrentCompany] = useState('');
    const [totalExperience, setTotalExperience] = useState('1–3 Years');
    const [aboutMe, setAboutMe] = useState('');

    // STEP 3: Education List (Clean empty list by default - no hardcoded samples)
    const [educationList, setEducationList] = useState(Array.isArray(userData?.education) ? userData.education : []);
    const [eduModal, setEduModal] = useState(false);
    const [eduForm, setEduForm] = useState({ qualification: "Bachelor's Degree", degree: '', specialization: '', institution: '', university: '', start_year: '', end_year: '', cgpa: '' });

    // STEP 4: Work Experience List
    const [experienceList, setExperienceList] = useState(Array.isArray(userData?.experience) ? userData.experience : []);
    const [expModal, setExpModal] = useState(false);
    const [expForm, setExpForm] = useState({ company_name: '', job_title: '', employment_type: 'Full Time', start_date: '', end_date: '', currently_working: false, location: '', description: '' });

    // STEP 5: Skills Tag System
    const [skills, setSkills] = useState(Array.isArray(userData?.skills) ? userData.skills : []);
    const [skillInput, setSkillInput] = useState('');

    // STEP 6: Resume Upload
    const [resumeName, setResumeName] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [resumeUpdatedAt, setResumeUpdatedAt] = useState('');

    // STEP 7: Career Preferences
    const [preferredTypes, setPreferredTypes] = useState(['Full Time']);
    const [preferredLocations, setPreferredLocations] = useState(['Chennai', 'Bangalore', 'Remote']);
    const [workMode, setWorkMode] = useState('Hybrid');
    const [minSalary, setMinSalary] = useState('4,00,000');
    const [maxSalary, setMaxSalary] = useState('8,00,000');
    const [noticePeriod, setNoticePeriod] = useState('Immediate Joiner');
    const [preferredRoles, setPreferredRoles] = useState(['Software Developer', 'Web Developer']);

    // Calculate Completion Score
    const computeCompletionScore = () => {
        let score = 0;
        if (fullName) score += 15;
        if (email && mobileNumber) score += 15;
        if (educationList.length > 0) score += 20;
        if (isFresher || experienceList.length > 0) score += 15;
        if (skills.length > 0) score += 15;
        if (resumeName || resumeUrl) score += 10;
        if (preferredRoles.length > 0) score += 10;
        return Math.min(100, Math.max(score, 30));
    };

    const completionScore = computeCompletionScore();

    // Skill Tag Handlers
    function handleAddSkill(sk) {
        const tag = (sk || skillInput).trim();
        if (tag && !skills.includes(tag)) {
            setSkills([...skills, tag]);
            setSkillInput('');
        }
    }

    function handleRemoveSkill(tag) {
        setSkills(skills.filter(s => s !== tag));
    }

    // Toggle multi-select badges
    function togglePreference(item, list, setList) {
        if (list.includes(item)) {
            setList(list.filter(x => x !== item));
        } else {
            setList([...list, item]);
        }
    }

    // Photo Upload Handler (with automatic client-side compression)
    function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 360;
                    const MAX_HEIGHT = 360;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height = Math.round(height * (MAX_WIDTH / width));
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width = Math.round(width * (MAX_HEIGHT / height));
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
                    setProfilePhoto(compressedDataUrl);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // Resume Upload Handler
    function handleResumeUpload(e) {
        const file = e.target.files[0];
        if (file) {
            setResumeName(file.name);
            setResumeUpdatedAt(new Date().toLocaleDateString());
            // Create object URL or mock string
            setResumeUrl(URL.createObjectURL(file));
        }
    }

    // Education Add Handler
    function handleAddEducation() {
        if (eduForm.degree && eduForm.institution) {
            setEducationList([...educationList, eduForm]);
            setEduForm({ qualification: "Bachelor's Degree", degree: '', specialization: '', institution: '', university: '', start_year: '2020', end_year: '2024', cgpa: '' });
            setEduModal(false);
        }
    }

    // Experience Add Handler
    function handleAddExperience() {
        if (expForm.company_name && expForm.job_title) {
            setExperienceList([...experienceList, expForm]);
            setExpForm({ company_name: '', job_title: '', employment_type: 'Full Time', start_date: '', end_date: '', currently_working: false, location: '', description: '' });
            setExpModal(false);
        }
    }

    // Next Step Handler with Step 1 validation
    function handleNextStep() {
        setError('');
        if (currentStep === 1) {
            if (!fullName.trim()) {
                setError('Please enter your Full Name.');
                return;
            }
            if (!email.trim()) {
                setError('Please enter your Email Address.');
                return;
            }
            if (!password) {
                setError('Please create a password for your account.');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match. Please re-enter.');
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    }

    // Final Save Handler (Requirement 14)
    async function handleFinishProfile() {
        if (!fullName || !email) {
            setError('Full Name and Email Address are required.');
            setCurrentStep(1);
            return;
        }
        if (password && password.length < 6) {
            setError('Password must be at least 6 characters.');
            setCurrentStep(1);
            return;
        }
        if (password && password !== confirmPassword) {
            setError('Passwords do not match.');
            setCurrentStep(1);
            return;
        }

        setLoading(true);
        setError('');

        const candidateData = {
            candidate_id: userData?.candidate_id || `CAND-${Date.now()}`,
            full_name: fullName,
            profile_photo: profilePhoto,
            email,
            password: password || 'password',
            mobile_number: mobileNumber,
            mobile_verified: 1,
            date_of_birth: dateOfBirth,
            gender,
            city,
            state,
            country,
            pincode,
            professional_headline: isFresher 
                ? (targetRole ? `${targetRole} (Fresher)` : `Fresher - ${fresherStatus}`)
                : `${currentTitle || 'Software Engineer'} at ${currentCompany || 'Company'}`,
            current_job_title: isFresher ? (targetRole || 'Fresher') : currentTitle,
            current_company: isFresher ? (fresherStatus || 'Student / Graduate') : currentCompany,
            total_experience: isFresher ? 'Fresher' : totalExperience,
            experience_type: isFresher ? 'Fresher' : 'Experienced',
            about_me: aboutMe,
            education: educationList,
            experience: isFresher ? [] : experienceList,
            skills,
            resume_name: resumeName || 'Candidate_Resume.pdf',
            resume_url: resumeUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            career_preferences: {
                preferred_job_types: preferredTypes,
                preferred_locations: preferredLocations,
                preferred_work_modes: workMode,
                minimum_salary: minSalary,
                maximum_salary: maxSalary,
                notice_period: noticePeriod,
                preferred_roles: preferredRoles
            },
            profile_completion_percentage: completionScore
        };

        try {
            const result = await saveCandidateProfile(candidateData);

            // Establish jobseeker session so ProtectedRoute allows access to /jobseeker
            await candidateLogin({
                ...candidateData,
                candidate_id: result?.candidate_id || candidateData.candidate_id
            });

            setSuccessMessage('🎉 Your Profile Has Been Created Successfully!');
            // Navigate directly — session is now set
            setTimeout(() => {
                navigate('/jobseeker');
            }, 1200);
        } catch (err) {
            setError(err.message || 'Failed to save profile. Please try again.');
        }
        setLoading(false);
    }

    const steps = [
        { num: 1, name: 'Personal', icon: FiUser },
        { num: 2, name: 'Professional', icon: FiBriefcase },
        { num: 3, name: 'Education', icon: FiBookOpen },
        { num: 4, name: 'Experience', icon: FiAward },
        { num: 5, name: 'Skills', icon: FiStar },
        { num: 6, name: 'Resume', icon: FiFileText },
    ];

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 20px 80px' }}>
            <div style={{ maxWidth: '840px', margin: '0 auto' }}>

                {/* HEADER TITLE */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 16px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Candidate Setup
                    </span>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '10px 0 6px' }}>
                        Complete Your Profile
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Build a professional profile to get matched with top employers & recruiters
                    </p>
                </div>

                {/* PROFILE COMPLETION SCORE INDICATOR (Requirement 13) */}
                <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                            Profile Completion: <span style={{ color: '#0ea5e9' }}>{completionScore}%</span>
                        </span>
                        {completionScore < 85 && (
                            <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700 }}>
                                💡 Complete all steps to improve your hiring chances
                            </span>
                        )}
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${completionScore}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #6366f1)', borderRadius: '10px', transition: 'width 0.4s ease' }} />
                    </div>
                </div>

                {/* STEP PROGRESS INDICATOR BAR */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                    marginBottom: '28px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    {steps.map(s => {
                        const Icon = s.icon;
                        const isActive = currentStep === s.num;
                        const isDone = currentStep > s.num;
                        return (
                            <button
                                key={s.num}
                                onClick={() => setCurrentStep(s.num)}
                                title={`Step ${s.num}: ${s.name}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '10px 6px',
                                    borderRadius: '12px',
                                    border: isActive ? '1.5px solid #0ea5e9' : '1px solid transparent',
                                    background: isActive ? '#0ea5e9' : isDone ? '#f0f9ff' : '#f8fafc',
                                    color: isActive ? '#ffffff' : isDone ? '#0284c7' : '#64748b',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    width: '100%',
                                    minWidth: 0,
                                    boxSizing: 'border-box'
                                }}
                            >
                                <span style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: isActive ? 'rgba(255,255,255,0.25)' : isDone ? '#bae6fd' : '#e2e8f0',
                                    color: isActive ? '#ffffff' : isDone ? '#0369a1' : '#64748b',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    flexShrink: 0
                                }}>
                                    {isDone ? '✓' : s.num}
                                </span>
                                <span style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {s.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '14px 20px', borderRadius: '16px', fontWeight: 700, marginBottom: '24px' }}>
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '16px 20px', borderRadius: '16px', fontWeight: 800, marginBottom: '24px', textAlign: 'center', fontSize: '1.1rem' }}>
                        {successMessage}
                    </div>
                )}

                {/* FORM CONTAINER */}
                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>

                    {/* STEP 1: PERSONAL INFORMATION */}
                    {currentStep === 1 && (
                        <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiUser style={{ color: '#0ea5e9' }} /> Step 1: Personal Information
                            </h3>

                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '28px', background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '2rem', overflow: 'hidden', flexShrink: 0 }}>
                                    {profilePhoto ? <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : fullName[0]?.toUpperCase() || 'C'}
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>Upload Profile Photo</label>
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '0.85rem' }} />
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>PNG, JPG or WEBP (Max 2MB)</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter full name" style={inputStyle} required />
                                </div>

                                <div>
                                    <label style={labelStyle}>Email Address *</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email address" style={inputStyle} required />
                                </div>

                                <div>
                                    <label style={labelStyle}>Create Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            placeholder="Min 6 characters" 
                                            style={{ ...inputStyle, paddingRight: '44px' }} 
                                            required 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center'
                                            }}
                                        >
                                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Confirm Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showConfirmPassword ? 'text' : 'password'} 
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)} 
                                            placeholder="Re-enter password" 
                                            style={{ ...inputStyle, paddingRight: '44px' }} 
                                            required 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{
                                                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center'
                                            }}
                                        >
                                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>
                                        Verified Mobile Number * <FiLock style={{ color: '#10b981', marginLeft: '4px' }} />
                                    </label>
                                    <input type="text" value={mobileNumber} disabled style={{ ...inputStyle, background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', fontWeight: 700 }} />
                                </div>

                                <div>
                                    <label style={labelStyle}>Date of Birth</label>
                                    <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={inputStyle} />
                                </div>

                                <div>
                                    <label style={labelStyle}>Gender</label>
                                    <div style={{ position: 'relative' }}>
                                        <select value={gender} onChange={e => setGender(e.target.value)} style={selectStyle}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <FiChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>City</label>
                                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Enter city" style={inputStyle} />
                                </div>

                                <div>
                                    <label style={labelStyle}>State</label>
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            value={state} 
                                            onChange={e => setState(e.target.value)} 
                                            style={{
                                                ...selectStyle,
                                                color: state ? '#0f172a' : '#94a3b8'
                                            }}
                                        >
                                            <option value="" style={{ color: '#94a3b8' }}>Select State</option>
                                            {INDIAN_STATES.map((st) => (
                                                <option key={st} value={st} style={{ color: '#0f172a' }}>{st}</option>
                                            ))}
                                            {state && !INDIAN_STATES.includes(state) && (
                                                <option value={state} style={{ color: '#0f172a' }}>{state}</option>
                                            )}
                                        </select>
                                        <FiChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Pincode</label>
                                    <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Enter pincode" style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <label style={labelStyle}>Full Address</label>
                                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full address" rows="2" style={{ ...inputStyle, height: 'auto', minHeight: '80px', resize: 'vertical' }} />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PROFESSIONAL INFORMATION */}
                    {currentStep === 2 && (
                        <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiBriefcase style={{ color: '#0ea5e9' }} /> Step 2: Professional Information
                            </h3>

                            {/* Candidate Experience Type Toggle */}
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '12px', display: 'block' }}>
                                    Are you a Fresher or an Experienced Professional? *
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div
                                        onClick={() => { setExperienceType('Fresher'); setIsFresher(true); }}
                                        style={{
                                            padding: '20px 24px', borderRadius: '16px', cursor: 'pointer',
                                            border: experienceType === 'Fresher' ? '2px solid #0ea5e9' : '1.5px solid #e2e8f0',
                                            background: experienceType === 'Fresher' ? '#f0f9ff' : '#ffffff',
                                            boxShadow: experienceType === 'Fresher' ? '0 4px 12px rgba(14, 165, 233, 0.12)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 4px', fontSize: '1.02rem', fontWeight: 800, color: experienceType === 'Fresher' ? '#0284c7' : '#0f172a' }}>
                                            I am a Fresher / Student
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4 }}>
                                            Final year student, recent graduate, or looking for first job
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => { setExperienceType('Experienced'); setIsFresher(false); }}
                                        style={{
                                            padding: '20px 24px', borderRadius: '16px', cursor: 'pointer',
                                            border: experienceType === 'Experienced' ? '2px solid #0ea5e9' : '1.5px solid #e2e8f0',
                                            background: experienceType === 'Experienced' ? '#f0f9ff' : '#ffffff',
                                            boxShadow: experienceType === 'Experienced' ? '0 4px 12px rgba(14, 165, 233, 0.12)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 4px', fontSize: '1.02rem', fontWeight: 800, color: experienceType === 'Experienced' ? '#0284c7' : '#0f172a' }}>
                                            I have Work Experience
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4 }}>
                                            Currently working or have prior professional experience
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Question Section */}
                            {experienceType === 'Fresher' ? (
                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0369a1', margin: '0 0 18px' }}>
                                        Fresher Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={labelStyle}>Current Academic / Student Status *</label>
                                            <div style={{ position: 'relative' }}>
                                                <select value={fresherStatus} onChange={e => setFresherStatus(e.target.value)} style={selectStyle}>
                                                    <option value="Final Year Student">Final Year Student</option>
                                                    <option value="Recent Graduate (2024/2025)">Recent Graduate (2024/2025)</option>
                                                    <option value="Looking for Internship / First Job">Looking for Internship / First Job</option>
                                                    <option value="Pre-Final Year Student">Pre-Final Year Student</option>
                                                </select>
                                                <FiChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Target Job Role / Desired Designation</label>
                                            <input
                                                type="text"
                                                value={targetRole}
                                                onChange={e => setTargetRole(e.target.value)}
                                                placeholder="Enter target job role / designation"
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0369a1', margin: '0 0 18px' }}>
                                        Work Experience Information
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={labelStyle}>Current / Most Recent Job Title *</label>
                                            <input
                                                type="text"
                                                value={currentTitle}
                                                onChange={e => setCurrentTitle(e.target.value)}
                                                placeholder="Enter current job title"
                                                style={inputStyle}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Current / Most Recent Company *</label>
                                            <input
                                                type="text"
                                                value={currentCompany}
                                                onChange={e => setCurrentCompany(e.target.value)}
                                                placeholder="Enter current company name"
                                                style={inputStyle}
                                                required
                                            />
                                        </div>

                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={labelStyle}>Total Experience *</label>
                                            <div style={{ position: 'relative' }}>
                                                <select value={totalExperience} onChange={e => setTotalExperience(e.target.value)} style={selectStyle}>
                                                    <option value="0–1 Years">0–1 Years</option>
                                                    <option value="1–3 Years">1–3 Years</option>
                                                    <option value="3–5 Years">3–5 Years</option>
                                                    <option value="5–10 Years">5–10 Years</option>
                                                    <option value="10+ Years">10+ Years</option>
                                                </select>
                                                <FiChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={labelStyle}>
                                    {experienceType === 'Fresher' ? 'Career Objective / About Me' : 'Professional Summary / About Me'}
                                </label>
                                <textarea
                                    value={aboutMe}
                                    onChange={e => setAboutMe(e.target.value)}
                                    placeholder="Enter career objective / professional summary..."
                                    rows="4"
                                    style={{ ...inputStyle, height: 'auto', minHeight: '110px', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: EDUCATION */}
                    {currentStep === 3 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FiBookOpen style={{ color: '#0ea5e9' }} /> Step 3: Education
                                </h3>
                                <button className="btn btn-sm btn-primary" onClick={() => setEduModal(true)}>
                                    <FiPlus /> + Add Education
                                </button>
                            </div>

                            {educationList.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                    <p style={{ color: '#64748b' }}>No education records added yet. Click "+ Add Education" to add your qualifications.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {educationList.map((edu, idx) => (
                                        <div key={idx} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0ea5e9', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>{edu.qualification}</span>
                                                <h4 style={{ margin: '6px 0 2px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{edu.degree} ({edu.specialization})</h4>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>{edu.institution} | {edu.start_year} - {edu.end_year} | CGPA: {edu.cgpa}</p>
                                            </div>
                                            <button onClick={() => setEducationList(educationList.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Education Modal */}
                            {eduModal && (
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                                    <div style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '500px' }}>
                                        <h4 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800 }}>Add Qualification</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <input type="text" placeholder="Enter degree / course" value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} style={inputStyle} />
                                            <input type="text" placeholder="Enter specialization" value={eduForm.specialization} onChange={e => setEduForm({ ...eduForm, specialization: e.target.value })} style={inputStyle} />
                                            <input type="text" placeholder="Enter college / institution name" value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} style={inputStyle} />
                                            <input type="text" placeholder="Enter university name" value={eduForm.university} onChange={e => setEduForm({ ...eduForm, university: e.target.value })} style={inputStyle} />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <input type="text" placeholder="Enter start year" value={eduForm.start_year} onChange={e => setEduForm({ ...eduForm, start_year: e.target.value })} style={inputStyle} />
                                                <input type="text" placeholder="Enter end year" value={eduForm.end_year} onChange={e => setEduForm({ ...eduForm, end_year: e.target.value })} style={inputStyle} />
                                            </div>
                                            <input type="text" placeholder="Enter percentage / CGPA" value={eduForm.cgpa} onChange={e => setEduForm({ ...eduForm, cgpa: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                            <button className="btn btn-secondary" onClick={() => setEduModal(false)}>Cancel</button>
                                            <button className="btn btn-primary" onClick={handleAddEducation}>Add Education</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: WORK EXPERIENCE */}
                    {currentStep === 4 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FiAward style={{ color: '#0ea5e9' }} /> Step 4: Work Experience
                                </h3>
                                <button className="btn btn-sm btn-primary" onClick={() => setExpModal(true)}>
                                    <FiPlus /> + Add Experience
                                </button>
                            </div>

                            {isFresher ? (
                                <div style={{ padding: '24px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', color: '#166534', fontWeight: 700 }}>
                                    ✓ Marked as "Fresher". Work experience is optional for freshers.
                                </div>
                            ) : experienceList.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                    <p style={{ color: '#64748b' }}>No work experience added yet. Click "+ Add Experience" to add past roles.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {experienceList.map((exp, idx) => (
                                        <div key={idx} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 2px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{exp.job_title} at {exp.company_name}</h4>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>{exp.employment_type} | {exp.start_date} - {exp.currently_working ? 'Present' : exp.end_date} | {exp.location}</p>
                                            </div>
                                            <button onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Experience Modal */}
                            {expModal && (
                                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                                    <div style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '500px' }}>
                                        <h4 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800 }}>Add Work Experience</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <input type="text" placeholder="Enter company name" value={expForm.company_name} onChange={e => setExpForm({ ...expForm, company_name: e.target.value })} style={inputStyle} />
                                            <input type="text" placeholder="Enter job title" value={expForm.job_title} onChange={e => setExpForm({ ...expForm, job_title: e.target.value })} style={inputStyle} />
                                            <select value={expForm.employment_type} onChange={e => setExpForm({ ...expForm, employment_type: e.target.value })} style={inputStyle}>
                                                <option value="Full Time">Full Time</option>
                                                <option value="Part Time">Part Time</option>
                                                <option value="Internship">Internship</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Freelance">Freelance</option>
                                            </select>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <input type="text" placeholder="Enter start date" value={expForm.start_date} onChange={e => setExpForm({ ...expForm, start_date: e.target.value })} style={inputStyle} />
                                                <input type="text" placeholder="Enter end date" disabled={expForm.currently_working} value={expForm.currently_working ? 'Present' : expForm.end_date} onChange={e => setExpForm({ ...expForm, end_date: e.target.value })} style={inputStyle} />
                                            </div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700 }}>
                                                <input type="checkbox" checked={expForm.currently_working} onChange={e => setExpForm({ ...expForm, currently_working: e.target.checked })} /> Currently Working Here
                                            </label>
                                            <input type="text" placeholder="Enter city / location" value={expForm.location} onChange={e => setExpForm({ ...expForm, location: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                            <button className="btn btn-secondary" onClick={() => setExpModal(false)}>Cancel</button>
                                            <button className="btn btn-primary" onClick={handleAddExperience}>Add Experience</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 5: SKILLS TAG INPUT */}
                    {currentStep === 5 && (
                        <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiStar style={{ color: '#0ea5e9' }} /> Step 5: Skills
                            </h3>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={labelStyle}>Add Custom Skill</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter skill name"
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                                        style={inputStyle}
                                    />
                                    <button className="btn btn-primary" onClick={() => handleAddSkill()}>+ Add</button>
                                </div>
                            </div>

                            {/* Added Skills Pill Container */}
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '10px' }}>Your Selected Skills:</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {skills.map(sk => (
                                        <span key={sk} style={{ background: '#0ea5e9', color: '#ffffff', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            {sk} <button onClick={() => handleRemoveSkill(sk)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Skill Suggestions */}
                            {Object.entries(SKILL_CATEGORIES).map(([cat, skList]) => (
                                <div key={cat} style={{ marginBottom: '16px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>Popular {cat} Skills:</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {skList.map(s => (
                                            <button key={s} onClick={() => handleAddSkill(s)} style={{ background: skills.includes(s) ? '#e0f2fe' : '#ffffff', color: skills.includes(s) ? '#0369a1' : '#475569', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                                                + {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 6: RESUME & PREFERENCES */}
                    {currentStep === 6 && (
                        <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiFileText style={{ color: '#0ea5e9' }} /> Step 6: Resume & Career Preferences
                            </h3>

                            {/* RESUME UPLOAD SECTION */}
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1.5px dashed #0ea5e9', marginBottom: '28px', textAlign: 'center' }}>
                                <FiUploadCloud size={40} style={{ color: '#0ea5e9', marginBottom: '10px' }} />
                                <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>Upload Your Resume</h4>
                                <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '16px' }}>Supported formats: PDF, DOC, DOCX (Max 5MB)</p>

                                {resumeName ? (
                                    <div style={{ background: '#ffffff', padding: '12px 20px', borderRadius: '12px', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '12px', color: '#166534', fontWeight: 700 }}>
                                        <FiCheckCircle style={{ color: '#16a34a' }} />
                                        <span>{resumeName} (Uploaded: {resumeUpdatedAt})</span>
                                        <button onClick={() => setResumeName('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                                    </div>
                                ) : (
                                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} style={{ fontSize: '0.9rem' }} />
                                )}
                            </div>

                            {/* CAREER PREFERENCES SECTION */}
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Career Preferences</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={labelStyle}>Work Mode</label>
                                    <div style={{ position: 'relative' }}>
                                        <select value={workMode} onChange={e => setWorkMode(e.target.value)} style={selectStyle}>
                                            <option value="On-site">On-site</option>
                                            <option value="Remote">Remote</option>
                                            <option value="Hybrid">Hybrid</option>
                                            <option value="Any">Any</option>
                                        </select>
                                        <FiChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Notice Period</label>
                                    <div style={{ position: 'relative' }}>
                                        <select value={noticePeriod} onChange={e => setNoticePeriod(e.target.value)} style={selectStyle}>
                                            <option value="Immediate Joiner">Immediate Joiner</option>
                                            <option value="7 Days">7 Days</option>
                                            <option value="15 Days">15 Days</option>
                                            <option value="30 Days">30 Days</option>
                                            <option value="60 Days">60 Days</option>
                                            <option value="90 Days">90 Days</option>
                                            <option value="Negotiable">Negotiable</option>
                                        </select>
                                        <FiChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={labelStyle}>Minimum Expected Salary (₹ / Year)</label>
                                    <input type="text" value={minSalary} onChange={e => setMinSalary(e.target.value)} placeholder="e.g. 4,00,000" style={inputStyle} />
                                </div>

                                <div>
                                    <label style={labelStyle}>Maximum Expected Salary (₹ / Year)</label>
                                    <input type="text" value={maxSalary} onChange={e => setMaxSalary(e.target.value)} placeholder="e.g. 8,00,000" style={inputStyle} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NAVIGATION BUTTONS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                        {currentStep > 1 ? (
                            <button className="btn btn-secondary" onClick={() => setCurrentStep(currentStep - 1)} style={{ padding: '12px 24px', fontWeight: 800 }}>
                                <FiArrowLeft /> Previous Step
                            </button>
                        ) : <div />}

                        {currentStep < 6 ? (
                            <button className="btn btn-primary" onClick={handleNextStep} style={{ padding: '12px 28px', fontWeight: 800 }}>
                                Next Step <FiArrowRight />
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleFinishProfile} disabled={loading} style={{ padding: '14px 36px', fontWeight: 800, background: '#10b981', fontSize: '1rem' }}>
                                {loading ? 'Saving Profile...' : 'Complete Profile 🎉'}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#334155',
    marginBottom: '6px'
};

const inputStyle = {
    width: '100%',
    height: '48px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#0f172a',
    outline: 'none',
    background: '#ffffff',
    boxSizing: 'border-box'
};

const selectStyle = {
    ...inputStyle,
    paddingRight: '38px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: 'pointer'
};
