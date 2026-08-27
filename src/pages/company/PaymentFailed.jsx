import { useNavigate } from 'react-router-dom';
import { FiXCircle } from 'react-icons/fi';

export default function PaymentFailed() {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px', textAlign: 'center' }}>
            <FiXCircle size={80} color="#ef4444" style={{ marginBottom: '24px' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>Payment Failed</h1>
            <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '32px' }}>
                We couldn't process your payment. Please try again or use a different payment method.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                    onClick={() => navigate('/company')}
                    style={{
                        padding: '12px 24px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Go to Dashboard
                </button>
                <button 
                    onClick={() => navigate('/company/subscriptions')}
                    style={{
                        padding: '12px 24px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
