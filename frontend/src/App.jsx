import React, { useState, useEffect } from 'react';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';
import RoadmapGenerator from './components/RoadmapGenerator.jsx';
import ResumeAnalyzer from './components/ResumeAnalyzer.jsx';
import CoverLetterGenerator from './components/CoverLetterGenerator.jsx';
import LinkedInOptimizer from './components/LinkedInOptimizer.jsx';
import SkillGapAnalyzer from './components/SkillGapAnalyzer.jsx';
import LearningPlan from './components/LearningPlan.jsx';
import MockInterview from './components/MockInterview.jsx';
import CodingEnvironment from './components/CodingEnvironment.jsx';
import SalaryInsights from './components/SalaryInsights.jsx';
import ChatAssistant from './components/ChatAssistant.jsx';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync token to API requests and fetch profile
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401) {
        setToken(''); // Reset auth if token expired
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentTab('dashboard');
  };

  if (!token) {
    return <Auth onAuthSuccess={(t, u) => { setToken(t); setUser(u); }} />;
  }

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard token={token} user={user} setTab={setCurrentTab} />;
      case 'roadmap':
        return <RoadmapGenerator token={token} user={user} />;
      case 'resume':
        return <ResumeAnalyzer token={token} user={user} />;
      case 'coverletter':
        return <CoverLetterGenerator token={token} user={user} />;
      case 'linkedin':
        return <LinkedInOptimizer token={token} user={user} />;
      case 'skills':
        return <SkillGapAnalyzer token={token} user={user} setTab={setCurrentTab} />;
      case 'learning':
        return <LearningPlan token={token} user={user} />;
      case 'interview':
        return <MockInterview token={token} user={user} />;
      case 'coding':
        return <CodingEnvironment token={token} user={user} />;
      case 'salaries':
        return <SalaryInsights token={token} user={user} />;
      case 'chat':
        return <ChatAssistant token={token} user={user} />;
      default:
        return <Dashboard token={token} user={user} setTab={setCurrentTab} />;
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'roadmap', label: 'Career Roadmap', icon: '🗺️' },
    { id: 'resume', label: 'Resume Analysis', icon: '📄' },
    { id: 'coverletter', label: 'Cover Letter', icon: '✉️' },
    { id: 'linkedin', label: 'LinkedIn Headline', icon: '💼' },
    { id: 'skills', label: 'Skill Gap Analysis', icon: '🎯' },
    { id: 'learning', label: 'Daily Learning Plan', icon: '📅' },
    { id: 'interview', label: 'Mock Interview', icon: '🎙️' },
    { id: 'coding', label: 'Coding Practice', icon: '💻' },
    { id: 'salaries', label: 'Salary Insights', icon: '💰' },
    { id: 'chat', label: 'AI Coach Chat', icon: '💬' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-text">NextPath AI</span>
          <button 
            style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', display: 'none' }} 
            className="mobile-hamburger" 
            onClick={() => setMobileSidebarOpen(false)}
          >
            ❌
          </button>
        </div>

        <ul className="sidebar-menu">
          {navigationItems.map(item => (
            <li key={item.id}>
              <button
                className={`sidebar-item ${currentTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {user && (
          <div className="sidebar-footer">
            <div className="user-badge">
              <div className="user-avatar">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <span className="user-role">{user.target_role || 'No Target Role'}</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-full" onClick={handleLogout} style={{ fontSize: '0.85rem', padding: '8px' }}>
              🚪 Log Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <button 
            className="mobile-hamburger" 
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            style={{ background: 'transparent', border: 'none' }}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <h2 className="nav-title">
            {navigationItems.find(item => item.id === currentTab)?.label || 'Dashboard'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user?.target_role && (
              <span className="badge badge-primary" style={{ fontSize: '0.8rem' }}>
                🎯 {user.target_role}
              </span>
            )}
          </div>
        </header>

        <main className="content-body">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
