import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaPlus, FaLaptopCode, FaCheckCircle, FaClock } from 'react-icons/fa';

const AssessmentsDashboard = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/assessments/company', {
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

  if (!user?.isPremium) {
    return (
      <div className="premium-lock-container">
        <div className="lock-content">
          <FaCheckCircle className="lock-icon" />
          <h2>Premium Feature</h2>
          <p>Assessments are exclusively available for premium employers.</p>
          <button className="upgrade-btn" onClick={() => navigate('/pricing')}>
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Assessment Management</h2>
        <button className="btn-primary" onClick={() => navigate('/company/assessments/create')}>
          <FaPlus /> Create Assessment
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : assessments.length === 0 ? (
        <div className="empty-state">
          <FaLaptopCode className="empty-icon" />
          <h3>No Assessments Created</h3>
          <p>Start evaluating candidates by creating your first test.</p>
        </div>
      ) : (
        <div className="assessment-grid">
          {assessments.map((test) => (
            <div key={test.id} className="assessment-card">
              <div className="card-header">
                <h3>{test.title}</h3>
                <span className={`badge ${test.type}`}>{test.type.toUpperCase()}</span>
              </div>
              <div className="card-body">
                <p><FaClock /> {test.timer} Minutes</p>
                <p>Pass Marks: {test.passingMarks}%</p>
                <p>Status: <span className={`status ${test.status}`}>{test.status}</span></p>
              </div>
              <div className="card-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => navigate(`/company/assessments/${test.id}/results`)}
                >
                  View Results
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentsDashboard;
