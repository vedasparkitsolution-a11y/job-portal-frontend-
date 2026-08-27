import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
    FiCreditCard, FiActivity, FiBell, FiSearch, FiDownload, 
    FiCheckCircle, FiXCircle, FiClock, FiShield, FiUsers, 
    FiFilter, FiFileText, FiSend, FiRefreshCw, FiMapPin,
    FiSmartphone, FiMonitor, FiAlertTriangle
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function AdminReports() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Active tab from URL query param or default to 'transactions'
    const activeTab = searchParams.get('tab') || 'transactions';

    // Filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // ── 1. TRANSACTION HISTORY DATA ──
    const [transactions, setTransactions] = useState([
        {
            id: 'TXN-90211',
            company: 'ABC Technologies Pvt Ltd',
            email: 'hr@abctech.com',
            userRole: 'Employer',
            package: 'ABC Tech Exclusive Plan (Quarterly)',
            amount: 34999,
            method: 'Bank Transfer / NEFT',
            gatewayRef: 'UTR-HDFC-9988221',
            status: 'Approved',
            date: '2026-02-14 11:30 AM'
        },
        {
            id: 'TXN-90212',
            company: 'TechCorp Solutions',
            email: 'talent@techcorp.io',
            userRole: 'Employer',
            package: 'Enterprise Scale (Monthly)',
            amount: 19999,
            method: 'UPI / Razorpay',
            gatewayRef: 'pay_RZP_7766554',
            status: 'Successful',
            date: '2026-02-15 02:45 PM'
        },
        {
            id: 'TXN-90213',
            company: 'Innovate Digital Labs',
            email: 'contact@innovatelabs.com',
            userRole: 'Employer',
            package: 'Growth Recruiter (Monthly)',
            amount: 4999,
            method: 'Credit Card (Visa)',
            gatewayRef: 'txn_init_332211',
            status: 'Pending',
            date: '2026-02-17 09:15 AM'
        },
        {
            id: 'TXN-90214',
            company: 'Apex Financial Services',
            email: 'finance@apexfin.com',
            userRole: 'Employer',
            package: 'Enterprise High-Volume Hiring Pack',
            amount: 89999,
            method: 'Corporate Card',
            gatewayRef: 'err_card_declined_99',
            status: 'Rejected',
            date: '2026-02-10 04:20 PM'
        },
        {
            id: 'TXN-90215',
            company: 'Candidate: Vikram Malhotra',
            email: 'vikram.dev@gmail.com',
            userRole: 'Candidate',
            package: 'Candidate Pro Accelerator',
            amount: 999,
            method: 'UPI / PhonePe',
            gatewayRef: 'session_init_887766',
            status: 'Initiated',
            date: '2026-02-17 12:10 PM'
        },
        {
            id: 'TXN-90216',
            company: 'GlobalLogistics India',
            email: 'admin@globallogistics.in',
            userRole: 'Employer',
            package: 'Quarterly Employer Elite Pack',
            amount: 24999,
            method: 'Bank Transfer (IMPS)',
            gatewayRef: 'UTR-ICICI-443322',
            status: 'Pending',
            date: '2026-02-17 03:30 PM'
        },
        {
            id: 'TXN-90217',
            company: 'Candidate: Ananya Sharma',
            email: 'ananya.s@gmail.com',
            userRole: 'Candidate',
            package: 'Resume Polish + Pro Badge',
            amount: 1499,
            method: 'UPI / GPay',
            gatewayRef: 'pay_UPI_990011',
            status: 'Successful',
            date: '2026-02-16 10:20 AM'
        }
    ]);

    // ── 2. LOGIN HISTORY DATA ──
    const [loginLogs, setLoginLogs] = useState([
        {
            id: 'LOG-1001',
            userName: 'Rajesh Kumar (HR)',
            email: 'hr@abctech.com',
            role: 'Employer',
            ipAddress: '103.212.144.18',
            location: 'Chennai, TN, India',
            device: 'Chrome 122 on Windows 11',
            deviceType: 'desktop',
            status: 'Success',
            timestamp: '2026-02-17 02:45 PM'
        },
        {
            id: 'LOG-1002',
            userName: 'Ananya Sharma',
            email: 'ananya.s@gmail.com',
            role: 'Candidate',
            ipAddress: '49.207.210.92',
            location: 'Bangalore, KA, India',
            device: 'Safari on iPhone 15 Pro',
            deviceType: 'mobile',
            status: 'Success',
            timestamp: '2026-02-17 01:15 PM'
        },
        {
            id: 'LOG-1003',
            userName: 'Vikram Rajput',
            email: 'vikram.spam@gmail.com',
            role: 'Candidate',
            ipAddress: '185.220.101.5',
            location: 'Frankfurt, Germany (VPN)',
            device: 'Firefox 120 on Linux',
            deviceType: 'desktop',
            status: 'Blocked (Banned User)',
            timestamp: '2026-02-17 11:30 AM'
        },
        {
            id: 'LOG-1004',
            userName: 'Talent Acquisition Team',
            email: 'talent@techcorp.io',
            role: 'Employer',
            ipAddress: '103.45.67.89',
            location: 'Hyderabad, TS, India',
            device: 'Edge 121 on Windows 10',
            deviceType: 'desktop',
            status: 'Success',
            timestamp: '2026-02-17 10:05 AM'
        },
        {
            id: 'LOG-1005',
            userName: 'Kavita Sundaram',
            email: 'kavita.s@gmail.com',
            role: 'Candidate',
            ipAddress: '157.48.99.120',
            location: 'Coimbatore, TN, India',
            device: 'Chrome on Android 14',
            deviceType: 'mobile',
            status: 'Failed Password',
            timestamp: '2026-02-17 09:40 AM'
        },
        {
            id: 'LOG-1006',
            userName: 'Super Administrator',
            email: 'admin@jobconnect.com',
            role: 'Admin',
            ipAddress: '122.178.200.55',
            location: 'Chennai, TN, India',
            device: 'Chrome 122 on macOS Sonoma',
            deviceType: 'desktop',
            status: 'Success',
            timestamp: '2026-02-17 08:30 AM'
        },
        {
            id: 'LOG-1007',
            userName: 'Rohan Mehta',
            email: 'rohan.m@yahoo.com',
            role: 'Candidate',
            ipAddress: '115.111.45.60',
            location: 'Mumbai, MH, India',
            device: 'Chrome 122 on Windows 11',
            deviceType: 'desktop',
            status: 'Success',
            timestamp: '2026-02-16 06:12 PM'
        }
    ]);

    // ── 3. NOTIFICATION HISTORY DATA ──
    const [notificationLogs, setNotificationLogs] = useState([
        {
            id: 'NOTIF-8001',
            title: 'Platform Maintenance Notice: Scheduled System Update',
            message: 'JobConnect servers will undergo scheduled infrastructure maintenance on Feb 20, 2026 from 02:00 AM to 04:00 AM IST.',
            channel: 'Both (In-App + Email)',
            recipient: 'All Registered Users',
            recipientCount: 14,
            status: 'Delivered',
            timestamp: '2026-02-17 10:00 AM'
        },
        {
            id: 'NOTIF-8002',
            title: 'Action Required: Verify Your Mobile Contact Number',
            message: 'Please complete your phone number verification to unlock 1-click candidate applications and verified badges.',
            channel: 'In-App Only',
            recipient: 'Mobile Unverified Users',
            recipientCount: 4,
            status: 'Delivered',
            timestamp: '2026-02-16 04:30 PM'
        },
        {
            id: 'NOTIF-8003',
            title: 'Exclusive Spring Hiring Subsidy: 20% Off Enterprise Plans',
            message: 'Unlock unlimited candidate profile contacts and verified hiring badges with our new quarterly tier.',
            channel: 'Email Dispatch Only',
            recipient: 'All Verified Employers',
            recipientCount: 6,
            status: 'Delivered',
            timestamp: '2026-02-15 11:15 AM'
        },
        {
            id: 'NOTIF-8004',
            title: 'Direct Notice: Profile Review Required',
            message: 'Your candidate portfolio was reviewed by our verification moderation team and is ready for live discovery.',
            channel: 'Both (In-App + Email)',
            recipient: 'ananya.s@gmail.com',
            recipientCount: 1,
            status: 'Delivered',
            timestamp: '2026-02-14 02:00 PM'
        }
    ]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('admin_notification_history');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setNotificationLogs(prev => {
                        const existingIds = new Set(prev.map(n => n.id));
                        const combined = [...parsed.filter(p => !existingIds.has(p.id)), ...prev];
                        return combined;
                    });
                }
            }
        } catch (e) {}
    }, [activeTab]);

    const setTab = (tabKey) => {
        setSearchParams({ tab: tabKey });
        setSearchTerm('');
        setStatusFilter('all');
    };

    const exportTransactionsCSV = () => {
        const headers = ['Transaction ID', 'Company/User', 'Email', 'Role', 'Package', 'Amount', 'Payment Method', 'Gateway Reference', 'Status', 'Date'];
        const rows = filteredTransactions.map(t => [
            t.id, `"${t.company}"`, t.email, t.userRole, `"${t.package}"`, t.amount, `"${t.method}"`, t.gatewayRef, t.status, `"${t.date}"`
        ]);
        downloadCSV(`transactions_report_${Date.now()}.csv`, headers, rows);
    };

    const exportLoginsCSV = () => {
        const headers = ['Log ID', 'User Name', 'Email', 'Role', 'IP Address', 'Location', 'Device / Browser', 'Status', 'Timestamp'];
        const rows = filteredLogins.map(l => [
            l.id, `"${l.userName}"`, l.email, l.role, l.ipAddress, `"${l.location}"`, `"${l.device}"`, l.status, `"${l.timestamp}"`
        ]);
        downloadCSV(`login_history_report_${Date.now()}.csv`, headers, rows);
    };

    const exportNotificationsCSV = () => {
        const headers = ['Notification ID', 'Subject / Title', 'Message', 'Channel', 'Target Audience', 'Recipients Count', 'Status', 'Dispatched At'];
        const rows = filteredNotifications.map(n => [
            n.id, `"${n.title}"`, `"${n.message.replace(/"/g, '""')}"`, `"${n.channel}"`, `"${n.recipient}"`, n.recipientCount, n.status, `"${n.timestamp}"`
        ]);
        downloadCSV(`notification_history_report_${Date.now()}.csv`, headers, rows);
    };

    const downloadCSV = (filename, headers, rows) => {
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addToast) addToast('success', `${filename} exported successfully.`);
    };

    const filteredTransactions = transactions.filter(t => {
        if (statusFilter !== 'all' && t.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            return t.id.toLowerCase().includes(s) ||
                   t.company.toLowerCase().includes(s) ||
                   t.email.toLowerCase().includes(s) ||
                   t.package.toLowerCase().includes(s) ||
                   t.gatewayRef.toLowerCase().includes(s);
        }
        return true;
    });

    const filteredLogins = loginLogs.filter(l => {
        if (statusFilter !== 'all') {
            if (statusFilter === 'success' && l.status !== 'Success') return false;
            if (statusFilter === 'failed' && l.status === 'Success') return false;
        }
        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            return l.userName.toLowerCase().includes(s) ||
                   l.email.toLowerCase().includes(s) ||
                   l.ipAddress.toLowerCase().includes(s) ||
                   l.location.toLowerCase().includes(s) ||
                   l.device.toLowerCase().includes(s);
        }
        return true;
    });

    const filteredNotifications = notificationLogs.filter(n => {
        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            return n.title.toLowerCase().includes(s) ||
                   n.message.toLowerCase().includes(s) ||
                   n.recipient.toLowerCase().includes(s);
        }
        return true;
    });

    const reportTabs = [
        { key: 'transactions', label: 'Transaction History', icon: FiCreditCard, count: transactions.length },
        { key: 'logins', label: 'Login History', icon: FiActivity, count: loginLogs.length },
        { key: 'notifications', label: 'Notification History', icon: FiBell, count: notificationLogs.length },
    ];

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Reports & Audit Logs
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.92rem' }}>
                        Comprehensive records of financial transactions, security authentication logs, and communication history.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {activeTab === 'transactions' && (
                        <button
                            onClick={exportTransactionsCSV}
                            style={{
                                background: '#ffffff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                padding: '9px 15px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.86rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                        >
                            <FiDownload size={14} /> Export CSV
                        </button>
                    )}
                    {activeTab === 'logins' && (
                        <button
                            onClick={exportLoginsCSV}
                            style={{
                                background: '#ffffff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                padding: '9px 15px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.86rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                        >
                            <FiDownload size={14} /> Export CSV
                        </button>
                    )}
                    {activeTab === 'notifications' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={exportNotificationsCSV}
                                style={{
                                    background: '#ffffff',
                                    color: '#2563eb',
                                    border: '1px solid #bfdbfe',
                                    padding: '9px 15px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.86rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                            >
                                <FiDownload size={14} /> Export CSV
                            </button>
                            <Link
                                to="/admin/users?action=send_notification"
                                style={{
                                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    padding: '9px 16px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.86rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                                }}
                            >
                                <FiSend size={13} /> Dispatch Notification
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Clean White + Blue Segmented Tabs for Report Selection */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <div style={{
                    display: 'inline-flex',
                    background: '#eff6ff',
                    padding: '4px',
                    borderRadius: '10px',
                    border: '1px solid #bfdbfe',
                    gap: '4px',
                    flexWrap: 'wrap'
                }}>
                    {reportTabs.map(tab => {
                        const isSelected = activeTab === tab.key;
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setTab(tab.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '7px 15px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    background: isSelected ? '#2563eb' : 'transparent',
                                    color: isSelected ? '#ffffff' : '#1e40af',
                                    fontWeight: isSelected ? 700 : 600,
                                    fontSize: '0.86rem',
                                    cursor: 'pointer',
                                    boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <TabIcon size={14} color={isSelected ? '#ffffff' : '#2563eb'} />
                                <span>{tab.label}</span>
                                <span style={{
                                    background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#dbeafe',
                                    color: isSelected ? '#ffffff' : '#1e40af',
                                    padding: '1px 6px',
                                    borderRadius: '8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── TAB 1: TRANSACTION HISTORY ── */}
            {activeTab === 'transactions' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} size={15} />
                            <input
                                type="text"
                                placeholder="Search TXN ID, company, email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 600, color: '#334155', outline: 'none' }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="successful">Successful</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                            <option value="initiated">Initiated</option>
                        </select>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                        <th style={{ padding: '12px 16px' }}>TXN ID & Date</th>
                                        <th style={{ padding: '12px 16px' }}>Payer & Role</th>
                                        <th style={{ padding: '12px 16px' }}>Subscribed Package</th>
                                        <th style={{ padding: '12px 16px' }}>Amount & Gateway Ref</th>
                                        <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                No transaction records found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map(txn => {
                                            let badgeBg = '#f1f5f9';
                                            let badgeColor = '#475569';
                                            if (txn.status === 'Successful') { badgeBg = '#f0fdf4'; badgeColor = '#16a34a'; }
                                            if (txn.status === 'Approved') { badgeBg = '#eff6ff'; badgeColor = '#2563eb'; }
                                            if (txn.status === 'Pending') { badgeBg = '#fffbeb'; badgeColor = '#b45309'; }
                                            if (txn.status === 'Rejected') { badgeBg = '#fef2f2'; badgeColor = '#dc2626'; }
                                            if (txn.status === 'Initiated') { badgeBg = '#faf5ff'; badgeColor = '#7c3aed'; }

                                            return (
                                                <tr key={txn.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{txn.id}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{txn.date}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{txn.company}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{txn.email} ({txn.userRole})</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#334155' }}>
                                                        {txn.package}
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                                            ₹{Number(txn.amount || 0).toLocaleString()}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#2563eb', fontFamily: 'monospace', fontWeight: 600 }}>
                                                            {txn.gatewayRef}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.82rem' }}>
                                                        {txn.method}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                        <span style={{
                                                            padding: '3px 9px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.74rem',
                                                            fontWeight: 700,
                                                            background: badgeBg,
                                                            color: badgeColor,
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 2: LOGIN HISTORY ── */}
            {activeTab === 'logins' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} size={15} />
                            <input
                                type="text"
                                placeholder="Search name, email, IP, device..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 600, color: '#334155', outline: 'none' }}
                        >
                            <option value="all">All Auth Results</option>
                            <option value="success">Successful Logins</option>
                            <option value="failed">Failed / Blocked</option>
                        </select>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                        <th style={{ padding: '12px 16px' }}>User Details</th>
                                        <th style={{ padding: '12px 16px' }}>Role</th>
                                        <th style={{ padding: '12px 16px' }}>IP & Location</th>
                                        <th style={{ padding: '12px 16px' }}>Device & Client</th>
                                        <th style={{ padding: '12px 16px' }}>Timestamp</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Authentication Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogins.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                No login session logs found matching the search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogins.map(log => {
                                            const isSuccess = log.status === 'Success';
                                            return (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.userName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.email}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            fontSize: '0.72rem',
                                                            fontWeight: 700,
                                                            padding: '2px 7px',
                                                            borderRadius: '5px',
                                                            background: log.role === 'Admin' ? '#f5f3ff' : (log.role === 'Employer' ? '#eff6ff' : '#f8fafc'),
                                                            color: log.role === 'Admin' ? '#7c3aed' : (log.role === 'Employer' ? '#2563eb' : '#475569')
                                                        }}>
                                                            {log.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>
                                                            {log.ipAddress}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                            {log.location}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.82rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            {log.deviceType === 'mobile' ? <FiSmartphone size={13} color="#2563eb" /> : <FiMonitor size={13} color="#2563eb" />}
                                                            <span>{log.device}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>
                                                        {log.timestamp}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '3px 9px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.74rem',
                                                            fontWeight: 700,
                                                            background: isSuccess ? '#f0fdf4' : '#fef2f2',
                                                            color: isSuccess ? '#16a34a' : '#dc2626'
                                                        }}>
                                                            {isSuccess ? <FiCheckCircle size={12} /> : <FiAlertTriangle size={12} />}
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB 3: NOTIFICATION HISTORY ── */}
            {activeTab === 'notifications' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} size={15} />
                            <input
                                type="text"
                                placeholder="Search title, keyword, recipient..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                            />
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            Dispatched: <strong style={{ color: '#2563eb' }}>{filteredNotifications.length}</strong>
                        </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                        <th style={{ padding: '12px 16px' }}>Subject & Message</th>
                                        <th style={{ padding: '12px 16px' }}>Channel</th>
                                        <th style={{ padding: '12px 16px' }}>Target Audience</th>
                                        <th style={{ padding: '12px 16px' }}>Sent Date & Time</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredNotifications.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                                No dispatched notifications found in logs.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredNotifications.map(notif => (
                                            <tr key={notif.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 16px', maxWidth: '380px' }}>
                                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                        {notif.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                                                        {notif.message}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: '2px' }}>
                                                        ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{notif.id}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '5px',
                                                        fontSize: '0.74rem',
                                                        fontWeight: 700,
                                                        background: '#eff6ff',
                                                        color: '#2563eb'
                                                    }}>
                                                        {notif.channel}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                                        {notif.recipient}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                                        {notif.recipientCount} recipient{notif.recipientCount !== 1 ? 's' : ''}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.82rem' }}>
                                                    {notif.timestamp}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '3px 9px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.74rem',
                                                        fontWeight: 700,
                                                        background: '#f0fdf4',
                                                        color: '#16a34a'
                                                    }}>
                                                        <FiCheckCircle size={12} /> {notif.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
