import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('React ErrorBoundary Caught Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: '#f8fafc'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '24px',
                        padding: '48px 32px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '20px',
                            background: '#fef2f2',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            margin: '0 auto 20px'
                        }}>
                            <FiAlertTriangle />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                            Something went wrong loading this page
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.6 }}>
                            {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh or try again.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-primary"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                fontWeight: 800,
                                fontSize: '0.92rem'
                            }}
                        >
                            <FiRefreshCw /> Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
