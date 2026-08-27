import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendCandidateOtp, verifyCandidateOtp } from '../../services/candidateService';
import { 
    FiX, FiSmartphone, FiMail, FiLock, FiArrowLeft, FiCheckCircle, 
    FiAlertCircle, FiUserPlus, FiLogIn, FiEye, FiEyeOff, FiArrowRight,
    FiCheck
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const COUNTRY_CODES = [
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+1', name: 'USA / Canada', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
];

export default function CandidateAuthModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { login, googleLogin, setVerifiedMobile } = useAuth();

    // Steps: 'MOBILE' -> 'OTP' -> 'CHOICE' -> 'LOGIN'
    const [step, setStep] = useState('MOBILE');

    // Form inputs
    const [countryCode, setCountryCode] = useState('+91');
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Timer & Status
    const [countdown, setCountdown] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('MOBILE');
            setError('');
            setInfoMessage('');
            setLoading(false);
            setOtp(['', '', '', '', '', '']);
            setEmail('');
            setPassword('');
            setShowPassword(false);
        }
    }, [isOpen]);

    // Countdown Timer logic
    useEffect(() => {
        let interval = null;
        if (timerActive && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setTimerActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timerActive, countdown]);

    if (!isOpen) return null;

    const fullMobile = `${countryCode} ${mobileNumber.trim()}`;

    // Handle Mobile Input Validation
    function validateMobile(phone) {
        const clean = phone.replace(/\D/g, '');
        return clean.length >= 10 && clean.length <= 12;
    }

    // Step 1: Send OTP
    async function handleSendOtp(e) {
        if (e) e.preventDefault();
        setError('');
        setInfoMessage('');

        if (!validateMobile(mobileNumber)) {
            return setError('Please enter a valid 10-digit mobile number.');
        }

        setLoading(true);
        try {
            const res = await sendCandidateOtp(mobileNumber, countryCode);
            setStep('OTP');
            setCountdown(30);
            setTimerActive(true);
            setInfoMessage(res.otpCode ? `Demo OTP code: ${res.otpCode} (or enter 123456)` : 'OTP code sent to your mobile');
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        }
        setLoading(false);
    }

    // Handle OTP Box Input Change
    function handleOtpChange(element, index) {
        if (isNaN(element.value)) return false;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Auto-focus next box
        if (element.value !== '' && element.nextSibling) {
            element.nextSibling.focus();
        }
    }

    function handleOtpKeyDown(e, index) {
        if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    }

    // Step 2: Verify OTP
    async function handleVerifyOtp(e) {
        if (e) e.preventDefault();
        setError('');

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            return setError('Please enter the complete 6-digit OTP.');
        }

        setLoading(true);
        try {
            await verifyCandidateOtp(mobileNumber, countryCode, otpString);
            if (setVerifiedMobile) {
                setVerifiedMobile(fullMobile);
            }

            // Store verified phone in sessionStorage
            sessionStorage.setItem('verified_candidate_phone', fullMobile);

            // Move to CHOICE step (Create Account vs Already Have Account)
            setStep('CHOICE');
            setInfoMessage('Mobile number verified successfully!');
        } catch (err) {
            setError(err.message || 'Verification failed. Please try 123456 as demo OTP.');
        }
        setLoading(false);
    }

    // Proceed to Create New Candidate Account Page
    function handleGoToCreateAccount() {
        onClose();
        navigate(`/candidate/create-profile?phone=${encodeURIComponent(fullMobile)}`);
    }

    // Step 3: Password Login
    async function handleEmailPasswordLogin(e) {
        if (e) e.preventDefault();
        setError('');

        if (!email || !password) {
            return setError('Please enter both email and password.');
        }

        setLoading(true);
        try {
            await login(email, password);
            onClose();
            navigate('/jobseeker');
        } catch (err) {
            setError(err.message || 'Invalid email or password. Please check your credentials or create a new account.');
        }
        setLoading(false);
    }

    // Step 4: Google Auth
    async function handleGoogleLogin() {
        setError('');
        setLoading(true);
        try {
            if (googleLogin) {
                const res = await googleLogin();
                if (res && res.exists) {
                    onClose();
                    navigate('/jobseeker');
                } else if (res && !res.exists) {
                    sessionStorage.setItem('google_auth_email', res.email || '');
                    sessionStorage.setItem('google_auth_name', res.fullName || '');
                    onClose();
                    navigate(`/candidate/create-profile?email=${encodeURIComponent(res.email || '')}&name=${encodeURIComponent(res.fullName || '')}&phone=${encodeURIComponent(fullMobile)}`);
                } else {
                    onClose();
                    navigate('/jobseeker');
                }
            }
        } catch (err) {
            setError(err.message || 'Google authentication failed.');
        }
        setLoading(false);
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', animation: 'fadeIn 0.25s ease'
        }}>
            <div style={{
                width: '100%', maxWidth: '480px',
                background: '#ffffff', borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden', border: '1px solid #e2e8f0',
                position: 'relative'
            }}>
                {/* Modal Header Bar */}
                <div style={{
                    padding: '22px 28px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid #f1f5f9'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {step !== 'MOBILE' && (
                            <button 
                                onClick={() => { 
                                    setError(''); 
                                    if (step === 'OTP') setStep('MOBILE');
                                    else if (step === 'CHOICE') setStep('MOBILE');
                                    else if (step === 'LOGIN') setStep('CHOICE');
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', padding: 0 }}
                            >
                                <FiArrowLeft />
                            </button>
                        )}
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                            <span style={{ color: '#0ea5e9' }}>Candidate</span> Portal
                        </h3>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9', border: 'none', borderRadius: '50%',
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
                        }}
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <div style={{ padding: '28px' }}>
                    {error && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '12px', background: '#fef2f2',
                            border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.88rem',
                            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px'
                        }}>
                            <FiAlertCircle style={{ flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {infoMessage && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '12px', background: '#f0fdf4',
                            border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.88rem',
                            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px'
                        }}>
                            <FiCheckCircle style={{ flexShrink: 0 }} />
                            <span>{infoMessage}</span>
                        </div>
                    )}

                    {/* ---------------- STEP 1: MOBILE NUMBER VERIFICATION ---------------- */}
                    {step === 'MOBILE' && (
                        <div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
                                Candidate Verification
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                                Enter your mobile number to verify with OTP first
                            </p>

                            <form onSubmit={handleSendOtp}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                        Mobile Number *
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <select 
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            style={{
                                                padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1',
                                                background: '#f8fafc', fontWeight: 700, fontSize: '0.92rem', color: '#1e293b',
                                                cursor: 'pointer', outline: 'none'
                                            }}
                                        >
                                            {COUNTRY_CODES.map(c => (
                                                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                            ))}
                                        </select>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input 
                                                type="tel"
                                                value={mobileNumber}
                                                onChange={(e) => setMobileNumber(e.target.value)}
                                                placeholder="98765 43210"
                                                maxLength={12}
                                                required
                                                autoFocus
                                                style={{
                                                    width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px',
                                                    border: '1.5px solid #cbd5e1', fontSize: '1rem', fontWeight: 600,
                                                    outline: 'none', transition: 'border 0.2s'
                                                }}
                                            />
                                            <FiSmartphone style={{ position: 'absolute', left: '14px', top: '16px', color: '#94a3b8', fontSize: '1.1rem' }} />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                        color: '#ffffff', fontWeight: 700, fontSize: '1rem', border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 16px rgba(14, 165, 233, 0.25)',
                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </form>

                            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep('LOGIN')}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '12px',
                                    background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                    color: '#334155', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <FiMail style={{ color: '#0ea5e9' }} /> Already registered? Log in with Password / Google
                            </button>
                        </div>
                    )}

                    {/* ---------------- STEP 2: OTP VERIFICATION ---------------- */}
                    {step === 'OTP' && (
                        <div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
                                Verify Mobile Number
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                                Enter the 6-digit OTP sent to <strong style={{ color: '#1e293b' }}>{fullMobile}</strong>
                            </p>

                            <form onSubmit={handleVerifyOtp}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                                    {otp.map((data, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength={1}
                                            value={data}
                                            onChange={(e) => handleOtpChange(e.target, index)}
                                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                            style={{
                                                width: '48px', height: '54px', borderRadius: '12px',
                                                border: data ? '2px solid #0ea5e9' : '1.5px solid #cbd5e1',
                                                textAlign: 'center', fontSize: '1.4rem', fontWeight: 800,
                                                color: '#1e293b', background: data ? '#f0f9ff' : '#f8fafc',
                                                outline: 'none'
                                            }}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                        color: '#ffffff', fontWeight: 700, fontSize: '1rem', border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 16px rgba(14, 165, 233, 0.25)',
                                        marginBottom: '16px'
                                    }}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                </button>
                            </form>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                {timerActive ? (
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>
                                        Resend OTP in <strong style={{ color: '#0ea5e9' }}>{countdown}s</strong>
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                    >
                                        Resend OTP
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => { setError(''); setStep('MOBILE'); }}
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                >
                                    Change mobile number
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ---------------- STEP 3: CHOICE SCREEN (CREATE ACCOUNT OR LOGIN) ---------------- */}
                    {step === 'CHOICE' && (
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '5px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '14px' }}>
                                <FiCheck size={14} /> Verified: {fullMobile}
                            </div>

                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                                How would you like to proceed?
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '22px' }}>
                                Choose an option to access your candidate services:
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {/* OPTION 1: CREATE NEW ACCOUNT */}
                                <button
                                    type="button"
                                    onClick={handleGoToCreateAccount}
                                    style={{
                                        width: '100%', padding: '18px 20px', borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                        color: '#ffffff', border: 'none', textAlign: 'left',
                                        cursor: 'pointer', boxShadow: '0 8px 20px rgba(14, 165, 233, 0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FiUserPlus size={22} color="#ffffff" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Create Account</div>
                                            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>New candidate? Set up profile & upload resume</div>
                                        </div>
                                    </div>
                                    <FiArrowRight size={20} />
                                </button>

                                {/* OPTION 2: ALREADY HAVE AN ACCOUNT (LOGIN) */}
                                <button
                                    type="button"
                                    onClick={() => setStep('LOGIN')}
                                    style={{
                                        width: '100%', padding: '18px 20px', borderRadius: '16px',
                                        background: '#ffffff', color: '#0f172a', border: '2px solid #e2e8f0', textAlign: 'left',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FiLogIn size={22} color="#0ea5e9" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>I Already Have an Account</div>
                                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Log in with Email & Password or Google</div>
                                        </div>
                                    </div>
                                    <FiArrowRight size={20} color="#64748b" />
                                </button>
                            </div>

                            <div style={{ textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '18px', marginTop: '22px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setError(''); setStep('MOBILE'); }}
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    ← Use different mobile number
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ---------------- STEP 4: EMAIL & PASSWORD LOGIN ---------------- */}
                    {step === 'LOGIN' && (
                        <div>
                            {mobileNumber && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '4px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '12px' }}>
                                    <FiCheck size={12} /> Mobile: {fullMobile}
                                </div>
                            )}

                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
                                Candidate Login
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
                                Sign in to access your Candidate Dashboard
                            </p>

                            <form onSubmit={handleEmailPasswordLogin}>
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                        Email Address *
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="candidate@example.com"
                                            required
                                            autoFocus
                                            style={{
                                                width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px',
                                                border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                            }}
                                        />
                                        <FiMail style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', fontSize: '1.1rem' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                                            Password *
                                        </label>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            style={{
                                                width: '100%', padding: '12px 44px 12px 40px', borderRadius: '12px',
                                                border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none'
                                            }}
                                        />
                                        <FiLock style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8', fontSize: '1.1rem' }} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                        >
                                            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                        color: '#ffffff', fontWeight: 700, fontSize: '1rem', border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 16px rgba(14, 165, 233, 0.25)',
                                        marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <FiLogIn size={18} /> {loading ? 'Logging in...' : 'Login to Candidate Dashboard'}
                                </button>
                            </form>

                            <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '12px',
                                    background: '#ffffff', border: '1.5px solid #cbd5e1',
                                    color: '#1e293b', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    marginBottom: '18px', transition: 'all 0.2s'
                                }}
                            >
                                <FcGoogle size={20} /> Continue with Google
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                                <button
                                    type="button"
                                    onClick={handleGoToCreateAccount}
                                    style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}
                                >
                                    Don't have an account? Create Account →
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setError(''); setStep('CHOICE'); }}
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
                                >
                                    ← Back to Options
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
