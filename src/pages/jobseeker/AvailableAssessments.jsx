import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaLaptopCode, FaClock } from 'react-icons/fa';
import CandidateSidebar from '../../components/CandidateSidebar';

const AvailableAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableAssessments();
  }, []);

  const fetchAvailableAssessments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/assessments/available', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error('Error fetching assessments', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CandidateSidebar>
      <div className="dashboard-container">
        <div className="dashboard-header" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Available Assessments</h2>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Take tests from premium companies to boost your profile.</p>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading assessments...</div>
        ) : assessments.length === 0 ? (
          <div className="empty-state" style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <FaLaptopCode size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 4px', color: '#1e293b' }}>No Assessments Available</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Companies haven't posted any open assessment tests for your profile yet.</p>
          </div>
        ) : (
          <div className="assessments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {assessments.map((test) => (
              <div key={test.id} className="assessment-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{test.title}</h3>
                  <span className={`badge ${test.type}`} style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, background: '#f0f9ff', color: '#0284c7' }}>
                    {test.type?.toUpperCase()}
                  </span>
                </div>
                <div className="card-body" style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <p style={{ margin: 0 }}><strong>Company:</strong> {test.companyName}</p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><FaClock /> {test.timer} Minutes</p>
                  <p style={{ margin: 0 }}>Pass Marks: {test.passingMarks}%</p>
                </div>
                <div className="card-footer">
                  <button 
                    className="btn-primary"
                    onClick={() => navigate(`/jobseeker/assessments/take/${test.id}`)}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#0ea5e9', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Take Test Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CandidateSidebar>
  );
};

export default AvailableAssessments;
