import React, { useEffect, useState } from 'react';
import RecommendationCard from './RecommendationCard';
import JobApplicationModal from './JobApplicationModal';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { useAuth } from '../../../contexts/AuthContext';
import PremiumPaymentModal from '../../company/PremiumPaymentModal';
import { auth, db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';
import { getJobRecommendations, generateSkillGap } from '../../../utils/career-analyzer/jobMatcher';
import { sendProfileSubmissionEmail, isEmailConfigured } from '../../../utils/career-analyzer/emailService';
import { triggerAutomation } from '../../../utils/career-analyzer/automationService';
import { getJobPortalLinks } from '../../../utils/career-analyzer/jobPortalLinks';

const Step6ResultsDashboard = ({ formData }) => {
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [jobResults, setJobResults] = useState([]);
    const [skillGapData, setSkillGapData] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showDetailsJob, setShowDetailsJob] = useState(null);
    const [portalLinks, setPortalLinks] = useState([]);
    
    // Feature gate states
    const { userData, token, refreshUserData } = useAuth();
    const isPremium = userData?.isPremium;
    const [externalClickCount, setExternalClickCount] = useState(parseInt(localStorage.getItem('candidate_external_clicks') || '0'));
    const [mockPaymentData, setMockPaymentData] = useState(null);
    const [candidatePlan, setCandidatePlan] = useState(null);

    useEffect(() => {
        const saveAndAnalyze = async () => {
            try {
                // Save form data to Firestore
                const user = auth.currentUser;

                const dataToSave = {
                    fullName: formData.fullName || '',
                    username: formData.username || '',
                    email: formData.email || '',
                    phone: formData.phone || '',
                    location: formData.location || '',
                    qualification: formData.qualification || '',
                    fieldOfStudy: formData.fieldOfStudy || '',
                    experienceType: formData.experienceType || '',
                    skills: formData.skills || [],
                    skillLevel: formData.skillLevel || '',
                    tools: formData.tools || '',
                    preferredRole: formData.preferredRole || '',
                    industry: formData.industry || '',
                    jobTypes: formData.jobTypes || [],
                    expectedSalary: formData.expectedSalary || 0,
                    relocation: formData.relocation || false,
                    yearsExperience: formData.yearsExperience || '',
                    lastJobTitle: formData.lastJobTitle || '',
                    companyName: formData.companyName || '',
                    responsibilities: formData.responsibilities || '',
                    projects: formData.projects || '',
                    enjoyWork: formData.enjoyWork || '',
                    workStyle: formData.workStyle || '',
                    careerGoal: formData.careerGoal || '',
                    learningInterest: formData.learningInterest || '',
                    resumeFileName: formData.resume ? formData.resume.name : 'No resume uploaded',
                    userId: user ? user.uid : 'anonymous',
                    createdAt: serverTimestamp()
                };

                // Save to Firestore
                await addDoc(collection(db, 'careerAnalysis'), dataToSave);
                setSaved(true);

                // Send dynamic confirmation email to the user
                if (isEmailConfigured()) {
                    await sendProfileSubmissionEmail(formData);
                }

                // Run job matching algorithm
                const recommendations = getJobRecommendations(
                    formData.skills || [],
                    {
                        experienceLevel: formData.experienceType || undefined,
                        industry: formData.industry || undefined
                    }
                );
                setJobResults(recommendations);

                // Trigger n8n Automation
                await triggerAutomation('profile_submission', {
                    fullName: formData.fullName,
                    email: formData.email,
                    qualification: formData.qualification,
                    topMatch: recommendations[0]?.title || 'N/A'
                });

                // Generate skill gap analysis
                const gap = generateSkillGap(formData.skills || [], recommendations);
                setSkillGapData(gap);

                // Generate job portal links based on preferred role
                const links = getJobPortalLinks(formData.preferredRole, formData.location);
                setPortalLinks(links);

            } catch (error) {
                console.error("Error saving to Firestore:", error);
                setSaveError(error.message || 'Data could not be saved. Check Firestore rules.');

                // Still run matching even if Firestore save fails
                const recommendations = getJobRecommendations(formData.skills || []);
                setJobResults(recommendations);
                const gap = generateSkillGap(formData.skills || [], recommendations);
                setSkillGapData(gap);
                const links = getJobPortalLinks(formData.preferredRole, formData.location);
                setPortalLinks(links);
            } finally {
                setTimeout(() => {
                    setLoading(false);
                }, 2000);
            }
        };

        saveAndAnalyze();
        
        // Fetch candidate subscription plan
        fetch('http://localhost:5000/api/subscriptions/plans')
            .then(res => res.json())
            .then(plans => {
                const plan = plans.find(p => p.role === 'jobseeker');
                if (plan) setCandidatePlan(plan);
            })
            .catch(err => console.error(err));

    }, [formData]);

    const handleUnlock = () => {
        if (!candidatePlan) {
            alert('Subscription plans are currently unavailable.');
            return;
        }
        setMockPaymentData({
            plan: candidatePlan,
            orderData: { order: { id: 'order_mock_' + Date.now(), amount: candidatePlan.price * 100, currency: 'INR' } }
        });
    };

    const handleExternalLinkClick = (e, portalUrl) => {
        if (isPremium) return; // Premium users have no limits

        if (externalClickCount >= 3) {
            e.preventDefault();
            handleUnlock();
        } else {
            const newCount = externalClickCount + 1;
            setExternalClickCount(newCount);
            localStorage.setItem('candidate_external_clicks', newCount.toString());
        }
    };

    const handleApply = (job) => {
        setSelectedJob(job);
        setShowApplyModal(true);
    };

    const handleViewDetails = (job) => {
        setShowDetailsJob(showDetailsJob?.id === job.id ? null : job);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                opacity: 0.7
            }}>
                <div className="spinner" style={{
                    width: '4rem',
                    height: '4rem',
                    border: '4px solid var(--border)',
                    borderTop: '4px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-dark)' }}>Analyzing your profile...</h3>
                <p style={{ color: 'var(--text-medium)', marginTop: '0.5rem' }}>Matching your skills with {formData.skills?.length || 0} skills across 30+ job roles.</p>
            </div>
        );
    }

    const containerStyle = {
        animation: 'fadeIn 0.5s ease-out forwards'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
    };

    const statsCardStyle = {
        backgroundColor: 'var(--bg-light)',
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        border: '1px solid var(--border)'
    };

    const getSkillColor = (item) => {
        if (item.hasSkill) return '#059669';
        if (item.status === 'Gap Identified') return '#ef4444';
        return '#f59e0b';
    };

    const getSkillLabel = (item) => {
        if (item.hasSkill) return `Strong (${item.percentage}%)`;
        if (item.status === 'Gap Identified') return `Gap Identified (${item.percentage}%)`;
        return `Needs Improvement (${item.percentage}%)`;
    };

    const downloadReport = () => {
        const reportDate = new Date().toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const topJobs = jobResults.slice(0, 5);

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Career Analysis Report - ${formData.fullName || 'User'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; padding: 30px; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { opacity: 0.9; font-size: 14px; }
        .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 20px; }
        .section h2 { font-size: 18px; color: #4F46E5; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #475569; min-width: 180px; }
        .value { color: #1e293b; text-align: right; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .skill-tag { background: #EEF2FF; color: #4F46E5; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
        .recommendation { background: white; border: 2px solid #4F46E5; border-radius: 10px; padding: 20px; margin-bottom: 15px; }
        .recommendation h3 { color: #4F46E5; font-size: 16px; }
        .match { color: #059669; font-weight: bold; font-size: 20px; }
        .skill-bar-container { margin: 10px 0; }
        .skill-bar-label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; }
        .skill-bar { height: 8px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-top: 4px; }
        .skill-fill { height: 100%; border-radius: 10px; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #94a3b8; font-size: 12px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Career Analysis Report</h1>
        <p>Career Analyser | Generated on ${reportDate}</p>
    </div>

    <div class="section">
        <h2>👤 Profile Information</h2>
        <div class="row"><span class="label">Full Name</span><span class="value">${formData.fullName || 'N/A'}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${formData.email || 'N/A'}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${formData.phone || 'N/A'}</span></div>
        <div class="row"><span class="label">Location</span><span class="value">${formData.location || 'N/A'}</span></div>
        <div class="row"><span class="label">Qualification</span><span class="value">${formData.qualification || 'N/A'}</span></div>
        <div class="row"><span class="label">Field of Study</span><span class="value">${formData.fieldOfStudy || 'N/A'}</span></div>
        <div class="row"><span class="label">Experience Level</span><span class="value">${formData.experienceType === 'fresher' ? 'Fresher' : 'Experienced'}</span></div>
        ${formData.experienceType === 'experienced' ? `
        <div class="row"><span class="label">Years of Experience</span><span class="value">${formData.yearsExperience || 'N/A'}</span></div>
        <div class="row"><span class="label">Last Job Title</span><span class="value">${formData.lastJobTitle || 'N/A'}</span></div>
        <div class="row"><span class="label">Company</span><span class="value">${formData.companyName || 'N/A'}</span></div>
        ` : ''}
    </div>

    <div class="section">
        <h2>🛠️ Skills & Expertise</h2>
        <div class="row"><span class="label">Skill Level</span><span class="value">${formData.skillLevel || 'N/A'}</span></div>
        <div class="row"><span class="label">Tools & Software</span><span class="value">${formData.tools || 'N/A'}</span></div>
        <div style="margin-top: 12px;">
            <span class="label">Skills:</span>
            <div class="skills-list">
                ${(formData.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
                ${(formData.skills || []).length === 0 ? '<span style="color:#94a3b8">No skills added</span>' : ''}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🎯 Top Career Recommendations</h2>
        ${topJobs.map(job => `
        <div class="recommendation">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h3>${job.title}</h3>
                <span class="match">${job.matchPercentage}% Match</span>
            </div>
            <p style="font-size:14px; color:#64748b;">Salary Range: ${job.salaryRange} | ${job.companyType}</p>
            <p style="font-size:13px; margin-top:8px;">${job.description}</p>
            <div style="margin-top:8px;">
                <span style="font-size:12px; color:#059669;">Matched Skills: ${(job.matchedRequired || []).join(', ')}</span>
            </div>
        </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>📊 Skill Gap Analysis</h2>
        ${skillGapData.slice(0, 6).map(item => `
        <div class="skill-bar-container">
            <div class="skill-bar-label">
                <span>${item.skill}</span>
                <span style="color:${getSkillColor(item)}">${getSkillLabel(item)}</span>
            </div>
            <div class="skill-bar"><div class="skill-fill" style="width:${item.percentage}%; background:${getSkillColor(item)};"></div></div>
        </div>
        `).join('')}
    </div>

    <div class="footer">
        <p>© ${new Date().getFullYear()} Career Analyser. This report was auto-generated based on user inputs and AI skill matching.</p>
        <p>For questions, contact support@careeranalyser.com</p>
    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Career_Report_${(formData.fullName || 'User').replace(/\s+/g, '_')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your Career Analysis Report</h2>
                <p style={{ color: 'var(--text-medium)', fontSize: '1.125rem' }}>
                    Based on {formData.skills?.length || 0} skills matched against 30+ job roles.
                </p>
                {saved && (
                    <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        ✅ Your profile data has been saved successfully.
                    </p>
                )}
                {saveError && (
                    <p style={{ color: '#f59e0b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        ⚠️ {saveError}
                    </p>
                )}
            </div>

            {/* Extracted Skills Summary */}
            {formData.skills && formData.skills.length > 0 && (
                <div style={{
                    ...statsCardStyle,
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(124, 58, 237, 0.05))'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span>🛠️</span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                            Your Skills ({formData.skills.length})
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {formData.skills.map((skill, i) => (
                            <span key={i} style={{
                                display: 'inline-block',
                                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                color: 'var(--primary)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '2rem',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Job Recommendations */}
            <div style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '1rem' }}>
                    💼 Job Recommendations ({jobResults.length})
                </h3>
            </div>

            <div style={gridStyle}>
                {jobResults.map((job, index) => {
                    const isLocked = !isPremium && index >= 3;
                    
                    return (
                        <div key={job.id} style={{ position: 'relative' }}>
                            <div style={{ filter: isLocked ? 'blur(5px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto', userSelect: isLocked ? 'none' : 'auto', opacity: isLocked ? 0.6 : 1 }}>
                                <RecommendationCard
                                    job={job}
                                    onApply={handleApply}
                                    onViewDetails={handleViewDetails}
                                />
                            </div>
                            
                            {isLocked && (
                                <div style={{
                                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                                    background: 'rgba(255, 255, 255, 0.4)'
                                }}>
                                    <div style={{ padding: '16px 24px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
                                        <h4 style={{ margin: '0 0 8px', color: '#0f172a' }}>Top Match Locked</h4>
                                        <button onClick={handleUnlock} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                            Unlock Now
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Expanded Details */}
                        {showDetailsJob?.id === job.id && (
                            <div style={{
                                marginTop: '-0.5rem',
                                padding: '1.25rem',
                                backgroundColor: 'var(--bg-light)',
                                borderRadius: '0 0 var(--radius) var(--radius)',
                                border: '1px solid var(--border)',
                                borderTop: 'none',
                                animation: 'fadeIn 0.3s ease-out'
                            }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-medium)', marginBottom: '0.75rem' }}>
                                    {job.description}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                                    <div><strong>Industry:</strong> {job.industry}</div>
                                    <div><strong>Level:</strong> {job.experienceLevel}</div>
                                    <div><strong>Salary:</strong> {job.salaryRange}</div>
                                    <div><strong>Type:</strong> {job.companyType}</div>
                                </div>
                                {job.missingRequired.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <strong style={{ fontSize: '0.8rem' }}>Skills to learn:</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                                            {job.missingRequired.map((s, i) => (
                                                <span key={i} style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '1rem',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444'
                                                }}>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
                })}
            </div>

            {jobResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-medium)' }}>
                    <p>No matching jobs found. Try adding more skills to get better recommendations.</p>
                </div>
            )}

            {/* ===== Job Portal Search Section ===== */}
            {portalLinks.length > 0 && (
                <div style={{
                    marginBottom: '2rem',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(124, 58, 237, 0.06))',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>🔍</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                            Search Jobs on Portals
                        </h3>
                    </div>
                    <p style={{ color: 'var(--text-medium)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Looking for <strong style={{ color: 'var(--primary)' }}>{formData.preferredRole}</strong> roles?
                        Click below to search on top job portals.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem'
                    }}>
                        {portalLinks.map((portal, index) => (
                            <div
                                key={index}
                                style={{
                                    background: portal.bgGradient,
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    color: '#ffffff',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 15px ${portal.color}33`
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = `0 8px 30px ${portal.color}55`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = `0 4px 15px ${portal.color}33`;
                                }}
                            >
                                {/* Decorative circle */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    right: '-20px',
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255,255,255,0.1)'
                                }}></div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '1.75rem' }}>{portal.icon}</span>
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{portal.name}</h4>
                                        <p style={{ fontSize: '0.7rem', opacity: 0.85, margin: 0 }}>{portal.tagline}</p>
                                    </div>
                                </div>

                                <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '1rem', lineHeight: 1.4 }}>
                                    {portal.description}
                                </p>

                                <a
                                    href={portal.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => handleExternalLinkClick(e, portal.url)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.55rem 1.2rem',
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: '#ffffff',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '2rem',
                                        textDecoration: 'none',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        backdropFilter: 'blur(4px)',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.35)'}
                                    onMouseLeave={e => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                                >
                                    Search {formData.preferredRole} Jobs →
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skill Gap Analysis */}
            {skillGapData.length > 0 && (
                <div style={statsCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--primary)' }}>📊</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Skill Gap Analysis</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {skillGapData.map((item, index) => (
                            <div key={index}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '500' }}>
                                    <span style={{ color: 'var(--text-dark)' }}>{item.skill}</span>
                                    <span style={{ color: getSkillColor(item) }}>{getSkillLabel(item)}</span>
                                </div>
                                <div style={{
                                    height: '0.5rem',
                                    backgroundColor: '#cbd5e1',
                                    borderRadius: '99px',
                                    overflow: 'hidden',
                                    marginTop: '0.5rem'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${item.percentage}%`,
                                        backgroundColor: getSkillColor(item),
                                        borderRadius: '99px',
                                        transition: 'width 1s ease-out'
                                    }}></div>
                                </div>
                                {!item.hasSkill && item.importance === 'critical' && (
                                    <p style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.25rem' }}>
                                        📚 Recommended: Learn this skill to unlock more opportunities
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Download Report */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button
                    onClick={downloadReport}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)'
                    }}
                >
                    ⬇️ Download Full Report
                </button>
            </div>

            {/* Application Modal */}
            {showApplyModal && selectedJob && (
                <JobApplicationModal
                    job={selectedJob}
                    formData={formData}
                    onClose={() => {
                        setShowApplyModal(false);
                        setSelectedJob(null);
                    }}
                />
            )}

            {/* Subscription Modal */}
            {mockPaymentData && (
                <PremiumPaymentModal 
                    isOpen={!!mockPaymentData} 
                    onClose={(success) => {
                        setMockPaymentData(null);
                        if (success) {
                            // Update local storage mock data so refreshUserData picks it up
                            const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
                            if (userData && userData.email && users[userData.email]) {
                                users[userData.email].data.isPremium = 1;
                                localStorage.setItem('mock_auth_users', JSON.stringify(users));
                            }
                            if (refreshUserData) refreshUserData();
                        }
                    }} 
                    plan={mockPaymentData.plan} 
                    orderData={mockPaymentData.orderData} 
                />
            )}
        </div>
    );
};

export default Step6ResultsDashboard;
