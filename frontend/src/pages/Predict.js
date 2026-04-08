import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { predictApi } from '../services/api';
import './Predict.css';

const CLASS_COLORS = {
  Glioma: '#ff4d6d',
  Meningioma: '#ffb347',
  Pituitary: '#6c63ff',
  'No Tumor': '#34d399',
};

const CLASS_INFO = {
  Glioma: {
    icon: '⚠',
    desc: 'Glioma is a tumor of the brain and spinal cord, arising from glial cells. Varies greatly in malignancy.',
    action: 'Immediate specialist consultation recommended',
  },
  Meningioma: {
    icon: '◎',
    desc: 'Meningioma arises from the meninges — typically slow-growing and often benign.',
    action: 'Follow-up imaging and neurologist review advised',
  },
  Pituitary: {
    icon: '◈',
    desc: 'Pituitary tumor forms in the pituitary gland, may affect hormones and vision.',
    action: 'Endocrinology and neurosurgery consultation suggested',
  },
  'No Tumor': {
    icon: '✓',
    desc: 'No tumor detected in the MRI scan. Brain tissue appears within normal range.',
    action: 'Routine follow-up as advised by your physician',
  },
};

function ConfidenceBar({ label, value, color }) {
  return (
    <div className="conf-row">
      <div className="conf-label-row">
        <span className="conf-label">{label}</span>
        <span className="conf-pct" style={{ color }}>{(value * 100).toFixed(2)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function ResultCard({ result, onDownload, downloading }) {
  const color = CLASS_COLORS[result.predicted_class] || 'var(--purple)';
  const info = CLASS_INFO[result.predicted_class] || {};
  const isTumor = result.predicted_class !== 'No Tumor';

  return (
    <div className="result-card animate-slideup">
      <div className="result-header" style={{ borderColor: color }}>
        <div className="result-icon" style={{ background: `${color}18`, color }}>
          {info.icon || '?'}
        </div>
        <div className="result-main">
          <div className="result-label">AI Classification Result</div>
          <div className="result-class" style={{ color }}>{result.predicted_class}</div>
          <div className="result-conf">{(result.confidence * 100).toFixed(1)}% confidence</div>
        </div>
        <div className={`result-status ${isTumor ? 'tumor' : 'clear'}`}>
          {isTumor ? 'Tumor Detected' : 'No Tumor Found'}
        </div>
      </div>

      <div className="result-body">
        <p className="result-desc">{info.desc}</p>
        <div className="result-action">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {info.action}
        </div>

        <h4 className="breakdown-title">Confidence Breakdown</h4>
        <div className="breakdown-bars">
          {Object.entries(result.all_confidences)
            .sort((a, b) => b[1] - a[1])
            .map(([cls, conf]) => (
              <ConfidenceBar
                key={cls}
                label={cls}
                value={conf}
                color={CLASS_COLORS[cls] || 'var(--purple)'}
              />
            ))}
        </div>

        <div className="result-meta">
          <span>File: <b>{result.image_filename}</b></span>
          <span>Model: <b>{result.model_version}</b></span>
          <span>Processing: <b>{result.processing_time_ms?.toFixed(0)} ms</b></span>
          {result.demo_mode && (
            <span className="demo-badge">Demo Mode — model not loaded</span>
          )}
        </div>

        <div className="result-actions">
          <button
            className="btn btn-primary"
            onClick={onDownload}
            disabled={downloading}
          >
            {downloading ? (
              <><div className="spinner" />Generating PDF...</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF Report
              </>
            )}
          </button>
        </div>

        <div className="disclaimer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          This is an AI-assisted tool for educational purposes only. Always consult a licensed medical professional.
        </div>
      </div>
    </div>
  );
}

export default function Predict() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted) => {
    if (accepted.length === 0) return;
    const f = accepted[0];
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => {
      setError('File rejected. Ensure it is a valid image under 10 MB.');
    },
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await predictApi.predict(file);
      setResult(res.data);
      toast.success('Analysis complete!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Analysis failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await predictApi.downloadReport(result.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `brainvision_report_${result.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="predict-page animate-fadein">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analyze MRI Scan</h1>
          <p className="page-desc">
            Upload a brain MRI image for AI-powered tumor classification using InceptionV3.
          </p>
        </div>
      </div>

      <div className="predict-layout">
        {/* Upload panel */}
        <div className="upload-panel">
          <div className="card">
            <h3 className="panel-title">Upload MRI Image</h3>

            {!preview ? (
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="dropzone-inner">
                  <div className="drop-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="drop-primary">
                    {isDragActive ? 'Drop image here…' : 'Drag & drop MRI image'}
                  </p>
                  <p className="drop-secondary">or click to browse</p>
                  <p className="drop-hint">Supports JPG, PNG, BMP, TIFF — max 10 MB</p>
                </div>
              </div>
            ) : (
              <div className="preview-wrap">
                <img src={preview} alt="MRI preview" className="preview-img" />
                <div className="preview-info">
                  <span className="preview-name">{file.name}</span>
                  <span className="preview-size">{(file.size / 1024).toFixed(1)} KB</span>
                  <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                    Change
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary w-full"
              style={{ marginTop: '1rem' }}
              onClick={handleAnalyze}
              disabled={!file || loading}
            >
              {loading ? (
                <><div className="spinner" />Analyzing...</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12h5"/><path d="M17 12h5"/><circle cx="12" cy="12" r="5"/>
                    <path d="M12 2v5"/><path d="M12 17v5"/>
                  </svg>
                  Run AI Analysis
                </>
              )}
            </button>
          </div>

          <div className="card info-card">
            <h4 className="info-title">Supported Classes</h4>
            <div className="class-list">
              {Object.entries(CLASS_COLORS).map(([cls, color]) => (
                <div key={cls} className="class-item">
                  <span className="class-dot" style={{ background: color }} />
                  <span>{cls}</span>
                </div>
              ))}
            </div>
            <p className="info-note">
              Model: InceptionV3 — trained on Kaggle Brain Tumor MRI Dataset (97.12% accuracy)
            </p>
          </div>
        </div>

        {/* Results panel */}
        <div className="results-panel">
          {loading && (
            <div className="card loading-card">
              <div className="loading-animation">
                <div className="scan-ring" />
                <div className="scan-ring ring-2" />
                <div className="scan-ring ring-3" />
              </div>
              <p className="loading-text">Running AI analysis...</p>
              <p className="loading-sub">Preprocessing image and running InceptionV3 inference</p>
            </div>
          )}
          {result && !loading && (
            <ResultCard
              result={result}
              onDownload={handleDownload}
              downloading={downloading}
            />
          )}
          {!result && !loading && (
            <div className="card placeholder-card">
              <div className="placeholder-icon">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(108,99,255,0.4)" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="placeholder-text">Upload and analyze an MRI to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
