import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function ProfileEditModal({ isOpen, onClose, sectionKey, sectionTitle, initialData, onSave }) {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({});
        }
    }, [initialData, sectionKey, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(sectionKey, formData);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, padding: '20px'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e2e8f0',
                animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    background: 'linear-gradient(to right, #f8fafc, #ffffff)'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                        {initialData?.id ? `Edit ${sectionTitle}` : `Add ${sectionTitle}`}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none', background: '#f1f5f9', width: '32px', height: '32px',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* Form Fields based on sectionKey */}
                <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* BASIC PERSONAL INFO */}
                    {sectionKey === 'personal' && (
                        <>
                            <div>
                                <label style={labelStyle}>Full Name *</label>
                                <input style={inputStyle} value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required placeholder="Enter full name" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Degree / Course</label>
                                    <input style={inputStyle} value={formData.department || ''} onChange={e => handleChange('department', e.target.value)} placeholder="Enter degree / course" />
                                </div>
                                <div>
                                    <label style={labelStyle}>College / Institution</label>
                                    <input style={inputStyle} value={formData.college || ''} onChange={e => handleChange('college', e.target.value)} placeholder="Enter college / institution name" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Current Location</label>
                                    <input style={inputStyle} value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} placeholder="Enter current location" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Gender</label>
                                    <select style={inputStyle} value={formData.gender || 'Female'} onChange={e => handleChange('gender', e.target.value)}>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Date of Birth</label>
                                    <input type="text" style={inputStyle} value={formData.dob || ''} onChange={e => handleChange('dob', e.target.value)} placeholder="Enter date of birth" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Mobile Number</label>
                                    <input style={inputStyle} value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} placeholder="Enter mobile number" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* CAREER PREFERENCE */}
                    {sectionKey === 'preference' && (
                        <>
                            <div>
                                <label style={labelStyle}>Preferred Job Type</label>
                                <input style={inputStyle} value={formData.preferredJobType || ''} onChange={e => handleChange('preferredJobType', e.target.value)} placeholder="Enter preferred job type" />
                            </div>
                            <div>
                                <label style={labelStyle}>Preferred Location</label>
                                <input style={inputStyle} value={formData.preferredLocation || ''} onChange={e => handleChange('preferredLocation', e.target.value)} placeholder="Enter preferred location" />
                            </div>
                            <div>
                                <label style={labelStyle}>Availability to Work</label>
                                <input style={inputStyle} value={formData.availability || ''} onChange={e => handleChange('availability', e.target.value)} placeholder="Enter availability to work" />
                            </div>
                        </>
                    )}

                    {/* EDUCATION */}
                    {sectionKey === 'education' && (
                        <>
                            <div>
                                <label style={labelStyle}>Education / Degree *</label>
                                <input style={inputStyle} value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} required placeholder="Enter education / degree" />
                            </div>
                            <div>
                                <label style={labelStyle}>College / Institution / School</label>
                                <input style={inputStyle} value={formData.institution || ''} onChange={e => handleChange('institution', e.target.value)} placeholder="Enter institution / school name" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Year & Status</label>
                                    <input style={inputStyle} value={formData.year || ''} onChange={e => handleChange('year', e.target.value)} placeholder="Enter graduation year & status" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Marks / CGPA / Percentage</label>
                                    <input style={inputStyle} value={formData.grade || ''} onChange={e => handleChange('grade', e.target.value)} placeholder="Enter marks / CGPA" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* KEY SKILLS */}
                    {sectionKey === 'skills' && (
                        <>
                            <div>
                                <label style={labelStyle}>Key Skills (Comma Separated)</label>
                                <input style={inputStyle} value={formData.skillsString || ''} onChange={e => handleChange('skillsString', e.target.value)} placeholder="Enter key skills separated by commas" />
                                <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Separate skills with commas so they render as clean badge tags.</small>
                            </div>
                        </>
                    )}

                    {/* LANGUAGES */}
                    {sectionKey === 'languages' && (
                        <>
                            <div>
                                <label style={labelStyle}>Language Name *</label>
                                <input style={inputStyle} value={formData.language || ''} onChange={e => handleChange('language', e.target.value)} required placeholder="Enter language name" />
                            </div>
                            <div>
                                <label style={labelStyle}>Proficiency Details</label>
                                <input style={inputStyle} value={formData.proficiency || ''} onChange={e => handleChange('proficiency', e.target.value)} placeholder="Enter proficiency details" />
                            </div>
                        </>
                    )}

                    {/* INTERNSHIPS */}
                    {sectionKey === 'internships' && (
                        <>
                            <div>
                                <label style={labelStyle}>Company Name *</label>
                                <input style={inputStyle} value={formData.company || ''} onChange={e => handleChange('company', e.target.value)} required placeholder="Enter company name" />
                            </div>
                            <div>
                                <label style={labelStyle}>Role / Designation</label>
                                <input style={inputStyle} value={formData.role || ''} onChange={e => handleChange('role', e.target.value)} placeholder="Enter role / designation" />
                            </div>
                            <div>
                                <label style={labelStyle}>Duration</label>
                                <input style={inputStyle} value={formData.duration || ''} onChange={e => handleChange('duration', e.target.value)} placeholder="Enter duration" />
                            </div>
                            <div>
                                <label style={labelStyle}>Key Learnings & Summary</label>
                                <textarea style={{ ...inputStyle, minHeight: '80px' }} value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="Enter key responsibilities and learnings..." />
                            </div>
                        </>
                    )}

                    {/* PROJECTS */}
                    {sectionKey === 'projects' && (
                        <>
                            <div>
                                <label style={labelStyle}>Project Title *</label>
                                <input style={inputStyle} value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} required placeholder="Enter project title" />
                            </div>
                            <div>
                                <label style={labelStyle}>Project Link (Optional)</label>
                                <input style={inputStyle} value={formData.link || ''} onChange={e => handleChange('link', e.target.value)} placeholder="Enter GitHub / live project URL" />
                            </div>
                            <div>
                                <label style={labelStyle}>Description & Learnings</label>
                                <textarea style={{ ...inputStyle, minHeight: '90px' }} value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="Enter project description and key learnings..." />
                            </div>
                        </>
                    )}

                    {/* PROFILE SUMMARY */}
                    {sectionKey === 'summary' && (
                        <>
                            <div>
                                <label style={labelStyle}>Profile Summary</label>
                                <textarea style={{ ...inputStyle, minHeight: '120px' }} value={formData.summaryText || ''} onChange={e => handleChange('summaryText', e.target.value)} placeholder="Enter profile summary..." />
                            </div>
                        </>
                    )}

                    {/* ACCOMPLISHMENTS / CERTIFICATIONS */}
                    {sectionKey === 'accomplishments' && (
                        <>
                            <div>
                                <label style={labelStyle}>Certification / Award Title *</label>
                                <input style={inputStyle} value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} required placeholder="Enter certification / award title" />
                            </div>
                            <div>
                                <label style={labelStyle}>Issuing Organization / Category</label>
                                <input style={inputStyle} value={formData.issuer || ''} onChange={e => handleChange('issuer', e.target.value)} placeholder="Enter issuing organization" />
                            </div>
                            <div>
                                <label style={labelStyle}>Description / Year</label>
                                <input style={inputStyle} value={formData.details || ''} onChange={e => handleChange('details', e.target.value)} placeholder="Enter description / completion year" />
                            </div>
                        </>
                    )}

                    {/* COMPETITIVE EXAMS */}
                    {sectionKey === 'competitiveExams' && (
                        <>
                            <div>
                                <label style={labelStyle}>Exam Name *</label>
                                <input style={inputStyle} value={formData.examName || ''} onChange={e => handleChange('examName', e.target.value)} required placeholder="Enter exam name" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={labelStyle}>Score / Rank</label>
                                    <input style={inputStyle} value={formData.score || ''} onChange={e => handleChange('score', e.target.value)} placeholder="Enter score / rank" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Year</label>
                                    <input style={inputStyle} value={formData.year || ''} onChange={e => handleChange('year', e.target.value)} placeholder="Enter year" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* EMPLOYMENT */}
                    {sectionKey === 'employment' && (
                        <>
                            <div>
                                <label style={labelStyle}>Designation / Role *</label>
                                <input style={inputStyle} value={formData.designation || ''} onChange={e => handleChange('designation', e.target.value)} required placeholder="Enter designation / role" />
                            </div>
                            <div>
                                <label style={labelStyle}>Organization / Company</label>
                                <input style={inputStyle} value={formData.company || ''} onChange={e => handleChange('company', e.target.value)} placeholder="Enter company name" />
                            </div>
                            <div>
                                <label style={labelStyle}>Work Duration</label>
                                <input style={inputStyle} value={formData.duration || ''} onChange={e => handleChange('duration', e.target.value)} placeholder="Enter work duration" />
                            </div>
                        </>
                    )}

                    {/* ACADEMIC ACHIEVEMENTS */}
                    {sectionKey === 'academicAchievements' && (
                        <>
                            <div>
                                <label style={labelStyle}>Achievement / Honor *</label>
                                <input style={inputStyle} value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} required placeholder="e.g. Class Topper Award / Best Project Presentation" />
                            </div>
                            <div>
                                <label style={labelStyle}>Details / Institution</label>
                                <textarea style={{ ...inputStyle, minHeight: '80px' }} value={formData.details || ''} onChange={e => handleChange('details', e.target.value)} placeholder="Describe academic distinction, college rank or publications..." />
                            </div>
                        </>
                    )}

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1',
                                background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 22px', borderRadius: '10px', border: 'none',
                                background: '#0ea5e9', color: '#ffffff', fontWeight: 700,
                                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <FiCheck size={18} /> Save Details
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#334155'
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#f8fafc',
    color: '#0f172a'
};
