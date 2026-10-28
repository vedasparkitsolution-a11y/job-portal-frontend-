import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc',
                    padding: '24px',
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        maxWidth: '560px',
                        width: '100%',
                        backgroundColor: '#ffffff',
                        borderRadius: '20px',
                        padding: '40px',
                        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            marginBottom: '20px'
                        }}>
                            <FiAlertTriangle />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 24px', lineHeight: 1.5 }}>
                            An unexpected application error occurred while displaying this page. Our team has been notified.
                        </p>

                        {this.state.error && (
                            <div style={{
                                backgroundColor: '#f1f5f9',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                color: '#b91c1c',
                                textAlign: 'left',
                                fontFamily: 'monospace',
                                marginBottom: '24px',
                                overflowX: 'auto',
                                border: '1px solid #e2e8f0'
                            }}>
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    backgroundColor: '#0ea5e9',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <FiRefreshCw /> Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#334155',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    border: '1px solid #cbd5e1',
                                    cursor: 'pointer'
                                }}
                            >
                                <FiHome /> Go to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
