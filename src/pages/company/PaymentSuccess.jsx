import { useNavigate } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

export default function PaymentSuccess() {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px', textAlign: 'center' }}>
            <FiCheckCircle size={80} color="#10b981" style={{ marginBottom: '24px' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>Payment Successful!</h1>
            <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '32px' }}>
                Your subscription has been activated successfully. You can now unlock premium candidate profiles and contact details.
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
                    onClick={() => navigate('/company/candidate-matches')}
                    style={{
                        padding: '12px 24px',
                        background: '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    View Candidates
                </button>
            </div>
        </div>
    );
}
