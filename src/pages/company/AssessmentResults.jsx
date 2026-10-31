import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

const AssessmentResults = () => {
  const { id } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assessments/results/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching results', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const safeResults = Array.isArray(results) ? results : [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Assessment Results</h2>
        <button className="btn-secondary" onClick={() => navigate('/company/assessments')}>Back to Assessments</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : safeResults.length === 0 ? (
        <div className="empty-state">
          <p>No candidates have taken this assessment yet.</p>
        </div>
      ) : (
        <div className="results-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Score</th>
                <th>Date Taken</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {safeResults.map(result => (
                <tr key={result.id}>
                  <td>{result.candidateEmail}</td>
                  <td>
                    <span className={`score-badge ${result.score >= 60 ? 'pass' : 'fail'}`}>
                      {result.score}%
                    </span>
                  </td>
                  <td>{new Date(result.createdAt).toLocaleDateString()}</td>
                  <td>
                    {result.details?.wpm && <span>WPM: {result.details.wpm} | Acc: {result.details.accuracy}% </span>}
                    {result.details?.mediaUrl && (
                      <a href={result.details.mediaUrl} target="_blank" rel="noreferrer" className="text-link">View Recording</a>
                    )}
                    {result.details?.code && (
                      <button className="btn-sm" onClick={() => alert(result.details.code)}>View Code</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssessmentResults;
