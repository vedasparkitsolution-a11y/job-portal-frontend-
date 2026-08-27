import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FiBriefcase, FiUser, FiMail, FiPhone, FiGlobe, 
    FiMapPin, FiUploadCloud, FiCheckCircle, FiLock, 
    FiAlertCircle, FiImage, FiTrash2, FiFileText
} from 'react-icons/fi';

export default function CreateCompanyProfile() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { verifiedMobile, createCompanyProfile } = useAuth();

    const initialPhone = searchParams.get('phone')
        || sessionStorage.getItem('verified_employer_phone')
        || verifiedMobile
        || '';

    // Company & Contact Form State
    const [formData, setFormData] = useState({
        // Company Info
        companyName: '',
        companyWebsite: '',
        companyEmail: '',
        companyPhone: initialPhone || '',
        companyType: 'Private Limited',
        industry: 'IT/Software',
        companySize: '11-50',
        yearEstablished: '',
        registrationNumber: '',
        gstNumber: '',
        description: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',

        // Contact Person Info
        contactPersonName: '',
        designation: 'Hiring Manager',
        email: '',
        mobileNumber: initialPhone || '',
        alternatePhone: '',
        password: ''
    });

    // Logo Upload State
    const [logoPreview, setLogoPreview] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Validation & Submission State
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const phone = searchParams.get('phone') || sessionStorage.getItem('verified_employer_phone') || verifiedMobile;
        if (phone) {
            setFormData(prev => ({
                ...prev,
                mobileNumber: phone,
                companyPhone: phone
            }));
        }
    }, [searchParams, verifiedMobile]);

    // Field change handler
    function handleChange(e) {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    }

    // Logo File Upload Validation & Canvas Compression
    function handleLogoSelect(file) {
        if (!file) return;

        // Check format
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setErrors(prev => ({ ...prev, logo: 'Accepted image formats: JPG, JPEG, PNG, WebP' }));
            return;
        }

        // Check size limit (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, logo: 'File size exceeds 5MB limit' }));
            return;
        }

        setErrors(prev => ({ ...prev, logo: '' }));
        setLogoFile(file);

        // Simulate progress & create compressed preview
        setIsUploading(true);
        setUploadProgress(30);

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            // Scale logo to max 180x180 px for lightweight storage
            const canvas = document.createElement('canvas');
            const maxDim = 180;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDim) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG 80% quality (~10KB size)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setLogoPreview(compressedDataUrl);
            setUploadProgress(100);
            setTimeout(() => setIsUploading(false), 300);
        };

        reader.readAsDataURL(file);
    }


    // Drag & Drop Handlers
    function handleDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleLogoSelect(e.dataTransfer.files[0]);
        }
    }

    // Validate Required Fields (Requirement 6)
    function validateForm() {
        const newErrors = {};

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required.';
        }

        if (!formData.contactPersonName.trim()) {
            newErrors.contactPersonName = 'Contact person name is required.';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Please enter a valid email address.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (!formData.mobileNumber.trim()) {
            newErrors.mobileNumber = 'Please enter a valid mobile number.';
        }

        if (!formData.password || formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    // Form Submission (Requirement 7)
    async function handleSubmit(e) {
        e.preventDefault();
        setSuccessMessage('');

        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);

        try {
            const profilePayload = {
                ...formData,
                companyLogo: logoPreview || '',
                companyEmail: formData.companyEmail || formData.email,
                companyPhone: formData.companyPhone || formData.mobileNumber
            };

            await createCompanyProfile(profilePayload);

            setSuccessMessage('Company Profile Created Successfully!');
            
            // Redirect after brief notification delay
            setTimeout(() => {
                navigate('/company');
            }, 1200);
        } catch (err) {
            setErrors({ submit: err.message || 'Failed to create company profile. Please try again.' });
        }
        setLoading(false);
    }

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 20px 80px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                
                {/* Header Title Banner */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: '#f5f3ff', color: '#7c3aed', padding: '6px 16px',
                        borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '12px'
                    }}>
                        <FiCheckCircle /> Verified Mobile: {formData.mobileNumber}
                    </div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                        Create Your Company Profile
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                        Set up your official employer account to post jobs and recruit top candidates
                    </p>
                </div>

                {successMessage && (
                    <div style={{
                        padding: '16px 24px', borderRadius: '16px', background: '#f0fdf4',
                        border: '1.5px solid #86efac', color: '#166534', fontWeight: 700,
                        fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px',
                        marginBottom: '32px', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)'
                    }}>
                        <FiCheckCircle size={24} />
                        <span>{successMessage} Redirecting to Employer Dashboard...</span>
                    </div>
                )}

                {errors.submit && (
                    <div style={{
                        padding: '16px 24px', borderRadius: '16px', background: '#fef2f2',
                        border: '1.5px solid #fca5a5', color: '#991b1b', fontWeight: 700,
                        fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '12px',
                        marginBottom: '32px'
                    }}>
                        <FiAlertCircle size={24} />
                        <span>{errors.submit}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    {/* SECTION 1: COMPANY LOGO UPLOAD (Requirement 5) */}
                    <div style={{
                        background: '#ffffff', borderRadius: '20px', padding: '32px',
                        border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                        marginBottom: '32px'
                    }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FiImage style={{ color: '#7c3aed' }} /> Company Logo
                        </h3>

                        <div 
                            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                            style={{
                                border: dragActive ? '2px dashed #7c3aed' : '2px dashed #cbd5e1',
                                background: dragActive ? '#f5f3ff' : '#f8fafc',
                                borderRadius: '16px', padding: '32px', textAlign: 'center',
                                transition: 'all 0.2s', position: 'relative'
                            }}
                        >
                            {logoPreview ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '100px', height: '100px', borderRadius: '20px',
                                        overflow: 'hidden', border: '2px solid #e2e8f0',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#ffffff'
                                    }}>
                                        <img src={logoPreview} alt="Company Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <label style={{
                                            padding: '8px 16px', borderRadius: '10px', background: '#7c3aed',
                                            color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                                        }}>
                                            Replace Logo
                                            <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={(e) => handleLogoSelect(e.target.files[0])} style={{ display: 'none' }} />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => { setLogoPreview(''); setLogoFile(null); }}
                                            style={{
                                                padding: '8px 16px', borderRadius: '10px', background: '#fef2f2',
                                                color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700, fontSize: '0.85rem',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            <FiTrash2 /> Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9',
                                        color: '#7c3aed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.8rem', marginBottom: '12px'
                                    }}>
                                        <FiUploadCloud />
                                    </div>
                                    <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                                        Drag & drop your company logo here, or <label style={{ color: '#7c3aed', cursor: 'pointer', textDecoration: 'underline' }}>
                                            browse
                                            <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={(e) => handleLogoSelect(e.target.files[0])} style={{ display: 'none' }} />
                                        </label>
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                                        Supports JPG, JPEG, PNG, WebP (Max size: 5MB). If omitted, a default avatar will be shown.
                                    </p>
                                </div>
                            )}

                            {isUploading && (
                                <div style={{ marginTop: '16px', width: '100%', background: '#e2e8f0', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                    <div style={{ width: `${uploadProgress}%`, background: '#7c3aed', height: '100%', transition: 'width 0.2s' }} />
                                </div>
                            )}
                        </div>
                        {errors.logo && <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, marginTop: '8px' }}>{errors.logo}</div>}
                    </div>

                    {/* SECTION 2: COMPANY INFORMATION (Requirement 4) */}
                    <div style={{
                        background: '#ffffff', borderRadius: '20px', padding: '32px',
                        border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                        marginBottom: '32px'
                    }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FiBriefcase style={{ color: '#7c3aed' }} /> Company Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Company Name *
                                </label>
                                <input 
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    placeholder="Enter company name"
                                    required
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: errors.companyName ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                                        fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                    }}
                                />
                                {errors.companyName && <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>{errors.companyName}</span>}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Company Website
                                </label>
                                <input 
                                    name="companyWebsite"
                                    value={formData.companyWebsite}
                                    onChange={handleChange}
                                    placeholder="Enter company website"
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Company Email
                                </label>
                                <input 
                                    type="email"
                                    name="companyEmail"
                                    value={formData.companyEmail}
                                    onChange={handleChange}
                                    placeholder="Enter company email address"
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Company Phone Number
                                </label>
                                <input 
                                    name="companyPhone"
                                    value={formData.companyPhone}
                                    onChange={handleChange}
                                    placeholder="Enter company phone number"
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Company Type
                                </label>
                                <select 
                                    name="companyType"
                                    value={formData.companyType}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600, background: 'white' }}
                                >
                                    <option value="Private Limited">Private Limited</option>
                                    <option value="Public Limited">Public Limited</option>
                                    <option value="Partnership">Partnership</option>
                                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                                    <option value="Startup">Startup</option>
                                    <option value="MNC">MNC</option>
                                    <option value="NGO">NGO</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Industry
                                </label>
                                <select 
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600, background: 'white' }}
                                >
                                    <option value="IT/Software">IT / Software</option>
                                    <option value="Finance">Finance / Fintech</option>
                                    <option value="Healthcare">Healthcare / Pharma</option>
                                    <option value="E-commerce">E-commerce / Retail</option>
                                    <option value="Education">Education / EdTech</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Marketing">Marketing / Agency</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Company Size
                                </label>
                                <select 
                                    name="companySize"
                                    value={formData.companySize}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600, background: 'white' }}
                                >
                                    <option value="1-10">1-10 Employees</option>
                                    <option value="11-50">11-50 Employees</option>
                                    <option value="51-200">51-200 Employees</option>
                                    <option value="201-500">201-500 Employees</option>
                                    <option value="501-1000">501-1000 Employees</option>
                                    <option value="1000+">1000+ Employees</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Year Established
                                </label>
                                <input 
                                    name="yearEstablished"
                                    value={formData.yearEstablished}
                                    onChange={handleChange}
                                    placeholder="Enter year established"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Company Registration Number (CIN/LLPIN)
                                </label>
                                <input 
                                    name="registrationNumber"
                                    value={formData.registrationNumber}
                                    onChange={handleChange}
                                    placeholder="Enter registration number (CIN/LLPIN)"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    GST Number
                                </label>
                                <input 
                                    name="gstNumber"
                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                    placeholder="Enter GST number"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Company Description
                            </label>
                            <textarea 
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter company description..."
                                rows={3}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 500, fontSize: '0.92rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Company Address
                            </label>
                            <input 
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter company address"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    City
                                </label>
                                <input 
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Enter city"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    State
                                </label>
                                <input 
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="Enter state"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Country
                                </label>
                                <input 
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="Enter country"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Pincode
                                </label>
                                <input 
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="Enter pincode"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: CONTACT PERSON INFORMATION (Requirement 4) */}
                    <div style={{
                        background: '#ffffff', borderRadius: '20px', padding: '32px',
                        border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                        marginBottom: '32px'
                    }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FiUser style={{ color: '#7c3aed' }} /> Recruiter / Contact Person Details
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Contact Person Name *
                                </label>
                                <input 
                                    name="contactPersonName"
                                    value={formData.contactPersonName}
                                    onChange={handleChange}
                                    placeholder="Enter contact person name"
                                    required
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: errors.contactPersonName ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                                        fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                    }}
                                />
                                {errors.contactPersonName && <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>{errors.contactPersonName}</span>}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Designation
                                </label>
                                <input 
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    placeholder="Enter designation"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Mobile Number * <span style={{ color: '#16a34a', fontSize: '0.78rem' }}>(OTP Verified ✓)</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        name="mobileNumber"
                                        value={formData.mobileNumber}
                                        readOnly
                                        style={{
                                            width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px',
                                            border: '1.5px solid #bbf7d0', background: '#f0fdf4',
                                            fontSize: '0.95rem', fontWeight: 700, color: '#166534', outline: 'none'
                                        }}
                                    />
                                    <FiLock style={{ position: 'absolute', left: '12px', top: '14px', color: '#16a34a' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Mobile number verified via OTP cannot be changed without re-verification.</span>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Official Email Address *
                                </label>
                                <input 
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter official email address"
                                    required
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: errors.email ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                                        fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                    }}
                                />
                                {errors.email && <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>{errors.email}</span>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Alternate Phone Number
                                </label>
                                <input 
                                    name="alternatePhone"
                                    value={formData.alternatePhone}
                                    onChange={handleChange}
                                    placeholder="Enter alternate phone number"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    Account Password *
                                </label>
                                <input 
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter account password"
                                    required
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: errors.password ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                                        fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                    }}
                                />
                                {errors.password && <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>{errors.password}</span>}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: SUBMISSION BUTTON (Requirement 7) */}
                    <div style={{ textAlign: 'center' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '16px 48px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                color: '#ffffff', fontWeight: 800, fontSize: '1.1rem', border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 12px 24px rgba(124, 58, 237, 0.3)',
                                transition: 'transform 0.2s', display: 'inline-flex', alignItems: 'center', gap: '10px'
                            }}
                            onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            {loading ? 'Creating Profile...' : 'Create Company Profile'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
