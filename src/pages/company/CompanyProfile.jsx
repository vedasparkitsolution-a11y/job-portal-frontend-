import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateCompanyProfile } from '../../services/companyService';
import { uploadLogo } from '../../services/storageService';
import { FiSave, FiImage, FiBriefcase, FiUser, FiSmartphone, FiCheckCircle, FiLock } from 'react-icons/fi';
import EmployerLoginModal from '../../components/company/EmployerLoginModal';

export default function CompanyProfile({ embedded = false }) {
    const { currentUser, userData, fetchUserData, refreshUserData } = useAuth();
    const [formData, setFormData] = useState({
        companyName: '',
        contactPersonName: '',
        hrName: '',
        designation: '',
        email: '',
        mobileNumber: '',
        website: '',
        location: '',
        address: '',
        industry: '',
        companySize: '',
        description: ''
    });

    const [originalMobile, setOriginalMobile] = useState('');
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

    useEffect(() => {
        if (userData) {
            const initialMobile = userData.mobileNumber || userData.phone || '';
            setFormData({
                companyName: userData.companyName || '',
                contactPersonName: userData.contactPersonName || userData.hrName || '',
                hrName: userData.hrName || userData.contactPersonName || '',
                designation: userData.designation || 'Hiring Manager',
                email: userData.email || '',
                mobileNumber: initialMobile,
                website: userData.website || '',
                location: userData.location || userData.address || '',
                address: userData.address || userData.location || '',
                industry: userData.industry || 'IT/Software',
                companySize: userData.companySize || '11-50',
                description: userData.description || ''
            });
            setOriginalMobile(initialMobile);
        }
    }, [userData]);

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    // Check mobile number change
    function handleMobileChangeClick() {
        setIsOtpModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            let updateData = {
                ...formData,
                hrName: formData.contactPersonName || formData.hrName
            };
            if (logo) {
                const url = await uploadLogo(logo, currentUser.uid);
                updateData.logoURL = url;
            }

            // Sync with backend API
            if (currentUser) {
                await fetch('http://localhost:5000/api/employer/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('mock_current_session') ? JSON.parse(localStorage.getItem('mock_current_session')).token : ''}`
                    },
                    body: JSON.stringify(updateData)
                }).catch(() => {});

                await updateCompanyProfile(currentUser.uid, updateData);
                await refreshUserData();
            }

            setMessage('Company & Contact profile updated successfully!');
        } catch (err) {
            setMessage('Failed to update profile. Please try again.');
        }
        setLoading(false);
    }

    const content = (
        <div className="profile-card" style={embedded ? { boxShadow: 'none', border: 'none', padding: 0 } : {}}>
            <div className="profile-header" style={{ marginBottom: '32px' }}>
                {userData?.logoURL || userData?.companyLogo ? (
                    <img src={userData.logoURL || userData.companyLogo} alt="Logo" style={{ width: 84, height: 84, borderRadius: '20px', objectFit: 'contain', border: '1px solid #cbd5e1', background: 'white' }} />
                ) : (
                    <div className="profile-avatar" style={{ width: 84, height: 84, borderRadius: '20px', fontSize: '2.2rem', fontWeight: 800 }}>
                        {userData?.companyName?.charAt(0) || 'C'}
                    </div>
                )}
                <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800 }}>{userData?.companyName || 'Company Profile'}</h2>
                    <p style={{ margin: '0 0 6px', color: '#64748b', fontSize: '0.95rem' }}>{userData?.email}</p>
                    <span className="status-badge approved" style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>
                        Active Employer ✓
                    </span>
                </div>
            </div>

            {message && (
                <div className={message.includes('success') ? 'success-message' : 'error-message'} style={{ marginBottom: '24px' }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* COMPANY PROFILE DETAILS (Requirement 10) */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiBriefcase style={{ color: '#7c3aed' }} /> Company Profile Details
                    </h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Company Name</label>
                            <input name="companyName" value={formData.companyName} onChange={handleChange} required placeholder="Enter company name" />
                        </div>
                        <div className="form-group">
                            <label>Website</label>
                            <input name="website" value={formData.website} onChange={handleChange} placeholder="Enter company website" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Industry</label>
                            <select name="industry" value={formData.industry} onChange={handleChange}>
                                <option value="IT/Software">IT / Software</option>
                                <option value="Finance">Finance</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Education">Education</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Marketing">Marketing</option>
                                <option value="E-commerce">E-commerce</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Company Size</label>
                            <select name="companySize" value={formData.companySize} onChange={handleChange}>
                                <option value="1-10">1-10 Employees</option>
                                <option value="11-50">11-50 Employees</option>
                                <option value="51-200">51-200 Employees</option>
                                <option value="201-500">201-500 Employees</option>
                                <option value="501-1000">501-1000 Employees</option>
                                <option value="1000+">1000+ Employees</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Company Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Enter company description..." />
                    </div>
                    <div className="form-group">
                        <label>Address & Location</label>
                        <input name="address" value={formData.address} onChange={handleChange} placeholder="Enter company address & location" />
                    </div>
                    <div className="form-group">
                        <label><FiImage /> Update Company Logo</label>
                        <input type="file" accept="image/*" onChange={e => setLogo(e.target.files[0])} />
                    </div>
                </div>

                {/* CONTACT PERSON DETAILS (Requirement 10) */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiUser style={{ color: '#7c3aed' }} /> Contact Person Information
                    </h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Person Name</label>
                            <input name="contactPersonName" value={formData.contactPersonName} onChange={handleChange} required placeholder="Enter contact person name" />
                        </div>
                        <div className="form-group">
                            <label>Designation</label>
                            <input name="designation" value={formData.designation} onChange={handleChange} placeholder="Enter designation" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter email address" />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Mobile Number (Verified)</span>
                                <button
                                    type="button"
                                    onClick={handleMobileChangeClick}
                                    style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                                >
                                    Change & Verify via OTP
                                </button>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    readOnly
                                    style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700, paddingRight: '40px' }}
                                />
                                <FiLock style={{ position: 'absolute', right: '12px', top: '14px', color: '#16a34a' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                    <FiSave /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
            </form>

            <EmployerLoginModal isOpen={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)} />
        </div>
    );

    if (embedded) return content;

    return (
        <div className="dashboard">
            <div className="container">
                <div className="dashboard-header" style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Employer Company Profile</h1>
                    <p style={{ color: '#64748b' }}>View and update your company details & recruiter contact information</p>
                </div>
                {content}
            </div>
        </div>
    );
}
