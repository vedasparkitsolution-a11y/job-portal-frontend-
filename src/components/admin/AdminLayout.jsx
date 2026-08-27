import { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { ToastProvider } from '../Toast';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <ToastProvider>
            <div className="admin-layout">
                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <div 
                        className="dashboard-backdrop d-lg-none" 
                        onClick={closeSidebar}
                        style={{ display: 'none' }} // Controlled by CSS media queries or className
                    />
                )}

                <div className={`admin-sidebar-wrapper ${sidebarOpen ? 'open' : 'closed'}`}>
                    <AdminSidebar onClose={closeSidebar} />
                </div>
                
                <div className="admin-main">
                    <AdminHeader toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
                    <main className="admin-content">
                        {children}
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
