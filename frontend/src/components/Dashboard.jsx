import React, { useState, useEffect } from 'react';

export default function Dashboard({ token, user, setTab }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile settings editor
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempRole, setTempRole] = useState(user?.target_role || '');
  const [tempLevel, setTempLevel] = useState(user?.experience_level || 'Beginner');
  const [tempName, setTempName] = useState(user?.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    fetchDashboardSummary();
  }, [user]);

  const fetchDashboardSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: tempName,
          target_role: tempRole,
          experience_level: tempLevel
        })
      });
      if (res.ok) {
        // Simple hack: reload page or let parent component trigger a profile update check
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
      setEditingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{
        padding: '32px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%), var(--bg-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800' }}>
            Hello, {user?.full_name || 'Innovator'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
            Welcome back to your Career Success Center. Customize your target path, examine resume compatibility, or run simulated coding and interview trials to speed up your job search.
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => {
            setTempName(user?.full_name || '');
            setTempRole(user?.target_role || '');
            setTempLevel(user?.experience_level || 'Beginner');
            setEditingProfile(true);
          }}>
            ⚙️ Edit Career Profile
          </button>
        </div>
      </div>

      {/* Editing Profile Modal overlay */}
      {editingProfile && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '20px' }}>
              Edit Career Target Profile
            </h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={tempName} 
                  onChange={e => setTempName(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Career Role</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={tempRole} 
                  onChange={e => setTempRole(e.target.value)} 
                  placeholder="e.g. Backend Engineer"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select 
                  className="form-select" 
                  value={tempLevel} 
                  onChange={e => setTempLevel(e.target.value)}
                >
                  <option value="Beginner">Beginner (0-1 yrs)</option>
                  <option value="Junior">Junior (1-3 yrs)</option>
                  <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                  <option value="Senior">Senior (5+ yrs)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProfile(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metrics Card Grid */}
      <div className="dashboard-grid">
        {/* Metric 1: Resume Score */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper icon-purple">📄</div>
          <div className="metric-content">
            <span className="metric-label">Latest Resume Score</span>
            <span className="metric-value">
              {summary?.resumeScore !== null ? `${summary.resumeScore}/100` : 'N/A'}
            </span>
            <button 
              onClick={() => setTab('resume')}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary-light)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', marginTop: '4px', textDecoration: 'underline' }}
            >
              {summary?.resumeScore !== null ? 'Analyze Again' : 'Upload Resume'}
            </button>
          </div>
        </div>

        {/* Metric 2: Roadmap Target */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper icon-blue">🗺️</div>
          <div className="metric-content">
            <span className="metric-label">Active Career Path</span>
            <span className="metric-value" style={{ fontSize: '1.2rem', fontWeight: '600', marginTop: '8px' }}>
              {summary?.activeRoadmap ? summary.activeRoadmap.role : 'No Roadmap Set'}
            </span>
            <button 
              onClick={() => setTab('roadmap')}
              style={{ background: 'transparent', border: 'none', color: 'var(--secondary-light)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', marginTop: '4px', textDecoration: 'underline' }}
            >
              {summary?.activeRoadmap ? 'View Roadmap' : 'Generate Roadmap'}
            </button>
          </div>
        </div>

        {/* Metric 3: Learning Plan Progress */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper icon-green">📅</div>
          <div className="metric-content">
            <span className="metric-label">Learning Plan Tasks</span>
            <span className="metric-value">
              {summary?.learningProgress 
                ? `${summary.learningProgress.completed}/${summary.learningProgress.total}`
                : '0/0'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ({summary?.learningProgress ? summary.learningProgress.percentage : 0}% Complete)
            </span>
            <button 
              onClick={() => setTab('learning')}
              style={{ background: 'transparent', border: 'none', color: 'var(--success)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', marginTop: '4px', textDecoration: 'underline' }}
            >
              Go to Study Plan
            </button>
          </div>
        </div>

        {/* Metric 4: Interview score */}
        <div className="glass-card metric-card">
          <div className="metric-icon-wrapper icon-purple" style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-light)' }}>🎙️</div>
          <div className="metric-content">
            <span className="metric-label">Mock Interviews Run</span>
            <span className="metric-value">{summary?.interviewCount || 0}</span>
            {summary?.latestInterview && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Latest: {summary.latestInterview.score}% ({summary.latestInterview.role})
              </span>
            )}
            <button 
              onClick={() => setTab('interview')}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-light)', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', marginTop: '4px', textDecoration: 'underline' }}
            >
              Start New Prep
            </button>
          </div>
        </div>
      </div>

      {/* Shortcuts and Suggestions Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '600' }}>
            Recommended Next Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {summary?.resumeScore === null && (
              <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🎯</div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Upload your resume for optimization</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Get detailed review feedback, structural rewrites, and check compatibility with your target job description.</p>
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '8px' }} onClick={() => setTab('resume')}>Upload File</button>
                </div>
              </div>
            )}

            {summary?.activeRoadmap === null && (
              <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '1.5rem' }}>🗺️</div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Generate a Career Roadmap</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Create a detailed milestone timeline customized to your current skills and target role.</p>
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '8px' }} onClick={() => setTab('roadmap')}>Create Roadmap</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', alignItems: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>🎯</div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Analyze Skills Gaps for a Job Description</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paste a job description to instantly map what you are missing and draft bridging recommendations.</p>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '8px' }} onClick={() => setTab('skills')}>Compare Job Desc</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>💻</div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>Practice Algorithms & Coding</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Evaluate your solution logic, complexity constraints, and compile reviews inside our workspace sandbox.</p>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '8px' }} onClick={() => setTab('coding')}>Solve Problem</button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Career Quote / Quick tips Sidebar */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: '600' }}>
            💡 Quick Advisor Tip
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
            "Recruiters look at bullet points that show Action + Context + Quantified Outcomes. Whenever you write bullet points, ask yourself: 'What tool did I use, why did I do it, and what was the exact percentage or latency impact I achieved?'"
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: '600' }}>
            💬 AI Advisor Helper
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Have a question about standard salary ranges, negotiating a package, or drafting an email to a recruiter?
          </p>
          <button className="btn btn-accent btn-full" style={{ fontSize: '0.85rem' }} onClick={() => setTab('chat')}>
            💬 Ask AI Coach
          </button>
        </div>
      </div>
    </div>
  );
}
