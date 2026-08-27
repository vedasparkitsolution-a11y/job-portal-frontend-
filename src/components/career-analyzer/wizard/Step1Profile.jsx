import React from 'react';

const Step1Profile = ({ formData, setFormData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(name, value);
    };

    const formGroupStyle = {
        marginBottom: '1rem'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--text-dark)',
        marginBottom: '0.4rem'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.6rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
    };

    const radioContainerStyle = {
        display: 'flex',
        gap: '1rem',
        marginTop: '0.5rem'
    };

    const radioLabelStyle = (isSelected) => ({
        flex: 1,
        padding: '1rem',
        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
        backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.05)' : 'var(--white)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'block'
    });

    return (
        <div className="animate-fadeIn">
            <h2 style={{ marginBottom: '0.5rem' }}>Profile Information</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-medium)' }}>Let's get to know you better. Please provide your basic details.</p>

            <div style={gridStyle}>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Enter your name"
                    />
                </div>


                <div style={formGroupStyle}>
                    <label style={labelStyle}>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Enter your email"
                    />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Enter your phone number"
                    />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Current Location</label>
                    <select
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        style={{ ...inputStyle, backgroundColor: 'var(--white)' }}
                    >
                        <option value="">Select Location</option>
                        <option value="Chennai, India">Chennai, India</option>
                        <option value="Mumbai, India">Mumbai, India</option>
                        <option value="Delhi, India">Delhi, India</option>
                        <option value="Bangalore, India">Bangalore, India</option>
                        <option value="Hyderabad, India">Hyderabad, India</option>
                        <option value="Kolkata, India">Kolkata, India</option>
                        <option value="Pune, India">Pune, India</option>
                        <option value="Ahmedabad, India">Ahmedabad, India</option>
                        <option value="Jaipur, India">Jaipur, India</option>
                        <option value="Coimbatore, India">Coimbatore, India</option>
                        <option value="Kochi, India">Kochi, India</option>
                        <option value="Lucknow, India">Lucknow, India</option>
                        <option value="Chandigarh, India">Chandigarh, India</option>
                        <option value="Indore, India">Indore, India</option>
                        <option value="Visakhapatnam, India">Visakhapatnam, India</option>
                    </select>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Highest Qualification</label>
                    <select
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        style={{ ...inputStyle, backgroundColor: 'var(--white)' }}
                    >
                        <option value="">Select Qualification</option>
                        <option value="High School">High School</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="PhD">PhD</option>
                        <option value="Diploma">Diploma</option>
                    </select>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Field of Study</label>
                    <input
                        type="text"
                        name="fieldOfStudy"
                        value={formData.fieldOfStudy}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder=""
                    />
                </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <label style={labelStyle}>Experience Level</label>
                <div style={radioContainerStyle}>
                    <label style={radioLabelStyle(formData.experienceType === 'fresher')}>
                        <input
                            type="radio"
                            name="experienceType"
                            value="fresher"
                            checked={formData.experienceType === 'fresher'}
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>I am a Fresher</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)', marginTop: '0.25rem' }}>Graduate / No work experience</div>
                    </label>

                    <label style={radioLabelStyle(formData.experienceType === 'experienced')}>
                        <input
                            type="radio"
                            name="experienceType"
                            value="experienced"
                            checked={formData.experienceType === 'experienced'}
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />
                        <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>I am Experienced</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)', marginTop: '0.25rem' }}>I have work history</div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Step1Profile;
