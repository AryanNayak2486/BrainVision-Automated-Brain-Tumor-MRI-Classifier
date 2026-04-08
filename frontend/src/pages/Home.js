import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Home.css';

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h5"/><path d="M17 12h5"/><circle cx="12" cy="12" r="5"/>
        <path d="M12 2v5"/><path d="M12 17v5"/>
      </svg>
    ),
    title: 'InceptionV3 AI Model',
    desc: 'State-of-the-art deep learning model achieving 97.12% accuracy on the Kaggle Brain Tumor MRI dataset.',
    accent: '#6c63ff',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    title: 'Drag & Drop Upload',
    desc: 'Simply drag your MRI image or click to browse. Supports JPEG, PNG, BMP, TIFF up to 10 MB.',
    accent: '#00d4b8',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Confidence Visualization',
    desc: 'See probability scores across all four tumor classes with interactive confidence bars.',
    accent: '#ffb347',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Analysis History',
    desc: 'Full history of every scan with search, filtering by class, and pagination. Never lose a result.',
    accent: '#ff4d6d',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'PDF Report Export',
    desc: 'Download a professional PDF report for each scan — ready to share with medical specialists.',
    accent: '#34d399',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    title: 'Analytics Dashboard',
    desc: 'Interactive pie and bar charts showing classification distribution and confidence trends.',
    accent: '#8b83ff',
  },
];

const TUMOR_CLASSES = [
  { name: 'Glioma', color: '#ff4d6d', desc: 'Arises from glial cells; varies in malignancy grade' },
  { name: 'Meningioma', color: '#ffb347', desc: 'Typically slow-growing, often benign meningeal tumor' },
  { name: 'Pituitary', color: '#6c63ff', desc: 'Forms in the pituitary gland; can affect hormones' },
  { name: 'No Tumor', color: '#34d399', desc: 'Normal brain tissue; no tumor detected in scan' },
];

export default function HomePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="home-page" data-theme={theme}>
      {/* ── Top Nav ── */}
      <header className="home-nav">
        <div className="home-nav-inner">
          <div className="home-brand">
            <div className="home-logo">
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="url(#hn1)" strokeWidth="2.5"/>
                <path d="M10 16 Q16 8 22 16 Q16 24 10 16Z" fill="url(#hn1)" opacity="0.9"/>
                <circle cx="16" cy="16" r="3" fill="white"/>
                <defs>
                  <linearGradient id="hn1" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#6c63ff"/>
                    <stop offset="100%" stopColor="#00d4b8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="home-brand-name">BrainVision</span>
          </div>

          <div className="home-nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm home-login-btn">Sign In</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-blob b1" />
          <div className="hero-blob b2" />
          <div className="hero-grid" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            InceptionV3 · 97.12% Accuracy
          </div>

          <h1 className="hero-title">
            AI-Powered
            <span className="hero-gradient"> Brain Tumor </span>
            MRI Classification
          </h1>

          <p className="hero-desc">
            Upload any brain MRI scan and receive an instant, detailed classification across four tumor types
            — Glioma, Meningioma, Pituitary, and No Tumor — with confidence scores and medical context.
          </p>

          <div className="hero-actions">
            {user ? (
              <Link to="/predict" className="btn btn-primary btn-lg hero-cta">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M2 12h5"/><path d="M17 12h5"/><circle cx="12" cy="12" r="5"/>
                  <path d="M12 2v5"/><path d="M12 17v5"/>
                </svg>
                Analyze MRI Now
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary btn-lg hero-cta">
                  Start for Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">97.12%</span>
              <span className="hero-stat-label">Model Accuracy</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">4</span>
              <span className="hero-stat-label">Tumor Classes</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">{'<'}2s</span>
              <span className="hero-stat-label">Inference Time</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="brain-card">
            <div className="brain-card-header">
              <div className="brain-dots">
                <span /><span /><span />
              </div>
              <span className="brain-card-title">Analysis Result</span>
            </div>
            <div className="brain-card-body">
              <div className="brain-result-label">Classification</div>
              <div className="brain-result-class">Glioma</div>
              <div className="brain-result-conf">
                <span className="brain-conf-pct" style={{ color: '#ff4d6d' }}>94.7%</span>
                <span className="brain-conf-label">confidence</span>
              </div>
              <div className="brain-bars">
                {[
                  { cls: 'Glioma', pct: 94.7, color: '#ff4d6d' },
                  { cls: 'Meningioma', pct: 3.1, color: '#ffb347' },
                  { cls: 'Pituitary', pct: 1.5, color: '#6c63ff' },
                  { cls: 'No Tumor', pct: 0.7, color: '#34d399' },
                ].map((b) => (
                  <div className="brain-bar-row" key={b.cls}>
                    <span className="brain-bar-cls">{b.cls}</span>
                    <div className="brain-bar-track">
                      <div className="brain-bar-fill" style={{ width: `${b.pct}%`, background: b.color }} />
                    </div>
                    <span className="brain-bar-val">{b.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="brain-status tumor">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
                Tumor Detected — Specialist Consult Advised
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tumor Classes ── */}
      <section className="classes-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Classified Tumor Types</h2>
            <p className="section-sub">BrainVision detects and distinguishes four critical categories from MRI scans</p>
          </div>
          <div className="classes-grid">
            {TUMOR_CLASSES.map((tc) => (
              <div className="class-card" key={tc.name} style={{ '--cls-color': tc.color }}>
                <div className="class-dot-lg" style={{ background: tc.color }} />
                <h3 className="class-name">{tc.name}</h3>
                <p className="class-desc">{tc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-sub">A complete clinical AI tool built for medical professionals and researchers</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon" style={{ color: f.accent, background: `${f.accent}14` }}>
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-blob c1" />
          <div className="cta-blob c2" />
          <div className="cta-content">
            <h2 className="cta-title">Ready to Classify Your First MRI?</h2>
            <p className="cta-desc">
              Create a free account and start using state-of-the-art AI classification in seconds.
            </p>
            {user ? (
              <Link to="/predict" className="btn btn-primary btn-lg">
                Go to Analysis →
              </Link>
            ) : (
              <Link to="/signup" className="btn btn-primary btn-lg">
                Create Free Account →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="home-logo" style={{ width: 26, height: 26 }}>
              <svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="url(#hf1)" strokeWidth="2.5"/>
                <path d="M10 16 Q16 8 22 16 Q16 24 10 16Z" fill="url(#hf1)" opacity="0.9"/>
                <circle cx="16" cy="16" r="3" fill="white"/>
                <defs>
                  <linearGradient id="hf1" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#6c63ff"/>
                    <stop offset="100%" stopColor="#00d4b8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="footer-brand-name">BrainVision</span>
          </div>
          <p className="footer-disclaimer">
            For educational and research purposes only. Not a substitute for professional medical advice.
          </p>
          <p className="footer-copy">© {new Date().getFullYear()} BrainVision AI · Built with InceptionV3</p>
        </div>
      </footer>
    </div>
  );
}
