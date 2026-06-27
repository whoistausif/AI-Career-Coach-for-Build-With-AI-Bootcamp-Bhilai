import React, { useState } from 'react';

export default function SkillGapAnalyzer({ token, user, setTab }) {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/skill-gap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText, targetRole, jobDescription })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze gap.');
      setAnalysis(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerLearningPlan = () => {
    if (!analysis) return;
    const missing = analysis.missing_skills?.map(s => s.skill).join(', ');
    // Cache the missing skills in session/localStorage so the learning plan component can read it
    localStorage.setItem('pending_skills_to_learn', missing);
    setTab('learning');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Configuration column */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '16px' }}>Analyze Skill Gaps</h3>
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Target Role</label>
            <input 
              type="text" 
              className="form-input" 
              value={targetRole} 
              onChange={e => setTargetRole(e.target.value)} 
              placeholder="e.g. Fullstack Developer"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Your Resume Text</label>
            <textarea 
              className="form-textarea" 
              placeholder="Paste your resume details or active accomplishments..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Job Description</label>
            <textarea 
              className="form-textarea" 
              placeholder="Paste the recruiter's job description here..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !resumeText.trim() || !jobDescription.trim()}>
            {loading ? 'Comparing Skills...' : '🎯 Run Gap Analysis'}
          </button>
        </form>
      </div>

      {/* Results Display */}
      <div className="glass-card">
        {loading ? (
          <div className="spinner-wrapper" style={{ minHeight: '350px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Comparing resume competencies, mapping target requirements, and scoring skill-match margins...</p>
          </div>
        ) : analysis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Compatibility summary card */}
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              borderBottom: '1px solid var(--border-color)', 
              paddingBottom: '20px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '700' }}>
                  Skill Matching Matrix
                </h3>
                <span className="badge badge-secondary" style={{ marginTop: '4px', display: 'inline-block' }}>
                  Target Role: {targetRole}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Role Fit Ratio:</span>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  fontWeight: '800',
                  boxShadow: '0 0 15px var(--secondary-glow)'
                }}>
                  {analysis.match_percentage}%
                </div>
              </div>
            </div>

            {/* Matching Skills */}
            <div>
              <h4 style={{ color: 'var(--success)', marginBottom: '10px', fontSize: '0.95rem' }}>
                ✅ Matching Skills ({analysis.matching_skills?.length || 0})
              </h4>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {analysis.matching_skills?.map((sk, idx) => (
                  <span key={idx} className="badge badge-success" style={{ fontSize: '0.75rem' }}>{sk}</span>
                ))}
              </div>
            </div>

            {/* Missing Skills and priorities */}
            <div>
              <h4 style={{ color: 'var(--warning)', marginBottom: '12px', fontSize: '0.95rem' }}>
                ⚠️ Missing Skills ({analysis.missing_skills?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analysis.missing_skills?.map((item, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.skill}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.description}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge" style={{
                        background: item.priority === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: item.priority === 'Critical' ? '#fca5a5' : '#fcd34d',
                        fontSize: '0.7rem'
                      }}>
                        {item.priority}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        Diff: {item.learning_difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>💡 Skill Bridging Strategy</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {analysis.bridging_recommendations?.map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Trigger learning schedule button */}
            {analysis.missing_skills?.length > 0 && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid var(--border-glow)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                  <strong>Take action now:</strong> Generate a customized 7-day study curriculum covering these missing skills.
                </div>
                <button className="btn btn-accent" onClick={handleTriggerLearningPlan} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  📅 Create Learning Plan
                </button>
              </div>
            )}

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-secondary)', gap: '12px' }}>
            <span style={{ fontSize: '3rem' }}>🎯</span>
            <p>Analyze how well your current resume maps to any target recruiter requirements.</p>
          </div>
        )}
      </div>

    </div>
  );
}
