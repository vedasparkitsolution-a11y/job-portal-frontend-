import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { 
    FiSearch, FiCheckCircle, FiXCircle, FiClock, FiDollarSign,
    FiAlertCircle, FiFilter, FiDownload, FiCheck, FiX, FiActivity,
    FiCreditCard, FiCheckSquare, FiFileText
} from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export default function AdminPayments() {
    const { token } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState('');
    const activeStatus = searchParams.get('status') || 'all';

    // Demo / Initial Transactions
    const [payments, setPayments] = useState([
        {
            id: 'PAY-8901',
            company: 'ABC Technologies Pvt Ltd',
            userEmail: 'hr@abctech.com',
            package: 'ABC Tech Exclusive Plan (Quarterly)',
            amount: 34999,
            paymentMethod: 'Bank Transfer / NEFT',
            status: 'approved',
            date: '2026-02-14 11:30 AM',
            transactionRef: 'UTR-HDFC-9988221'
        },
        {
            id: 'PAY-8902',
            company: 'TechCorp Solutions',
            userEmail: 'talent@techcorp.io',
            package: 'Enterprise Scale (Monthly)',
            amount: 19999,
            paymentMethod: 'UPI / Razorpay',
            status: 'successful',
            date: '2026-02-15 02:45 PM',
            transactionRef: 'pay_RZP_7766554'
        },
        {
            id: 'PAY-8903',
            company: 'Innovate Digital Labs',
            userEmail: 'contact@innovatelabs.com',
            package: 'Growth Recruiter (Monthly)',
            amount: 4999,
            paymentMethod: 'Credit Card (Visa)',
            status: 'pending',
            date: '2026-02-17 09:15 AM',
            transactionRef: 'txn_init_332211'
        },
        {
            id: 'PAY-8904',
            company: 'Apex Financial Services',
            userEmail: 'finance@apexfin.com',
            package: 'Enterprise High-Volume Hiring Pack',
            amount: 89999,
            paymentMethod: 'Corporate Card',
            status: 'rejected',
            date: '2026-02-10 04:20 PM',
            transactionRef: 'err_card_declined_99'
        },
        {
            id: 'PAY-8905',
            company: 'Candidate: Vikram Malhotra',
            userEmail: 'vikram.dev@gmail.com',
            package: 'Candidate Pro Accelerator',
            amount: 999,
            paymentMethod: 'UPI / PhonePe',
            status: 'initiated',
            date: '2026-02-17 12:10 PM',
            transactionRef: 'session_init_887766'
        },
        {
            id: 'PAY-8906',
            company: 'GlobalLogistics India',
            userEmail: 'admin@globallogistics.in',
            package: 'Quarterly Employer Elite Pack',
            amount: 24999,
            paymentMethod: 'Bank Transfer (IMPS)',
            status: 'pending',
            date: '2026-02-17 03:30 PM',
            transactionRef: 'UTR-ICICI-443322'
        },
        {
            id: 'PAY-8907',
            company: 'Candidate: Ananya Sharma',
            userEmail: 'ananya.s@gmail.com',
            package: 'Resume Polish + Pro Badge',
            amount: 1499,
            paymentMethod: 'UPI / GPay',
            status: 'successful',
            date: '2026-02-16 10:20 AM',
            transactionRef: 'pay_UPI_990011'
        }
    ]);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/payments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) setPayments(data);
            }
        } catch (e) {}
    };

    const handleUpdateStatus = (payId, newStatus) => {
        setPayments(prev => prev.map(p => p.id === payId ? { ...p, status: newStatus } : p));
        if (addToast) addToast('success', `Payment ${payId} status updated to ${newStatus.toUpperCase()}`);
    };

    const handleExportCSV = () => {
        const headers = ['Payment ID', 'Company/User', 'Email', 'Package', 'Amount (INR)', 'Payment Method', 'Status', 'Date', 'Reference'];
        const rows = filteredPayments.map(p => [
            p.id,
            `"${p.company}"`,
            p.userEmail,
            `"${p.package}"`,
            p.amount,
            `"${p.paymentMethod}"`,
            p.status,
            `"${p.date}"`,
            p.transactionRef
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `jobconnect_payments_${activeStatus}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addToast) addToast('success', 'Payments exported to CSV successfully.');
    };

    // Filter Logic matching search query and status parameter
    const filteredPayments = payments.filter(p => {
        if (activeStatus !== 'all' && p.status !== activeStatus) return false;

        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            return p.id.toLowerCase().includes(s) ||
                   p.company.toLowerCase().includes(s) ||
                   p.userEmail.toLowerCase().includes(s) ||
                   p.package.toLowerCase().includes(s) ||
                   (p.transactionRef && p.transactionRef.toLowerCase().includes(s));
        }
        return true;
    });

    const totalCollected = payments.filter(p => p.status === 'successful' || p.status === 'approved').reduce((a, b) => a + Number(b.amount || 0), 0);
    const tabTotalAmount = filteredPayments.reduce((a, b) => a + Number(b.amount || 0), 0);

    return (
        <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, -apple-system, sans-serif' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                        Payments Management
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.92rem' }}>
                        Track incoming transaction requests, approve manual wire transfers, and monitor platform revenue.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>
                        <span style={{ color: '#1e40af', fontWeight: 600 }}>Total Collected: </span>
                        <strong style={{ color: '#2563eb', fontWeight: 800 }}>₹{totalCollected.toLocaleString()}</strong>
                    </div>

                    <button
                        onClick={handleExportCSV}
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
                </div>
            </div>

            {/* Search Bar & Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} size={15} />
                    <input
                        type="text"
                        placeholder="Search ID, company, package, ref..."
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
                    Total: <strong style={{ color: '#2563eb', fontWeight: 700 }}>₹{tabTotalAmount.toLocaleString()}</strong> ({filteredPayments.length} records)
                </div>
            </div>

            {/* Payments Table */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                <th style={{ padding: '12px 16px' }}>Payment Ref / Date</th>
                                <th style={{ padding: '12px 16px' }}>Company / Account</th>
                                <th style={{ padding: '12px 16px' }}>Subscription Package</th>
                                <th style={{ padding: '12px 16px' }}>Amount & Method</th>
                                <th style={{ padding: '12px 16px' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>No Payments Found</div>
                                        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
                                            There are no transactions recorded under this filter.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map(pay => {
                                    let badgeBg = '#f1f5f9';
                                    let badgeColor = '#475569';
                                    if (pay.status === 'successful') { badgeBg = '#f0fdf4'; badgeColor = '#16a34a'; }
                                    if (pay.status === 'approved') { badgeBg = '#eff6ff'; badgeColor = '#2563eb'; }
                                    if (pay.status === 'pending') { badgeBg = '#fffbeb'; badgeColor = '#b45309'; }
                                    if (pay.status === 'rejected') { badgeBg = '#fef2f2'; badgeColor = '#dc2626'; }
                                    if (pay.status === 'initiated') { badgeBg = '#faf5ff'; badgeColor = '#7c3aed'; }

                                    return (
                                        <tr key={pay.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{pay.id}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pay.date}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#2563eb', fontFamily: 'monospace', fontWeight: 600 }}>{pay.transactionRef}</div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{pay.company}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pay.userEmail}</div>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontWeight: 500, color: '#334155' }}>
                                                {pay.package}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                                    ₹{Number(pay.amount || 0).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{pay.paymentMethod}</div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    padding: '3px 9px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 700,
                                                    background: badgeBg,
                                                    color: badgeColor,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {pay.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                                                    {pay.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(pay.id, 'approved')}
                                                                style={{ background: '#2563eb', border: 'none', color: '#ffffff', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateStatus(pay.id, 'rejected')}
                                                                style={{ background: '#ffffff', border: '1px solid #fecaca', color: '#dc2626', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {pay.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(pay.id, 'successful')}
                                                            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                                        >
                                                            Mark Successful
                                                        </button>
                                                    )}
                                                    {pay.status === 'initiated' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(pay.id, 'successful')}
                                                            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                                        >
                                                            Confirm Paid
                                                        </button>
                                                    )}
                                                    {pay.status === 'rejected' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(pay.id, 'approved')}
                                                            style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                                        >
                                                            Re-approve
                                                        </button>
                                                    )}
                                                </div>
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
    );
}
