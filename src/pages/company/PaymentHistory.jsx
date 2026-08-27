import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiFileText, FiCheckCircle } from 'react-icons/fi';

export default function PaymentHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/subscriptions/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching payment history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Payment History</h1>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>View your past transactions and download invoices.</p>

            {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No payment history found.</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Plan</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Amount</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Order ID</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>Invoice</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(payment => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '16px 20px', color: '#1e293b' }}>
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#1e293b', fontWeight: 500 }}>
                                        {payment.planName}
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#1e293b', fontWeight: 600 }}>
                                        ₹{payment.amount}
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.9rem' }}>
                                        {payment.razorpayOrderId}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ 
                                            background: payment.status === 'success' ? '#dcfce7' : '#fee2e2', 
                                            color: payment.status === 'success' ? '#166534' : '#991b1b',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {payment.status === 'success' && <FiCheckCircle />} {payment.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <button 
                                            onClick={() => alert('Invoice generation would be implemented here in production.')}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#7c3aed',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontWeight: 600
                                            }}
                                        >
                                            <FiFileText /> PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
