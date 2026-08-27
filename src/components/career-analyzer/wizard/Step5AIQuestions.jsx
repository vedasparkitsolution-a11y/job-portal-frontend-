import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

const Step5AIQuestions = ({ formData, setFormData }) => {
    const handleSelect = (category, value) => {
        setFormData(category, value);
    };

    const OptionCard = ({ category, value, label, emoji, currentValue, description }) => {
        const isSelected = currentValue === value;

        const cardStyle = {
            padding: '20px',
            borderRadius: '16px',
            border: isSelected ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
            backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            height: '100%',
            position: 'relative',
            boxShadow: isSelected ? '0 4px 12px rgba(14, 165, 233, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
            transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
        };

        return (
            <div 
                onClick={() => handleSelect(category, value)} 
                style={cardStyle}
                onMouseEnter={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.borderColor = '#bae6fd';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    }
                }}
            >
                {isSelected && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#0ea5e9', fontSize: '1.2rem' }}>
                        <FiCheckCircle />
                    </div>
                )}
                <div style={{ fontSize: '2.4rem', marginBottom: '16px', background: isSelected ? '#ffffff' : '#f8fafc', padding: '12px', borderRadius: '12px', display: 'inline-block' }}>
                    {emoji}
                </div>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.1rem', marginBottom: '8px' }}>
                    {label}
                </div>
                {description && (
                    <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
                        {description}
                    </div>
                )}
            </div>
        );
    };

    const sectionStyle = {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '1.25rem',
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: '8px'
    };
    
    const subtitleStyle = {
        fontSize: '0.95rem',
        color: '#64748b',
        marginBottom: '24px'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
    };

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2fe', color: '#0ea5e9', padding: '10px 20px', borderRadius: '30px', fontWeight: '700', fontSize: '0.9rem', marginBottom: '16px' }}>
                    ✨ AI Profiling
                </div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', marginBottom: '12px' }}>
                    Career Intelligence Analysis
                </h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Select the options that best describe your working style. Our AI uses this to find companies with cultures that match your personality.
                </p>
            </div>

            {/* Work Interest */}
            <div style={sectionStyle}>
                <label style={labelStyle}>What kind of work do you enjoy most?</label>
                <p style={subtitleStyle}>Select the core activity that drives your professional satisfaction.</p>
                <div style={gridStyle}>
                    <OptionCard category="enjoyWork" value="Problem Solving" label="Problem Solving" description="Tackling complex challenges and finding logical solutions." emoji="🧩" currentValue={formData.enjoyWork} />
                    <OptionCard category="enjoyWork" value="Creative" label="Creative Design" description="Innovating, designing, and thinking outside the box." emoji="🎨" currentValue={formData.enjoyWork} />
                    <OptionCard category="enjoyWork" value="People" label="Helping People" description="Mentoring, supporting, and interacting with others." emoji="🤝" currentValue={formData.enjoyWork} />
                    <OptionCard category="enjoyWork" value="Data" label="Analyzing Data" description="Working with numbers, trends, and analytics." emoji="📊" currentValue={formData.enjoyWork} />
                </div>
            </div>

            {/* Work Style */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Preferred Work Style</label>
                <p style={subtitleStyle}>How do you prefer to execute your daily tasks?</p>
                <div style={gridStyle}>
                    <OptionCard category="workStyle" value="Team" label="Team Collaboration" description="Thrive in group settings and collective brainstorming." emoji="👥" currentValue={formData.workStyle} />
                    <OptionCard category="workStyle" value="Independent" label="Independent Contributor" description="Excel when given autonomy and deep-focus time." emoji="👤" currentValue={formData.workStyle} />
                </div>
            </div>

            {/* Career Goal */}
            <div style={sectionStyle}>
                <label style={labelStyle}>Primary Career Goal</label>
                <p style={subtitleStyle}>What is your main objective for the next 3-5 years?</p>
                <div style={gridStyle}>
                    <OptionCard category="careerGoal" value="Growth" label="Fast Career Growth" description="Rapid promotions and climbing the corporate ladder." emoji="🚀" currentValue={formData.careerGoal} />
                    <OptionCard category="careerGoal" value="Stability" label="Work-Life Balance" description="Predictable hours and time for personal pursuits." emoji="⚖️" currentValue={formData.careerGoal} />
                    <OptionCard category="careerGoal" value="Leadership" label="Leadership Role" description="Managing teams and guiding company strategy." emoji="👑" currentValue={formData.careerGoal} />
                    <OptionCard category="careerGoal" value="Expertise" label="Deep Technology" description="Becoming an elite subject matter expert." emoji="🧠" currentValue={formData.careerGoal} />
                </div>
            </div>

            {/* Learning Interest */}
            <div style={sectionStyle}>
                <label style={labelStyle}>What do you want to learn next?</label>
                <p style={subtitleStyle}>Where do you want to focus your upskilling efforts?</p>
                <div style={gridStyle}>
                    <OptionCard category="learningInterest" value="Technical" label="New Technologies" description="Mastering new frameworks, languages, or tools." emoji="💻" currentValue={formData.learningInterest} />
                    <OptionCard category="learningInterest" value="Management" label="Management Skills" description="Improving soft skills, agile, and leadership." emoji="📈" currentValue={formData.learningInterest} />
                </div>
            </div>
        </div>
    );
};

export default Step5AIQuestions;

