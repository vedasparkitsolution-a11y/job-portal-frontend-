import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CreateAssessment = () => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'aptitude',
    timer: 30,
    passingMarks: 60,
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddQuestion = () => {
    if (formData.type === 'aptitude') {
      setQuestions([...questions, { data: { question: '', options: ['', '', '', ''] }, answer: '' }]);
    } else if (formData.type === 'coding') {
      setQuestions([...questions, { data: { problem: '', expectedOutput: '' }, answer: '', language: 'javascript' }]);
    } else if (formData.type === 'communication') {
      setQuestions([...questions, { data: { topic: '' }, answer: 'N/A' }]);
    } else if (formData.type === 'typing') {
      setQuestions([...questions, { data: { textToType: '' }, answer: 'N/A' }]);
    }
  };

  const updateQuestionData = (index, field, value, isNested = false) => {
    const updated = [...questions];
    if (isNested) {
      updated[index].data[field] = value;
    } else {
      updated[index][field] = value;
    }
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].data.options[optIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/assessments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...formData, questions })
      });
      if (response.ok) {
        alert('Assessment created successfully!');
        navigate('/company/assessments');
      } else {
        const err = await response.json();
        alert('Error: ' + err.message);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container create-assessment">
      <h2>Create New Assessment</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Assessment Title</label>
          <input 
            type="text" 
            required 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})} 
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Test Type</label>
            <select 
              value={formData.type}
              onChange={e => {
                setFormData({...formData, type: e.target.value});
                setQuestions([]); // Reset questions on type change
              }}
            >
              <option value="aptitude">Aptitude (MCQ)</option>
              <option value="coding">Coding Test</option>
              <option value="communication">Communication (Audio/Video)</option>
              <option value="typing">Typing Test</option>
            </select>
          </div>
          <div className="form-group">
            <label>Timer (Minutes)</label>
            <input 
              type="number" 
              required 
              min="1"
              value={formData.timer}
              onChange={e => setFormData({...formData, timer: parseInt(e.target.value)})} 
            />
          </div>
          <div className="form-group">
            <label>Passing Marks (%)</label>
            <input 
              type="number" 
              required 
              min="1" max="100"
              value={formData.passingMarks}
              onChange={e => setFormData({...formData, passingMarks: parseInt(e.target.value)})} 
            />
          </div>
        </div>

        <div className="questions-section">
          <h3>Questions / Prompts</h3>
          {questions.map((q, index) => (
            <div key={index} className="question-card">
              <h4>Question {index + 1}</h4>
              
              {formData.type === 'aptitude' && (
                <>
                  <input 
                    type="text" 
                    placeholder="Enter question" 
                    value={q.data.question}
                    onChange={e => updateQuestionData(index, 'question', e.target.value, true)}
                    required
                  />
                  <div className="options-grid">
                    {q.data.options.map((opt, oIdx) => (
                      <input 
                        key={oIdx} 
                        type="text" 
                        placeholder={`Option ${oIdx + 1}`} 
                        value={opt}
                        onChange={e => handleOptionChange(index, oIdx, e.target.value)}
                        required
                      />
                    ))}
                  </div>
                  <select 
                    value={q.answer} 
                    onChange={e => updateQuestionData(index, 'answer', e.target.value)}
                    required
                  >
                    <option value="">Select Correct Answer</option>
                    {q.data.options.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>{opt || `Option ${oIdx + 1}`}</option>
                    ))}
                  </select>
                </>
              )}

              {formData.type === 'coding' && (
                <>
                  <textarea 
                    placeholder="Problem Statement"
                    value={q.data.problem}
                    onChange={e => updateQuestionData(index, 'problem', e.target.value, true)}
                    required
                  />
                  <select 
                    value={q.language}
                    onChange={e => updateQuestionData(index, 'language', e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Expected Output (for auto-eval)"
                    value={q.data.expectedOutput}
                    onChange={e => updateQuestionData(index, 'expectedOutput', e.target.value, true)}
                  />
                </>
              )}

              {formData.type === 'communication' && (
                <textarea 
                  placeholder="Topic or prompt for the candidate to record audio/video"
                  value={q.data.topic}
                  onChange={e => updateQuestionData(index, 'topic', e.target.value, true)}
                  required
                />
              )}

              {formData.type === 'typing' && (
                <textarea 
                  placeholder="Text snippet for typing test"
                  value={q.data.textToType}
                  onChange={e => updateQuestionData(index, 'textToType', e.target.value, true)}
                  required
                />
              )}

              <button type="button" className="btn-danger btn-sm" onClick={() => {
                const updated = questions.filter((_, i) => i !== index);
                setQuestions(updated);
              }}>Remove</button>
            </div>
          ))}
          
          <button type="button" className="btn-secondary" onClick={handleAddQuestion}>
            + Add {formData.type === 'aptitude' ? 'Question' : 'Prompt'}
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || questions.length === 0}>
          {loading ? 'Creating...' : 'Create Assessment'}
        </button>
      </form>
    </div>
  );
};

export default CreateAssessment;
