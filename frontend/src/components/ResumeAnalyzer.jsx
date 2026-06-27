import React, { useState, useEffect } from 'react';

export default function ResumeAnalyzer({ token, user }) {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/resume/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0) {
          setReport(data[0].analysis);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !resumeText.trim()) return;

    setLoading(true);
    const formData = new FormData();
    if (file) {
      formData.append('resume', file);
    } else {
      formData.append('resumeText', resumeText);
    }
    formData.append('targetRole', targetRole);

    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze resume.');
      setReport(data.analysis);
      setFile(null);
      setResumeText('');
      fetchHistory();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Upload Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '16px' }}>Upload Resume</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Target Role</label>
              <input 
                type="text" 
                className="form-input" 
                value={targetRole} 
                onChange={e => setTargetRole(e.target.value)} 
                placeholder="e.g. Node.js Developer"
                required
              />
            </div>

            {/* Drag and Drop Zone */}
            <div 
              className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input 
                id="file-input"
                type="file" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                accept=".pdf,.txt"
              />
              <span style={{ fontSize: '2.5rem' }}>📁</span>
              <p className="upload-text">
                {file ? <strong>Selected: {file.name}</strong> : <>Drag & Drop resume here or <span>browse</span></>}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports PDF or TXT (Max 5MB)</span>
            </div>

            <div style={{ textSelf: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>— OR PASTE TEXT —</div>

            <div className="form-group">
              <label className="form-label">Raw Resume Text</label>
              <textarea 
                className="form-textarea" 
                placeholder="Paste resume text here if you don't have a PDF file..."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                disabled={file !== null}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading || (!file && !resumeText.trim())}>
              {loading ? 'Analyzing...' : '📄 Analyze Compatibility'}
            </button>
          </form>
        </div>

        {/* Saved Upload History */}
        {history.length > 0 && (
          <div className="glass-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '12px' }}>Analysis History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => setReport(item.analysis)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{item.file_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>
                    {item.analysis.score}/100
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      <div className="glass-card">
        {loading ? (
          <div className="spinner-wrapper" style={{ minHeight: '350px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Extracting text, running structural scoring checks, and optimizing bullet point expressions...</p>
          </div>
        ) : report ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Header compatibility score */}
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
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700' }}>
                  Resume Feedback Report
                </h2>
                <span className="badge badge-secondary" style={{ marginTop: '6px', display: 'inline-block' }}>
                  Target Role: {report.target_role || targetRole}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Compatibility Rating:</span>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  boxShadow: '0 0 20px var(--primary-glow)'
                }}>
                  {report.score}
                </div>
              </div>
            </div>

            {/* Strengths & Gaps lists */}
            <div className="resume-grid">
              <div>
                <h4 style={{ color: 'var(--success)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ✅ Strengths
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '16px' }}>
                  {report.strengths?.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 style={{ color: 'var(--warning)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⚠️ Gap Areas
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', paddingLeft: '16px' }}>
                  {report.gaps?.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bullet Point Optimizer */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💡 Google X-Y-Z Bullet Point Optimizer
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {report.bullet_improvements?.map((item, idx) => (
                  <div key={idx} className="feedback-item">
                    <div className="comparison-box">
                      <div className="diff-text diff-minus">
                        <strong>Before:</strong> "{item.original}"
                      </div>
                      <div className="diff-text diff-plus">
                        <strong>After:</strong> "{item.revised}"
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                      <strong>Why this works:</strong> {item.impact_reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Compare */}
            <div className="resume-grid">
              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--secondary-light)' }}>🛠️ Skills Found</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {report.skills_found?.map((sk, idx) => (
                    <span key={idx} className="badge badge-success" style={{ fontSize: '0.75rem' }}>{sk}</span>
                  ))}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: '#f87171' }}>❌ Skills Missing</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {report.skills_missing?.map((sk, idx) => (
                    <span key={idx} className="badge badge-secondary" style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}>{sk}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Formatting Tips */}
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '10px' }}>📄 General Formatting & Layout Tips</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {report.formatting_tips?.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{tip}</li>
                ))}
              </ul>
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-secondary)', gap: '12px' }}>
            <span style={{ fontSize: '3rem' }}>📄</span>
            <p>Upload a resume PDF or paste your current profile on the left to review metrics.</p>
          </div>
        )}
      </div>

    </div>
  );
}
