import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
    FiSearch, FiCheckCircle, FiXCircle, FiSlash, FiMail, FiPhone,
    FiSend, FiShield, FiStar, FiFilter, FiBriefcase, FiDollarSign,
    FiAlertCircle, FiX, FiCheck, FiGlobe, FiMapPin, FiPlus,
    FiCreditCard, FiUsers, FiUserCheck, FiUserX
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';

export default function ManageCompanies() {
    const { token } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Active filter from URL query params (managed via sidebar) or default 'all'
    const activeFilter = searchParams.get('filter') || 'all';

    // Send Notification Modal
    const [showNotifyModal, setShowNotifyModal] = useState(searchParams.get('action') === 'send_notification');
    const [targetEmployer, setTargetEmployer] = useState(null);
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyChannel, setNotifyChannel] = useState('both');
    const [sendingNotify, setSendingNotify] = useState(false);

    // Balance Adjustment Modal
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [targetEmployerForBalance, setTargetEmployerForBalance] = useState(null);
    const [balanceAmount, setBalanceAmount] = useState('');

    // Demo Data & Live Data
    const [employers, setEmployers] = useState([
        {
            id: 1,
            companyName: 'ABC Technologies Pvt Ltd',
            hrName: 'Rajesh Sharma',
            email: 'hr@abctech.com',
            phone: '+91 98401 23456',
            location: 'Chennai, Tamil Nadu',
            industry: 'Information Technology',
            isBanned: false,
            isEmailVerified: true,
            isMobileVerified: true,
            isPremium: true,
            balance: 25000,
            activePlan: 'ABC Tech Exclusive Plan',
            jobsCount: 14
        },
        {
            id: 2,
            companyName: 'TechCorp Solutions',
            hrName: 'Priya Sundaram',
            email: 'talent@techcorp.io',
            phone: '+91 98200 44556',
            location: 'Bangalore, Karnataka',
            industry: 'Software & Cloud',
            isBanned: false,
            isEmailVerified: true,
            isMobileVerified: false,
            isPremium: true,
            balance: 10000,
            activePlan: 'Enterprise Scale',
            jobsCount: 8
        },
        {
            id: 3,
            companyName: 'Innovate Digital Labs',
            hrName: 'Anand Kumar',
            email: 'contact@innovatelabs.com',
            phone: '+91 97111 88990',
            location: 'Hyderabad, Telangana',
            industry: 'Product Engineering',
            isBanned: false,
            isEmailVerified: false,
            isMobileVerified: true,
            isPremium: false,
            balance: 0,
            activePlan: 'Free Tier',
            jobsCount: 2
        },
        {
            id: 4,
            companyName: 'Apex Financial Services',
            hrName: 'Devendra Patel',
            email: 'fraud.check@apexfin.com',
            phone: '+91 91000 11223',
            location: 'Mumbai, Maharashtra',
            industry: 'Fintech / Banking',
            isBanned: true,
            isEmailVerified: false,
            isMobileVerified: false,
            isPremium: false,
            balance: 0,
            activePlan: 'None',
            jobsCount: 0
        },
        {
            id: 5,
            companyName: 'Zeta Robotics India',
            hrName: 'Meenakshi Nair',
            email: 'jobs@zetarobotics.in',
            phone: '+91 94444 33221',
            location: 'Pune, Maharashtra',
            industry: 'Hardware & AI',
            isBanned: false,
            isEmailVerified: true,
            isMobileVerified: true,
            isPremium: true,
            balance: 45000,
            activePlan: 'Growth Recruiter',
            jobsCount: 5
        },
        {
            id: 6,
            companyName: 'CloudScale Technologies',
            hrName: 'Deepak Verma',
            email: 'deepak@cloudscale.io',
            phone: '+91 98800 12345',
            location: 'Bangalore, Karnataka',
            industry: 'Cloud Hosting & SaaS',
            isBanned: false,
            isEmailVerified: true,
            isMobileVerified: false,
            isPremium: true,
            balance: 15000,
            activePlan: 'Enterprise Scale',
            jobsCount: 6
        },
        {
            id: 7,
            companyName: 'PeopleFirst Solutions',
            hrName: 'Sunita Rao',
            email: 'sunita@peoplefirst.com',
            phone: '+91 98111 99887',
            location: 'Hyderabad, Telangana',
            industry: 'Human Resources & Staffing',
            isBanned: false,
            isEmailVerified: false,
            isMobileVerified: false,
            isPremium: false,
            balance: 0,
            activePlan: 'Free Tier',
            jobsCount: 1
        },
        {
            id: 8,
            companyName: 'Global Logistics India',
            hrName: 'Karthik Raja',
            email: 'admin@globallogistics.in',
            phone: '+91 97900 11223',
            location: 'Chennai, Tamil Nadu',
            industry: 'Logistics & Supply Chain',
            isBanned: true,
            isEmailVerified: true,
            isMobileVerified: true,
            isPremium: false,
            balance: 5000,
            activePlan: 'Custom Plan',
            jobsCount: 0
        }
    ]);

    useEffect(() => {
        if (searchParams.get('action') === 'send_notification') {
            setShowNotifyModal(true);
            setTargetEmployer(null);
        }
        loadEmployers();
    }, [searchParams]);

    const loadEmployers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const comps = (data.users || []).filter(u => u.role === 'company' || u.role === 'employer');
                if (comps.length > 0) {
                    const mapped = comps.map(c => ({
                        id: c.id || c.uid,
                        companyName: c.companyName || c.company || c.name || 'Company Name',
                        hrName: c.name || c.hrName || 'HR Manager',
                        email: c.email,
                        phone: c.phone || '+91 98000 00000',
                        location: c.location || 'India',
                        industry: c.industry || 'Technology',
                        isBanned: c.isBanned === 1 || c.isBanned === true,
                        isEmailVerified: c.isEmailVerified !== 0 && c.isEmailVerified !== false,
                        isMobileVerified: c.isMobileVerified === 1 || c.isMobileVerified === true,
                        isPremium: c.isPremium === 1 || c.isPremium === true,
                        balance: c.balance || 0,
                        activePlan: c.activePlan || (c.isPremium ? 'Growth Recruiter' : 'Free Tier'),
                        jobsCount: c.jobsCount || 3
                    }));
                    setEmployers(mapped);
                }
            }
        } catch (e) {}
    };

    const handleToggleBan = (emp) => {
        const nextState = !emp.isBanned;
        setEmployers(prev => prev.map(e => e.id === emp.id ? { ...e, isBanned: nextState } : e));
        if (addToast) addToast(nextState ? 'error' : 'success', `${emp.companyName} has been ${nextState ? 'banned' : 'unbanned'}`);
    };

    const handleVerifyEmail = (emp) => {
        setEmployers(prev => prev.map(e => e.id === emp.id ? { ...e, isEmailVerified: true } : e));
        if (addToast) addToast('success', `Email verified for ${emp.companyName}`);
    };

    const handleVerifyMobile = (emp) => {
        setEmployers(prev => prev.map(e => e.id === emp.id ? { ...e, isMobileVerified: true } : e));
        if (addToast) addToast('success', `Mobile verified for ${emp.companyName}`);
    };

    const handleOpenNotify = (emp = null) => {
        setTargetEmployer(emp);
        setNotifyTitle(emp ? `Notice for ${emp.companyName}` : 'Employer Announcement');
        setNotifyMessage('');
        setShowNotifyModal(true);
    };

    const handleSendNotification = (e) => {
        e.preventDefault();
        if (!notifyTitle || !notifyMessage) return;
        setSendingNotify(true);

        try {
            const existingNotifs = JSON.parse(localStorage.getItem('admin_notification_history') || '[]');
            const newNotif = {
                id: `NOTIF-${Date.now().toString().slice(-6)}`,
                title: notifyTitle,
                message: notifyMessage,
                channel: notifyChannel,
                recipient: targetEmployer ? targetEmployer.email : `All Employers (${activeFilter.toUpperCase().replace('_', ' ')})`,
                recipientCount: targetEmployer ? 1 : filteredEmployers.length,
                status: 'Delivered',
                timestamp: new Date().toLocaleString()
            };
            existingNotifs.unshift(newNotif);
            localStorage.setItem('admin_notification_history', JSON.stringify(existingNotifs));
        } catch (err) {}

        setTimeout(() => {
            setSendingNotify(false);
            setShowNotifyModal(false);
            if (addToast) addToast('success', targetEmployer ? `Notification sent to ${targetEmployer.email}` : 'Broadcast notification sent to all matching employers!');
        }, 600);
    };

    const handleOpenBalance = (emp) => {
        setTargetEmployerForBalance(emp);
        setBalanceAmount(String(emp.balance || 0));
        setShowBalanceModal(true);
    };

    const handleSaveBalance = (e) => {
        e.preventDefault();
        if (!targetEmployerForBalance) return;
        const newBal = Number(balanceAmount) || 0;
        setEmployers(prev => prev.map(e => e.id === targetEmployerForBalance.id ? { ...e, balance: newBal } : e));
        if (addToast) addToast('success', `Balance updated to ₹${newBal.toLocaleString()} for ${targetEmployerForBalance.companyName}`);
        setShowBalanceModal(false);
    };

    const handleToggleApprovedAccess = async (emp) => {
        const newStatus = !emp.approved_access;
        try {
            await fetch(`http://localhost:5000/api/admin/companies/${emp.id || emp.company_id}/approved-access`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ approved_access: newStatus })
            });
        } catch (err) {
            console.error('Failed to update approved access on server:', err);
        }

        setEmployers(prev => prev.map(e => e.id === emp.id ? { ...e, approved_access: newStatus } : e));
        if (addToast) addToast('success', 'Approved Access updated successfully.');
    };

    // Filter Logic matching search query & URL parameter
    const filteredEmployers = employers.filter(e => {
        if (activeFilter === 'active' && e.isBanned) return false;
        if (activeFilter === 'banned' && !e.isBanned) return false;
        if (activeFilter === 'email_unverified' && e.isEmailVerified) return false;
        if (activeFilter === 'mobile_unverified' && e.isMobileVerified) return false;
        if (activeFilter === 'with_balance' && (e.balance || 0) <= 0) return false;
        if (activeFilter === 'approved_access_on' && !e.approved_access) return false;
        if (activeFilter === 'approved_access_off' && e.approved_access) return false;

        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            return (e.companyName && e.companyName.toLowerCase().includes(s)) ||
                   (e.hrName && e.hrName.toLowerCase().includes(s)) ||
                   (e.email && e.email.toLowerCase().includes(s)) ||
                   (e.phone && e.phone.toLowerCase().includes(s)) ||
                   (e.location && e.location.toLowerCase().includes(s)) ||
                   (e.activePlan && e.activePlan.toLowerCase().includes(s));
        }
        return true;
    });

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Manage Employers
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.92rem' }}>
                        Supervise company profiles, balances, verification statuses, plans, and messaging.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/admin/premium-plans?tab=company_plans')}
                        style={{
                            background: '#ffffff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            padding: '9px 16px',
                            borderRadius: '9px',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    >
                        <FiStar size={14} color="#2563eb" /> Company Plans
                    </button>

                    <button
                        onClick={() => handleOpenNotify(null)}
                        style={{
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 16px',
                            borderRadius: '9px',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                        }}
                    >
                        <FiSend size={14} /> Send Notification
                    </button>
                </div>
            </div>

            {/* Search Bar & Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} size={15} />
                    <input
                        type="text"
                        placeholder="Search company, HR contact, email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '9px 12px 9px 36px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                            boxSizing: 'border-box',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Showing <strong style={{ color: '#2563eb' }}>{filteredEmployers.length}</strong> employers
                </div>
            </div>

            {/* Employers Table */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                <th style={{ padding: '12px 16px' }}>Company & HR Contact</th>
                                <th style={{ padding: '12px 16px' }}>Email Status</th>
                                <th style={{ padding: '12px 16px' }}>Mobile Status</th>
                                <th style={{ padding: '12px 16px' }}>Wallet Balance</th>
                                <th style={{ padding: '12px 16px' }}>Plan</th>
                                <th style={{ padding: '12px 16px' }}>Approved Access</th>
                                <th style={{ padding: '12px 16px' }}>Account</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployers.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>No Employers Found</div>
                                        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
                                            No employers matched the selected filter or search term.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployers.map(emp => (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.companyName}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{emp.hrName} · {emp.email}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{emp.phone} · {emp.location}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {emp.isEmailVerified ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.78rem', fontWeight: 600 }}>
                                                    <FiCheck size={12} /> Verified
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleVerifyEmail(emp)}
                                                    title="Click to verify email"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    <FiAlertCircle size={11} /> Unverified (Verify)
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {emp.isMobileVerified ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.78rem', fontWeight: 600 }}>
                                                    <FiCheck size={12} /> Verified
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleVerifyMobile(emp)}
                                                    title="Click to verify mobile"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    <FiAlertCircle size={11} /> Unverified (Verify)
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontWeight: 700, color: (emp.balance || 0) > 0 ? '#2563eb' : '#94a3b8' }}>
                                                    ₹{(emp.balance || 0).toLocaleString()}
                                                </span>
                                                <button
                                                    onClick={() => handleOpenBalance(emp)}
                                                    title="Adjust Balance"
                                                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '2px 6px', fontSize: '0.68rem', cursor: 'pointer', color: '#2563eb', fontWeight: 600 }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontWeight: 600, color: emp.isPremium ? '#2563eb' : '#475569', fontSize: '0.82rem' }}>
                                                {emp.activePlan}
                                            </span>
                                        </td>
                                        {/* Approved Access Toggle Switch */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                onClick={() => handleToggleApprovedAccess(emp)}
                                                title={emp.approved_access ? "Approved Access Enabled (Click to toggle OFF)" : "Approved Access Disabled (Click to toggle ON)"}
                                                style={{
                                                    position: 'relative',
                                                    width: '64px',
                                                    height: '28px',
                                                    borderRadius: '20px',
                                                    background: emp.approved_access ? 'linear-gradient(135deg, #10b981, #059669)' : '#cbd5e1',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '2px 4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: emp.approved_access ? 'flex-end' : 'flex-start',
                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: emp.approved_access ? '0 2px 6px rgba(16, 185, 129, 0.35)' : 'none'
                                                }}
                                            >
                                                <span style={{
                                                    position: 'absolute',
                                                    left: emp.approved_access ? '8px' : 'auto',
                                                    right: emp.approved_access ? 'auto' : '8px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    color: emp.approved_access ? '#ffffff' : '#475569',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {emp.approved_access ? 'ON' : 'OFF'}
                                                </span>
                                                <span style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    background: '#ffffff',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                    display: 'inline-block'
                                                }} />
                                            </button>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                background: emp.isBanned ? '#fef2f2' : '#f0fdf4',
                                                color: emp.isBanned ? '#b91c1c' : '#15803d'
                                            }}>
                                                {emp.isBanned ? 'Banned' : 'Active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                                                <button
                                                    onClick={() => handleOpenNotify(emp)}
                                                    title="Send Direct Notification"
                                                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <FiSend size={11} /> Notify
                                                </button>
                                                <button
                                                    onClick={() => handleToggleBan(emp)}
                                                    style={{
                                                        background: emp.isBanned ? '#f0fdf4' : '#ffffff',
                                                        border: emp.isBanned ? '1px solid #bbf7d0' : '1px solid #fecaca',
                                                        color: emp.isBanned ? '#166534' : '#dc2626',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {emp.isBanned ? 'Unban' : 'Ban'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── SEND NOTIFICATION MODAL ── */}
            {showNotifyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '14px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 35px rgba(0,0,0,0.12)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                                    {targetEmployer ? `Notify ${targetEmployer.companyName}` : 'Broadcast Employer Announcement'}
                                </h3>
                                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                                    {targetEmployer ? `Recipient: ${targetEmployer.email}` : `Will dispatch to all ${filteredEmployers.length} employers`}
                                </p>
                            </div>
                            <button onClick={() => setShowNotifyModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSendNotification}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Subject / Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={notifyTitle}
                                    onChange={e => setNotifyTitle(e.target.value)}
                                    placeholder="e.g. Account Verification Required"
                                    style={{ width: '100%', padding: '9px 11px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Delivery Channel</label>
                                <select
                                    value={notifyChannel}
                                    onChange={e => setNotifyChannel(e.target.value)}
                                    style={{ width: '100%', padding: '9px 11px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                                >
                                    <option value="both">Both (In-App Notification + Email Dispatch)</option>
                                    <option value="in_app">In-App Notification Only</option>
                                    <option value="email">Email Dispatch Only</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Message Body *</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={notifyMessage}
                                    onChange={e => setNotifyMessage(e.target.value)}
                                    placeholder="Type your official announcement or message here..."
                                    style={{ width: '100%', padding: '9px 11px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button type="button" onClick={() => setShowNotifyModal(false)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '7px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={sendingNotify} style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '7px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FiSend size={13} /> {sendingNotify ? 'Sending...' : 'Dispatch Notification'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── ADJUST BALANCE MODAL ── */}
            {showBalanceModal && targetEmployerForBalance && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 20px 35px rgba(0,0,0,0.12)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Update Wallet Balance</h3>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{targetEmployerForBalance.companyName}</div>
                            </div>
                            <button onClick={() => setShowBalanceModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}><FiX /></button>
                        </div>
                        <form onSubmit={handleSaveBalance}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                    Wallet Balance (INR ₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={balanceAmount}
                                    onChange={e => setBalanceAmount(e.target.value)}
                                    style={{ width: '100%', padding: '9px 11px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button type="button" onClick={() => setShowBalanceModal(false)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '7px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', padding: '7px 15px', borderRadius: '7px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>Save Balance</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
