import React, { useState } from 'react';
import { extractTextFromPDF, isValidPDF } from '../../../utils/career-analyzer/resumeParser';
import { getSkillNames } from '../../../utils/career-analyzer/skillExtractor';

const Step2Skills = ({ formData, setFormData }) => {
    const [currentSkill, setCurrentSkill] = useState('');
    const [parsing, setParsing] = useState(false);
    const [parseMessage, setParseMessage] = useState('');
    const [autoDetectedSkills, setAutoDetectedSkills] = useState([]);

    const handleAddSkill = (e) => {
        e.preventDefault();
        if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
            setFormData('skills', [...formData.skills, currentSkill.trim()]);
            setCurrentSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData('skills', formData.skills.filter(skill => skill !== skillToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddSkill(e);
        }
    };

    const handleResumeUpload = async (file) => {
        if (!file) return;

        setFormData('resume', file);

        // Only parse PDFs
        if (isValidPDF(file)) {
            setParsing(true);
            setParseMessage('📄 Extracting text from resume...');

            try {
                const text = await extractTextFromPDF(file);
                setFormData('resumeText', text);
                setParseMessage('🔍 Identifying skills from resume...');

                // Extract skills
                const extractedSkills = getSkillNames(text);

                if (extractedSkills.length > 0) {
                    // Merge with existing skills (no duplicates)
                    const existingSkills = formData.skills || [];
                    const newSkills = extractedSkills.filter(s =>
                        !existingSkills.some(es => es.toLowerCase() === s.toLowerCase())
                    );
                    const mergedSkills = [...existingSkills, ...newSkills];
                    setFormData('skills', mergedSkills);
                    setAutoDetectedSkills(newSkills);
                    setParseMessage(`✅ Found ${extractedSkills.length} skills from your resume!`);
                } else {
                    setParseMessage('');
                }
            } catch (error) {
                console.error('Resume parsing error:', error);
                setParseMessage('');
            } finally {
                setParsing(false);
            }
        } else {
            setParseMessage('');
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.6rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: '1rem',
        outline: 'none'
    };

    const addButtonStyle = {
        backgroundColor: 'var(--primary)',
        color: 'var(--white)',
        border: 'none',
        padding: '0 1rem',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        fontSize: '1.25rem',
        marginLeft: '0.5rem'
    };

    const tagStyle = (isAutoDetected) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: isAutoDetected ? 'rgba(16, 185, 129, 0.08)' : 'var(--white)',
        border: `1px solid ${isAutoDetected ? '#10b981' : 'var(--primary)'}`,
        color: isAutoDetected ? '#059669' : 'var(--primary)',
        padding: '0.25rem 0.75rem',
        borderRadius: '2rem',
        fontSize: '0.875rem',
        fontWeight: '500'
    });

    const closeBtnStyle = {
        background: 'none',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: '1rem',
        marginLeft: '0.25rem'
    };

    return (
        <div className="animate-fadeIn">
            <h2 style={{ marginBottom: '0.5rem' }}>Skills & Expertise</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-medium)' }}>Upload your resume to auto-detect skills, or add them manually.</p>

            {/* Resume Upload — Moved to top for better flow */}
            <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--bg-light)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Upload Resume <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    id="resume-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            handleResumeUpload(file);
                        }
                    }}
                />
                <div
                    onClick={() => document.getElementById('resume-upload').click()}
                    style={{
                        border: `2px dashed ${formData.resume ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: formData.resume ? 'rgba(79, 70, 229, 0.03)' : 'var(--bg-light)',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {parsing ? '⏳' : formData.resume ? '✅' : '📄'}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-dark)' }}>
                        {parsing ? 'Analyzing resume...' : formData.resume ? formData.resume.name : 'Click to upload resume (PDF recommended)'}
                    </div>
                    {!formData.resume && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                            PDF files will be auto-analyzed for skills • Up to 5MB
                        </p>
                    )}
                </div>

                {/* Parse Status Message */}
                {parseMessage && (
                    <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: parseMessage.includes('✅') ? '#f0fdf4' :
                            parseMessage.includes('⚠️') ? '#fffbeb' : '#eff6ff',
                        border: `1px solid ${parseMessage.includes('✅') ? '#bbf7d0' :
                            parseMessage.includes('⚠️') ? '#fde68a' : '#bfdbfe'}`,
                        borderRadius: 'var(--radius)',
                        fontSize: '0.875rem',
                        color: parseMessage.includes('✅') ? '#166534' :
                            parseMessage.includes('⚠️') ? '#92400e' : '#1e40af'
                    }}>
                        {parseMessage}
                    </div>
                )}

                {/* Loading animation */}
                {parsing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <div style={{
                            width: '1rem', height: '1rem',
                            border: '2px solid var(--border)',
                            borderTop: '2px solid var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }}></div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-medium)' }}>Processing...</span>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}
            </div>

            {/* Skills Input */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: '500' }}>Add Skills Manually</label>
                <div style={{ display: 'flex' }}>
                    <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={inputStyle}
                        placeholder="Enter your skills"
                    />
                    <button onClick={handleAddSkill} type="button" style={addButtonStyle}>+</button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>Press Enter to add</p>
            </div>

            {/* Skills List */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                minHeight: '60px',
                padding: '1rem',
                backgroundColor: 'var(--bg-light)',
                borderRadius: 'var(--radius)',
                border: '1px dashed var(--border)',
                marginBottom: '1.5rem'
            }}>
                {formData.skills.length === 0 && (
                    <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.875rem' }}>No skills added yet.</span>
                )}
                {formData.skills.map((skill, index) => {
                    const isAuto = autoDetectedSkills.includes(skill);
                    return (
                        <div key={index} style={tagStyle(isAuto)}>
                            {isAuto && <span style={{ fontSize: '0.7rem' }}>🤖</span>}
                            {skill}
                            <button onClick={() => handleRemoveSkill(skill)} style={closeBtnStyle}>×</button>
                        </div>
                    );
                })}
            </div>

            {autoDetectedSkills.length > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '1rem' }}>
                    🤖 = Auto-detected from resume
                </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: '500' }}>Overall Skill Level</label>
                    <select
                        name="skillLevel"
                        value={formData.skillLevel}
                        onChange={(e) => setFormData('skillLevel', e.target.value)}
                        style={{ ...inputStyle, backgroundColor: 'var(--white)' }}
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Expert">Expert</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: '500' }}>Tools & Software</label>
                    <input
                        type="text"
                        name="tools"
                        value={formData.tools}
                        onChange={(e) => setFormData('tools', e.target.value)}
                        style={inputStyle}
                        placeholder=""
                    />
                </div>
            </div>
        </div>
    );
};

export default Step2Skills;
