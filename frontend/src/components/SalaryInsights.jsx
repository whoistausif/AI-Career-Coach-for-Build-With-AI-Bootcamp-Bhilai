import React, { useState, useEffect } from 'react';

export default function SalaryInsights({ token, user }) {
  const [role, setRole] = useState(user?.target_role || '');
  const [location, setLocation] = useState('United States');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const res = await fetch('/api/salaries/saved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedSearches(saved);
        if (saved.length > 0) {
          setData(saved[0].data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    try {
      const res = await fetch('/api/salaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, location })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to fetch insights.');
      
      setData(resData);
      fetchSavedSearches();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format salary values
  const formatCurrency = (val, curr = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* Search and configuration */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '16px' }}>Compensation Lookup</h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Role Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                placeholder="e.g. Node Developer"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Geographic Region</label>
              <select className="form-select" value={location} onChange={e => setLocation(e.target.value)}>
                <option value="United States">United States (USD)</option>
                <option value="United Kingdom">United Kingdom (GBP)</option>
                <option value="European Union">European Union (EUR)</option>
                <option value="India">India (INR)</option>
                <option value="Remote Global">Remote Global (USD)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !role}>
              {loading ? 'Analyzing rates...' : '💰 Get Salary Ranges'}
            </button>
          </form>
        </div>

        {/* History / Saved searches list */}
        {savedSearches.length > 0 && (
          <div className="glass-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '12px' }}>Recent Searches</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {savedSearches.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setData(item.data);
                    setRole(item.role);
                    setLocation(item.location);
                  }}
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
                  <strong>{item.role}</strong> ({item.location})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Results Graphic */}
      <div className="glass-card">
        {loading ? (
          <div className="spinner-wrapper" style={{ minHeight: '350px' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Gathering regional cost of living indicators, compensation scales, and compiling negotiation advice...</p>
          </div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '700' }}>
                  Compensation Matrix
                </h2>
                <span className="badge badge-secondary" style={{ marginTop: '4px', display: 'inline-block' }}>
                  {data.role} — {data.location}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Market Demand:</span>
                <span className="badge badge-success" style={{ marginLeft: '6px', fontSize: '0.8rem' }}>
                  {data.market_demand || 'High'}
                </span>
              </div>
            </div>

            {/* Pure CSS Visual charts */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>💵 Annual Salary Brackets (Base Salary)</h3>
              <div className="chart-container">
                {/* Entry Level */}
                {data.ranges?.entry && (
                  <div className="chart-bar-row">
                    <div className="chart-bar-labels">
                      <strong>Entry-Level (0-2 yrs)</strong>
                      <span>
                        {formatCurrency(data.ranges.entry.min, data.currency)} - {formatCurrency(data.ranges.entry.max, data.currency)}
                      </span>
                    </div>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill" style={{ width: '45%' }}></div>
                      <div className="chart-bar-value">Median: {formatCurrency(data.ranges.entry.median, data.currency)}</div>
                    </div>
                  </div>
                )}

                {/* Mid Level */}
                {data.ranges?.mid && (
                  <div className="chart-bar-row" style={{ marginTop: '10px' }}>
                    <div className="chart-bar-labels">
                      <strong>Mid-Level (2-5 yrs)</strong>
                      <span>
                        {formatCurrency(data.ranges.mid.min, data.currency)} - {formatCurrency(data.ranges.mid.max, data.currency)}
                      </span>
                    </div>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill" style={{ width: '70%', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}></div>
                      <div className="chart-bar-value">Median: {formatCurrency(data.ranges.mid.median, data.currency)}</div>
                    </div>
                  </div>
                )}

                {/* Senior Level */}
                {data.ranges?.senior && (
                  <div className="chart-bar-row" style={{ marginTop: '10px' }}>
                    <div className="chart-bar-labels">
                      <strong>Senior / Lead (5+ yrs)</strong>
                      <span>
                        {formatCurrency(data.ranges.senior.min, data.currency)} - {formatCurrency(data.ranges.senior.max, data.currency)}
                      </span>
                    </div>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar-fill" style={{ width: '95%', background: 'linear-gradient(90deg, var(--accent), var(--secondary-light))' }}></div>
                      <div className="chart-bar-value">Median: {formatCurrency(data.ranges.senior.median, data.currency)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Standard Benefits list */}
            {data.benefits && (
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>🎁 Standard Perks & Benefits</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {data.benefits.map((b, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                      <span>🔹</span> <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation Tips */}
            {data.negotiation_tips && (
              <div className="glass-card" style={{ background: 'rgba(6, 182, 212, 0.05)', borderColor: 'var(--secondary-glow)' }}>
                <h4 style={{ color: 'var(--secondary-light)', fontSize: '1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🗣️ AI Package Negotiation Recommendations
                </h4>
                <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {data.negotiation_tips.map((tip, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-secondary)', gap: '12px' }}>
            <span style={{ fontSize: '3rem' }}>💰</span>
            <p>Specify a role title on the left to verify compensation percentiles.</p>
          </div>
        )}
      </div>

    </div>
  );
}
