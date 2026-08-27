import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompanyByAdmin } from '../../services/companyService';
import { FiSave, FiArrowLeft, FiHome } from 'react-icons/fi';

export default function AdminAddCompany() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({
        companyName: '', email: '', hrName: '', location: '',
        industry: '', website: '', description: '', logoURL: ''
    });

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await createCompanyByAdmin(formData);
            setMessage({ text: '✅ Company added successfully! It is pre-approved and visible on the platform.', type: 'success' });
            setFormData({
                companyName: '', email: '', hrName: '', location: '',
                industry: '', website: '', description: '', logoURL: ''
            });
        } catch (err) {
            console.error('Failed to add company:', err);
            setMessage({ text: '❌ Failed to add company. Please try again.', type: 'error' });
        }
        setLoading(false);
    }

    return (
        <div className="dashboard">
            <div className="container">
                <button className="btn btn-secondary" onClick={() => navigate('/admin')} style={{ marginBottom: '20px' }}>
                    <FiArrowLeft /> Back to Dashboard
                </button>

                <div className="profile-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <FiHome style={{ fontSize: '1.5rem', color: 'var(--primary-light)' }} />
                        <h2 style={{ margin: 0 }}>Add a New Company</h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Add a company directly to the platform. It will be pre-approved automatically.
                    </p>

                    {message.text && (
                        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Company Name *</label>
                            <input name="companyName" value={formData.companyName} onChange={handleChange}
                                placeholder="e.g. Google India Pvt Ltd" required />
                        </div>
                        <div className="form-group">
                            <label>Company Logo URL (optional)</label>
                            <input name="logoURL" value={formData.logoURL} onChange={handleChange}
                                placeholder="https://example.com/logo.png" />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email *</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange}
                                    placeholder="contact@company.com" required />
                            </div>
                            <div className="form-group">
                                <label>HR Contact Name *</label>
                                <input name="hrName" value={formData.hrName} onChange={handleChange}
                                    placeholder="e.g. Priya Sharma" required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Location *</label>
                                <input name="location" value={formData.location} onChange={handleChange}
                                    placeholder="e.g. Mumbai, Bangalore" required />
                            </div>
                            <div className="form-group">
                                <label>Industry *</label>
                                <select name="industry" value={formData.industry} onChange={handleChange} required>
                                    <option value="">Select Industry</option>
                                    <option value="IT/Software">IT/Software</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Education">Education</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Consulting">Consulting</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Website (optional)</label>
                            <input name="website" value={formData.website} onChange={handleChange}
                                placeholder="https://www.company.com" />
                        </div>
                        <div className="form-group">
                            <label>Company Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange}
                                placeholder="Brief description of the company, its culture and values..." rows={4} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
                            <FiSave /> {loading ? 'Adding...' : 'Add Company'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
