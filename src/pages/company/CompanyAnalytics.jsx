import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getJobsByCompany } from '../../services/jobService';
import { getApplicationsByCompany } from '../../services/applicationService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CompanyAnalytics() {
    const { currentUser, userData } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (currentUser) {
            loadData();
        }
    }, [currentUser]);

    async function loadData() {
        try {
            const [jobs, apps] = await Promise.all([
                getJobsByCompany(currentUser.uid),
                getApplicationsByCompany(currentUser.uid)
            ]);
            
            const activeJobs = jobs.filter(j => j.status === 'open').length;
            const shortlisted = apps.filter(a => a.status === 'shortlisted').length;
            const rejected = apps.filter(a => a.status === 'rejected').length;

            setStats({
                totalJobs: jobs.length,
                activeJobs,
                totalApps: apps.length,
                shortlisted,
                rejected
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <h2 style={{ marginBottom: '24px' }}>Analytics & Reporting</h2>
            
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>Conversion Rate</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {stats.totalApps > 0 ? Math.round((stats.shortlisted / stats.totalApps) * 100) : 0}%
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Applicants shortlisted</p>
                    </div>

                    <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>Avg. Applicants/Job</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info)' }}>
                            {stats.totalJobs > 0 ? (stats.totalApps / stats.totalJobs).toFixed(1) : 0}
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Across all posted jobs</p>
                    </div>

                    <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>Pipeline Health</h4>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <div style={{ flex: stats.shortlisted || 1, height: '8px', background: 'var(--success)', borderRadius: '4px' }} title="Shortlisted"></div>
                            <div style={{ flex: stats.rejected || 1, height: '8px', background: 'var(--danger)', borderRadius: '4px' }} title="Rejected"></div>
                            <div style={{ flex: (stats.totalApps - stats.shortlisted - stats.rejected) || 1, height: '8px', background: 'var(--secondary)', borderRadius: '4px' }} title="Pending"></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span><span style={{ color: 'var(--success)' }}>●</span> Shortlisted ({stats.shortlisted})</span>
                            <span><span style={{ color: 'var(--secondary)' }}>●</span> Pending ({stats.totalApps - stats.shortlisted - stats.rejected})</span>
                            <span><span style={{ color: 'var(--danger)' }}>●</span> Rejected ({stats.rejected})</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Mock Chart Area */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <h3>Views vs Applications (Last 30 Days)</h3>
                <div style={{ height: '300px', width: '100%', position: 'relative', marginTop: '24px', borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    {/* CSS Mock Bar Chart */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '10%', padding: '0 5%' }}>
                        <div style={{ width: '15%', height: '40%', background: 'var(--primary-200)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                            <div style={{ width: '100%', height: '30%', background: 'var(--primary)', position: 'absolute', bottom: 0 }}></div>
                        </div>
                        <div style={{ width: '15%', height: '60%', background: 'var(--primary-200)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                            <div style={{ width: '100%', height: '45%', background: 'var(--primary)', position: 'absolute', bottom: 0 }}></div>
                        </div>
                        <div style={{ width: '15%', height: '80%', background: 'var(--primary-200)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                            <div style={{ width: '100%', height: '20%', background: 'var(--primary)', position: 'absolute', bottom: 0 }}></div>
                        </div>
                        <div style={{ width: '15%', height: '50%', background: 'var(--primary-200)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                            <div style={{ width: '100%', height: '50%', background: 'var(--primary)', position: 'absolute', bottom: 0 }}></div>
                        </div>
                        <div style={{ width: '15%', height: '90%', background: 'var(--primary-200)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                            <div style={{ width: '100%', height: '60%', background: 'var(--primary)', position: 'absolute', bottom: 0 }}></div>
                        </div>
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '24px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><span style={{ color: 'var(--primary-200)' }}>■</span> Job Views</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><span style={{ color: 'var(--primary)' }}>■</span> Applications Submitted</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
