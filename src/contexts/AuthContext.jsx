import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { 
    signInWithGoogle, 
    firebaseSignInEmailPassword, 
    firebaseSignUpEmailPassword, 
    firebaseResetPassword, 
    firebaseSignOut, 
    isFirebaseConfigured 
} from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Helper to generate a unique ID
function generateId() {
    return 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Pre-seeded demo accounts
const DEMO_USERS = {
    'candidate@test.com': {
        uid: 'user_candidate_001',
        email: 'candidate@test.com',
        password: 'password',
        role: 'jobseeker',
        data: { name: 'John Doe', phone: '+91 9876543210', email: 'candidate@test.com', resumeURL: '', role: 'jobseeker', createdAt: new Date().toISOString() }
    },
    'company@test.com': {
        uid: 'user_company_001',
        email: 'company@test.com',
        password: 'password',
        role: 'company',
        data: { companyName: 'Tech Solutions Pvt Ltd', hrName: 'Jane Smith', email: 'company@test.com', website: 'https://techsolutions.com', location: 'Mumbai, India', industry: 'IT/Software', description: 'Leading IT services company', logoURL: '', status: 'approved', role: 'company', createdAt: new Date().toISOString() }
    },
    'company2@test.com': {
        uid: 'user_company_002',
        email: 'company2@test.com',
        password: 'password',
        role: 'company',
        data: { companyName: 'Global Innovations Inc', hrName: 'Michael Brown', email: 'company2@test.com', website: 'https://globalinnovations.com', location: 'Bangalore, India', industry: 'Finance', description: 'Fintech solutions provider', logoURL: '', status: 'approved', role: 'company', createdAt: new Date().toISOString() }
    },
    'admin@test.com': {
        uid: 'user_admin_001',
        email: 'admin@test.com',
        password: 'password',
        role: 'admin',
        data: { name: 'Admin User', email: 'admin@test.com', role: 'admin', createdAt: new Date().toISOString() }
    },
    'admin@jobportal.com': {
        uid: 'user_admin_002',
        email: 'admin@jobportal.com',
        password: 'admin123',
        role: 'admin',
        data: { name: 'System Admin', email: 'admin@jobportal.com', role: 'admin', createdAt: new Date().toISOString() }
    }
};

// Initialize demo data in localStorage if not present
function initDemoData() {
    const existingAuthUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
    // Ensure all demo users exist
    const mergedAuthUsers = { ...DEMO_USERS, ...existingAuthUsers };
    localStorage.setItem('mock_auth_users', JSON.stringify(mergedAuthUsers));

    // Seed users collection
    if (!localStorage.getItem('mock_users')) {
        localStorage.setItem('mock_users', JSON.stringify([
            { id: 'user_candidate_001', name: 'John Doe', phone: '+91 9876543210', email: 'candidate@test.com', resumeURL: '', role: 'jobseeker', createdAt: new Date().toISOString() }
        ]));
    }

    // Seed companies collection
    if (!localStorage.getItem('mock_companies')) {
        localStorage.setItem('mock_companies', JSON.stringify([
            { id: 'user_company_001', companyName: 'Tech Solutions Pvt Ltd', hrName: 'Jane Smith', email: 'company@test.com', website: 'https://techsolutions.com', location: 'Mumbai, India', industry: 'IT/Software', description: 'Leading IT services company', logoURL: '', status: 'approved', createdAt: new Date().toISOString() },
            { id: 'user_company_002', companyName: 'Global Innovations Inc', hrName: 'Michael Brown', email: 'company2@test.com', website: 'https://globalinnovations.com', location: 'Bangalore, India', industry: 'Finance', description: 'Fintech solutions provider', logoURL: '', status: 'approved', createdAt: new Date().toISOString() }
        ]));
    }

    // Seed admin collection
    if (!localStorage.getItem('mock_admin')) {
        localStorage.setItem('mock_admin', JSON.stringify([
            { id: 'user_admin_001', name: 'Admin User', email: 'admin@test.com', role: 'admin', createdAt: new Date().toISOString() },
            { id: 'user_admin_002', name: 'System Admin', email: 'admin@jobportal.com', role: 'admin', createdAt: new Date().toISOString() }
        ]));
    }

    // Seed jobs
    if (!localStorage.getItem('mock_jobs')) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const deadline = nextMonth.toISOString();

        localStorage.setItem('mock_jobs', JSON.stringify([
            { id: 'job_001', title: 'Frontend Developer', company: 'Tech Solutions Pvt Ltd', companyId: 'user_company_001', location: 'Mumbai', type: 'Full-time', salary: '₹8,00,000 - ₹12,00,000', description: 'We are looking for a skilled React developer.', requirements: 'React, JavaScript, CSS', status: 'open', deadline, createdAt: new Date().toISOString() },
            { id: 'job_002', title: 'Backend Engineer', company: 'Tech Solutions Pvt Ltd', companyId: 'user_company_001', location: 'Bangalore', type: 'Full-time', salary: '₹10,00,000 - ₹15,00,000', description: 'Node.js backend developer needed.', requirements: 'Node.js, Express, MongoDB', status: 'open', deadline, createdAt: new Date().toISOString() },
            { id: 'job_003', title: 'UI/UX Designer', company: 'Tech Solutions Pvt Ltd', companyId: 'user_company_001', location: 'Remote', type: 'Contract', salary: '₹6,00,000 - ₹9,00,000', description: 'Creative designer for web applications.', requirements: 'Figma, Adobe XD, CSS', status: 'open', deadline, createdAt: new Date().toISOString() }
        ]));
    }

    // Seed applications
    if (!localStorage.getItem('mock_applications')) {
        localStorage.setItem('mock_applications', JSON.stringify([]));
    }
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            initDemoData();

            // Restore session from localStorage
            const savedSession = localStorage.getItem('mock_current_session');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                if (session && session.uid) {
                    setCurrentUser({ uid: session.uid, email: session.email });
                    setUserData(session.data);
                    setUserRole(session.role);
                    setToken(session.token);
                    if (session.token) {
                        localStorage.setItem('token', session.token);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to restore session:', err);
            localStorage.removeItem('mock_current_session');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        }
    }, [token]);

    async function refreshUserData() {
        const session = JSON.parse(localStorage.getItem('mock_current_session') || 'null');
        if (session && session.uid) {
            // In mock mode, we just re-read from localStorage
            const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
            const userEntry = Object.values(users).find(u => u.uid === session.uid);
            if (userEntry) {
                setUserData(userEntry.data);
                setUserRole(userEntry.role);
                session.data = userEntry.data;
                localStorage.setItem('mock_current_session', JSON.stringify(session));
            }
        }
    }

    async function login(email, password) {
        // Try backend login first to get the real JWT token for API calls
        let realToken = null;
        let realUser = null;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const data = await res.json();
                realToken = data.token;
                realUser = data.user;
            }
        } catch (e) {
            console.error('Backend login failed, falling back to mock auth', e);
        }

        // If backend authenticated successfully
        if (realUser && realToken) {
            const data = {
                name: realUser.companyName || realUser.hrName || realUser.email || 'Admin',
                email: realUser.email,
                role: realUser.role,
                id: realUser.id
            };
            const session = { uid: realUser.id, email: realUser.email, role: realUser.role, data, token: realToken };
            
            setCurrentUser({ uid: realUser.id, email: realUser.email });
            setUserData(data);
            setUserRole(realUser.role);
            setToken(realToken);
            localStorage.setItem('token', realToken);
            localStorage.setItem('mock_current_session', JSON.stringify(session));
            return { user: { uid: realUser.id, email: realUser.email, role: realUser.role } };
        }

        // Fallback to local mock auth
        const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
        const userEntry = users[email];
        
        if (userEntry && userEntry.password === password) {
            const uid = userEntry.uid;
            const role = userEntry.role;
            const data = userEntry.data;
            const session = { uid, email, role, data, token: realToken };
            
            setCurrentUser({ uid, email });
            setUserData(data);
            setUserRole(role);
            setToken(realToken);
            localStorage.setItem('mock_current_session', JSON.stringify(session));
            return { user: { uid, email, role } };
        } else {
            throw new Error('Invalid email or password');
        }
    }

    async function registerJobSeeker(email, password, profileData) {
        const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
        if (users[email]) throw new Error('User already exists');

        const uid = generateId();
        const userData = { ...profileData, id: uid, role: 'jobseeker', createdAt: new Date().toISOString() };
        
        users[email] = { uid, email, password, role: 'jobseeker', data: userData };
        localStorage.setItem('mock_auth_users', JSON.stringify(users));

        // Also add to mock_users
        const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
        mockUsers.push(userData);
        localStorage.setItem('mock_users', JSON.stringify(mockUsers));

        return await login(email, password);
    }

    async function registerCompany(email, password, companyData) {
        const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
        if (users[email]) throw new Error('User already exists');

        const uid = generateId();
        const userData = { ...companyData, id: uid, role: 'company', status: 'approved', createdAt: new Date().toISOString() };
        
        users[email] = { uid, email, password, role: 'company', data: userData };
        localStorage.setItem('mock_auth_users', JSON.stringify(users));

        // Also add to mock_companies
        const mockCompanies = JSON.parse(localStorage.getItem('mock_companies') || '[]');
        mockCompanies.push(userData);
        localStorage.setItem('mock_companies', JSON.stringify(mockCompanies));

        return await login(email, password);
    }

    const [verifiedMobile, setVerifiedMobile] = useState(() => localStorage.getItem('employer_verified_mobile') || '');

    async function sendOtp(phone, countryCode = '+91') {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, countryCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
            return data;
        } catch (e) {
            console.warn('Backend send-otp failed, using fallback', e);
            const fullPhone = phone.startsWith('+') ? phone : `${countryCode} ${phone}`;
            return {
                message: `OTP sent to ${fullPhone}`,
                fullPhone,
                otpCode: '123456',
                expiresInSeconds: 30
            };
        }
    }

    async function verifyOtp(phone, otp) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'OTP verification failed');

            if (data.verified) {
                setVerifiedMobile(phone);
                localStorage.setItem('employer_verified_mobile', phone);
            }

            if (data.exists && data.employer) {
                // Account exists -> set session
                const session = {
                    uid: data.employer.employer_id,
                    email: data.employer.email,
                    role: 'company',
                    data: {
                        companyName: data.employer.companyName,
                        phone: data.employer.mobile_number,
                        email: data.employer.email,
                        role: 'company',
                        company_id: data.employer.company_id,
                        logoURL: data.employer.logoURL || ''
                    },
                    token: data.token
                };
                setCurrentUser({ uid: data.employer.employer_id, email: data.employer.email });
                setUserData(session.data);
                setUserRole('company');
                setToken(data.token);
                localStorage.setItem('mock_current_session', JSON.stringify(session));
            }
            return data;
        } catch (e) {
            console.warn('Backend verify-otp failed, falling back to mock logic', e);
            if (otp === '123456' || otp.length === 6) {
                setVerifiedMobile(phone);
                localStorage.setItem('employer_verified_mobile', phone);

                // Check mock_auth_users
                const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
                const existing = Object.values(users).find(u => u.role === 'company' && u.data?.phone === phone);
                if (existing) {
                    const session = { uid: existing.uid, email: existing.email, role: 'company', data: existing.data };
                    setCurrentUser({ uid: existing.uid, email: existing.email });
                    setUserData(existing.data);
                    setUserRole('company');
                    localStorage.setItem('mock_current_session', JSON.stringify(session));
                    return { verified: true, exists: true, user: existing.data };
                } else {
                    return { verified: true, exists: false };
                }
            }
            throw new Error('Invalid OTP code. Please enter 123456 or a valid 6-digit OTP.');
        }
    }

    async function employerLogin(email, password) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/employer/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const data = await res.json();
                const session = {
                    uid: data.user.id,
                    email: data.user.email,
                    role: 'company',
                    data: data.user,
                    token: data.token
                };
                setCurrentUser({ uid: data.user.id, email: data.user.email });
                setUserData(data.user);
                setUserRole('company');
                setToken(data.token);
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                localStorage.setItem('mock_current_session', JSON.stringify(session));
                return data;
            }
        } catch (e) {
            console.warn('Backend employer login failed, falling back', e);
        }

        // Fallback to standard login
        return await login(email, password);
    }

    async function googleLogin() {
        let googleUser = null;
        if (isFirebaseConfigured) {
            try {
                const fbUser = await signInWithGoogle();
                googleUser = {
                    email: fbUser.email,
                    fullName: fbUser.displayName || fbUser.email?.split('@')[0],
                    googleAccountId: fbUser.uid,
                    photoURL: fbUser.photoURL || ''
                };
            } catch (err) {
                console.error('Firebase Google Sign-In error:', err);
                throw err;
            }
        } else {
            googleUser = {
                email: 'candidate.google@example.com',
                fullName: 'Google Candidate',
                googleAccountId: 'google_cand_' + Date.now(),
                photoURL: ''
            };
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/candidate/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(googleUser)
            });
            const data = await res.json();
            if (data.exists && data.candidate) {
                const session = {
                    uid: data.candidate.candidate_id,
                    email: data.candidate.email,
                    role: 'jobseeker',
                    data: {
                        name: data.candidate.full_name,
                        email: data.candidate.email,
                        phone: data.candidate.mobile_number,
                        role: 'jobseeker',
                        id: data.candidate.candidate_id,
                        photoURL: googleUser.photoURL || ''
                    },
                    token: data.token
                };
                setCurrentUser({ uid: data.candidate.candidate_id, email: data.candidate.email });
                setUserData(session.data);
                setUserRole('jobseeker');
                setToken(data.token);
                localStorage.setItem('mock_current_session', JSON.stringify(session));
                return { exists: true, ...data };
            }
            return { exists: false, email: googleUser.email, fullName: googleUser.fullName, googleAccountId: googleUser.googleAccountId };
        } catch (e) {
            console.warn('Backend candidate google endpoint unavailable, setting local session', e);
            const session = {
                uid: googleUser.googleAccountId || generateId(),
                email: googleUser.email,
                role: 'jobseeker',
                data: {
                    name: googleUser.fullName,
                    email: googleUser.email,
                    role: 'jobseeker'
                }
            };
            setCurrentUser({ uid: session.uid, email: session.email });
            setUserData(session.data);
            setUserRole('jobseeker');
            localStorage.setItem('mock_current_session', JSON.stringify(session));
            return { exists: true, candidate: session.data };
        }
    }

    async function googleLoginEmployer(passedAccount = null) {
        let googleAccount = passedAccount;
        if (!googleAccount && isFirebaseConfigured) {
            try {
                const fbUser = await signInWithGoogle();
                googleAccount = {
                    email: fbUser.email,
                    name: fbUser.displayName || fbUser.email?.split('@')[0],
                    googleId: fbUser.uid,
                    photoURL: fbUser.photoURL || ''
                };
            } catch (err) {
                console.error('Firebase Google Employer Sign-In error:', err);
                throw err;
            }
        } else if (!googleAccount) {
            googleAccount = {
                email: 'employer.google@company.com',
                name: 'Google Recruiter',
                googleId: 'google_emp_' + Date.now()
            };
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/employer/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(googleAccount)
            });
            const data = await res.json();
            if (data.exists && data.user) {
                const session = {
                    uid: data.user.id,
                    email: data.user.email,
                    role: 'company',
                    data: data.user,
                    token: data.token
                };
                setCurrentUser({ uid: data.user.id, email: data.user.email });
                setUserData(data.user);
                setUserRole('company');
                setToken(data.token);
                localStorage.setItem('mock_current_session', JSON.stringify(session));
            }
            return data;
        } catch (e) {
            console.warn('Google login failed', e);
            return { exists: false, requiresMobileVerification: true, email: googleAccount.email, name: googleAccount.name };
        }
    }

function safeSetLocalStorage(key, value) {
    try {
        const valStr = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, valStr);
    } catch (e) {
        console.warn(`localStorage quota exceeded while setting "${key}". Sanitizing large data URLs...`, e);
        try {
            // Strip any raw Base64 Data URLs exceeding 30KB before saving to localStorage
            const sanitized = JSON.parse(JSON.stringify(value, (k, v) => {
                if (typeof v === 'string' && v.startsWith('data:image') && v.length > 30000) {
                    return ''; // Strip huge base64 logo for localStorage
                }
                return v;
            }));
            localStorage.setItem(key, JSON.stringify(sanitized));
        } catch (innerErr) {
            console.error(`Failed to write key "${key}" to localStorage even after sanitizing:`, innerErr);
        }
    }
}

    async function createCompanyProfile(profileData) {
        let result = null;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/employer/create-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (res.ok) {
                result = await res.json();
            }
        } catch (e) {
            console.warn('Backend create-profile failed, saving locally', e);
        }

        const employerId = result?.employerId || `emp_${Date.now()}`;
        const companyId = result?.companyId || `comp_${Date.now()}`;
        const fullCompanyData = {
            ...profileData,
            id: employerId,
            uid: employerId,
            company_id: companyId,
            role: 'company',
            mobile_verified: 1,
            profile_completed: 1,
            logoURL: profileData.companyLogo || '',
            createdAt: new Date().toISOString()
        };

        // Save safely in localStorage mock
        const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
        users[profileData.email] = {
            uid: employerId,
            email: profileData.email,
            password: profileData.password || 'password',
            role: 'company',
            data: fullCompanyData
        };
        safeSetLocalStorage('mock_auth_users', users);

        const mockCompanies = JSON.parse(localStorage.getItem('mock_companies') || '[]');
        mockCompanies.push(fullCompanyData);
        safeSetLocalStorage('mock_companies', mockCompanies);

        const session = {
            uid: employerId,
            email: profileData.email,
            role: 'company',
            data: fullCompanyData,
            token: result?.token || null
        };

        setCurrentUser({ uid: employerId, email: profileData.email });
        setUserData(fullCompanyData);
        setUserRole('company');
        setToken(result?.token || null);
        safeSetLocalStorage('mock_current_session', session);

        return { success: true, employerId, companyId, user: fullCompanyData };
    }


    // Called after candidate profile creation to establish a jobseeker session
    async function candidateLogin(profileData) {
        const uid = profileData.candidate_id || profileData.uid || `cand_${Date.now()}`;
        const email = profileData.email || profileData.full_name || 'candidate';

        const sessionData = {
            name: profileData.full_name || profileData.name,
            email,
            phone: profileData.mobile_number || profileData.phone,
            role: 'jobseeker',
            candidate_id: uid,
            uid,
            city: profileData.city,
            profilePictureURL: profileData.profile_photo || '',
            resumeURL: profileData.resume_url || '',
            skills: Array.isArray(profileData.skills) ? profileData.skills.join(', ') : profileData.skills || '',
            professional_headline: profileData.professional_headline || '',
            total_experience: profileData.total_experience || 'Fresher',
            profile_completed: 1,
            profile_completion_percentage: profileData.profile_completion_percentage || 85,
            createdAt: new Date().toISOString()
        };

        const candidateToken = profileData.token || `cand_tok_${uid}_${Date.now()}`;
        const session = { uid, email, role: 'jobseeker', data: sessionData, token: candidateToken };

        // Save to mock_auth_users for future logins
        const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
        users[email] = { 
            uid, 
            email, 
            password: profileData.password || users[email]?.password || 'password', 
            role: 'jobseeker', 
            data: sessionData 
        };
        safeSetLocalStorage('mock_auth_users', users);

        setCurrentUser({ uid, email });
        setUserData(sessionData);
        setUserRole('jobseeker');
        setToken(candidateToken);
        localStorage.setItem('token', candidateToken);
        safeSetLocalStorage('mock_current_session', session);

        return { success: true, uid };
    }

    async function logout() {
        try {
            await firebaseSignOut();
        } catch (e) {
            console.warn('Firebase signout warning:', e);
        }
        setCurrentUser(null);
        setUserData(null);
        setUserRole(null);
        setToken(null);
        setVerifiedMobile('');
        localStorage.removeItem('token');
        localStorage.removeItem('mock_current_session');
        localStorage.removeItem('employer_verified_mobile');
        sessionStorage.removeItem('verified_candidate_phone');
    }

    async function fetchUserData(uid) {
        const users = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
        const userEntry = Object.values(users).find(u => u.uid === uid);
        if (userEntry) {
            setUserRole(userEntry.role);
            setUserData(userEntry.data);
        } else {
            setUserRole(null);
            setUserRole(null);
            setUserData(null);
        }
    }

    const value = {
        currentUser,
        userData,
        userRole,
        token,
        loading,
        verifiedMobile,
        setVerifiedMobile,
        sendOtp,
        verifyOtp,
        employerLogin,
        googleLoginEmployer,
        googleLogin,
        createCompanyProfile,
        candidateLogin,
        registerJobSeeker,
        registerCompany,
        login,
        logout,
        fetchUserData,
        refreshUserData
    };


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
