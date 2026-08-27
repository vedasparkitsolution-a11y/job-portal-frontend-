import React, { useState } from 'react';
import Button from '../common/Button';
import { auth, db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';
import { sendApplicationEmail, isEmailConfigured } from '../../../utils/career-analyzer/emailService';
import { triggerAutomation } from '../../../utils/career-analyzer/automationService';

const JobApplicationModal = ({ job, formData, onClose }) => {
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [error, setError] = useState('');
    const [emailStatus, setEmailStatus] = useState('');
    const [coverNote, setCoverNote] = useState('');

    // Generate real job portal search URLs
    const jobTitle = encodeURIComponent(job.title);
    const location = encodeURIComponent(formData.location || 'India');
    const jobPortals = [
        {
            name: 'LinkedIn Jobs',
            icon: '🔗',
            url: `https://www.linkedin.com/jobs/search/?keywords=${jobTitle}&location=${location}`,
            color: '#0A66C2',
            bgColor: 'rgba(10, 102, 194, 0.1)'
        },
        {
            name: 'Naukri',
            icon: '💼',
            url: `https://www.naukri.com/${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-jobs`,
            color: '#4A90D9',
            bgColor: 'rgba(74, 144, 217, 0.1)'
        },
        {
            name: 'Indeed',
            icon: '🔍',
            url: `https://in.indeed.com/jobs?q=${jobTitle}&l=${location}`,
            color: '#2164f3',
            bgColor: 'rgba(33, 100, 243, 0.1)'
        },
        {
            name: 'Glassdoor',
            icon: '🏢',
            url: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${jobTitle}`,
            color: '#0caa41',
            bgColor: 'rgba(12, 170, 65, 0.1)'
        }
    ];

    const portalButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1rem',
        borderRadius: '0.75rem',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.8rem',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        flex: '1 1 45%',
        justifyContent: 'center'
    };

    const handleApply = async () => {
        setApplying(true);
        setError('');
        try {
            const user = auth.currentUser;

            const applicationData = {
                jobTitle: job.title,
                jobDescription: job.description,
                matchPercentage: job.matchPercentage,
                salaryRange: job.salaryRange,
                companyType: job.companyType,
                industry: job.industry,
                matchedRequiredSkills: job.matchedRequired || [],
                matchedPreferredSkills: job.matchedPreferred || [],
                missingSkills: job.missingRequired || [],
                applicantName: formData.fullName || '',
                applicantEmail: formData.email || (user ? user.email : ''),
                applicantPhone: formData.phone || '',
                applicantLocation: formData.location || '',
                applicantSkills: formData.skills || [],
                coverNote: coverNote,
                resumeFileName: formData.resume ? formData.resume.name : 'No resume',
                userId: user ? user.uid : 'anonymous',
                userEmail: user ? user.email : 'anonymous',
                status: 'Applied',
                appliedAt: serverTimestamp()
            };

            // Save to Firestore
            await addDoc(collection(db, 'jobApplications'), applicationData);

            // Send email notification
            if (isEmailConfigured()) {
                const emailResult = await sendApplicationEmail({
                    userName: formData.fullName || 'User',
                    userEmail: formData.email || (user ? user.email : ''),
                    jobTitle: job.title,
                    matchPercentage: job.matchPercentage,
                    salaryRange: job.salaryRange,
                    companyType: job.companyType,
                    matchedSkills: (job.matchedRequired || []).join(', ')
                });
                setEmailStatus(emailResult.message);
            } else {
                setEmailStatus('Email notifications not configured yet.');
            }

            // Trigger n8n Automation
            await triggerAutomation('job_application', {
                jobTitle: job.title,
                studentName: formData.fullName,
                studentEmail: formData.email,
                matchPercentage: job.matchPercentage,
                salary: job.salaryRange
            });

            setApplied(true);
        } catch (err) {
            console.error('Application error:', err);
            setError('Failed to submit application. Please try again.');
        } finally {
            setApplying(false);
        }
    };

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
    };

    const modalStyle = {
        backgroundColor: 'var(--surface)',
        borderRadius: '1.5rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUp 0.3s ease-out'
    };

    const headerStyle = {
        background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
        color: 'white',
        padding: '2rem',
        borderRadius: '1.5rem 1.5rem 0 0'
    };

    const bodyStyle = {
        padding: '2rem'
    };

    const tagStyle = {
        display: 'inline-block',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        color: 'var(--primary)',
        padding: '0.2rem 0.6rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        margin: '0.15rem'
    };

    const missingTagStyle = {
        ...tagStyle,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444'
    };

    if (applied) {
        return (
            <div style={overlayStyle} onClick={onClose}>
                <div style={modalStyle} onClick={e => e.stopPropagation()}>
                    <div style={{ ...headerStyle, background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Application Submitted!</h2>
                        </div>
                    </div>
                    <div style={bodyStyle}>
                        <div style={{
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 'var(--radius)',
                            padding: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <p style={{ margin: 0, color: '#166534', fontWeight: '500' }}>
                                ✅ Your application for <strong>{job.title}</strong> has been saved successfully!
                            </p>
                        </div>

                        {emailStatus && (
                            <div style={{
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: 'var(--radius)',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <p style={{ margin: 0, color: '#1e40af', fontSize: '0.875rem' }}>
                                    📧 {emailStatus}
                                </p>
                            </div>
                        )}

                        {/* Real Job Portal Links */}
                        <div style={{
                            backgroundColor: '#fefce8',
                            border: '1px solid #fde68a',
                            borderRadius: 'var(--radius)',
                            padding: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <h4 style={{ margin: '0 0 0.75rem', color: '#854d0e', fontSize: '0.95rem' }}>🌐 Search Real Job Openings</h4>
                            <p style={{ margin: '0 0 0.75rem', color: '#a16207', fontSize: '0.8rem' }}>
                                Find real "{job.title}" positions on top job portals:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {jobPortals.map((portal, i) => (
                                    <a
                                        key={i}
                                        href={portal.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            ...portalButtonStyle,
                                            backgroundColor: portal.bgColor,
                                            color: portal.color
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = portal.color;
                                            e.target.style.color = 'white';
                                            e.target.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = portal.bgColor;
                                            e.target.style.color = portal.color;
                                            e.target.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {portal.icon} {portal.name}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <Button onClick={onClose}>Close</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Apply for {job.title}</h2>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>{job.companyType} • {job.industry}</p>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            fontSize: '1rem',
                            fontWeight: '700'
                        }}>
                            {job.matchPercentage}% Match
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div style={bodyStyle}>
                    {/* Job Info */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>📋 Job Description</h4>
                        <p style={{ color: 'var(--text-medium)', fontSize: '0.875rem', lineHeight: 1.6 }}>{job.description}</p>
                        <p style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '0.5rem' }}>💰 {job.salaryRange}</p>
                    </div>

                    {/* Matched Skills */}
                    {job.matchedRequired && job.matchedRequired.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>✅ Your Matching Skills</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {job.matchedRequired.map((skill, i) => (
                                    <span key={i} style={tagStyle}>{skill}</span>
                                ))}
                                {(job.matchedPreferred || []).map((skill, i) => (
                                    <span key={`p-${i}`} style={tagStyle}>{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing Skills */}
                    {job.missingRequired && job.missingRequired.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>📚 Skills to Develop</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {job.missingRequired.map((skill, i) => (
                                    <span key={i} style={missingTagStyle}>{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cover Note */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>✍️ Cover Note (Optional)</h4>
                        <textarea
                            value={coverNote}
                            onChange={(e) => setCoverNote(e.target.value)}
                            placeholder="Write a brief note about why you're interested in this role..."
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '0.75rem',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                fontSize: '0.875rem',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Applicant Info Summary */}
                    <div style={{
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: 'var(--radius)',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-dark)' }}>👤 Your Profile</h4>
                        <p style={{ margin: '0.25rem 0', color: 'var(--text-medium)' }}>Name: {formData.fullName || 'N/A'}</p>
                        <p style={{ margin: '0.25rem 0', color: 'var(--text-medium)' }}>Email: {formData.email || 'N/A'}</p>
                        <p style={{ margin: '0.25rem 0', color: 'var(--text-medium)' }}>Resume: {formData.resume ? formData.resume.name : 'No resume'}</p>
                    </div>

                    {/* Real Job Portal Links */}
                    <div style={{
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: 'var(--radius)',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--border)'
                    }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-dark)', fontSize: '0.9rem' }}>🌐 Search This Role on Job Portals</h4>
                        <p style={{ margin: '0 0 0.75rem', color: 'var(--text-medium)', fontSize: '0.78rem' }}>
                            Find real "{job.title}" openings from top companies:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {jobPortals.map((portal, i) => (
                                <a
                                    key={i}
                                    href={portal.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        ...portalButtonStyle,
                                        backgroundColor: portal.bgColor,
                                        color: portal.color
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = portal.color;
                                        e.target.style.color = 'white';
                                        e.target.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = portal.bgColor;
                                        e.target.style.color = portal.color;
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {portal.icon} {portal.name}
                                </a>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>❌ {error}</p>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApply}
                            style={{ flex: 2, opacity: applying ? 0.7 : 1 }}
                            disabled={applying}
                        >
                            {applying ? '⏳ Submitting...' : '🚀 Submit Application'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobApplicationModal;
