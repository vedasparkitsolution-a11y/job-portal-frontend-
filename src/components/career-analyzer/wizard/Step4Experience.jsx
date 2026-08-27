import React from 'react';

const Step4Experience = ({ formData, setFormData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(name, value);
    };

    const inputStyle = {
        width: '100%',
        padding: '0.6rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: '1rem',
        outline: 'none',
        fontFamily: 'inherit'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--text-dark)',
        marginBottom: '0.4rem'
    };

    const formGroupStyle = { marginBottom: '1.5rem' };

    return (
        <div className="animate-fadeIn">
            <h2 style={{ marginBottom: '0.5rem' }}>Work Experience</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-medium)' }}>Highlight your past roles and achievements.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                    <label style={labelStyle}>Last Job Title</label>
                    <input
                        type="text"
                        name="lastJobTitle"
                        value={formData.lastJobTitle}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="e.g. Senior Developer"
                    />
                </div>

                <div>
                    <label style={labelStyle}>Company Name</label>
                    <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Enter your company name"
                    />
                </div>

                <div>
                    <label style={labelStyle}>Years of Experience</label>
                    <input
                        type="number"
                        min="0"
                        max="50"
                        name="yearsExperience"
                        value={formData.yearsExperience}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Enter your experience"
                    />
                </div>
            </div>

            <div style={formGroupStyle}>
                <label style={labelStyle}>Key Responsibilities</label>
                <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    rows="4"
                    style={{ ...inputStyle, resize: 'none' }}
                    placeholder="Describe your main duties and achievements..."
                />
            </div>

            <div style={formGroupStyle}>
                <label style={labelStyle}>Key Projects</label>
                <textarea
                    name="projects"
                    value={formData.projects}
                    onChange={handleChange}
                    rows="3"
                    style={{ ...inputStyle, resize: 'none' }}
                    placeholder="List major projects you worked on..."
                />
            </div>
        </div>
    );
};

export default Step4Experience;
