import React, { useState, useEffect, useCallback } from 'react';
import { historyApi, predictApi } from '../services/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import './History.css';

const CLASS_COLORS = {
  Glioma: '#ff4d6d',
  Meningioma: '#ffb347',
  Pituitary: '#6c63ff',
  'No Tumor': '#34d399',
};

const CLASS_BADGE = {
  Glioma: 'badge-glioma',
  Meningioma: 'badge-meningioma',
  Pituitary: 'badge-pituitary',
  'No Tumor': 'badge-no-tumor',
};

const CLASS_OPTIONS = ['All', 'Glioma', 'Meningioma', 'Pituitary', 'No Tumor'];

function ConfMini({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="progress-bar" style={{ width: 64 }}>
        <div className="progress-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)' }}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

export default function History() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const PAGE_SIZE = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(filterClass !== 'All' ? { predicted_class: filterClass } : {}),
      };
      const res = await historyApi.list(params);
      const data = res.data;
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterClass]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilter = (cls) => {
    setFilterClass(cls);
    setPage(1);
  };

  const handleDownload = async (id) => {
    setDownloading(id);
    try {
      const res = await predictApi.downloadReport(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `brainvision_report_${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prediction record?')) return;
    setDeleting(id);
    try {
      await historyApi.delete(id);
      toast.success('Record deleted.');
      fetchHistory();
    } catch {
      toast.error('Failed to delete record.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="history-page animate-fadein">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analysis History</h1>
          <p className="page-desc">{total} scan{total !== 1 ? 's' : ''} analyzed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="history-filters card">
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="filter-chips">
          {CLASS_OPTIONS.map((cls) => (
            <button
              key={cls}
              className={`filter-chip ${filterClass === cls ? 'active' : ''}`}
              onClick={() => handleFilter(cls)}
            >
              {cls !== 'All' && (
                <span className="chip-dot" style={{ background: CLASS_COLORS[cls] }} />
              )}
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card history-table-card">
        {loading ? (
          <div className="table-loading">
            <div className="spinner spinner-dark" />
            <span>Loading...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="table-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <p>No records found.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Result</th>
                    <th>Confidence</th>
                    <th>Model</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="file-td" title={item.image_filename}>
                        <div className="file-cell">
                          <div className="file-thumb">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                          <span>{item.image_filename}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${CLASS_BADGE[item.predicted_class] || ''}`}>
                          {item.predicted_class}
                        </span>
                      </td>
                      <td>
                        <ConfMini
                          value={item.confidence}
                          color={CLASS_COLORS[item.predicted_class] || 'var(--purple)'}
                        />
                      </td>
                      <td className="model-td">{item.model_version}</td>
                      <td className="date-td">
                        {item.created_at ? format(parseISO(item.created_at), 'MMM d, yyyy HH:mm') : '—'}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="btn btn-ghost btn-sm icon-btn"
                            title="Download PDF report"
                            onClick={() => handleDownload(item.id)}
                            disabled={downloading === item.id}
                          >
                            {downloading === item.id ? (
                              <div className="spinner spinner-dark" style={{ width: 14, height: 14 }} />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            )}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm icon-btn delete-btn"
                            title="Delete record"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                          >
                            {deleting === item.id ? (
                              <div className="spinner spinner-dark" style={{ width: 14, height: 14 }} />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                <span className="page-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
