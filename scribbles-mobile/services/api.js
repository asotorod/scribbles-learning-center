import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://scribbles-learning-center-production.up.railway.app/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Track if we're currently refreshing to avoid loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor — attach auth token
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // SecureStore unavailable — continue without token
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } =
          response.data?.data || response.data;

        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens — AuthContext will detect and redirect to login
        await SecureStore.deleteItemAsync('accessToken').catch(() => {});
        await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
        await SecureStore.deleteItemAsync('user').catch(() => {});
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  verify: () => api.get('/auth/verify'),
  me: () => api.get('/auth/me'),
};

// ============================================
// PARENT PORTAL API
// ============================================
export const portalAPI = {
  // Dashboard
  getDashboard: () => api.get('/portal/dashboard'),

  // Children
  getMyChildren: () => api.get('/portal/my-children'),
  getMyChild: (id) => api.get(`/portal/my-children/${id}`),

  // Photo upload
  uploadChildPhoto: (childId, file) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'image/jpeg',
      name: file.fileName || 'photo.jpg',
    });
    return api.post(`/portal/my-children/${childId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },

  // Emergency contact
  updateEmergencyContact: (childId, data) =>
    api.put(`/portal/my-children/${childId}/emergency-contact`, data),

  // Absences
  getAbsenceReasons: () => api.get('/portal/absence-reasons'),
  getAbsences: (params) => api.get('/portal/absences', { params }),
  getAbsence: (id) => api.get(`/portal/absences/${id}`),
  reportAbsence: (data) => api.post('/portal/absences', data),
  updateAbsence: (id, data) => api.put(`/portal/absences/${id}`, data),
  cancelAbsence: (id) => api.delete(`/portal/absences/${id}`),

  // Profile
  getProfile: () => api.get('/portal/profile'),
  updateProfile: (data) => api.put('/portal/profile', data),
  changePassword: (data) => api.post('/portal/change-password', data),

  // Notifications
  getNotifications: (params) => api.get('/portal/notifications', { params }),
  markNotificationRead: (id) => api.put(`/portal/notifications/${id}/read`),
  getUnreadCount: () => api.get('/portal/notifications/unread-count'),
};

export default api;
