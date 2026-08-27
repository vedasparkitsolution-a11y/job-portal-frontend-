import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { 
    FiSearch, FiCheckCircle, FiXCircle, FiSlash, FiMail, FiPhone,
    FiSend, FiShield, FiStar, FiFilter, FiUserCheck, FiUsers, FiUserX,
    FiAlertCircle, FiX, FiCheck, FiUserPlus, FiBell
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/Toast';

export default function ManageUsers() {
    const { token } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Active filter from query params (controlled via sidebar) or default 'all'
    const activeFilter = searchParams.get('filter') || 'all';

    // Notification Modal
    const [showNotifyModal, setShowNotifyModal] = useState(searchParams.get('action') === 'send_notification');
    const [targetUser, setTargetUser] = useState(null);
    const [notifyTitle, setNotifyTitle] = useState('');
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyChannel, setNotifyChannel] = useState('both');
    const [sendingNotify, setSendingNotify] = useState(false);

    // Demo Data & Live Data
    const [users, setUsers] = useState([
        {
            id: 1,
            name: 'Ananya Sharma',
            email: 'ananya.s@gmail.com',
            phone: '+91 98401 11223',
            role: 'candidate',
            isBanned: false,
            isEmailVerified: true,
            isMobileVerified: true,
            isPremium: true,
            activePlan: 'Candidate Pro Accelerator',
            balance: 0,
            registeredAt: '2026-02-10'
        },
        {
            id: 2,
            name: 'Rohan Mehta',
            email: 'rohan.m@yahoo.com',
            phone: '+91 97234 55667',
            role: 'candidate',
            isBanned: false,
            isEmailVerified: true,
            isMobileVerified: false,
            isPremium: false,
            activePlan: 'Free Tier',
            balance: 0,
            registeredAt: '2026-02-12'
        },
        {
            id: 3,
            name: 'Vikram Rajput',
            email: 'vikram.spam@gmail.com',
            phone: '+91 91234 99887',
            role: 'candidate',
            isBanned: true,
            isEmailVerified: false,
            isMobileVerified: false,
            isPremium: false,
            activePlan: 'None',
            balance: 0,
            registeredAt: '2026-01-20'
        },
        {
            id: 4,
            name: 'Kavita Sundaram',
            email: 'kavita.s@gmail.com',
            phone: '+91 98111 22334',
            role: 'candidate',
            isBanned: false,
            isEmailVerified: false,
            isMobileVerified: true,
            isPremium: false,
            activePlan: 'Free Tier',
            balance: 0,
            registeredAt: '2026-02-14'
        },
        {
            id: 5,
            name: 'Rajesh Kumar (HR)',
            email: 'hr@abctech.com',
            phone: '+91 98401 23456',
            role: 'employer',
            company: 'ABC Technologies Pvt Ltd',
            isBanned: false,
            isEmailVerified: true,
            isMobileVerified: true,
            isPremium: true,
            activePlan: 'ABC Tech Exclusive Plan',
            balance: 15000,
            registeredAt: '2026-01-15'
        },
        {
            id: 6,
            name: 'Suresh Raina',
            email: 'suresh.r@outlook.com',
            phone: '+91 99887 76655',
            role: 'candidate',
            isBanned: false,
            isEmailVerified: true,
            isMobileVerified: true,
            isPremium: false,
            activePlan: 'Free Tier',
            balance: 0,
            registeredAt: '2026-02-01'
        },
        {
            id: 7,
            name: 'Meera Iyer',
            email: 'meera.iyer@gmail.com',
            phone: '+91 94441 55667',
            role: 'candidate',
            isBanned: false,
            isEmailVerified: false,
            isMobileVerified: false,
            isPremium: false,
            activePlan: 'Free Tier',
            balance: 0,
            registeredAt: '2026-02-16'
        },
        {
            id: 8,
            name: 'Deepak Verma (Recruiter)',
            email: 'deepak@cloudscale.io',
            phone: '+91 98800 12345',
            role: 'employer',
            company: 'CloudScale Technologies',
            isBanned: true,
            isEmailVerified: true,
            isMobileVerified: false,
            isPremium: false,
            activePlan: 'Growth Pack',
            balance: 0,
            registeredAt: '2026-01-10'
        }
    ]);

    useEffect(() => {
        if (searchParams.get('action') === 'send_notification') {
            setShowNotifyModal(true);
            setTargetUser(null);
        }
        loadUsers();
    }, [searchParams]);

    const loadUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.users && data.users.length > 0) {
                    const mapped = data.users.map(u => ({
                        id: u.id || u.uid,
                        name: u.name || u.email?.split('@')[0],
                        email: u.email,
                        phone: u.phone || '+91 98000 00000',
                        role: u.role || 'candidate',
                        isBanned: u.isBanned === 1 || u.isBanned === true,
                        isEmailVerified: u.isEmailVerified !== 0 && u.isEmailVerified !== false,
                        isMobileVerified: u.isMobileVerified === 1 || u.isMobileVerified === true,
                        isPremium: u.isPremium === 1 || u.isPremium === true,
                        activePlan: u.activePlan || (u.isPremium ? 'Candidate Pro' : 'Free Tier'),
                        balance: u.balance || 0,
                        registeredAt: u.createdAt || '2026-02-15'
                    }));
                    setUsers(mapped);
                }
            }
        } catch (e) {}
    };

    const handleToggleBan = (user) => {
        const nextState = !user.isBanned;
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: nextState } : u));
        if (addToast) addToast(nextState ? 'error' : 'success', `${user.name} has been ${nextState ? 'banned' : 'unbanned'}`);
    };

    const handleVerifyEmail = (user) => {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isEmailVerified: true } : u));
        if (addToast) addToast('success', `Email marked as verified for ${user.name}`);
    };

    const handleVerifyMobile = (user) => {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isMobileVerified: true } : u));
        if (addToast) addToast('success', `Mobile number verified for ${user.name}`);
    };

    const handleOpenNotify = (user = null) => {
        setTargetUser(user);
        setNotifyTitle(user ? `Direct Notice: ${user.name}` : 'Platform Announcement');
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
                recipient: targetUser ? targetUser.email : `All Users (${activeFilter.toUpperCase()})`,
                recipientCount: targetUser ? 1 : filteredUsers.length,
                status: 'Delivered',
                timestamp: new Date().toLocaleString()
            };
            existingNotifs.unshift(newNotif);
            localStorage.setItem('admin_notification_history', JSON.stringify(existingNotifs));
        } catch (err) {}

        setTimeout(() => {
            setSendingNotify(false);
            setShowNotifyModal(false);
            if (addToast) addToast('success', targetUser ? `Notification sent to ${targetUser.email}` : 'Broadcast notification dispatched successfully!');
        }, 600);
    };

    const handleToggleApprovedAccess = async (user) => {
        const newStatus = !user.approved_access;
        try {
            await fetch(`http://localhost:5000/api/admin/users/${user.id}/approved-access`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ approved_access: newStatus })
            });
        } catch (err) {
            console.error('Failed to update user approved access on server:', err);
        }

        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved_access: newStatus } : u));
        if (addToast) addToast('success', 'Approved Access updated successfully.');
    };

    // Filter Logic matching search query and URL parameter
    const filteredUsers = users.filter(u => {
        if (activeFilter === 'active' && u.isBanned) return false;
        if (activeFilter === 'banned' && !u.isBanned) return false;
        if (activeFilter === 'email_unverified' && u.isEmailVerified) return false;
        if (activeFilter === 'mobile_unverified' && u.isMobileVerified) return false;
        if (activeFilter === 'approved_access_on' && !u.approved_access) return false;
        if (activeFilter === 'approved_access_off' && u.approved_access) return false;

        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            return (u.name && u.name.toLowerCase().includes(s)) ||
                   (u.email && u.email.toLowerCase().includes(s)) ||
                   (u.phone && u.phone.toLowerCase().includes(s)) ||
                   (u.activePlan && u.activePlan.toLowerCase().includes(s));
        }
        return true;
    });

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Manage Users
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.92rem' }}>
                        Filter by account verification status, manage bans, and dispatch instant notifications.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => handleOpenNotify(null)}
                        style={{
                            background: '#0f172a',
                            color: 'white',
                            border: 'none',
                            padding: '9px 16px',
                            borderRadius: '9px',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <FiSend size={14} /> Send Notification
                    </button>
                </div>
            </div>

            {/* Search Bar & Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={15} />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, plan..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '9px 12px 9px 36px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Showing <strong>{filteredUsers.length}</strong> users
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                <th style={{ padding: '12px 16px' }}>User Details</th>
                                <th style={{ padding: '12px 16px' }}>Role & Plan</th>
                                <th style={{ padding: '12px 16px' }}>Email Status</th>
                                <th style={{ padding: '12px 16px' }}>Mobile Status</th>
                                <th style={{ padding: '12px 16px' }}>Approved Access</th>
                                <th style={{ padding: '12px 16px' }}>Account Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>No Users Found</div>
                                        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
                                            No users matched the selected filter or search term.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{user.email}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{user.phone}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 500, color: '#334155', textTransform: 'capitalize' }}>
                                                {user.role} {user.company ? `(${user.company})` : ''}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: user.isPremium ? '#2563eb' : '#64748b', fontWeight: user.isPremium ? 600 : 500 }}>
                                                {user.activePlan}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {user.isEmailVerified ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.78rem', fontWeight: 600 }}>
                                                    <FiCheck size={12} /> Verified
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleVerifyEmail(user)}
                                                    title="Click to verify email"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    <FiAlertCircle size={11} /> Unverified (Verify)
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {user.isMobileVerified ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.78rem', fontWeight: 600 }}>
                                                    <FiCheck size={12} /> Verified
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleVerifyMobile(user)}
                                                    title="Click to verify mobile"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', padding: '2px 7px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    <FiAlertCircle size={11} /> Unverified (Verify)
                                                </button>
                                            )}
                                        </td>
                                        {/* Approved Access Toggle Switch */}
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                onClick={() => handleToggleApprovedAccess(user)}
                                                title={user.approved_access ? "Approved Access Enabled (Click to toggle OFF)" : "Approved Access Disabled (Click to toggle ON)"}
                                                style={{
                                                    position: 'relative',
                                                    width: '64px',
                                                    height: '28px',
                                                    borderRadius: '20px',
                                                    background: user.approved_access ? 'linear-gradient(135deg, #10b981, #059669)' : '#cbd5e1',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '2px 4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: user.approved_access ? 'flex-end' : 'flex-start',
                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: user.approved_access ? '0 2px 6px rgba(16, 185, 129, 0.35)' : 'none'
                                                }}
                                            >
                                                <span style={{
                                                    position: 'absolute',
                                                    left: user.approved_access ? '8px' : 'auto',
                                                    right: user.approved_access ? 'auto' : '8px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    color: user.approved_access ? '#ffffff' : '#475569',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {user.approved_access ? 'ON' : 'OFF'}
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
                                                background: user.isBanned ? '#fef2f2' : '#f0fdf4',
                                                color: user.isBanned ? '#b91c1c' : '#15803d'
                                            }}>
                                                {user.isBanned ? 'Banned' : 'Active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                                                <button
                                                    onClick={() => handleOpenNotify(user)}
                                                    title="Send Direct Notification"
                                                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <FiSend size={11} /> Notify
                                                </button>
                                                <button
                                                    onClick={() => handleToggleBan(user)}
                                                    style={{
                                                        background: user.isBanned ? '#f0fdf4' : '#ffffff',
                                                        border: user.isBanned ? '1px solid #bbf7d0' : '1px solid #fecaca',
                                                        color: user.isBanned ? '#166534' : '#dc2626',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {user.isBanned ? 'Unban' : 'Ban'}
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
                                    {targetUser ? `Notify ${targetUser.name}` : 'Send Broadcast Notification'}
                                </h3>
                                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                                    {targetUser ? `Recipient: ${targetUser.email}` : `Will dispatch to all users`}
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
                                    placeholder="e.g. Action Required: Account Verification"
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
                                    placeholder="Type your message here..."
                                    style={{ width: '100%', padding: '9px 11px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button type="button" onClick={() => setShowNotifyModal(false)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '7px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={sendingNotify} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '7px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FiSend size={13} /> {sendingNotify ? 'Sending...' : 'Dispatch Notification'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
