import React, { useState } from 'react';

export default function CodingEnvironment({ token }) {
  const [topic, setTopic] = useState('Algorithms');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  
  const [challenge, setChallenge] = useState(null);
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [code, setCode] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);

  const fetchChallenge = async (e) => {
    e.preventDefault();
    setLoading(true);
    setChallenge(null);
    setReport(null);

    try {
      const res = await fetch('/api/coding/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, difficulty })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch question.');
      
      setChallenge(data);
      setCode(data.starter_code[selectedLang] || '');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    if (challenge?.starter_code?.[lang]) {
      setCode(challenge.starter_code[lang]);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim() || !challenge) return;

    setSubmitting(true);
    setReport(null);

    try {
      const res = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          problemTitle: challenge.title,
          code,
          language: selectedLang
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit solution');
      
      setReport(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Settings bar */}
      <div className="glass-card">
        <form onSubmit={fetchChallenge} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '160px', marginBottom: 0 }}>
            <label className="form-label">Coding Topic</label>
            <select className="form-select" value={topic} onChange={e => setTopic(e.target.value)}>
              <option value="Algorithms">Algorithms & Logic</option>
              <option value="Data Structures">Data Structures</option>
              <option value="Databases">Database Queries</option>
              <option value="System Design">APIs and Routing</option>
            </select>
          </div>
          
          <div className="form-group" style={{ flexGrow: 1, minWidth: '160px', marginBottom: 0 }}>
            <label className="form-label">Difficulty</label>
            <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="Easy">Easy (Foundational)</option>
              <option value="Medium">Medium (Standard)</option>
              <option value="Hard">Hard (Optimal)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '46px' }} disabled={loading}>
            {loading ? 'Fetching...' : '💻 Load Challenge'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="spinner-wrapper" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Compiling coding statements, formatting test structures, and preparing starter loops...</p>
        </div>
      ) : challenge ? (
        <div className="coding-container">
          
          {/* Left panel: challenge description */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-primary">{challenge.topic}</span>
                <span className="badge badge-secondary">{challenge.difficulty}</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '700' }}>
                {challenge.title}
              </h2>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '6px' }}>Problem Statement</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {challenge.problem_statement}
              </p>
            </div>

            {challenge.constraints && (
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>Constraints</h4>
                <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {challenge.constraints.map((c, idx) => <li key={idx}>{c}</li>)}
                </ul>
              </div>
            )}

            {challenge.examples && (
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Examples</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {challenge.examples.map((ex, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', fontSize: '0.8rem' }}>
                      <strong>Example {idx + 1}:</strong>
                      <div style={{ marginTop: '4px', fontFamily: 'monospace', color: 'var(--secondary-light)' }}>Input: {ex.input}</div>
                      <div style={{ fontFamily: 'monospace', color: 'var(--success)' }}>Output: {ex.output}</div>
                      {ex.explanation && <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Explanation: {ex.explanation}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: code editor sandbox */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            
            <div className="code-sandbox-editor">
              <div className="editor-header">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className={`btn ${selectedLang === 'javascript' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleLangChange('javascript')}
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    JS
                  </button>
                  <button 
                    className={`btn ${selectedLang === 'python' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleLangChange('python')}
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    Python
                  </button>
                  <button 
                    className={`btn ${selectedLang === 'cpp' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleLangChange('cpp')}
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    C++
                  </button>
                </div>
                <button 
                  className="btn btn-accent" 
                  onClick={handleSubmitCode}
                  disabled={submitting || !code.trim()}
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  {submitting ? 'Running...' : '⚙️ Evaluate Code'}
                </button>
              </div>

              <textarea 
                className="editor-textarea" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                disabled={submitting}
                spellCheck="false"
              />
            </div>

            {/* Submitting loader / Evaluation reports */}
            {submitting && (
              <div className="glass-card spinner-wrapper" style={{ padding: '20px' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Analyzing logic paths, examining big-O execution scaling bounds, and writing optimizations...</p>
              </div>
            )}

            {report && (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: '600' }}>Evaluation Report</h4>
                  <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>Score: {report.score}/100</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <strong>Time Complexity:</strong>
                    <div style={{ color: 'var(--secondary-light)', fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '2px' }}>{report.time_complexity}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <strong>Space Complexity:</strong>
                    <div style={{ color: 'var(--accent-light)', fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '2px' }}>{report.space_complexity}</div>
                  </div>
                </div>

                <div>
                  <strong style={{ fontSize: '0.85rem' }}>📋 Review Summary:</strong>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{report.review}</p>
                </div>

                {report.issues_found?.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#fca5a5' }}>⚠️ Issues/Recommendations:</strong>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {report.issues_found.map((issue, idx) => <li key={idx}>{issue}</li>)}
                    </ul>
                  </div>
                )}

                {report.optimized_code && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--success)' }}>💡 Optimized Code Solution:</strong>
                    <pre style={{
                      background: '#0d0e15',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: '#a7f3d0',
                      marginTop: '6px',
                      overflowX: 'auto'
                    }}>
                      {report.optimized_code}
                    </pre>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-secondary)', gap: '12px' }}>
          <span style={{ fontSize: '3rem' }}>💻</span>
          <p>Load a technical coding challenge above to test your skills in the workspace editor.</p>
        </div>
      )}

    </div>
  );
}
