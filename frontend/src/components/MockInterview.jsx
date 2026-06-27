import React, { useState, useEffect } from 'react';

export default function MockInterview({ token, user }) {
  const [role, setRole] = useState(user?.target_role || '');
  const [type, setType] = useState('Technical');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState('config'); // 'config', 'interview', 'summary'
  
  // Active Interview state
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [dialogue, setDialogue] = useState([]); // Array of { role: 'ai'|'user', text, feedback: {} }
  const [stepLoading, setStepLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Summary state
  const [scores, setScores] = useState([]);
  const [finalFeedback, setFinalFeedback] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [pastInterviews, setPastInterviews] = useState([]);

  useEffect(() => {
    fetchPastInterviews();
  }, []);

  // Text-To-Speech function
  const speakText = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a standard English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  };

  const fetchPastInterviews = async () => {
    try {
      const res = await fetch('/api/interview/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPastInterviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start interview');
      
      setQuestions(data.questions);
      setCurrentIdx(0);
      setDialogue([{ role: 'ai', text: data.questions[0].question }]);
      setActiveStep('interview');
      // Speak the first question
      setTimeout(() => speakText(data.questions[0].question), 500);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!userResponse.trim()) return;

    setStepLoading(true);
    const questionText = questions[currentIdx].question;

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: questionText, response: userResponse })
      });
      const evaluation = await res.json();
      if (!res.ok) throw new Error(evaluation.error || 'Failed to evaluate answer');

      // Append user response and feedback
      const updatedDialogue = [
        ...dialogue,
        { role: 'user', text: userResponse, feedback: evaluation }
      ];
      setDialogue(updatedDialogue);
      setScores([...scores, evaluation.score]);
      setUserResponse('');

      // Advance or finish
      if (currentIdx + 1 < questions.length) {
        const nextQ = questions[currentIdx + 1].question;
        setCurrentIdx(currentIdx + 1);
        setDialogue([...updatedDialogue, { role: 'ai', text: nextQ }]);
        setTimeout(() => speakText(nextQ), 500);
      } else {
        // Compute final scores
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / questions.length || evaluation.score);
        setFinalScore(avgScore);
        
        // Form final feedback message
        const summaryText = `Completed a ${type} interview for the role of ${role}. Out of 5 questions, your average score was ${avgScore}%.`;
        setFinalFeedback(summaryText);
        setActiveStep('summary');

        // Auto save to database history
        await saveInterviewResult(avgScore, summaryText, updatedDialogue);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setStepLoading(false);
    }
  };

  const saveInterviewResult = async (score, feedbackText, dialogueHistory) => {
    try {
      await fetch('/api/interview/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role,
          score,
          feedback: feedbackText,
          dialogue: dialogueHistory
        })
      });
      fetchPastInterviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Sidebar: Config or past sessions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {activeStep === 'config' ? (
          <div className="glass-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '16px' }}>Interview Setup</h3>
            <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={role} 
                  onChange={e => setRole(e.target.value)} 
                  placeholder="e.g. Frontend Engineer"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Interview Category</label>
                <select 
                  className="form-select" 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                >
                  <option value="Technical">Technical Competency</option>
                  <option value="Behavioral">Behavioral (STAR Method)</option>
                  <option value="General">General / Mock Screening</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <input 
                  type="checkbox" 
                  id="tts-toggle" 
                  checked={speechEnabled} 
                  onChange={e => setSpeechEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="tts-toggle" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Enable Voice Output (TTS)
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading || !role}>
                {loading ? 'Setting up stage...' : '🎙️ Start Interview'}
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-card">
            <button className="btn btn-secondary btn-full" onClick={() => setActiveStep('config')}>
              ⚙️ Reset & Restart
            </button>
          </div>
        )}

        {/* History of sessions */}
        {pastInterviews.length > 0 && (
          <div className="glass-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '12px' }}>Previous Scorecards</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {pastInterviews.map(item => (
                <div key={item.id} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.82rem', display: 'block' }}>{item.role}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                    {item.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Interview Panel */}
      <div className="glass-card">
        {loading ? (
          <div className="spinner-wrapper" style={{ minHeight: '350px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Formulating behavioral benchmarks and compiling interview questions...</p>
          </div>
        ) : activeStep === 'interview' ? (
          <div className="interview-screen">
            
            {/* Pulsing Avatar graphic */}
            <div className="avatar-pulse-container">
              <div className="pulse-avatar" style={{ animationPlayState: stepLoading ? 'paused' : 'running' }}>
                👤
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                {stepLoading ? 'Evaluating Response...' : 'Active Interviewer'}
              </span>
            </div>

            {/* Q&A chat progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Progress Tracker</span>
              <span>Question {currentIdx + 1} of {questions.length}</span>
            </div>

            {/* Conversation list */}
            <div className="interview-transcript">
              {dialogue.map((bubble, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div className={`speech-bubble ${bubble.role}`}>
                    {bubble.text}
                  </div>
                  
                  {/* Feedback overlay under user answers */}
                  {bubble.feedback && (
                    <div style={{
                      margin: '10px 0 10px auto',
                      width: '75%',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ color: 'var(--primary-light)' }}>Advisor Scoring:</strong>
                        <span className="badge badge-success">{bubble.feedback.score}%</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }}>{bubble.feedback.feedback_summary}</p>
                      {bubble.feedback.revised_better_version && (
                        <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                          <span style={{ color: 'var(--secondary-light)', fontSize: '0.8rem' }}>Suggested Answer:</span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                            "{bubble.feedback.revised_better_version}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {stepLoading && (
                <div className="speech-bubble ai" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  Analyzing answer structure...
                </div>
              )}
            </div>

            {/* Input field */}
            <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <textarea 
                  className="form-textarea"
                  value={userResponse}
                  onChange={e => setUserResponse(e.target.value)}
                  placeholder="Type your response here... (Be specific. Answer using STAR framework if behavioral)."
                  disabled={stepLoading}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => speakText(questions[currentIdx]?.question)}
                >
                  🔊 Repeat Question
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={stepLoading || !userResponse.trim()}
                >
                  {stepLoading ? 'Analyzing...' : 'Submit Answer & Next'}
                </button>
              </div>
            </form>

          </div>
        ) : activeStep === 'summary' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>🏆</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginTop: '10px' }}>
                Interview Complete
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                Feedback summary and scorecards compiled.
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                fontSize: '2rem',
                fontWeight: '800',
                margin: '20px 0',
                boxShadow: '0 0 25px var(--primary-glow)'
              }}>
                {finalScore}%
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>📋 Interviewer Report Summary</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {finalFeedback}
              </p>
            </div>

            <div style={{ display: 'flex', justifySelf: 'center', justifyContent: 'center', marginTop: '10px' }}>
              <button className="btn btn-primary" onClick={() => setActiveStep('config')}>
                Prepare for Another Session
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-secondary)', gap: '12px' }}>
            <span style={{ fontSize: '3rem' }}>🎙️</span>
            <p>Setup your role on the left to start a real-time mock evaluation screen.</p>
          </div>
        )}
      </div>

    </div>
  );
}
