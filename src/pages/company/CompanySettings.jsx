import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CompanyProfile from './CompanyProfile';
import { useToast } from '../../components/Toast';

export default function CompanySettings() {
    const [activeTab, setActiveTab] = useState('profile');
    const { userData } = useAuth();
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const { addToast } = useToast();

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            addToast('Passwords do not match', 'error');
            return;
        }
        addToast('Password updated successfuly! (Mock)', 'success');
        setPasswords({ current: '', new: '', confirm: '' });
    };

    const handleNotsChange = (e) => {
        e.preventDefault();
        addToast('Notification preferences saved.', 'success');
    };

    return (
        <div>
            <h2 style={{ marginBottom: '24px' }}>Settings</h2>

            <div style={{ display: 'flex', gap: '32px' }}>
                {/* Tabs vertical */}
                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                        onClick={() => setActiveTab('profile')} 
                        style={{ padding: '12px 16px', textAlign: 'left', background: activeTab === 'profile' ? 'var(--primary)' : 'var(--bg-card)', color: activeTab === 'profile' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                        Company Profile
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')} 
                        style={{ padding: '12px 16px', textAlign: 'left', background: activeTab === 'security' ? 'var(--primary)' : 'var(--bg-card)', color: activeTab === 'security' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                        Security & Password
                    </button>
                    <button 
                        onClick={() => setActiveTab('notifications')} 
                        style={{ padding: '12px 16px', textAlign: 'left', background: activeTab === 'notifications' ? 'var(--primary)' : 'var(--bg-card)', color: activeTab === 'notifications' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                        Notification Preferences
                    </button>
                </div>

                {/* Tab Content */}
                <div style={{ flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '32px' }}>
                    {activeTab === 'profile' && (
                        <div>
                            <h3 style={{ marginBottom: '24px' }}>Update Profile</h3>
                            <CompanyProfile embedded={true} />
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h3 style={{ marginBottom: '24px' }}>Change Password</h3>
                            <form onSubmit={handlePasswordChange}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} required />
                                </div>
                                <button type="submit" className="btn btn-primary">Update Password</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h3 style={{ marginBottom: '24px' }}>Email Notifications</h3>
                            <form onSubmit={handleNotsChange}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="checkbox" defaultChecked /> Receive email when a new application is submitted
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="checkbox" defaultChecked /> Receive daily digest of job views
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="checkbox" defaultChecked /> Receive alerts for platform updates
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary">Save Preferences</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
