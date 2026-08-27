import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle, FiX, FiSend, FiClock, FiCalendar, FiArrowRight, FiCheck } from 'react-icons/fi';
import { getJobApplicationQuestions } from '../utils/questionGenerator';

export default function ApplicationQuestionsModal({
    job,
    isOpen,
    onClose,
    onSubmit,
    isSubmitting = false
}) {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [errors, setErrors] = useState({});
    const [submittedData, setSubmittedData] = useState(null);

    useEffect(() => {
        if (job && isOpen) {
            const qs = getJobApplicationQuestions(job);
            setQuestions(qs);
            setAnswers({});
            setErrors({});
            setSubmittedData(null);
        }
    }, [job, isOpen]);

    if (!isOpen || !job) return null;

    const jobTitle = job.job_title || job.title || job.jobTitle || 'Position';
    const companyName = job.company_name || job.companyName || 'Company';

    const handleSingleAnswer = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
        if (errors[qId]) {
            setErrors(prev => {
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
        if (errors[qId]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[qId];
                return next;
            });
        }
    };

    const validateAndSubmit = async (e) => {
        if (e) e.preventDefault();
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
            setErrors(newErrors);
            return;
        }

        // Extract joining & interview availability
        const joiningAnswer = answers['q_joining'] || answers[questions.find(q => q.question.toLowerCase().includes('join'))?.id] || 'Immediately';
        const interviewAnswer = answers['q_interview'] || answers[questions.find(q => q.question.toLowerCase().includes('interview'))?.id] || 'Anytime';

        try {
            const submissionPayload = {
                applicationQuestions: questions,
                applicationAnswers: answers,
                joiningAvailability: typeof joiningAnswer === 'string' ? joiningAnswer : String(joiningAnswer),
                interviewAvailability: typeof interviewAnswer === 'string' ? interviewAnswer : String(interviewAnswer)
            };

            await onSubmit(submissionPayload);
            setSubmittedData({
                jobTitle,
                companyName,
                status: 'Applied'
            });
        } catch (err) {
            console.error('Submission failed in modal:', err);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            overflowY: 'auto'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e2e8f0',
                position: 'relative',
                animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 28px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    background: '#f8fafc',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px'
                }}>
                    <div>
                        <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#0284c7',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'inline-block',
                            marginBottom: '4px'
                        }}>
                            Job Application Questions
                        </span>
                        <h2 style={{
                            margin: '0 0 6px 0',
                            fontSize: '1.4rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            lineHeight: 1.3
                        }}>
                            {submittedData ? 'Application Status' : `Apply for ${jobTitle}`}
                        </h2>
                        <p style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            color: '#64748b',
                            lineHeight: 1.4
                        }}>
                            {submittedData 
                                ? 'Your candidate profile and answers have been forwarded to the hiring team.'
                                : `Please answer the following questions before submitting your application to ${companyName}.`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: '#ffffff',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            flexShrink: 0,
                            marginLeft: '12px'
                        }}
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div style={{
                    padding: '28px',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {submittedData ? (
                        /* SUCCESS STATE */
                        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                            <div style={{
                                width: '76px',
                                height: '76px',
                                borderRadius: '50%',
                                background: '#dcfce7',
                                color: '#16a34a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                fontSize: '2.5rem',
                                boxShadow: '0 10px 20px rgba(22, 163, 74, 0.15)'
                            }}>
                                <FiCheckCircle />
                            </div>

                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                margin: '0 0 8px'
                            }}>
                                Application Submitted Successfully!
                            </h3>

                            <p style={{
                                color: '#64748b',
                                fontSize: '0.95rem',
                                margin: '0 0 24px',
                                maxWidth: '440px',
                                marginLeft: 'auto',
                                marginRight: 'auto'
                            }}>
                                Your application has been sent to the employer. You can track recruiter review stages in your dashboard.
                            </p>

                            <div style={{
                                background: '#f8fafc',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '16px',
                                padding: '20px',
                                textAlign: 'left',
                                maxWidth: '460px',
                                margin: '0 auto 28px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' }}>
                                    <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>Job Position</span>
                                    <span style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 800 }}>{submittedData.jobTitle}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' }}>
                                    <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>Company</span>
                                    <span style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 800 }}>{submittedData.companyName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>Application Status</span>
                                    <span style={{
                                        background: '#dcfce7',
                                        color: '#15803d',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.82rem',
                                        fontWeight: 800
                                    }}>
                                        {submittedData.status}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/jobseeker/applications');
                                    }}
                                    className="btn btn-primary btn-lg"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontWeight: 800 }}
                                >
                                    View My Applications <FiArrowRight />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="btn btn-secondary btn-lg"
                                    style={{ padding: '12px 24px', fontWeight: 700 }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* QUESTIONS FORM */
                        <form onSubmit={validateAndSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                {questions.map((q, index) => {
                                    const hasError = !!errors[q.id];
                                    const currentAnswer = answers[q.id];

                                    return (
                                        <div
                                            key={q.id || index}
                                            style={{
                                                background: '#ffffff',
                                                border: hasError ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                                                <label style={{
                                                    fontSize: '0.98rem',
                                                    fontWeight: 700,
                                                    color: '#0f172a',
                                                    lineHeight: 1.4
                                                }}>
                                                    <span style={{
                                                        color: '#0284c7',
                                                        marginRight: '6px',
                                                        fontWeight: 800
                                                    }}>
                                                        Q{index + 1}.
                                                    </span>
                                                    {q.question}
                                                    {q.required !== false && (
                                                        <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                                    )}
                                                </label>
                                                {q.type === 'multi_select' && (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        background: '#f1f5f9',
                                                        color: '#475569',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        fontWeight: 600,
                                                        flexShrink: 0
                                                    }}>
                                                        Select all that apply
                                                    </span>
                                                )}
                                            </div>

                                            {/* Render options based on question type */}
                                            {q.type === 'multi_select' ? (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                    gap: '10px'
                                                }}>
                                                    {(q.options || []).map((opt, optIdx) => {
                                                        const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(opt);
                                                        return (
                                                            <div
                                                                key={optIdx}
                                                                onClick={() => handleMultiSelectToggle(q.id, opt)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    padding: '10px 14px',
                                                                    borderRadius: '12px',
                                                                    border: isSelected ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                                                                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                                                    cursor: 'pointer',
                                                                    userSelect: 'none',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: '18px',
                                                                    height: '18px',
                                                                    borderRadius: '4px',
                                                                    border: isSelected ? '2px solid #0ea5e9' : '2px solid #94a3b8',
                                                                    backgroundColor: isSelected ? '#0ea5e9' : 'transparent',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: '#ffffff',
                                                                    fontSize: '12px',
                                                                    flexShrink: 0
                                                                }}>
                                                                    {isSelected && <FiCheck strokeWidth={3} />}
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '0.88rem',
                                                                    fontWeight: isSelected ? 700 : 500,
                                                                    color: isSelected ? '#0369a1' : '#334155'
                                                                }}>
                                                                    {opt}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : q.type === 'short_text' ? (
                                                <input
                                                    type="text"
                                                    value={currentAnswer || ''}
                                                    onChange={e => handleSingleAnswer(q.id, e.target.value)}
                                                    placeholder="Type your answer here..."
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '0.92rem',
                                                        backgroundColor: '#f8fafc',
                                                        outline: 'none',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            ) : (
                                                /* Multiple Choice / Yes-No / Radio */
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px'
                                                }}>
                                                    {(q.options || ['Yes', 'No']).map((opt, optIdx) => {
                                                        const isSelected = currentAnswer === opt;
                                                        return (
                                                            <div
                                                                key={optIdx}
                                                                onClick={() => handleSingleAnswer(q.id, opt)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '12px',
                                                                    padding: '12px 16px',
                                                                    borderRadius: '12px',
                                                                    border: isSelected ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
                                                                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                                                    cursor: 'pointer',
                                                                    userSelect: 'none',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: '18px',
                                                                    height: '18px',
                                                                    borderRadius: '50%',
                                                                    border: isSelected ? '5px solid #0ea5e9' : '2px solid #94a3b8',
                                                                    backgroundColor: '#ffffff',
                                                                    flexShrink: 0
                                                                }} />
                                                                <span style={{
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: isSelected ? 700 : 500,
                                                                    color: isSelected ? '#0369a1' : '#334155'
                                                                }}>
                                                                    {opt}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {hasError && (
                                                <p style={{
                                                    color: '#ef4444',
                                                    fontSize: '0.82rem',
                                                    margin: '8px 0 0',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <FiAlertCircle size={14} /> {errors[q.id]}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Modal Footer Controls */}
                            <div style={{
                                marginTop: '28px',
                                paddingTop: '20px',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '16px'
                            }}>
                                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                    🔒 Your contact details will remain private & secure.
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="btn btn-secondary"
                                        disabled={isSubmitting}
                                        style={{ padding: '12px 20px', fontWeight: 600 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 32px',
                                            fontWeight: 800,
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        <FiSend /> {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
