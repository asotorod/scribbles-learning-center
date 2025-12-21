import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Content API
export const contentAPI = {
  getAll: () => api.get('/content'),
  getSection: (section) => api.get(`/content/${section}`),
  updateSection: (section, data) => api.put(`/content/${section}`, data),
  updateItem: (section, id, data) => api.put(`/content/${section}/${id}`, data),
  addItem: (section, data) => api.post(`/content/${section}`, data),
  deleteItem: (section, id) => api.delete(`/content/${section}/${id}`),
};

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
  me: () => api.get('/auth/me'),
};

// Inquiries API
export const inquiryAPI = {
  getAll: () => api.get('/inquiries'),
  getOne: (id) => api.get(`/inquiries/${id}`),
  submit: (data) => api.post('/inquiries', data),
  reply: (id, message) => api.post(`/inquiries/${id}/reply`, { message }),
  updateStatus: (id, status) => api.patch(`/inquiries/${id}/status`, { status }),
  delete: (id) => api.delete(`/inquiries/${id}`),
};

export default api;
