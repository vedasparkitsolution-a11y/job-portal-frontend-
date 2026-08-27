import { useState } from 'react';
import CompanyHeader from './CompanyHeader';
import CompanySidebar from './CompanySidebar';
import { ToastProvider } from '../Toast';
import './CompanyLayout.css';

export default function CompanyLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <ToastProvider>
            <div className="company-layout">
                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <div 
                        className="company-dashboard-backdrop d-lg-none" 
                        onClick={closeSidebar}
                        style={{ display: 'none' }}
                    />
                )}

                <div className={`company-sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
                    <CompanySidebar onClose={closeSidebar} />
                </div>

                <div className="company-main">
                    <CompanyHeader toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
                    <main className="company-content">
                        {children}
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
