import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const TakeAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Typing test specific
  const [typedText, setTypedText] = useState('');
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Communication specific
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);

  useEffect(() => {
    fetchAssessmentDetails();
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0 && assessment) {
      const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0 && assessment && !submitting) {
      handleSubmit();
    }
  }, [timeLeft, assessment]);

  const fetchAssessmentDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/assessments/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
        setTimeLeft(data.timer * 60);
      } else {
        alert('Assessment not found');
        navigate('/jobseeker/assessments');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setMediaBlobUrl(url);
        setAnswers({ mediaUrl: url }); // Note: Real app needs to upload this blob to a server
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Could not access camera/microphone');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
  };

  const handleTyping = (e, originalText) => {
    const text = e.target.value;
    setTypedText(text);
    
    // Calculate Accuracy
    let correctChars = 0;
    for(let i=0; i < text.length; i++) {
        if(text[i] === originalText[i]) correctChars++;
    }
    const acc = text.length > 0 ? (correctChars / text.length) * 100 : 100;
    setAccuracy(acc.toFixed(2));

    // Calculate WPM (assuming 5 chars per word)
    const timeElapsed = (assessment.timer * 60 - timeLeft) / 60; // in minutes
    if (timeElapsed > 0) {
        const wordsTyped = text.length / 5;
        setWpm(Math.round(wordsTyped / timeElapsed));
    }
    
    setAnswers({ wpm, accuracy: acc });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let calculatedScore = 0;

    // Basic evaluation simulation
    if (assessment.type === 'aptitude') {
      let correct = 0;
      assessment.questions.forEach((q, idx) => {
        if (answers[idx] === q.answer) correct++;
      });
      calculatedScore = (correct / assessment.questions.length) * 100;
    } else if (assessment.type === 'coding') {
      // Mock evaluation: if they wrote code, give 100 (needs real sandbox)
      calculatedScore = answers.code?.length > 10 ? 100 : 0;
    } else if (assessment.type === 'typing') {
      calculatedScore = wpm >= 40 ? 100 : (wpm / 40) * 100; // Mock: 40wpm is 100%
    } else if (assessment.type === 'communication') {
      calculatedScore = mediaBlobUrl ? 100 : 0; // HR will review later
    }

    try {
      const response = await fetch('http://localhost:5000/api/assessments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          assessmentId: id,
          score: calculatedScore,
          details: answers
        })
      });
      
      if (response.ok) {
        alert(`Assessment Submitted! Your Score: ${calculatedScore.toFixed(2)}%`);
        navigate('/jobseeker/assessments');
      }
    } catch (err) {
      alert('Error submitting');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!assessment) return <div>Not Found</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="take-assessment-container">
      <div className="assessment-header-bar">
        <h2>{assessment.title}</h2>
        <div className={`timer ${timeLeft < 60 ? 'danger' : ''}`}>
          Time Left: {formatTime(timeLeft)}
        </div>
      </div>

      <div className="assessment-body">
        {assessment.type === 'aptitude' && (
          <div className="aptitude-test">
            {assessment.questions.map((q, idx) => (
              <div key={q.id} className="question-block">
                <h4>{idx + 1}. {q.question}</h4>
                <div className="options-list">
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} className="option-label">
                      <input 
                        type="radio" 
                        name={`q_${idx}`} 
                        value={opt}
                        onChange={() => setAnswers({...answers, [idx]: opt})}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {assessment.type === 'coding' && (
          <div className="coding-test">
            <div className="problem-statement">
              <h4>Problem Statement:</h4>
              <p>{assessment.questions[0]?.problem}</p>
            </div>
            <div className="editor-container">
              <Editor
                height="500px"
                defaultLanguage={assessment.questions[0]?.language || 'javascript'}
                theme="vs-dark"
                onChange={(val) => setAnswers({ ...answers, code: val })}
              />
            </div>
          </div>
        )}

        {assessment.type === 'communication' && (
          <div className="communication-test">
            <h4>Prompt:</h4>
            <p className="topic-box">{assessment.questions[0]?.topic}</p>
            <div className="recording-controls">
              {!isRecording && !mediaBlobUrl ? (
                <button className="btn-primary" onClick={startRecording}>Start Recording</button>
              ) : isRecording ? (
                <button className="btn-danger" onClick={stopRecording}>Stop Recording</button>
              ) : (
                <div className="preview">
                  <video src={mediaBlobUrl} controls className="video-preview" />
                  <button className="btn-secondary" onClick={() => { setMediaBlobUrl(null); startRecording(); }}>Retake</button>
                </div>
              )}
            </div>
          </div>
        )}

        {assessment.type === 'typing' && (
          <div className="typing-test">
            <div className="text-to-type">
              {assessment.questions[0]?.textToType}
            </div>
            <textarea
              className="typing-input"
              value={typedText}
              onChange={(e) => handleTyping(e, assessment.questions[0]?.textToType)}
              placeholder="Start typing here..."
              onPaste={(e) => e.preventDefault()} // Disable paste
            />
            <div className="typing-stats">
              <span>WPM: {wpm}</span>
              <span>Accuracy: {accuracy}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="assessment-footer">
        <button className="btn-primary submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

export default TakeAssessment;
