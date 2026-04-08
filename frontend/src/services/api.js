import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bv_token');
      localStorage.removeItem('bv_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (username, password) => {
    const form = new FormData();
    form.append('username', username);
    form.append('password', password);
    return api.post('/auth/login', form);
  },
  signup: (data) => api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
};

// ── Predictions ───────────────────────────────────────
export const predictApi = {
  predict: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/predict/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  predictBatch: (files) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post('/predict/batch', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadReport: (predictionId) =>
    api.get(`/predict/${predictionId}/report`, { responseType: 'blob' }),
};

// ── History ───────────────────────────────────────────
export const historyApi = {
  list: (params) => api.get('/history/', { params }),
  stats: () => api.get('/history/stats'),
  delete: (id) => api.delete(`/history/${id}`),
};

export default api;
