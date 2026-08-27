import React, { useState, useRef, useEffect } from 'react';
import { JOB_ROLES } from '../../../utils/career-analyzer/jobPortalLinks';

const Step3Preferences = ({ formData, setFormData }) => {
    const [roleSearch, setRoleSearch] = useState(formData.preferredRole || '');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredRoles = JOB_ROLES.filter(role =>
        role.toLowerCase().includes(roleSearch.toLowerCase())
    );

    const handleRoleSelect = (role) => {
        setRoleSearch(role);
        setFormData('preferredRole', role);
        setShowDropdown(false);
    };

    const handleRoleInputChange = (e) => {
        const value = e.target.value;
        setRoleSearch(value);
        setFormData('preferredRole', value);
        setShowDropdown(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox' && name === 'jobTypes') {
            const currentTypes = formData.jobTypes || [];
            let newTypes;
            if (checked) {
                newTypes = [...currentTypes, value];
            } else {
                newTypes = currentTypes.filter(t => t !== value);
            }
            setFormData('jobTypes', newTypes);
        } else if (type === 'checkbox' && name === 'relocation') {
            setFormData('relocation', checked);
        } else {
            setFormData(name, value);
        }
    };

    const jobTypeOptions = ['Full-time', 'Part-time', 'Internship', 'Remote', 'Freelance'];

    const inputStyle = {
        width: '100%',
        padding: '0.6rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: '1rem',
        outline: 'none',
        backgroundColor: 'var(--white)'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--text-dark)',
        marginBottom: '0.4rem'
    };

    const checkboxLabelStyle = (isChecked) => ({
        padding: '0.5rem 1rem',
        borderRadius: '2rem',
        border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
        backgroundColor: isChecked ? 'var(--primary)' : 'var(--white)',
        color: isChecked ? 'var(--white)' : 'var(--text-medium)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        userSelect: 'none',
        transition: 'all 0.2s',
        display: 'inline-block'
    });

    return (
        <div className="animate-fadeIn">
            <h2 style={{ marginBottom: '0.5rem' }}>Job Preferences</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-medium)' }}>Tell us what kind of role you are looking for.</p>

            {/* Preferred Role — Separate from grid to avoid overlap */}
            <div style={{ position: 'relative', zIndex: 50, marginBottom: '1.5rem' }} ref={dropdownRef}>
                <label style={labelStyle}>Preferred Role <span style={{ color: 'red' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        value={roleSearch}
                        onChange={handleRoleInputChange}
                        onFocus={() => setShowDropdown(true)}
                        style={{
                            ...inputStyle,
                            borderColor: showDropdown ? 'var(--primary)' : 'var(--border)',
                            boxShadow: showDropdown ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                        placeholder="Type to search roles... e.g. Full Stack Developer"
                    />
                    <span style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: `translateY(-50%) rotate(${showDropdown ? '180deg' : '0deg'})`,
                        transition: 'transform 0.2s',
                        fontSize: '0.7rem',
                        color: 'var(--text-light)',
                        pointerEvents: 'none'
                    }}>▼</span>
                </div>

                {/* Dropdown List */}
                {showDropdown && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--primary)',
                        borderTop: 'none',
                        borderRadius: '0 0 var(--radius) var(--radius)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                        zIndex: 9999,
                        animation: 'fadeIn 0.15s ease-out'
                    }}>
                        {filteredRoles.length > 0 ? (
                            filteredRoles.map((role, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleRoleSelect(role)}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: formData.preferredRole === role ? 'rgba(79, 70, 229, 0.08)' : '#ffffff',
                                        color: formData.preferredRole === role ? 'var(--primary)' : 'var(--text-dark)',
                                        fontWeight: formData.preferredRole === role ? '600' : '400',
                                        transition: 'background-color 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = formData.preferredRole === role ? 'rgba(79, 70, 229, 0.08)' : '#ffffff'}
                                >
                                    {formData.preferredRole === role && <span style={{ marginRight: '0.4rem' }}>✓</span>}
                                    {role}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem', backgroundColor: '#ffffff' }}>
                                No matching roles. Your custom role "{roleSearch}" will be used.
                            </div>
                        )}
                    </div>
                )}

                {formData.preferredRole && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.35rem', fontWeight: '500' }}>
                        ✓ Selected: {formData.preferredRole}
                    </p>
                )}
            </div>

            {/* Other fields in grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                <div>
                    <label style={labelStyle}>Industry</label>
                    <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="">Select Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Design">Design</option>
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>
                        Expected Salary: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{formData.expectedSalary}</span>
                    </label>
                    <input
                        type="range"
                        name="expectedSalary"
                        min="20000"
                        max="200000"
                        step="5000"
                        value={formData.expectedSalary}
                        onChange={handleChange}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                        <span>20k</span>
                        <span>200k+</span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <label style={labelStyle}>Job Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {jobTypeOptions.map((type) => (
                        <label key={type} style={checkboxLabelStyle(formData.jobTypes.includes(type))}>
                            <input
                                type="checkbox"
                                name="jobTypes"
                                value={type}
                                checked={formData.jobTypes.includes(type)}
                                onChange={handleChange}
                                style={{ display: 'none' }}
                            />
                            {type}
                        </label>
                    ))}
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: 'var(--bg-light)',
                borderRadius: 'var(--radius)',
                marginTop: '2rem'
            }}>
                <div>
                    <div style={{ fontWeight: '500', color: 'var(--text-dark)' }}>Willing to Relocate</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>Are you open to moving for the right job?</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                    <input
                        type="checkbox"
                        name="relocation"
                        checked={formData.relocation}
                        onChange={handleChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: formData.relocation ? 'var(--primary)' : '#ccc',
                        transition: '.4s',
                        borderRadius: '34px'
                    }}></span>
                    <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '1.1rem',
                        width: '1.1rem',
                        left: formData.relocation ? '1.7rem' : '0.2rem',
                        bottom: '0.2rem',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%'
                    }}></span>
                </label>
            </div>
        </div>
    );
};

export default Step3Preferences;
