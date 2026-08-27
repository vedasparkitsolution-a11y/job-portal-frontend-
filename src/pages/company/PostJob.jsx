import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createJob } from '../../services/jobService';
import { generateDynamicQuestions } from '../../utils/questionGenerator';
import {
    FiArrowLeft, FiPlus, FiX, FiCheck, FiSave, FiEye,
    FiBriefcase, FiMapPin, FiDollarSign, FiClock, FiUsers,
    FiCalendar, FiAlertCircle, FiCheckCircle, FiGlobe,
    FiFileText, FiTag, FiAward, FiPhone, FiMail, FiExternalLink, FiEdit3, FiHelpCircle, FiTrash2
} from 'react-icons/fi';

export default function PostJob() {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();

    // Section 1: Job Information
    const [jobType, setJobType] = useState('Full Time');
    const [jobTitle, setJobTitle] = useState('');
    const [city, setCity] = useState(userData?.city || '');
    const [state, setState] = useState(userData?.state || '');
    const [country, setCountry] = useState(userData?.country || 'India');
    const [pincode, setPincode] = useState(userData?.pincode || '');
    const [locationType, setLocationType] = useState('On-site');
    const [numberOfOpenings, setNumberOfOpenings] = useState(1);

    // Geo-Tag Location States (Configured via Admin System Settings)
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [geoAddress, setGeoAddress] = useState('');
    const [geoRadius, setGeoRadius] = useState('25');
    const [detectingGps, setDetectingGps] = useState(false);
    const [geoEmployerAccess, setGeoEmployerAccess] = useState(true);

    // Section 2: Candidate Requirements
    const [experienceType, setExperienceType] = useState('Any Experience');
    const [minExperience, setMinExperience] = useState('');
    const [maxExperience, setMaxExperience] = useState('');
    const [selectedEducation, setSelectedEducation] = useState(['Bachelor\'s Degree']);
    const [requiredSkills, setRequiredSkills] = useState(['React.js', 'JavaScript', 'CSS']);
    const [currentSkillInput, setCurrentSkillInput] = useState('');
    const [preferredSkills, setPreferredSkills] = useState(['TypeScript', 'Node.js']);
    const [currentPreferredInput, setCurrentPreferredInput] = useState('');
    const [genderPreference, setGenderPreference] = useState('Any');
    const [minAge, setMinAge] = useState('');
    const [maxAge, setMaxAge] = useState('');

    // Section 3: Salary Information
    const [minSalary, setMinSalary] = useState('25000');
    const [maxSalary, setMaxSalary] = useState('45000');
    const [salaryType, setSalaryType] = useState('Monthly');
    const [salaryNegotiable, setSalaryNegotiable] = useState(false);

    // Section 4: Job Description & Responsibilities
    const [jobDescription, setJobDescription] = useState(
        'We are seeking a talented and motivated professional to join our dynamic team. The ideal candidate will be responsible for driving key project initiatives, collaborating across teams, and delivering high-quality solutions.'
    );
    const [responsibilities, setResponsibilities] = useState([
        'Develop and maintain high-performance web applications',
        'Collaborate with cross-functional teams to design, build, and ship new features',
        'Identify and resolve software performance bottlenecks and bugs',
        'Participate in code reviews and engineering meetings'
    ]);
    const [newRespInput, setNewRespInput] = useState('');

    // Section 5: Job Timings
    const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [shiftType, setShiftType] = useState('Day Shift');
    const [workingHours, setWorkingHours] = useState('8 hours/day');

    // Section 6: About Company (Auto-loaded from Employer Company Profile - Requirement 7)
    const companyName = userData?.companyName || 'Your Company Name';
    const companyLogo = userData?.logoURL || userData?.companyLogo || '';
    const contactPersonName = userData?.contactPersonName || userData?.hrName || 'Recruiter';
    const companyPhone = userData?.mobileNumber || userData?.companyPhone || '';
    const companyEmail = userData?.email || userData?.companyEmail || '';
    const companyWebsite = userData?.website || userData?.companyWebsite || '';
    const aboutCompany = userData?.description || userData?.aboutCompany || 'Leading technology solutions and service provider.';

    // Section 7: Hiring Information
    const [hiringTimeline, setHiringTimeline] = useState('Immediately');
    const [hiringFrequency, setHiringFrequency] = useState('One-time Hiring');
    const [hiringPriority, setHiringPriority] = useState('Normal'); // Normal or Urgent

    // Section 8: Job Address
    const [buildingName, setBuildingName] = useState(userData?.address || '');
    const [doorNumber, setDoorNumber] = useState('');
    const [street, setStreet] = useState('');
    const [area, setArea] = useState('');
    const [district, setDistrict] = useState('');

    // Section 9: Additional Details
    const [selectedBenefits, setSelectedBenefits] = useState(['Health Insurance', 'Paid Leave', 'Bonus']);
    const [noticePeriod, setNoticePeriod] = useState('30 Days');
    const [joiningDate, setJoiningDate] = useState('');

    // Section 10: Application Screening Questions (Requirement 3)
    const [applicationQuestions, setApplicationQuestions] = useState([
        {
            id: 'q_1',
            question: 'How many years of relevant experience do you have in this domain?',
            type: 'multiple_choice',
            options: ['Fresher / < 1 year', '1–2 years', '2–3 years', '3+ years'],
            required: true
        },
        {
            id: 'q_2',
            question: 'Which of the required tools and skills are you proficient in?',
            type: 'multi_select',
            options: ['Core Domain Skills', 'Problem Solving', 'Team Collaboration', 'Communication'],
            required: true
        },
        {
            id: 'q_joining',
            question: 'When can you join if selected?',
            type: 'multiple_choice',
            options: ['Immediately', 'Within 7 days', 'Within 15 days', 'Within 30 days', 'More than 30 days'],
            required: true,
            isAvailability: true
        },
        {
            id: 'q_interview',
            question: 'When are you available for an interview?',
            type: 'multiple_choice',
            options: ['Anytime', 'Within the next 7 days', 'Within the next 15 days', 'Need advance notice'],
            required: true,
            isAvailability: true
        }
    ]);

    function handleAutoSuggestQuestions() {
        const generated = generateDynamicQuestions({
            job_title: jobTitle || 'Position',
            required_skills: requiredSkills,
            experience: experienceType
        });
        setApplicationQuestions(generated);
    }

    function handleAddCustomQuestion() {
        if (applicationQuestions.length >= 6) {
            alert('You can add up to 5-6 screening questions per job posting.');
            return;
        }
        const nextId = `q_custom_${Date.now()}`;
        setApplicationQuestions([
            ...applicationQuestions,
            {
                id: nextId,
                question: 'New custom screening question',
                type: 'multiple_choice',
                options: ['Beginner / Basic', 'Intermediate', 'Advanced'],
                required: true
            }
        ]);
    }

    function handleUpdateQuestion(index, field, value) {
        setApplicationQuestions(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    }

    function handleDeleteQuestion(index) {
        setApplicationQuestions(prev => prev.filter((_, idx) => idx !== index));
    }

    function handleAddOption(qIndex) {
        setApplicationQuestions(prev => {
            const copy = [...prev];
            const currentOpts = copy[qIndex].options || [];
            copy[qIndex] = { ...copy[qIndex], options: [...currentOpts, `New Option ${currentOpts.length + 1}`] };
            return copy;
        });
    }

    function handleUpdateOption(qIndex, optIndex, val) {
        setApplicationQuestions(prev => {
            const copy = [...prev];
            const currentOpts = [...(copy[qIndex].options || [])];
            currentOpts[optIndex] = val;
            copy[qIndex] = { ...copy[qIndex], options: currentOpts };
            return copy;
        });
    }

    function handleDeleteOption(qIndex, optIndex) {
        setApplicationQuestions(prev => {
            const copy = [...prev];
            const currentOpts = (copy[qIndex].options || []).filter((_, i) => i !== optIndex);
            copy[qIndex] = { ...copy[qIndex], options: currentOpts };
            return copy;
        });
    }

    // Section 11: Application Settings & Deadline
    const [applicationMethod, setApplicationMethod] = useState('Apply through Job Portal');
    const [applicationUrl, setApplicationUrl] = useState('');
    const [applicationEmail, setApplicationEmail] = useState('');

    const defaultDeadline = () => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    };
    const [applicationDeadline, setApplicationDeadline] = useState(defaultDeadline());

    // Quota & Premium Limits (Requirement: 3 free jobs, upgrade for 20, 50, 100 jobs)
    const [quotaData, setQuotaData] = useState(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    useEffect(() => {
        fetchEmployerQuota();
        fetchGeoPermissions();
    }, [currentUser]);

    async function fetchGeoPermissions() {
        try {
            const res = await fetch('http://localhost:5000/api/settings/public');
            if (res.ok) {
                const data = await res.json();
                setGeoEmployerAccess(data.geotag_employer_access !== 'false' && data.geotag_enabled !== 'false');
            }
        } catch (e) {}
    }

    async function fetchEmployerQuota() {
        try {
            const token = localStorage.getItem('mock_current_session') ? JSON.parse(localStorage.getItem('mock_current_session')).token : null;
            const res = await fetch('http://localhost:5000/api/subscriptions/employer-quota', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuotaData(data);
            }
        } catch (e) {}
    }

    // States for UI
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Job Title common suggestions
    const titleSuggestions = [
        'Software Developer', 'Digital Marketing Executive', 'Data Analyst',
        'HR Executive', 'Frontend Developer', 'Accountant', 'Full Stack Engineer',
        'Sales Manager', 'UI/UX Designer', 'Business Development Manager'
    ];

    // Options Arrays
    const jobTypesList = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Temporary', 'Freelance'];
    const experienceTypesList = ['Any Experience', 'Fresher Only', 'Experienced Only', '0–1 Years', '1–3 Years', '3–5 Years', '5+ Years'];
    const educationOptions = ['10th', '12th', 'Diploma', 'Any Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'Other'];
    const allBenefits = ['Health Insurance', 'PF', 'ESI', 'Paid Leave', 'Bonus', 'Performance Incentive', 'Transport', 'Food', 'Accommodation', 'Work From Home', 'Flexible Working Hours'];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Skill Tag Handlers
    function handleAddSkill() {
        if (!currentSkillInput.trim()) return;
        if (!requiredSkills.includes(currentSkillInput.trim())) {
            setRequiredSkills([...requiredSkills, currentSkillInput.trim()]);
        }
        setCurrentSkillInput('');
    }

    function handleRemoveSkill(skillToRemove) {
        setRequiredSkills(requiredSkills.filter(s => s !== skillToRemove));
    }

    function handleAddPreferredSkill() {
        if (!currentPreferredInput.trim()) return;
        if (!preferredSkills.includes(currentPreferredInput.trim())) {
            setPreferredSkills([...preferredSkills, currentPreferredInput.trim()]);
        }
        setCurrentPreferredInput('');
    }

    function handleRemovePreferredSkill(skillToRemove) {
        setPreferredSkills(preferredSkills.filter(s => s !== skillToRemove));
    }

    // Dynamic Responsibility Builder
    function handleAddResponsibility() {
        if (!newRespInput.trim()) return;
        setResponsibilities([...responsibilities, newRespInput.trim()]);
        setNewRespInput('');
    }

    function handleRemoveResponsibility(index) {
        setResponsibilities(responsibilities.filter((_, i) => i !== index));
    }

    // Days shortcut buttons
    function handleSelectWeekdays() {
        setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    }
    function handleSelectMondayToSaturday() {
        setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    }

    function toggleDay(day) {
        if (workingDays.includes(day)) {
            setWorkingDays(workingDays.filter(d => d !== day));
        } else {
            setWorkingDays([...workingDays, day]);
        }
    }

    function toggleBenefit(benefit) {
        if (selectedBenefits.includes(benefit)) {
            setSelectedBenefits(selectedBenefits.filter(b => b !== benefit));
        } else {
            setSelectedBenefits([...selectedBenefits, benefit]);
        }
    }

    function toggleEducation(edu) {
        if (selectedEducation.includes(edu)) {
            setSelectedEducation(selectedEducation.filter(e => e !== edu));
        } else {
            setSelectedEducation([...selectedEducation, edu]);
        }
    }

    // Form Validation (Requirement 15)
    function validatePayload() {
        if (!jobTitle.trim()) return 'Please enter a job title.';
        if (!jobType) return 'Please select a job type.';
        if (numberOfOpenings < 1 || isNaN(numberOfOpenings)) return 'Number of openings must be at least 1.';
        if (requiredSkills.length === 0) return 'Please add at least one required skill.';
        if (!jobDescription.trim()) return 'Please enter a job description.';
        if (!applicationDeadline) return 'Please select an application deadline.';

        const today = new Date().toISOString().split('T')[0];
        if (applicationDeadline < today) {
            return 'Application deadline cannot be in the past.';
        }

        if (locationType === 'On-site' && !city.trim()) {
            return 'City is required for on-site job locations.';
        }

        if (applicationMethod === 'External Application Link' && !applicationUrl.trim()) {
            return 'Please provide a valid application URL.';
        }

        if (applicationMethod === 'Company Email' && !applicationEmail.trim()) {
            return 'Please provide a valid application email address.';
        }

        return null;
    }

    // Build Payload Object
    function getJobPayload(status = 'active') {
        const fullLocation = [city, state, country].filter(Boolean).join(', ') || 'Remote';
        const formattedSalary = minSalary && maxSalary
            ? `₹${Number(minSalary).toLocaleString('en-IN')} - ₹${Number(maxSalary).toLocaleString('en-IN')} / ${salaryType.toLowerCase()}`
            : 'Salary Negotiable';

        return {
            job_id: `JOB-${Date.now()}`,
            jobId: `JOB-${Date.now()}`,
            employer_id: currentUser?.uid || userData?.id,
            employerId: currentUser?.uid || userData?.id,
            company_id: userData?.company_id || currentUser?.uid,
            companyId: currentUser?.uid,
            job_type: jobType,
            jobType: jobType,
            job_title: jobTitle,
            title: jobTitle,
            jobTitle: jobTitle,
            job_location: fullLocation,
            location: fullLocation,
            location_type: locationType,
            number_of_openings: Number(numberOfOpenings),
            experience_type: experienceType,
            minimum_experience: minExperience,
            maximum_experience: maxExperience,
            experience: experienceType === 'Experienced Only' ? `${minExperience}-${maxExperience} Years` : experienceType,
            education: selectedEducation.join(', '),
            qualification: selectedEducation.join(', '),
            required_skills: requiredSkills.join(', '),
            skills: requiredSkills.join(', '),
            preferred_skills: preferredSkills.join(', '),
            gender_preference: genderPreference,
            minimum_age: minAge,
            maximum_age: maxAge,
            minimum_salary: minSalary,
            maximum_salary: maxSalary,
            salary: formattedSalary,
            salaryRange: formattedSalary,
            salary_type: salaryType,
            salary_negotiable: salaryNegotiable,
            job_description: jobDescription,
            description: jobDescription,
            jobDescription: jobDescription,
            responsibilities: JSON.stringify(responsibilities),
            working_days: workingDays.join(', '),
            start_time: startTime,
            end_time: endTime,
            shift_type: shiftType,
            working_hours: workingHours,
            company_name: companyName,
            companyName: companyName,
            company_logo: companyLogo,
            companyLogo: companyLogo,
            contact_person_name: contactPersonName,
            company_phone: companyPhone,
            company_email: companyEmail,
            company_website: companyWebsite,
            about_company: aboutCompany,
            hiring_timeline: hiringTimeline,
            hiring_frequency: hiringFrequency,
            hiring_priority: hiringPriority,
            building_name: buildingName,
            door_number: doorNumber,
            street: street,
            area: area,
            city: city,
            district: district,
            state: state,
            country: country,
            pincode: pincode,
            benefits: selectedBenefits.join(', '),
            notice_period: noticePeriod,
            joining_date: joiningDate,
            application_method: applicationMethod,
            application_url: applicationUrl,
            application_email: applicationEmail,
            application_deadline: applicationDeadline,
            deadline: applicationDeadline,
            latitude: latitude || '',
            longitude: longitude || '',
            geo_address: geoAddress || fullLocation,
            geo_radius: Number(geoRadius) || 25,
            is_public: isPublic,
            application_questions: applicationQuestions,
            applicationQuestions: applicationQuestions,
            status: status,
            jobStatus: status,
            posted_at: new Date().toISOString()
        };
    }

    // Save as Draft (Requirement 13)
    async function handleSaveDraft(e) {
        if (e) e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const payload = getJobPayload('draft');
            await createJob(payload);
            setSuccessMsg('Job saved as Draft! You can edit and publish it anytime from Manage Jobs.');
            setTimeout(() => navigate('/company/manage-jobs'), 1500);
        } catch (err) {
            setErrorMsg('Failed to save draft. Please try again.');
        }
        setLoading(false);
    }

    // Publish Job (Requirement 15)
    async function handlePublish(e) {
        if (e) e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        const valErr = validatePayload();
        if (valErr) {
            setErrorMsg(valErr);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (quotaData && !quotaData.canPostMore) {
            setIsUpgradeModalOpen(true);
            return;
        }

        setLoading(true);
        try {
            const payload = getJobPayload('active');
            const createdId = await createJob(payload);
            setSuccessMsg('🎉 Job Posted Successfully! Candidates can now search and apply.');
            setTimeout(() => navigate('/company/manage-jobs'), 1600);
        } catch (err) {
            setErrorMsg('Failed to publish job. Please try again.');
        }
        setLoading(false);
    }

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '30px 20px 80px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Back Button & Page Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/company/manage-jobs')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={handleSaveDraft} className="btn btn-secondary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FiSave /> Save as Draft
                        </button>
                        <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe' }}>
                            <FiEye /> Preview Job
                        </button>
                        <button type="button" onClick={handlePublish} className="btn btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 24px' }}>
                            <FiPlus /> {loading ? 'Publishing...' : 'Publish Job'}
                        </button>
                    </div>
                </div>

                {/* Job Quota Status Banner */}
                {quotaData && (
                    <div style={{
                        background: quotaData.canPostMore ? '#f5f3ff' : '#fef2f2',
                        border: `1.5px solid ${quotaData.canPostMore ? '#ddd6fe' : '#fca5a5'}`,
                        borderRadius: '18px', padding: '18px 24px', marginBottom: '24px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: quotaData.canPostMore ? '#ede9fe' : '#fee2e2', color: quotaData.canPostMore ? '#7c3aed' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                <FiBriefcase />
                            </div>
                            <div>
                                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                                    Job Posting Quota: {quotaData.postedCount} of {quotaData.allowedLimit >= 9999 ? 'Unlimited' : quotaData.allowedLimit} Jobs Used
                                </strong>
                                <span style={{ display: 'block', fontSize: '0.82rem', color: '#64748b' }}>
                                    Current Plan: <strong>{quotaData.activePlanName}</strong> {!quotaData.isPremium && `(Free Limit: ${quotaData.freeLimit} Jobs)`}
                                </span>
                            </div>
                        </div>

                        {!quotaData.canPostMore ? (
                            <button
                                type="button"
                                onClick={() => setIsUpgradeModalOpen(true)}
                                style={{
                                    background: '#dc2626', color: 'white', border: 'none',
                                    padding: '8px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                                }}
                            >
                                ⚡ Limit Reached — Upgrade Plan
                            </button>
                        ) : (
                            <Link
                                to="/company/subscriptions"
                                style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7c3aed', textDecoration: 'none' }}
                            >
                                View Premium Packages (20, 50, 100 Jobs) →
                            </Link>
                        )}
                    </div>
                )}

                <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                            <FiBriefcase />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Post a New Job</h1>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.92rem' }}>Fill out the details below to create an active job listing for job seekers</p>
                        </div>
                    </div>
                </div>

                {errorMsg && (
                    <div style={{ padding: '16px 20px', borderRadius: '16px', background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <FiAlertCircle size={22} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: '16px 20px', borderRadius: '16px', background: '#f0fdf4', border: '1.5px solid #86efac', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <FiCheckCircle size={22} />
                        <span>{successMsg}</span>
                    </div>
                )}

                <form onSubmit={handlePublish}>

                    {/* SECTION 1: JOB INFORMATION (Requirement 2) */}
                    <div style={cardStyle}>
                        <h3 style={sectionHeaderStyle}>
                            <FiBriefcase style={{ color: '#7c3aed' }} /> 1. Job Information
                        </h3>

                        {/* Job Type Selector */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Job Type *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                {jobTypesList.map(type => (
                                    <button
                                        type="button"
                                        key={type}
                                        onClick={() => setJobType(type)}
                                        style={{
                                            padding: '12px', borderRadius: '12px', border: '2px solid',
                                            borderColor: jobType === type ? '#7c3aed' : '#e2e8f0',
                                            background: jobType === type ? '#f5f3ff' : '#ffffff',
                                            color: jobType === type ? '#7c3aed' : '#475569',
                                            fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                                            transition: 'all 0.2s', textAlign: 'center'
                                        }}
                                    >
                                        {type} {jobType === type && '✓'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Job Title */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Job Title *</label>
                            <input
                                style={inputStyle}
                                value={jobTitle}
                                onChange={e => setJobTitle(e.target.value)}
                                placeholder="Enter job title (e.g. Software Developer, Data Analyst)"
                                required
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, alignSelf: 'center' }}>Suggestions:</span>
                                {titleSuggestions.map(sug => (
                                    <button
                                        type="button"
                                        key={sug}
                                        onClick={() => setJobTitle(sug)}
                                        style={{ background: '#f1f5f9', border: 'none', borderRadius: '16px', padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                                    >
                                        + {sug}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Work Location Type & Openings */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={labelStyle}>Work Location Type *</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['On-site', 'Remote', 'Hybrid'].map(mode => (
                                        <button
                                            type="button"
                                            key={mode}
                                            onClick={() => setLocationType(mode)}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                                                borderColor: locationType === mode ? '#7c3aed' : '#cbd5e1',
                                                background: locationType === mode ? '#f5f3ff' : '#ffffff',
                                                color: locationType === mode ? '#7c3aed' : '#475569',
                                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                                            }}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Number of Openings *</label>
                                <input
                                    type="number"
                                    min="1"
                                    style={inputStyle}
                                    value={numberOfOpenings}
                                    onChange={e => setNumberOfOpenings(Math.max(1, parseInt(e.target.value) || 1))}
                                    required
                                />
                            </div>
                        </div>

                        {/* City, State, Country, Pincode */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>City {locationType === 'On-site' && '*'}</label>
                                <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Chennai" required={locationType === 'On-site'} />
                            </div>
                            <div>
                                <label style={labelStyle}>State</label>
                                <input style={inputStyle} value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Tamil Nadu" />
                            </div>
                            <div>
                                <label style={labelStyle}>Country</label>
                                <input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} placeholder="India" />
                            </div>
                            <div>
                                <label style={labelStyle}>Pincode</label>
                                <input style={inputStyle} value={pincode} onChange={e => setPincode(e.target.value)} placeholder="600001" />
                            </div>
                        </div>

                        {/* Geo-Tag Exact Coordinates Pinpoint (Requirement for Location-Based matching) */}
                        {geoEmployerAccess && (
                            <div style={{
                                marginTop: '20px',
                                padding: '18px 20px',
                                background: '#f8fafc',
                                borderRadius: '14px',
                                border: '1.5px dashed #93c5fd'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FiMapPin size={16} />
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>Job Geo-Tagging & GPS Coordinates</strong>
                                            <span style={{ fontSize: '0.74rem', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '6px', marginLeft: '6px', fontWeight: 700 }}>
                                                Location Match Active
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (navigator.geolocation) {
                                                setDetectingGps(true);
                                                navigator.geolocation.getCurrentPosition(
                                                    (pos) => {
                                                        setLatitude(String(pos.coords.latitude.toFixed(6)));
                                                        setLongitude(String(pos.coords.longitude.toFixed(6)));
                                                        setGeoAddress(city ? `${city}, ${state}` : 'Current Office Location');
                                                        setDetectingGps(false);
                                                    },
                                                    () => {
                                                        // Demo Bangalore fallback
                                                        setLatitude('12.9716');
                                                        setLongitude('77.5946');
                                                        setGeoAddress('Bangalore Metro Office');
                                                        setDetectingGps(false);
                                                    }
                                                );
                                            }
                                        }}
                                        style={{
                                            background: '#2563eb', color: '#ffffff', border: 'none',
                                            padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem',
                                            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        {detectingGps ? 'Locating...' : '📍 Auto-Detect Office GPS'}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Latitude (Decimal)</label>
                                        <input
                                            style={{ ...inputStyle, padding: '8px 12px', fontSize: '0.85rem' }}
                                            value={latitude}
                                            onChange={e => setLatitude(e.target.value)}
                                            placeholder="e.g. 12.9716"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Longitude (Decimal)</label>
                                        <input
                                            style={{ ...inputStyle, padding: '8px 12px', fontSize: '0.85rem' }}
                                            value={longitude}
                                            onChange={e => setLongitude(e.target.value)}
                                            placeholder="e.g. 77.5946"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Applicant Radius Match (km)</label>
                                        <select
                                            style={{ ...inputStyle, padding: '8px 12px', fontSize: '0.85rem' }}
                                            value={geoRadius}
                                            onChange={e => setGeoRadius(e.target.value)}
                                        >
                                            <option value="5">5 km (Local)</option>
                                            <option value="10">10 km (City Area)</option>
                                            <option value="25">25 km (Standard Commute)</option>
                                            <option value="50">50 km (Regional)</option>
                                            <option value="100">100 km (State-wide)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Quick Presets */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Presets:</span>
                                    {[
                                        { name: 'Bangalore', lat: '12.9716', lng: '77.5946' },
                                        { name: 'Mumbai', lat: '19.0760', lng: '72.8777' },
                                        { name: 'Delhi NCR', lat: '28.6139', lng: '77.2090' },
                                        { name: 'Chennai', lat: '13.0827', lng: '80.2707' },
                                        { name: 'Hyderabad', lat: '17.3850', lng: '78.4867' }
                                    ].map(p => (
                                        <button
                                            type="button"
                                            key={p.name}
                                            onClick={() => {
                                                setLatitude(p.lat);
                                                setLongitude(p.lng);
                                                setGeoAddress(p.name);
                                            }}
                                            style={{
                                                background: '#ffffff', border: '1px solid #cbd5e1',
                                                padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem',
                                                color: '#334155', fontWeight: 600, cursor: 'pointer'
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: CANDIDATE REQUIREMENTS (Requirement 3) */}
                    <div style={cardStyle}>
                        <h3 style={sectionHeaderStyle}>
                            <FiUsers style={{ color: '#7c3aed' }} /> 2. Candidate Requirements
                        </h3>

                        {/* Total Experience */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Total Experience *</label>
                            <select style={inputStyle} value={experienceType} onChange={e => setExperienceType(e.target.value)}>
                                {experienceTypesList.map(exp => (
                                    <option key={exp} value={exp}>{exp}</option>
                                ))}
                            </select>

                            {/* Conditional Min & Max Experience Range */}
                            {experienceType === 'Experienced Only' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <label style={labelStyle}>Minimum Experience (Years)</label>
                                        <input type="number" min="0" style={inputStyle} value={minExperience} onChange={e => setMinExperience(e.target.value)} placeholder="e.g. 2" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Maximum Experience (Years)</label>
                                        <input type="number" min="0" style={inputStyle} value={maxExperience} onChange={e => setMaxExperience(e.target.value)} placeholder="e.g. 5" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Educational Qualification (Multi-select) */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Educational Qualification (Select multiple)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {educationOptions.map(edu => {
                                    const isSelected = selectedEducation.includes(edu);
                                    return (
                                        <button
                                            type="button"
                                            key={edu}
                                            onClick={() => toggleEducation(edu)}
                                            style={{
                                                padding: '8px 14px', borderRadius: '20px', border: '1.5px solid',
                                                borderColor: isSelected ? '#7c3aed' : '#cbd5e1',
                                                background: isSelected ? '#7c3aed' : '#ffffff',
                                                color: isSelected ? '#ffffff' : '#475569',
                                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                                            }}
                                        >
                                            {edu} {isSelected && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Required Skills Tag Input (Requirement 3) */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Required Skills * (Type skill and press Add)</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                <input
                                    style={{ flex: 1, ...inputStyle }}
                                    value={currentSkillInput}
                                    onChange={e => setCurrentSkillInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                                    placeholder="e.g. Python, React.js, SQL"
                                />
                                <button type="button" onClick={handleAddSkill} className="btn btn-secondary" style={{ padding: '0 20px', fontWeight: 700 }}>
                                    + Add
                                </button>
                            </div>

                            {/* Skill Tag Pills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {requiredSkills.map(skill => (
                                    <span key={skill} style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        {skill}
                                        <FiX style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(skill)} />
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Gender Preference & Age Range */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Gender Preference</label>
                                <select style={inputStyle} value={genderPreference} onChange={e => setGenderPreference(e.target.value)}>
                                    <option value="Any">Any (Default)</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Minimum Age (Optional)</label>
                                <input type="number" min="18" style={inputStyle} value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="e.g. 21" />
                            </div>
                            <div>
                                <label style={labelStyle}>Maximum Age (Optional)</label>
                                <input type="number" min="18" style={inputStyle} value={maxAge} onChange={e => setMaxAge(e.target.value)} placeholder="e.g. 45" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: SALARY DETAILS (Requirement 4) */}
                    <div style={cardStyle}>
                        <h3 style={sectionHeaderStyle}>
                            <FiDollarSign style={{ color: '#7c3aed' }} /> 3. Salary Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={labelStyle}>Minimum Salary (₹) *</label>
                                <input type="number" style={inputStyle} value={minSalary} onChange={e => setMinSalary(e.target.value)} placeholder="15000" required />
                            </div>
                            <div>
                                <label style={labelStyle}>Maximum Salary (₹) *</label>
                                <input type="number" style={inputStyle} value={maxSalary} onChange={e => setMaxSalary(e.target.value)} placeholder="35000" required />
                            </div>
                            <div>
                                <label style={labelStyle}>Salary Period</label>
                                <select style={inputStyle} value={salaryType} onChange={e => setSalaryType(e.target.value)}>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Annual">Annual (LPA)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="checkbox"
                                id="salaryNeg"
                                checked={salaryNegotiable}
                                onChange={e => setSalaryNegotiable(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="salaryNeg" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                                Salary Negotiable
                            </label>
                        </div>
                    </div>

                    {/* SECTION 4: JOB DESCRIPTION & RESPONSIBILITIES (Requirement 5) */}
                    <div style={cardStyle}>
                        <h3 style={sectionHeaderStyle}>
                            <FiFileText style={{ color: '#7c3aed' }} /> 4. Job Description & Responsibilities
                        </h3>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Job Description *</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '140px', lineHeight: 1.6 }}
                                value={jobDescription}
                                onChange={e => setJobDescription(e.target.value)}
                                placeholder="Describe the role, responsibilities and expectations..."
                                required
                            />
                        </div>

                        {/* Dynamic Key Responsibilities */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Key Responsibilities</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                <input
                                    style={{ flex: 1, ...inputStyle }}
                                    value={newRespInput}
                                    onChange={e => setNewRespInput(e.target.value)}
                                    placeholder="Add a key responsibility..."
                                />
                                <button type="button" onClick={handleAddResponsibility} className="btn btn-secondary" style={{ fontWeight: 700 }}>
                                    + Add Responsibility
                                </button>
                            </div>

                            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                {responsibilities.map((resp, i) => (
                                    <li key={i} style={{ marginBottom: '8px', fontSize: '0.92rem', color: '#334155', fontWeight: 600 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{resp}</span>
                                            <FiX style={{ cursor: 'pointer', color: '#ef4444', marginLeft: '10px' }} onClick={() => handleRemoveResponsibility(i)} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Preferred Skills */}
                        <div>
                            <label style={labelStyle}>Preferred Skills (Optional)</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                <input
                                    style={{ flex: 1, ...inputStyle }}
                                    value={currentPreferredInput}
                                    onChange={e => setCurrentPreferredInput(e.target.value)}
                                    placeholder="e.g. AWS, Docker"
                                />
                                <button type="button" onClick={handleAddPreferredSkill} className="btn btn-secondary" style={{ fontWeight: 700 }}>
                                    + Add
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {preferredSkills.map(skill => (
                                    <span key={skill} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        {skill}
                                        <FiX style={{ cursor: 'pointer' }} onClick={() => handleRemovePreferredSkill(skill)} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: JOB TIMINGS (Requirement 6) */}
                    <div style={cardStyle}>
                        <h3 style={sectionHeaderStyle}>
                            <FiClock style={{ color: '#7c3aed' }} /> 5. Job Timings & Shift
                        </h3>

                        {/* Working Days */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={labelStyle}>Working Days</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="button" onClick={handleSelectWeekdays} style={shortcutBtnStyle}>Monday–Friday</button>
                                    <button type="button" onClick={handleSelectMondayToSaturday} style={shortcutBtnStyle}>Monday–Saturday</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {daysOfWeek.map(day => {
                                    const isSel = workingDays.includes(day);
                                    return (
                                        <button
                                            type="button"
                                            key={day}
                                            onClick={() => toggleDay(day)}
                                            style={{
                                                padding: '8px 14px', borderRadius: '10px', border: '1.5px solid',
                                                borderColor: isSel ? '#7c3aed' : '#cbd5e1',
                                                background: isSel ? '#f5f3ff' : '#ffffff',
                                                color: isSel ? '#7c3aed' : '#475569',
                                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                                            }}
                                        >
                                            {day} {isSel && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Shift & Timing */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Start Time</label>
                                <input type="time" style={inputStyle} value={startTime} onChange={e => setStartTime(e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>End Time</label>
                                <input type="time" style={inputStyle} value={endTime} onChange={e => setEndTime(e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Shift Type</label>
                                <select style={inputStyle} value={shiftType} onChange={e => setShiftType(e.target.value)}>
                                    <option value="Day Shift">Day Shift</option>
                                    <option value="Night Shift">Night Shift</option>
                                    <option value="Rotational Shift">Rotational Shift</option>
                                    <option value="Flexible Shift">Flexible Shift</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Working Hours</label>
                                <input style={inputStyle} value={workingHours} onChange={e => setWorkingHours(e.target.value)} placeholder="e.g. 8 hours/day" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 6: ABOUT COMPANY - AUTO LOADED (Requirement 7) */}
                    <div style={{ ...cardStyle, border: '2px solid #ddd6fe', background: '#faf5ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ ...sectionHeaderStyle, margin: 0 }}>
                                <FiBriefcase style={{ color: '#7c3aed' }} /> 6. About Company (Auto-Loaded)
                            </h3>

                            <Link to="/company/profile" target="_blank" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7c3aed', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FiEdit3 /> Edit Company Profile
                            </Link>
                        </div>
                        <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#64748b' }}>
                            Company information is automatically fetched from your employer profile and attached to this job posting.
                        </p>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#7c3aed', fontSize: '1.5rem', flexShrink: 0 }}>
                                {companyLogo ? <img src={companyLogo} alt={companyName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : companyName[0]}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>{companyName}</h4>
                                <p style={{ margin: '0 0 6px', fontSize: '0.88rem', color: '#64748b' }}>
                                    Recruiter: <strong>{contactPersonName}</strong> • Phone: <strong>{companyPhone}</strong> • Email: <strong>{companyEmail}</strong>
                                </p>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>"{aboutCompany.substring(0, 150)}..."</p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 7: HIRING INFORMATION (Requirement 8) */}
                    <div style={cardStyle}>
                        <h3 style={sectionHeaderStyle}>
                            <FiAward style={{ color: '#7c3aed' }} /> 7. Hiring Information & Priority
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>How soon do you want to fill the position? *</label>
                                <select style={inputStyle} value={hiringTimeline} onChange={e => setHiringTimeline(e.target.value)}>
                                    <option value="Immediately">Immediately</option>
                                    <option value="Within 1 Week">Within 1 Week</option>
                                    <option value="1–2 Weeks">1–2 Weeks</option>
                                    <option value="2–4 Weeks">2–4 Weeks</option>
                                    <option value="Within 1 Month">Within 1 Month</option>
                                    <option value="More than 1 Month">More than 1 Month</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>How often do you need to hire? *</label>
                                <select style={inputStyle} value={hiringFrequency} onChange={e => setHiringFrequency(e.target.value)}>
                                    <option value="One-time Hiring">One-time Hiring</option>
                                    <option value="Occasionally">Occasionally</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Frequently / Continuous Hiring">Frequently / Continuous Hiring</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Hiring Priority *</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['Normal', 'Urgent'].map(prio => (
                                        <button
                                            type="button"
                                            key={prio}
                                            onClick={() => setHiringPriority(prio)}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                                                borderColor: hiringPriority === prio ? (prio === 'Urgent' ? '#ef4444' : '#7c3aed') : '#cbd5e1',
                                                background: hiringPriority === prio ? (prio === 'Urgent' ? '#fef2f2' : '#f5f3ff') : '#ffffff',
                                                color: hiringPriority === prio ? (prio === 'Urgent' ? '#ef4444' : '#7c3aed') : '#475569',
                                                fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                                            }}
                                        >
                                            {prio === 'Urgent' ? '🔥 Urgent Hiring' : 'Normal'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 8: ADDITIONAL DETAILS & BENEFITS (Requirement 10) */}
                    <div style={cardStyle}>
                        <h3 style={sectionHeaderStyle}>
                            <FiTag style={{ color: '#7c3aed' }} /> 8. Benefits & Notice Period
                        </h3>

                        {/* Benefits Multi-select */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Perks & Benefits (Select multiple)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {allBenefits.map(ben => {
                                    const isSel = selectedBenefits.includes(ben);
                                    return (
                                        <button
                                            type="button"
                                            key={ben}
                                            onClick={() => toggleBenefit(ben)}
                                            style={{
                                                padding: '8px 14px', borderRadius: '20px', border: '1.5px solid',
                                                borderColor: isSel ? '#10b981' : '#cbd5e1',
                                                background: isSel ? '#f0fdf4' : '#ffffff',
                                                color: isSel ? '#166534' : '#475569',
                                                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
                                            }}
                                        >
                                            {ben} {isSel && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Notice Period Preference</label>
                                <select style={inputStyle} value={noticePeriod} onChange={e => setNoticePeriod(e.target.value)}>
                                    <option value="Immediate Joiner">Immediate Joiner</option>
                                    <option value="7 Days">7 Days</option>
                                    <option value="15 Days">15 Days</option>
                                    <option value="30 Days">30 Days</option>
                                    <option value="60 Days">60 Days</option>
                                    <option value="90 Days">90 Days</option>
                                    <option value="Negotiable">Negotiable</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Target Joining Date (Optional)</label>
                                <input type="date" style={inputStyle} value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 10: APPLICATION SCREENING QUESTIONS (Requirement 3) */}
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ ...sectionHeaderStyle, margin: '0 0 4px' }}>
                                    <FiHelpCircle style={{ color: '#7c3aed' }} /> 10. Application Screening Questions
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                    Add 3–5 short questions candidates must answer when clicking "Apply Now". If not customized, questions will be auto-generated based on role requirements.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={handleAutoSuggestQuestions}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.82rem', padding: '8px 14px', background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}
                                >
                                    ✨ Auto-Generate Suggestions
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddCustomQuestion}
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                                >
                                    <FiPlus /> Add Question
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {applicationQuestions.map((q, qIdx) => (
                                <div
                                    key={q.id || qIdx}
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        padding: '18px',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                                        <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.85rem' }}>
                                            Question #{qIdx + 1} {q.isAvailability && <span style={{ color: '#0ea5e9', fontWeight: 600 }}>(Candidate Availability)</span>}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteQuestion(qIdx)}
                                            style={{
                                                border: 'none',
                                                background: '#fee2e2',
                                                color: '#ef4444',
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Delete Question"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '0.78rem' }}>Question Text *</label>
                                            <input
                                                type="text"
                                                style={inputStyle}
                                                value={q.question}
                                                onChange={e => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                                                placeholder="e.g. How many years of experience do you have?"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ ...labelStyle, fontSize: '0.78rem' }}>Question Type</label>
                                            <select
                                                style={inputStyle}
                                                value={q.type}
                                                onChange={e => {
                                                    const newType = e.target.value;
                                                    let newOpts = q.options;
                                                    if (newType === 'yes_no' || (newType === 'multiple_choice' && (!newOpts || newOpts.length === 0))) {
                                                        newOpts = ['Yes', 'No'];
                                                    }
                                                    handleUpdateQuestion(qIdx, 'type', newType);
                                                    if (newOpts) handleUpdateQuestion(qIdx, 'options', newOpts);
                                                }}
                                            >
                                                <option value="multiple_choice">Multiple Choice (Single Option)</option>
                                                <option value="multi_select">Multi-Select (Multiple Options)</option>
                                                <option value="short_text">Short Text Answer</option>
                                                <option value="yes_no">Yes / No</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Options configuration for Multiple Choice & Multi-select */}
                                    {(q.type === 'multiple_choice' || q.type === 'multi_select') && (
                                        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                            <label style={{ ...labelStyle, fontSize: '0.75rem', marginBottom: '8px' }}>Answer Options</label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {(q.options || []).map((opt, optIdx) => (
                                                    <div key={optIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: '18px' }}>{optIdx + 1}.</span>
                                                        <input
                                                            type="text"
                                                            style={{ ...inputStyle, padding: '6px 10px', fontSize: '0.85rem' }}
                                                            value={opt}
                                                            onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                                            placeholder={`Option ${optIdx + 1}`}
                                                            required
                                                        />
                                                        {(q.options || []).length > 2 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteOption(qIdx, optIdx)}
                                                                style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                                            >
                                                                <FiX size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddOption(qIdx)}
                                                    style={{
                                                        border: '1px dashed #cbd5e1',
                                                        background: '#f8fafc',
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        color: '#7c3aed',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        alignSelf: 'flex-start',
                                                        marginTop: '4px'
                                                    }}
                                                >
                                                    + Add Another Option
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 11: APPLICATION SETTINGS & DEADLINE (Requirement 11 & 12) */}
                    <div style={cardStyle}>
                        <h3 style={sectionHeaderStyle}>
                            <FiGlobe style={{ color: '#7c3aed' }} /> 11. Application Settings & Deadline
                        </h3>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>How should candidates apply? *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                {[
                                    'Apply through Job Portal',
                                    'External Application Link',
                                    'Company Email'
                                ].map(method => (
                                    <button
                                        type="button"
                                        key={method}
                                        onClick={() => setApplicationMethod(method)}
                                        style={{
                                            padding: '12px', borderRadius: '12px', border: '1.5px solid',
                                            borderColor: applicationMethod === method ? '#7c3aed' : '#cbd5e1',
                                            background: applicationMethod === method ? '#f5f3ff' : '#ffffff',
                                            color: applicationMethod === method ? '#7c3aed' : '#475569',
                                            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                                        }}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>

                            {applicationMethod === 'External Application Link' && (
                                <div style={{ marginTop: '14px' }}>
                                    <label style={labelStyle}>Application URL *</label>
                                    <input type="url" style={inputStyle} value={applicationUrl} onChange={e => setApplicationUrl(e.target.value)} placeholder="https://careers.company.com/apply/..." required />
                                </div>
                            )}

                            {applicationMethod === 'Company Email' && (
                                <div style={{ marginTop: '14px' }}>
                                    <label style={labelStyle}>Application Email *</label>
                                    <input type="email" style={inputStyle} value={applicationEmail} onChange={e => setApplicationEmail(e.target.value)} placeholder="jobs@company.com" required />
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={labelStyle}>Application Deadline * (Must be today or future date)</label>
                            <input
                                type="date"
                                style={inputStyle}
                                value={applicationDeadline}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setApplicationDeadline(e.target.value)}
                                required
                            />
                            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                                The job listing will automatically expire after this date.
                            </p>
                        </div>
                    </div>

                    {/* SECTION 10: ACTION BUTTONS (Requirement 13, 14, 15) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={handleSaveDraft} className="btn btn-secondary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <FiSave /> Save as Draft
                        </button>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe' }}>
                                <FiEye /> Preview Job
                            </button>

                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 32px', fontSize: '1rem', fontWeight: 800 }}>
                                <FiPlus /> {loading ? 'Publishing...' : 'Publish Job Now'}
                            </button>
                        </div>
                    </div>

                </form>

                {/* ── JOB PREVIEW MODAL MOCKUP (Requirement 14) ── */}
                {isPreviewOpen && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
                        <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>👁️ Job Listing Preview (Candidate View)</h3>
                                <button onClick={() => setIsPreviewOpen(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                                    <FiX size={18} />
                                </button>
                            </div>

                            <div style={{ padding: '28px' }}>
                                {/* Header Card */}
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.8rem', overflow: 'hidden' }}>
                                        {companyLogo ? <img src={companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : companyName[0]}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{jobTitle || 'Job Title'}</h2>
                                            {hiringPriority === 'Urgent' && (
                                                <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '2px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 800 }}>
                                                    🔥 Urgent Hiring
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 700, color: '#7c3aed' }}>{companyName}</p>
                                    </div>
                                </div>

                                {/* Overview Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                                    <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Job Type</span><p style={previewValStyle}>{jobType}</p></div>
                                    <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Location</span><p style={previewValStyle}>{city || 'Remote'} ({locationType})</p></div>
                                    <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Salary</span><p style={previewValStyle}>₹{Number(minSalary).toLocaleString('en-IN')} - ₹{Number(maxSalary).toLocaleString('en-IN')}</p></div>
                                    <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Experience</span><p style={previewValStyle}>{experienceType}</p></div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={previewHeaderStyle}>Required Skills</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {requiredSkills.map(s => (
                                            <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 700 }}>{s}</span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={previewHeaderStyle}>Job Description</h4>
                                    <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{jobDescription}</p>
                                </div>

                                {responsibilities.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={previewHeaderStyle}>Key Responsibilities</h4>
                                        <ul style={{ paddingLeft: '20px', margin: 0, color: '#334155', fontSize: '0.9rem' }}>
                                            {responsibilities.map((r, i) => <li key={i} style={{ marginBottom: '6px' }}>{r}</li>)}
                                        </ul>
                                    </div>
                                )}

                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={previewHeaderStyle}>About {companyName}</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#475569' }}>{aboutCompany}</p>
                                </div>
                            </div>

                            <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsPreviewOpen(false)}>Back to Edit</button>
                                <button type="button" className="btn btn-primary" onClick={handlePublish} disabled={loading}>Publish Job Now</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── JOB LIMIT REACHED UPGRADE MODAL (Requirement) ── */}
                {isUpgradeModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '20px' }}>
                        <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '620px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>
                                <FiBriefcase />
                            </div>

                            <h2 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                                Job Posting Limit Reached
                            </h2>

                            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
                                You have posted <strong>{quotaData?.postedCount || 3} of {quotaData?.allowedLimit || 3} jobs</strong> under your current plan ({quotaData?.activePlanName || 'Free Tier'}).
                                <br />
                                Upgrade to a <strong>Premium Employer Package</strong> to post 20, 50, or 100 jobs!
                            </p>

                            {/* Package Highlights */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 12px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Starter</span>
                                    <h4 style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>20 Jobs</h4>
                                    <strong style={{ color: '#7c3aed', fontSize: '0.9rem' }}>₹499/mo</strong>
                                </div>
                                <div style={{ background: '#f5f3ff', border: '2px solid #7c3aed', borderRadius: '16px', padding: '16px 12px', position: 'relative' }}>
                                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap' }}>POPULAR</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>Growth</span>
                                    <h4 style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>50 Jobs</h4>
                                    <strong style={{ color: '#7c3aed', fontSize: '0.9rem' }}>₹999/mo</strong>
                                </div>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 12px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Enterprise</span>
                                    <h4 style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>100 Jobs</h4>
                                    <strong style={{ color: '#7c3aed', fontSize: '0.9rem' }}>₹1,800/mo</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsUpgradeModalOpen(false)}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/company/subscriptions')}
                                    style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)' }}
                                >
                                    View Packages & Upgrade Now →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// Inline Styles
const cardStyle = {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
    marginBottom: '28px'
};

const sectionHeaderStyle = {
    margin: '0 0 20px',
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
};

const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#334155',
    marginBottom: '6px'
};

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.95rem',
    fontWeight: 600,
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#0f172a'
};

const shortcutBtnStyle = {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#7c3aed',
    cursor: 'pointer'
};

const previewHeaderStyle = {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '8px'
};

const previewValStyle = {
    margin: '2px 0 0',
    fontWeight: 800,
    fontSize: '0.92rem',
    color: '#0f172a'
};
