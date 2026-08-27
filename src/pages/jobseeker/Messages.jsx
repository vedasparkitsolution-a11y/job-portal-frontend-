import CandidateSidebar from '../../components/CandidateSidebar';
import { FiMessageSquare, FiInbox } from 'react-icons/fi';

export default function Messages() {
    return (
        <CandidateSidebar>
            <div className="dashboard-header">
                <h1>Messages</h1>
                <p>Your inbox and conversations</p>
            </div>

            <div className="profile-card">
                <div className="empty-state">
                    <FiInbox style={{ fontSize: '3rem' }} />
                    <h3>No messages yet</h3>
                    <p>When employers contact you or respond to your applications, messages will appear here.</p>
                </div>
            </div>
        </CandidateSidebar>
    );
}
