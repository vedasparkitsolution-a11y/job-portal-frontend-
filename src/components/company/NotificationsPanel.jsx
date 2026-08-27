import { useState, useEffect } from 'react';
import { FiBell, FiX, FiUsers, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';

// Simple notification store using localStorage
export function addNotification(type, message) {
    const stored = JSON.parse(localStorage.getItem('company_notifications') || '[]');
    stored.unshift({ id: Date.now(), type, message, read: false, time: new Date().toISOString() });
    localStorage.setItem('company_notifications', JSON.stringify(stored.slice(0, 50)));
}

export default function NotificationsPanel({ companyId }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        load();
        const iv = setInterval(load, 10000);
        return () => clearInterval(iv);
    }, []);

    function load() {
        const stored = JSON.parse(localStorage.getItem('company_notifications') || '[]');
        setNotifications(stored);
    }

    function markAllRead() {
        const updated = notifications.map(n => ({ ...n, read: true }));
        localStorage.setItem('company_notifications', JSON.stringify(updated));
        setNotifications(updated);
    }

    function dismiss(id) {
        const updated = notifications.filter(n => n.id !== id);
        localStorage.setItem('company_notifications', JSON.stringify(updated));
        setNotifications(updated);
    }

    const unread = notifications.filter(n => !n.read).length;
    const iconMap = { application: <FiUsers />, message: <FiMessageSquare />, test: <FiCheckCircle /> };
    const colorMap = { application: '#6366f1', message: '#22c55e', test: '#f59e0b' };

    return (
        <div style={{ position: 'relative' }}>
            <button className="company-icon-btn" onClick={() => { setOpen(!open); markAllRead(); }}>
                <FiBell />
                {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
            </button>

            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{
                        position: 'absolute', top: '48px', right: 0,
                        width: '340px', background: 'var(--bg-card)',
                        border: '1px solid var(--border)', borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', zIndex: 50,
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>🔔 Notifications</h4>
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX /></button>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No notifications yet</p>
                            ) : notifications.map(n => (
                                <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'flex-start', background: n.read ? 'transparent' : 'var(--primary-50,#ede9fe11)' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: (colorMap[n.type] || '#64748b') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colorMap[n.type] || '#64748b', flexShrink: 0 }}>
                                        {iconMap[n.type] || <FiBell />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>{n.message}</p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><FiX size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
