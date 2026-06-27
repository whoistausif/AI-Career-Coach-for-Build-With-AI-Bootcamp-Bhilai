import React, { useState } from 'react';

export default function CoverLetterGenerator({ token }) {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) return;

    setLoading(true);
    setLetter(null);
    setCopied(false);

    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText, jobDescription, tone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setLetter(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!letter) return;
    navigator.clipboard.writeText(letter.full_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Form Card */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '16px' }}>Generate Tailored Letter</h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Your Resume Details</label>
            <textarea 
              className="form-textarea" 
              placeholder="Paste your resume accomplishments or text details here..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Description</label>
            <textarea 
              className="form-textarea" 
              placeholder="Paste the target job description here..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cover Letter Tone</label>
            <select 
              className="form-select" 
              value={tone} 
              onChange={e => setTone(e.target.value)}
            >
              <option value="Professional">Professional & Direct</option>
              <option value="Enthusiastic">Enthusiastic & Driven</option>
              <option value="Creative">Creative & Story-focused</option>
              <option value="Executive">Executive Leadership</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !resumeText.trim() || !jobDescription.trim()}>
            {loading ? 'Crafting Letter...' : '✉️ Generate Cover Letter'}
          </button>
        </form>
      </div>

      {/* Result Display */}
      <div className="glass-card">
        {loading ? (
          <div className="spinner-wrapper" style={{ minHeight: '350px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing requirements, mapping achievements, and writing your customized application letter...</p>
          </div>
        ) : letter ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: '600' }}>Your Cover Letter</h4>
              <button className={`btn ${copied ? 'btn-accent' : 'btn-secondary'}`} onClick={handleCopy} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                {copied ? '✅ Copied!' : '📋 Copy Letter'}
              </button>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.15)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '24px',
              fontFamily: 'Georgia, serif',
              fontSize: '1rem',
              color: '#d1d5db',
              whiteSpace: 'pre-wrap',
              maxHeight: '550px',
              overflowY: 'auto',
              lineHeight: '1.6'
            }}>
              <strong>Subject:</strong> {letter.subject}
              <br /><br />
              {letter.salutation}
              <br /><br />
              {letter.body_paragraphs?.map((para, idx) => (
                <p key={idx} style={{ marginBottom: '16px' }}>{para}</p>
              ))}
              <br />
              {letter.sign_off}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-secondary)', gap: '12px' }}>
            <span style={{ fontSize: '3rem' }}>✉️</span>
            <p>Fill out the job specifications on the left to write a personalized cover letter.</p>
          </div>
        )}
      </div>

    </div>
  );
}
