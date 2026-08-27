import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';

export default function RegisterJobSeeker() {
    const [searchParams] = useSearchParams();
    const phoneFromUrl = searchParams.get('phone') || sessionStorage.getItem('verified_candidate_phone') || '';

    const [formData, setFormData] = useState({
        name: '', email: '', phone: phoneFromUrl, password: '', confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { registerJobSeeker } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const phone = searchParams.get('phone') || sessionStorage.getItem('verified_candidate_phone');
        if (phone) {
            setFormData(prev => ({ ...prev, phone }));
        }
    }, [searchParams]);

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match.');
        }
        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters.');
        }

        setLoading(true);
        try {
            await registerJobSeeker(formData.email, formData.password, {
                name: formData.name,
                phone: formData.phone,
                resumeURL: ''
            });
            navigate('/jobseeker');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        }
        setLoading(false);
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Create Account</h2>
                <p className="auth-subtitle">Join as a Job Seeker and start applying</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label><FiUser /> Full Name</label>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label><FiMail /> Email</label>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" required />
                        </div>
                        <div className="form-group">
                            <label><FiPhone /> Phone</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label><FiLock /> Password</label>
                            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" required />
                        </div>
                        <div className="form-group">
                            <label><FiLock /> Confirm Password</label>
                            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                    <p style={{ marginTop: '8px' }}>Are you a company? <Link to="/register/company">Register Company</Link></p>
                </div>
            </div>
        </div>
    );
}
