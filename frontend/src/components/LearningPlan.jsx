import React, { useState, useEffect } from 'react';

export default function LearningPlan({ token, user }) {
  const [skillsInput, setSkillsInput] = useState('');
  const [level, setLevel] = useState(user?.experience_level || 'Beginner');
  const [loading, setLoading] = useState(false);
  
  const [planId, setPlanId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]); // indices of completed days

  // Interactive Quiz State
  const [activeQuizDay, setActiveQuizDay] = useState(null); // which day's quiz is open
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    // Check if there are pending skills from the gap analyzer
    const pendingSkills = localStorage.getItem('pending_skills_to_learn');
    if (pendingSkills) {
      setSkillsInput(pendingSkills);
      localStorage.removeItem('pending_skills_to_learn');
    }
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
    try {
      const res = await fetch('/api/learning-plan/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setPlanId(data.id);
          setPlan(data.plan);
          setCompletedTasks(data.completed_tasks || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!skillsInput.trim()) return;

    setLoading(true);
    setPlan(null);
    setCompletedTasks([]);

    try {
      const res = await fetch('/api/learning-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skillsToLearn: skillsInput, currentLevel: level })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setPlanId(data.id);
      setPlan(data.plan);
      setCompletedTasks(data.completed_tasks || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (dayIndex) => {
    if (!planId) return;

    // optimistic update
    let updated;
    if (completedTasks.includes(dayIndex)) {
      updated = completedTasks.filter(d => d !== dayIndex);
    } else {
      updated = [...completedTasks, dayIndex];
    }
    setCompletedTasks(updated);

    try {
      await fetch('/api/learning-plan/toggle-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId, dayIndex })
      });
    } catch (err) {
      console.error('Failed to sync progress:', err);
    }
  };

  const handleOpenQuiz = (day) => {
    setActiveQuizDay(day);
    setSelectedOptionIdx(null);
    setQuizSubmitted(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Configuration Header */}
      <div className="glass-card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '16px' }}>
          Schedule Custom Study Plan
        </h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flexGrow: 2, minWidth: '280px', marginBottom: 0 }}>
            <label className="form-label">Skills to Master</label>
            <input 
              type="text" 
              className="form-input" 
              value={skillsInput} 
              onChange={e => setSkillsInput(e.target.value)} 
              placeholder="e.g. Docker containerization, REST API security" 
              required
            />
          </div>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '160px', marginBottom: 0 }}>
            <label className="form-label">Current Proficiency</label>
            <select 
              className="form-select" 
              value={level} 
              onChange={e => setLevel(e.target.value)}
            >
              <option value="Beginner">Beginner (Level 1)</option>
              <option value="Intermediate">Intermediate (Level 2)</option>
              <option value="Advanced">Advanced (Level 3)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '46px' }} disabled={loading || !skillsInput.trim()}>
            {loading ? 'Creating...' : '📅 Generate 7-Day Plan'}
          </button>
        </form>
      </div>

      {/* Main Learning Plan Days Layout */}
      {loading ? (
        <div className="spinner-wrapper" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Designing curriculum modules, detailing study bullet tasks, and drafting interactive quizzes...</p>
        </div>
      ) : plan ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '700' }}>
                {plan.plan_name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                ({completedTasks.length} of {plan.daily_tasks?.length || 7} Days Completed)
              </p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              width: '200px',
              height: '14px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${plan.daily_tasks?.length > 0 ? (completedTasks.length / plan.daily_tasks.length) * 100 : 0}%`,
                background: 'var(--success)',
                transition: 'var(--transition-smooth)'
              }}></div>
            </div>
          </div>

          <div className="learning-grid">
            {plan.daily_tasks?.map(task => {
              const isCompleted = completedTasks.includes(task.day);
              return (
                <div 
                  key={task.day} 
                  className={`glass-card learning-day-card ${isCompleted ? 'completed' : ''}`}
                  style={{ opacity: isCompleted ? 0.8 : 1 }}
                >
                  <div 
                    className={`learning-checkbox ${isCompleted ? 'checked' : ''}`}
                    onClick={() => handleToggleTask(task.day)}
                  >
                    {isCompleted ? '✓' : ''}
                  </div>

                  <div style={{ paddingRight: '32px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Day {task.day}</span>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: '600', marginTop: '8px', marginBottom: '4px' }}>
                      {task.topic}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏰ {task.estimated_minutes} minutes</span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>🎯 Daily Focus:</strong>
                    <ul style={{ paddingLeft: '16px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {task.sub_tasks?.map((sub, idx) => (
                        <li key={idx} style={{ marginBottom: '3px' }}>{sub}</li>
                      ))}
                    </ul>
                  </div>

                  {task.resources && (
                    <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                      <strong style={{ fontSize: '0.85rem' }}>📚 Resource:</strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--primary-light)', marginTop: '4px' }}>
                        🔗 {task.resources[0]}
                      </div>
                    </div>
                  )}

                  {task.quiz && (
                    <button 
                      className="btn btn-secondary btn-full" 
                      style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '12px' }}
                      onClick={() => handleOpenQuiz(task)}
                    >
                      ✏️ Take Self-Check Quiz
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)', gap: '12px' }}>
          <span style={{ fontSize: '3rem' }}>📅</span>
          <p>Generate a daily study plan for targeted technologies to check off your progress.</p>
        </div>
      )}

      {/* Quiz Modal overlay */}
      {activeQuizDay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '550px', padding: '32px' }}>
            <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge badge-primary">Day {activeQuizDay.day} Quiz</span>
              <button 
                onClick={() => setActiveQuizDay(null)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ❌
              </button>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', lineHeight: '1.4' }}>
              {activeQuizDay.quiz.question}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {activeQuizDay.quiz.options?.map((option, idx) => {
                let borderStyle = '1px solid var(--border-color)';
                let backgroundStyle = 'rgba(255, 255, 255, 0.02)';

                if (selectedOptionIdx === idx) {
                  borderStyle = '1px solid var(--primary)';
                  backgroundStyle = 'var(--primary-glow)';
                }

                if (quizSubmitted) {
                  if (idx === activeQuizDay.quiz.answer_index) {
                    borderStyle = '1px solid var(--success)';
                    backgroundStyle = 'var(--success-glow)';
                  } else if (selectedOptionIdx === idx) {
                    borderStyle = '1px solid var(--danger)';
                    backgroundStyle = 'rgba(239, 68, 68, 0.15)';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !quizSubmitted && setSelectedOptionIdx(idx)}
                    disabled={quizSubmitted}
                    style={{
                      border: borderStyle,
                      background: backgroundStyle,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: quizSubmitted ? 'default' : 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '1px solid var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div style={{
                background: selectedOptionIdx === activeQuizDay.quiz.answer_index ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.05)',
                border: '1px solid',
                borderColor: selectedOptionIdx === activeQuizDay.quiz.answer_index ? 'var(--success)' : 'rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                marginBottom: '24px'
              }}>
                <strong>
                  {selectedOptionIdx === activeQuizDay.quiz.answer_index ? '🎉 Correct Answer!' : '❌ Incorrect'}
                </strong>
                <p style={{ marginTop: '6px' }}>{activeQuizDay.quiz.explanation}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveQuizDay(null)}
              >
                Close
              </button>
              {!quizSubmitted ? (
                <button 
                  className="btn btn-primary" 
                  disabled={selectedOptionIdx === null}
                  onClick={() => setQuizSubmitted(true)}
                >
                  Submit Answer
                </button>
              ) : (
                <button 
                  className="btn btn-accent" 
                  onClick={() => {
                    handleToggleTask(activeQuizDay.day);
                    setActiveQuizDay(null);
                  }}
                >
                  Mark Day Complete ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
