import React, { useState, useEffect } from 'react';

export default function RoadmapGenerator({ token, user }) {
  const [role, setRole] = useState(user?.target_role || '');
  const [level, setLevel] = useState(user?.experience_level || 'Beginner');
  const [timeline, setTimeline] = useState('3 Months');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeNode, setActiveNode] = useState(1); // Track which node details are open

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/roadmap/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0) {
          setRoadmap(data[0].roadmap);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, level, timeline })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setRoadmap(data);
      fetchHistory(); // refresh list
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPastRoadmap = (pastRoadmap) => {
    setRoadmap(pastRoadmap);
    setRole(pastRoadmap.role);
    setLevel(pastRoadmap.level);
    setTimeline(pastRoadmap.timeline);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Configuration Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '16px' }}>Configure Path</h3>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Target Role</label>
              <input 
                type="text" 
                className="form-input" 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                placeholder="e.g. Backend Developer"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Current Experience</label>
              <select 
                className="form-select" 
                value={level} 
                onChange={e => setLevel(e.target.value)}
              >
                <option value="Beginner">Beginner (No experience)</option>
                <option value="Junior">Junior (1-2 yrs)</option>
                <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                <option value="Senior">Senior (5+ yrs)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Timeline Target</label>
              <select 
                className="form-select" 
                value={timeline} 
                onChange={e => setTimeline(e.target.value)}
              >
                <option value="1 Month">1 Month Fast-track</option>
                <option value="3 Months">3 Months Standard</option>
                <option value="6 Months">6 Months Comprehensive</option>
                <option value="12 Months">1 Year Deep-dive</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Generating...' : '🗺️ Build Roadmap'}
            </button>
          </form>
        </div>

        {/* History Checklist Card */}
        {history.length > 0 && (
          <div className="glass-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '12px' }}>Your Saved Paths</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => loadPastRoadmap(item.roadmap)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong>{item.role}</strong> ({item.level})
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Roadmap Timeline Display */}
      <div className="glass-card">
        {loading ? (
          <div className="spinner-wrapper" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Mapping milestones, gathering learning modules, and generating your customized career path...</p>
          </div>
        ) : roadmap ? (
          <div>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700' }}>
                  {roadmap.role} Career Roadmap
                </h2>
                <span className="badge badge-primary">{roadmap.level}</span>
                <span className="badge badge-secondary">{roadmap.timeline}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem' }}>
                {roadmap.summary}
              </p>
            </div>

            <div className="roadmap-timeline">
              {roadmap.milestones?.map(node => (
                <div key={node.id} className="roadmap-node">
                  <div className="roadmap-node-dot" style={{ borderColor: activeNode === node.id ? 'var(--secondary)' : 'var(--primary)' }}></div>
                  
                  <div style={{
                    background: activeNode === node.id ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    border: '1px solid',
                    borderColor: activeNode === node.id ? 'var(--border-color)' : 'transparent',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer'
                  }} onClick={() => setActiveNode(node.id)}>
                    
                    <div className="roadmap-node-header">
                      <h4 className="roadmap-node-title" style={{ color: activeNode === node.id ? 'var(--secondary-light)' : 'var(--text-primary)' }}>
                        Milestone {node.id}: {node.title}
                      </h4>
                      <span className="badge badge-success">{node.duration}</span>
                    </div>
                    
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {node.description}
                    </p>

                    {activeNode === node.id && (
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        
                        {/* Skills */}
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>🛠️ Skills to Learn:</strong>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {node.key_skills?.map((sk, idx) => (
                              <span key={idx} className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{sk}</span>
                            ))}
                          </div>
                        </div>

                        {/* Action items */}
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>🚀 Action Items:</strong>
                          <ul style={{ listStyleType: 'circle', paddingLeft: '20px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {node.action_items?.map((item, idx) => (
                              <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Resources */}
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>📚 Curated Resources:</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                            {node.resources?.map((res, idx) => (
                              <a 
                                key={idx} 
                                href={res.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{
                                  fontSize: '0.85rem', 
                                  color: 'var(--primary-light)', 
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                🔗 {res.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({res.type})</span>
                              </a>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)', gap: '12px' }}>
            <span style={{ fontSize: '3rem' }}>🗺️</span>
            <p>Define your target role on the left to map your personalized career milestone track.</p>
          </div>
        )}
      </div>

    </div>
  );
}
