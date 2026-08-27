import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJobByAdmin } from '../../services/jobService';
import { FiSave, FiArrowLeft, FiBriefcase } from 'react-icons/fi';

export default function AdminPostJob() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({
        companyName: '', title: '', description: '', skills: '',
        experience: '', salaryRange: '', location: '', jobType: 'Full-Time',
        deadline: '', contactEmail: '', companyLogo: '',
        googleFormLink: '', cgpa: ''
    });

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            await createJobByAdmin(formData);
            setMessage({ text: '✅ Job posted successfully! It is now live on Browse Jobs.', type: 'success' });
            setFormData({
                companyName: '', title: '', description: '', skills: '',
                experience: '', salaryRange: '', location: '', jobType: 'Full-Time',
                deadline: '', contactEmail: '', companyLogo: '', googleFormLink: '', cgpa: ''
            });
        } catch (err) {
            console.error('Failed to post job:', err);
            setMessage({ text: '❌ Failed to post job. Please try again.', type: 'error' });
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
                        <FiBriefcase style={{ fontSize: '1.5rem', color: 'var(--primary-light)' }} />
                        <h2 style={{ margin: 0 }}>Post a New Job</h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Create a job listing that will appear immediately on the Browse Jobs page
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
                                placeholder="e.g. Google, TCS, Infosys" required />
                        </div>
                        <div className="form-group">
                            <label>Company Logo URL (optional)</label>
                            <input name="companyLogo" value={formData.companyLogo} onChange={handleChange}
                                placeholder="https://example.com/logo.png" />
                        </div>
                        <div className="form-group">
                            <label>Job Title *</label>
                            <input name="title" value={formData.title} onChange={handleChange}
                                placeholder="e.g. Senior React Developer" required />
                        </div>
                        <div className="form-group">
                            <label>Job Description *</label>
                            <textarea name="description" value={formData.description} onChange={handleChange}
                                placeholder="Describe the role, responsibilities, and requirements..." rows={5} required />
                        </div>
                        <div className="form-group">
                            <label>Required Skills (comma-separated) *</label>
                            <input name="skills" value={formData.skills} onChange={handleChange}
                                placeholder="React, Node.js, MongoDB, TypeScript" required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Experience Required *</label>
                                <select name="experience" value={formData.experience} onChange={handleChange} required>
                                    <option value="">Select</option>
                                    <option value="Fresher">Fresher</option>
                                    <option value="1-2 years">1-2 years</option>
                                    <option value="3-5 years">3-5 years</option>
                                    <option value="5+ years">5+ years</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Salary Range *</label>
                                <input name="salaryRange" value={formData.salaryRange} onChange={handleChange}
                                    placeholder="e.g. ₹5L - ₹10L / year" required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Job Location *</label>
                                <input name="location" value={formData.location} onChange={handleChange}
                                    placeholder="e.g. Mumbai, Remote" required />
                            </div>
                            <div className="form-group">
                                <label>Job Type *</label>
                                <select name="jobType" value={formData.jobType} onChange={handleChange} required>
                                    <option value="Full-Time">Full-Time</option>
                                    <option value="Part-Time">Part-Time</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Application Deadline *</label>
                                <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Contact Email *</label>
                                <input name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange}
                                    placeholder="hr@company.com" required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>CGPA Requirement</label>
                                <input name="cgpa" value={formData.cgpa} onChange={handleChange} placeholder="e.g. 7.5 or above" />
                            </div>
                            <div className="form-group">
                                <label>Google Form Application Link (Optional)</label>
                                <input name="googleFormLink" type="url" value={formData.googleFormLink} onChange={handleChange} placeholder="https://docs.google.com/forms/d/e/..." />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
                            <FiSave /> {loading ? 'Posting...' : 'Post Job'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
