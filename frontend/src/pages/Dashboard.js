import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { historyApi } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { format, parseISO } from 'date-fns';
import './Dashboard.css';

const CLASS_COLORS = {
  Glioma: '#ff4d6d',
  Meningioma: '#ffb347',
  Pituitary: '#6c63ff',
  'No Tumor': '#34d399',
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function TumorBadge({ cls }) {
  const colors = {
    Glioma: 'badge-glioma',
    Meningioma: 'badge-meningioma',
    Pituitary: 'badge-pituitary',
    'No Tumor': 'badge-no-tumor',
  };
  return <span className={`badge ${colors[cls] || ''}`}>{cls}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyApi.stats()
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats
    ? Object.entries(stats.class_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const barData = pieData.map((d) => ({ ...d, fill: CLASS_COLORS[d.name] || '#6c63ff' }));

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="page-desc">
            Here's an overview of your MRI analysis activity.
          </p>
        </div>
        <Link to="/predict" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Analysis
        </Link>
      </div>

      {/* Stats grid */}
      {stats ? (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Scans Analyzed"
              value={stats.total_predictions}
              sub="All time"
              accent="var(--purple)"
            />
            <StatCard
              label="Avg. Confidence"
              value={`${(stats.average_confidence * 100).toFixed(1)}%`}
              sub="Across all predictions"
              accent="var(--teal)"
            />
            <StatCard
              label="Tumor Detected"
              value={stats.total_predictions - (stats.class_distribution['No Tumor'] || 0)}
              sub="Cases requiring attention"
              accent="var(--rose)"
            />
            <StatCard
              label="Normal Scans"
              value={stats.class_distribution['No Tumor'] || 0}
              sub="No tumor found"
              accent="var(--green)"
            />
          </div>

          {/* Charts */}
          {stats.total_predictions > 0 && (
            <div className="charts-row">
              <div className="card chart-card">
                <h3 className="chart-title">Classification Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={CLASS_COLORS[entry.name] || '#6c63ff'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [v, n]}
                      contentStyle={{ borderRadius: 8, fontSize: '0.8rem', border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {pieData.map((d) => (
                    <div key={d.name} className="legend-item">
                      <span className="legend-dot" style={{ background: CLASS_COLORS[d.name] }} />
                      <span>{d.name}</span>
                      <span className="legend-count">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card chart-card">
                <h3 className="chart-title">Cases by Type</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: '0.8rem', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent predictions */}
          {stats.recent_predictions?.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-header-row">
                <h3 className="chart-title" style={{ margin: 0 }}>Recent Analyses</h3>
                <Link to="/history" className="btn btn-ghost btn-sm">View all</Link>
              </div>
              <div className="recent-table-wrap">
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Result</th>
                      <th>Confidence</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_predictions.map((p) => (
                      <tr key={p.id}>
                        <td className="filename-cell" title={p.image_filename}>
                          {p.image_filename}
                        </td>
                        <td><TumorBadge cls={p.predicted_class} /></td>
                        <td>
                          <div className="conf-cell">
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${p.confidence * 100}%`,
                                  background: CLASS_COLORS[p.predicted_class] || 'var(--purple)',
                                }}
                              />
                            </div>
                            <span>{(p.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="date-cell">
                          {p.created_at ? format(parseISO(p.created_at), 'MMM d, yyyy') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state card">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="1.5">
              <path d="M2 12h5"/><path d="M17 12h5"/><circle cx="12" cy="12" r="5"/>
              <path d="M12 2v5"/><path d="M12 17v5"/>
            </svg>
          </div>
          <h3>No analyses yet</h3>
          <p>Upload your first MRI scan to get started with AI-powered brain tumor classification.</p>
          <Link to="/predict" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Analyze Your First MRI
          </Link>
        </div>
      )}
    </div>
  );
}
