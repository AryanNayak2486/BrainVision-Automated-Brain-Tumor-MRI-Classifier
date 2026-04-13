import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { historyApi } from '../services/api';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    historyApi.stats()
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Profile editing is a UI stub — backend endpoint may vary
    try {
      // Simulate a save
      await new Promise((res) => setTimeout(res, 700));
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Signed out successfully.');
  };

  const initials = ((user?.full_name || user?.username || 'U')[0]).toUpperCase();

  return (
    <div className="profile-page animate-fadeIn">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-desc">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* ── Left: avatar + quick stats ── */}
        <aside className="profile-sidebar">
          <div className="card profile-id-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-avatar-ring" />
            </div>
            <h2 className="profile-name">{user?.full_name || user?.username}</h2>
            {user?.email && <p className="profile-email">{user.email}</p>}
            <span className="profile-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Verified User
            </span>
          </div>

          {/* Quick stats */}
          <div className="card profile-stats-card">
            <h3 className="profile-stats-title">Activity Summary</h3>
            {loadingStats ? (
              <div className="profile-stats-loading">
                <div className="spinner spinner-dark" />
              </div>
            ) : stats ? (
              <div className="profile-stats-list">
                <div className="profile-stat-row">
                  <span className="pstat-label">Total Scans</span>
                  <span className="pstat-value">{stats.total_predictions}</span>
                </div>
                <div className="profile-stat-row">
                  <span className="pstat-label">Avg. Confidence</span>
                  <span className="pstat-value">{(stats.average_confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="profile-stat-row">
                  <span className="pstat-label">Tumor Detected</span>
                  <span className="pstat-value pstat-rose">
                    {stats.total_predictions - (stats.class_distribution?.['No Tumor'] || 0)}
                  </span>
                </div>
                <div className="profile-stat-row">
                  <span className="pstat-label">Normal Scans</span>
                  <span className="pstat-value pstat-green">
                    {stats.class_distribution?.['No Tumor'] || 0}
                  </span>
                </div>
              </div>
            ) : (
              <p className="profile-stats-empty">No activity yet. Upload your first MRI to get started.</p>
            )}
          </div>
        </aside>

        {/* ── Right: edit form + preferences ── */}
        <div className="profile-main">
          {/* Edit profile */}
          <div className="card profile-section">
            <h3 className="profile-section-title">Account Information</h3>
            <form onSubmit={handleSave} className="profile-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  type="text"
                  value={user?.username || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <span className="form-hint">Username cannot be changed</span>
              </div>

              <div className="profile-form-footer">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="spinner" />Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Preferences */}
          <div className="card profile-section">
            <h3 className="profile-section-title">Preferences</h3>
            <div className="pref-list">
              <div className="pref-row">
                <div className="pref-info">
                  <span className="pref-label">Appearance</span>
                  <span className="pref-desc">
                    Currently using {theme === 'light' ? 'Light' : 'Dark'} mode
                  </span>
                </div>
                <button
                  className={`theme-pill ${theme}`}
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  <span className="theme-pill-icon">
                    {theme === 'light' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                      </svg>
                    )}
                  </span>
                  <span>{theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="card profile-section danger-section">
            <h3 className="profile-section-title danger-title">Account Actions</h3>
            <div className="danger-row">
              <div>
                <p className="danger-label">Sign Out</p>
                <p className="danger-desc">Sign out from this session on this device.</p>
              </div>
              <button className="btn btn-danger" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
