import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadResume } from '../../services/storageService';
import { updateUserProfile } from '../../services/userService';
import CandidateSidebar from '../../components/CandidateSidebar';
import { FiUpload, FiFile, FiTrash2, FiCheckCircle } from 'react-icons/fi';

export default function ResumeUpload() {
    const { currentUser, userData, fetchUserData } = useAuth();
    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    async function handleUpload(e) {
        e.preventDefault();
        if (!resume) return;
        setLoading(true);
        setMessage('');

        try {
            const url = await uploadResume(resume, currentUser.uid);
            await updateUserProfile(currentUser.uid, { resumeURL: url });
            await fetchUserData(currentUser.uid);
            setMessage('Resume uploaded successfully!');
            setResume(null);
        } catch (err) {
            setMessage('Failed to upload resume. Please try again.');
        }
        setLoading(false);
    }

    async function handleDelete() {
        setLoading(true);
        try {
            await updateUserProfile(currentUser.uid, { resumeURL: '' });
            await fetchUserData(currentUser.uid);
            setMessage('Resume removed successfully.');
        } catch (err) {
            setMessage('Failed to remove resume.');
        }
        setLoading(false);
    }

    return (
        <CandidateSidebar>
            <div className="dashboard-header">
                <h1>Resume Upload</h1>
                <p>Upload and manage your resume</p>
            </div>

            {message && (
                <div className={message.includes('success') ? 'success-message' : 'error-message'}>
                    {message}
                </div>
            )}

            <div className="profile-card">
                {userData?.resumeURL ? (
                    <div className="resume-current">
                        <div className="resume-file-info">
                            <FiFile className="resume-icon" />
                            <div>
                                <h3>Current Resume</h3>
                                <p>Your resume is on file and visible to employers</p>
                            </div>
                            <FiCheckCircle style={{ color: 'var(--success)', fontSize: '1.3rem' }} />
                        </div>
                        <div className="resume-actions">
                            <a href={userData.resumeURL} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                                View Resume
                            </a>
                            <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={loading}>
                                <FiTrash2 /> Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="resume-empty">
                        <FiUpload style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '12px' }} />
                        <h3>No resume uploaded</h3>
                        <p>Upload your resume so employers can discover your profile</p>
                    </div>
                )}

                <form onSubmit={handleUpload} style={{ marginTop: '24px' }}>
                    <div className="form-group">
                        <label><FiUpload /> Upload New Resume (PDF, DOC, DOCX)</label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={e => setResume(e.target.files[0])}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading || !resume}>
                        <FiUpload /> {loading ? 'Uploading...' : 'Upload Resume'}
                    </button>
                </form>
            </div>
        </CandidateSidebar>
    );
}
