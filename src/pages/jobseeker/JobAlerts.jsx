import { useState } from 'react';
import CandidateSidebar from '../../components/CandidateSidebar';
import { FiBell, FiMapPin, FiBriefcase, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

export default function JobAlerts() {
    const [alerts, setAlerts] = useState([
        { id: 1, label: 'New jobs matching my skills', enabled: true },
        { id: 2, label: 'Jobs in my preferred location', enabled: false },
        { id: 3, label: 'Remote job opportunities', enabled: true },
        { id: 4, label: 'Salary-based recommendations', enabled: false },
    ]);

    function toggleAlert(id) {
        setAlerts(prev =>
            prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
        );
    }

    return (
        <CandidateSidebar>
            <div className="dashboard-header">
                <h1>Job Alerts</h1>
                <p>Manage your notification preferences</p>
            </div>

            <div className="profile-card">
                <div className="alerts-list">
                    {alerts.map(alert => (
                        <div key={alert.id} className="alert-item">
                            <div className="alert-info">
                                <FiBell style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                <span>{alert.label}</span>
                            </div>
                            <button
                                className={`alert-toggle ${alert.enabled ? 'active' : ''}`}
                                onClick={() => toggleAlert(alert.id)}
                            >
                                {alert.enabled ? <FiToggleRight /> : <FiToggleLeft />}
                            </button>
                        </div>
                    ))}
                </div>
                <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    You'll receive email notifications based on your preferences above.
                </p>
            </div>
        </CandidateSidebar>
    );
}
