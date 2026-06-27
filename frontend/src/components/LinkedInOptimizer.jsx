import React, { useState } from 'react';

export default function LinkedInOptimizer({ token, user }) {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedHeadline, setCopiedHeadline] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleOptimize = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || !targetRole.trim()) return;

    setLoading(true);
    setResult(null);
    setCopiedHeadline(null);
    setCopiedSummary(false);

    try {
      const res = await fetch('/api/linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText, targetRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to optimize profile.');
      setResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyHeadline = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedHeadline(idx);
    setTimeout(() => setCopiedHeadline(null), 1500);
  };

  const copySummary = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.about_summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 1500);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Settings Form */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '16px' }}>LinkedIn Optimization</h3>
        <form onSubmit={handleOptimize} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Target Role</label>
            <input 
              type="text" 
              className="form-input" 
              value={targetRole} 
              onChange={e => setTargetRole(e.target.value)} 
              placeholder="e.g. Senior Frontend Engineer"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resume Details</label>
            <textarea 
              className="form-textarea" 
              placeholder="Paste your resume milestones or professional experience..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !resumeText.trim()}>
            {loading ? 'Optimizing Profile...' : '💼 Optimize LinkedIn'}
          </button>
        </form>
      </div>

      {/* Results Display */}
      <div className="glass-card">
        {loading ? (
          <div className="spinner-wrapper" style={{ minHeight: '350px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Drafting high-conversion headlines, formatting keywords, and writing profile summaries...</p>
          </div>
        ) : result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Headlines list */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '12px', color: 'var(--primary-light)' }}>
                💡 Suggested headlines (Click to copy)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.headlines?.map((h, idx) => (
                  <div 
                    key={idx}
                    onClick={() => copyHeadline(h, idx)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <span>{h}</span>
                    <span style={{ fontSize: '0.75rem', color: copiedHeadline === idx ? 'var(--success)' : 'var(--text-muted)' }}>
                      {copiedHeadline === idx ? 'Copied! ✅' : 'Copy 📋'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

            {/* 2. About section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--secondary-light)' }}>
                  📄 Optimized "About" Section
                </h4>
                <button className="btn btn-secondary" onClick={copySummary} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                  {copiedSummary ? 'Copied! ✅' : 'Copy Summary 📋'}
                </button>
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {result.about_summary}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

            {/* 3. General Profile Tips */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '10px' }}>
                💡 Social Branding Checklist
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {result.profile_tips?.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{tip}</li>
                ))}
              </ul>
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-secondary)', gap: '12px' }}>
            <span style={{ fontSize: '3rem' }}>💼</span>
            <p>Optimize your LinkedIn hooks and searchability score by supplying details on the left.</p>
          </div>
        )}
      </div>

    </div>
  );
}
