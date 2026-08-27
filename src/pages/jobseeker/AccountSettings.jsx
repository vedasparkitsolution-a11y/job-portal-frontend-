import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CandidateSidebar from '../../components/CandidateSidebar';
import { FiLock, FiBell, FiTrash2, FiSave } from 'react-icons/fi';

export default function AccountSettings() {
    const { userData, currentUser } = useAuth();
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        applicationUpdates: true,
        newsletter: false,
    });

    function handleToggle(key) {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    }

    return (
        <CandidateSidebar>
            <div className="dashboard-header">
                <h1>Account Settings</h1>
                <p>Manage your account preferences</p>
            </div>

            {/* Account Info */}
            <div className="profile-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Account Information</h3>
                <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={userData?.email || currentUser?.email || ''} disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group">
                    <label><FiLock /> Change Password</label>
                    <input type="password" placeholder="New password" />
                </div>
                <div className="form-group">
                    <label><FiLock /> Confirm New Password</label>
                    <input type="password" placeholder="Confirm new password" />
                </div>
                <button className="btn btn-primary">
                    <FiSave /> Update Password
                </button>
            </div>

            {/* Email Notifications */}
            <div className="profile-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>
                    <FiBell style={{ marginRight: '8px' }} /> Email Notifications
                </h3>
                <div className="alerts-list">
                    <div className="alert-item">
                        <span>Job alert emails</span>
                        <button
                            className={`alert-toggle ${notifications.emailAlerts ? 'active' : ''}`}
                            onClick={() => handleToggle('emailAlerts')}
                        >
                            {notifications.emailAlerts ? 'On' : 'Off'}
                        </button>
                    </div>
                    <div className="alert-item">
                        <span>Application status updates</span>
                        <button
                            className={`alert-toggle ${notifications.applicationUpdates ? 'active' : ''}`}
                            onClick={() => handleToggle('applicationUpdates')}
                        >
                            {notifications.applicationUpdates ? 'On' : 'Off'}
                        </button>
                    </div>
                    <div className="alert-item">
                        <span>Weekly newsletter</span>
                        <button
                            className={`alert-toggle ${notifications.newsletter ? 'active' : ''}`}
                            onClick={() => handleToggle('newsletter')}
                        >
                            {notifications.newsletter ? 'On' : 'Off'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="profile-card" style={{ borderColor: 'var(--danger)', borderWidth: '1px' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1.1rem', color: 'var(--danger)' }}>
                    <FiTrash2 style={{ marginRight: '8px' }} /> Danger Zone
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="btn btn-sm btn-danger">Delete Account</button>
            </div>
        </CandidateSidebar>
    );
}
