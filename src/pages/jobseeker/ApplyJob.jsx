import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getJob } from '../../services/jobService';
import { createApplication, hasUserApplied } from '../../services/applicationService';
import { getJobApplicationQuestions } from '../../utils/questionGenerator';
import { calculateMatchScore } from '../../utils/matchCalculator';
import LoadingSpinner from '../../components/LoadingSpinner';
import CandidateSidebar from '../../components/CandidateSidebar';
import {
    FiArrowLeft, FiSend, FiCheckCircle, FiFileText, FiUser, FiMail,
    FiPhone, FiMapPin, FiBook, FiBriefcase, FiCode, FiHelpCircle, FiCheck, FiAlertCircle
} from 'react-icons/fi';

export default function ApplyJob() {
    const { id } = useParams();
    const { currentUser, userRole, userData, refreshUserData } = useAuth();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [questionErrors, setQuestionErrors] = useState({});

    // Form pre-fill state
    const [formData, setFormData] = useState({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        candidateLocation: '',
        education: '',
        experience: '',
        skills: '',
        resumeUrl: '',
        coverLetter: ''
    });

    const [matchScoreData, setMatchScoreData] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            navigate(`/login?redirect=/jobs/${id}/apply`);
            return;
        }
        loadJobAndUserData();
    }, [id, currentUser]);

    async function loadJobAndUserData() {
        try {
            setLoading(true);
            const jobData = await getJob(id);
            if (!jobData) {
                setMessage('Job not found.');
                setLoading(false);
                return;
            }
            setJob(jobData);

            // Check duplicate application
            const applied = await hasUserApplied(currentUser.uid, id);
            if (applied) {
                setAlreadyApplied(true);
                setLoading(false);
                return;
            }

            // Load screening questions
            const qs = getJobApplicationQuestions(jobData);
            setQuestions(qs);

            // Pre-fill profile data
            const candidateInfo = {
                candidateName: userData?.name || userData?.full_name || 'DIVYABHARATHI R',
                candidateEmail: userData?.email || currentUser.email || '',
                candidatePhone: userData?.phone || userData?.mobile_number || '8148389347',
                candidateLocation: userData?.address || userData?.city || 'Chennai',
                education: userData?.department || (userData?.education?.[0]?.title ? `${userData.education[0].title} from ${userData.education[0].institution}` : 'B.Tech / B.E.'),
                experience: (userData?.internships && userData.internships.length > 0) ? `${userData.internships[0].company} (${userData.internships[0].role})` : 'Fresher / Entry Level',
                skills: userData?.skills || 'React, JavaScript, Node.js, Python',
                resumeUrl: userData?.resumeURL || userData?.resumeUrl || '',
                coverLetter: ''
            };
            setFormData(candidateInfo);

            // Calculate Candidate-Job Match Score
            const calculatedMatch = calculateMatchScore(userData || candidateInfo, jobData);
            setMatchScoreData(calculatedMatch);

        } catch (err) {
            console.error('Error loading job/application form:', err);
            setMessage('Failed to load application details.');
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSingleAnswer = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
        if (questionErrors[qId]) {
            setQuestionErrors(prev => {
                const next = { ...prev };
                delete next[qId];
                return next;
            });
        }
    };

    const handleMultiSelectToggle = (qId, option) => {
        const currentList = Array.isArray(answers[qId]) ? answers[qId] : [];
        let updatedList;
        if (currentList.includes(option)) {
            updatedList = currentList.filter(item => item !== option);
        } else {
            updatedList = [...currentList, option];
        }
        setAnswers(prev => ({ ...prev, [qId]: updatedList }));
        if (questionErrors[qId]) {
            setQuestionErrors(prev => {
                const next = { ...prev };
                delete next[qId];
                return next;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        questions.forEach(q => {
            if (q.required !== false) {
                const val = answers[q.id];
                if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
                    newErrors[q.id] = 'This question is required.';
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setQuestionErrors(newErrors);
            setMessage('Please answer all required screening questions before submitting.');
            return;
        }

        setSubmitting(true);
        setMessage('');

        try {
            const calculatedScore = matchScoreData?.score || 85;
            const joiningAnswer = answers['q_joining'] || answers[questions.find(q => q.question.toLowerCase().includes('join'))?.id] || 'Immediately';
            const interviewAnswer = answers['q_interview'] || answers[questions.find(q => q.question.toLowerCase().includes('interview'))?.id] || 'Anytime';

            await createApplication({
                jobId: job.jobId || job.id || id,
                employerId: job.employerId || job.companyId,
                companyId: job.companyId || job.employerId,
                candidateId: currentUser.uid,
                applicantId: currentUser.uid,
                candidateName: formData.candidateName,
                applicantName: formData.candidateName,
                candidateEmail: formData.candidateEmail,
                applicantEmail: formData.candidateEmail,
                candidatePhone: formData.candidatePhone,
                candidateLocation: formData.candidateLocation,
                education: formData.education,
                skills: formData.skills,
                experience: formData.experience,
                resumeUrl: formData.resumeUrl,
                resumeURL: formData.resumeUrl,
                coverLetter: formData.coverLetter,
                coverMessage: formData.coverLetter,
                jobTitle: job.jobTitle || job.title,
                companyName: job.companyName,
                matchScore: calculatedScore,
                applicationQuestions: questions,
                applicationAnswers: answers,
                joiningAvailability: typeof joiningAnswer === 'string' ? joiningAnswer : String(joiningAnswer),
                interviewAvailability: typeof interviewAnswer === 'string' ? interviewAnswer : String(interviewAnswer)
            });

            await refreshUserData();
            setSuccess(true);
            setMessage('Application submitted successfully!');

            setTimeout(() => {
                navigate('/jobseeker/applications');
            }, 1800);
        } catch (err) {
            setMessage(err.message || 'Failed to submit application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <CandidateSidebar>
            <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px',
                        padding: '8px 16px', fontWeight: 600, color: '#475569', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px'
                    }}
                >
                    <FiArrowLeft /> Back to Job Details
                </button>

                {alreadyApplied ? (
                    <div style={{
                        background: '#ffffff', borderRadius: '20px', padding: '48px 32px',
                        border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7',
                            color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', margin: '0 auto 16px'
                        }}>
                            <FiCheckCircle />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                            You have already applied for this job.
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>
                            Your application for <strong>{job?.title}</strong> at <strong>{job?.companyName}</strong> has been received and is being processed.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <Link to="/jobseeker/applications" className="btn btn-primary">
                                View My Applications
                            </Link>
                            <Link to="/jobs" className="btn btn-secondary">
                                Browse Other Jobs
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        background: '#ffffff', borderRadius: '20px', padding: '32px',
                        border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                    }}>
                        {/* Header Banner */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            paddingBottom: '24px', borderBottom: '1px solid #f1f5f9', marginBottom: '24px'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase' }}>
                                    Job Application • ID: {job?.jobId || job?.id}
                                </span>
                                <h1 style={{ margin: '4px 0 4px 0', fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                                    {job?.title}
                                </h1>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>
                                    {job?.companyName} • {job?.location}
                                </p>
                            </div>

                            {matchScoreData && (
                                <div style={{
                                    background: matchScoreData.score >= 90 ? '#f0fdf4' : matchScoreData.score >= 75 ? '#f0f9ff' : '#fffbeb',
                                    border: `1px solid ${matchScoreData.score >= 90 ? '#bbf7d0' : matchScoreData.score >= 75 ? '#bae6fd' : '#fde68a'}`,
                                    padding: '12px 18px', borderRadius: '14px', textAlign: 'center'
                                }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                        Matching Score
                                    </span>
                                    <span style={{
                                        fontSize: '1.5rem', fontWeight: 800,
                                        color: matchScoreData.score >= 90 ? '#16a34a' : matchScoreData.score >= 75 ? '#0284c7' : '#d97706'
                                    }}>
                                        {matchScoreData.score}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {message && (
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px', marginBottom: '24px',
                                backgroundColor: success ? '#dcfce7' : '#fff1f2',
                                color: success ? '#15803d' : '#be123c',
                                border: `1px solid ${success ? '#bbf7d0' : '#fecdd3'}`,
                                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {success ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />} 
                                    <span>{message}</span>
                                </div>
                                {!success && (message.includes('limit') || message.includes('Upgrade')) && (
                                    <Link
                                        to="/jobseeker/subscriptions"
                                        style={{
                                            background: '#e11d48',
                                            color: '#ffffff',
                                            padding: '8px 16px',
                                            borderRadius: '10px',
                                            textDecoration: 'none',
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)'
                                        }}
                                    >
                                        Upgrade Plan Now →
                                    </Link>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* ── JOB SCREENING QUESTIONS SECTION (Requirement 1 & 2) ── */}
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiHelpCircle style={{ color: '#0284c7' }} /> Job Application Questions
                                </h3>
                                <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: '#64748b' }}>
                                    Please answer these role-specific questions for <strong>{job?.companyName}</strong> recruiters.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    {questions.map((q, qIdx) => {
                                        const currentAns = answers[q.id];
                                        const hasErr = !!questionErrors[q.id];

                                        return (
                                            <div key={q.id || qIdx} style={{ background: '#ffffff', padding: '18px', borderRadius: '14px', border: hasErr ? '1.5px solid #ef4444' : '1px solid #e2e8f0' }}>
                                                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                                                    <span style={{ color: '#0284c7', marginRight: '6px' }}>Q{qIdx + 1}.</span>
                                                    {q.question} {q.required !== false && <span style={{ color: '#ef4444' }}>*</span>}
                                                </label>

                                                {q.type === 'multi_select' ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                                        {(q.options || []).map((opt, oIdx) => {
                                                            const isSel = Array.isArray(currentAns) && currentAns.includes(opt);
                                                            return (
                                                                <div
                                                                    key={oIdx}
                                                                    onClick={() => handleMultiSelectToggle(q.id, opt)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                                                                        borderRadius: '10px', border: isSel ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                                                                        backgroundColor: isSel ? '#f0f9ff' : '#ffffff', cursor: 'pointer', userSelect: 'none'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        width: '16px', height: '16px', borderRadius: '4px',
                                                                        border: isSel ? '2px solid #0ea5e9' : '2px solid #94a3b8',
                                                                        backgroundColor: isSel ? '#0ea5e9' : 'transparent',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px'
                                                                    }}>
                                                                        {isSel && <FiCheck strokeWidth={3} />}
                                                                    </div>
                                                                    <span style={{ fontSize: '0.85rem', fontWeight: isSel ? 700 : 500, color: isSel ? '#0369a1' : '#334155' }}>
                                                                        {opt}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {(q.options || ['Yes', 'No']).map((opt, oIdx) => {
                                                            const isSel = currentAns === opt;
                                                            return (
                                                                <div
                                                                    key={oIdx}
                                                                    onClick={() => handleSingleAnswer(q.id, opt)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                                                                        borderRadius: '10px', border: isSel ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
                                                                        backgroundColor: isSel ? '#f0f9ff' : '#ffffff', cursor: 'pointer', userSelect: 'none'
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        width: '16px', height: '16px', borderRadius: '50%',
                                                                        border: isSel ? '5px solid #0ea5e9' : '2px solid #94a3b8', backgroundColor: '#fff'
                                                                    }} />
                                                                    <span style={{ fontSize: '0.88rem', fontWeight: isSel ? 700 : 500, color: isSel ? '#0369a1' : '#334155' }}>
                                                                        {opt}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {hasErr && (
                                                    <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '8px 0 0', fontWeight: 600 }}>
                                                        {questionErrors[q.id]}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Cover Letter Input */}
                            <div>
                                <label style={labelStyle}>Cover Letter / Message to Recruiter (Optional)</label>
                                <textarea
                                    name="coverLetter"
                                    rows={3}
                                    style={{ ...inputStyle, minHeight: '80px', fontFamily: 'inherit' }}
                                    value={formData.coverLetter}
                                    onChange={handleChange}
                                    placeholder="Introduce yourself and highlight relevant experience..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                    🔒 Candidate contact details are kept private by system security.
                                </span>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => navigate(-1)}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn btn-primary"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 32px', fontWeight: 800 }}
                                    >
                                        <FiSend /> {submitting ? 'Submitting Application...' : 'Submit Application'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </CandidateSidebar>
    );
}

const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    fontSize: '0.88rem',
    fontWeight: 700,
    color: '#334155'
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    boxSizing: 'border-box'
};
