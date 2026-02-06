import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors (token refresh is handled in AuthContext)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Let AuthContext handle 401 errors for token refresh
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  verify: () => api.get('/auth/verify'),
  me: () => api.get('/auth/me'),
};

// Children API
export const childrenAPI = {
  getAll: (params) => api.get('/children', { params }),
  getOne: (id) => api.get(`/children/${id}`),
  create: (data) => api.post('/children', data),
  update: (id, data) => api.put(`/children/${id}`, data),
  delete: (id) => api.delete(`/children/${id}`),
  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/children/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Parents API
export const parentsAPI = {
  getAll: (params) => api.get('/parents', { params }),
  getOne: (id) => api.get(`/parents/${id}`),
  create: (data) => api.post('/parents', data),
  update: (id, data) => api.put(`/parents/${id}`, data),
  delete: (id) => api.delete(`/parents/${id}`),
  linkChild: (parentId, data) => api.post(`/parents/${parentId}/link-child`, data),
  unlinkChild: (parentId, childId) => api.delete(`/parents/${parentId}/children/${childId}`),
  sendMessage: (parentId, data) => api.post(`/parents/${parentId}/messages`, data),
  getSentMessages: (params) => api.get('/parents/messages/sent', { params }),
};

// Attendance API
export const attendanceAPI = {
  getToday: () => api.get('/attendance/today'),
  getByDate: (date) => api.get(`/attendance/date/${date}`),
  getReport: (date) => api.get('/attendance/report', { params: { date } }),
  getAbsences: (params) => api.get('/attendance/absences', { params }),
  acknowledgeAbsence: (id) => api.put(`/attendance/absences/${id}/acknowledge`),
  manualCheckIn: (data) => api.post('/attendance/checkin', data),
  manualCheckOut: (data) => api.post('/attendance/checkout', data),
};

// Programs API
export const programsAPI = {
  getAll: () => api.get('/programs'),
  getOne: (id) => api.get(`/programs/${id}`),
  create: (data) => api.post('/programs', data),
  update: (id, data) => api.put(`/programs/${id}`, data),
  delete: (id) => api.delete(`/programs/${id}`),
};

// Content API
export const contentAPI = {
  getAll: () => api.get('/content'),
  getSection: (section) => api.get(`/content/${section}`),
  updateSection: (section, data) => api.put(`/content/${section}`, data),
  updateItem: (section, id, data) => api.put(`/content/${section}/${id}`, data),
  addItem: (section, data) => api.post(`/content/${section}`, data),
  deleteItem: (section, id) => api.delete(`/content/${section}/${id}`),
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

// Employees API
export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// Kiosk API
export const kioskAPI = {
  verifyPin: (pin) => api.post('/kiosk/verify-pin', { pin }),
  getParentChildren: (parentId, pin) => api.post('/kiosk/parent/children', { parentId, pin }),
  checkIn: (data) => api.post('/kiosk/checkin', data),
  checkOut: (data) => api.post('/kiosk/checkout', data),
  employeeClockIn: (data) => api.post('/kiosk/employee/clockin', data),
  employeeClockOut: (data) => api.post('/kiosk/employee/clockout', data),
};

// Parent Portal API
export const portalAPI = {
  getMyChildren: () => api.get('/portal/my-children'),
  reportAbsence: (data) => api.post('/portal/absences', data),
  getAbsences: () => api.get('/portal/absences'),
  updateAbsence: (id, data) => api.put(`/portal/absences/${id}`, data),
  cancelAbsence: (id) => api.delete(`/portal/absences/${id}`),
  getAbsenceReasons: () => api.get('/portal/absence-reasons'),
  getProfile: () => api.get('/portal/profile'),
  updateProfile: (data) => api.put('/portal/profile', data),
  changePassword: (data) => api.post('/portal/change-password', data),
  updateEmergencyContact: (childId, data) => api.put(`/portal/my-children/${childId}/emergency-contact`, data),
  uploadChildPhoto: (childId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/portal/my-children/${childId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Authorized Pickups (per child)
  getAuthorizedPickups: (childId) => api.get(`/portal/my-children/${childId}/authorized-pickups`),
  createAuthorizedPickup: (childId, data) => api.post(`/portal/my-children/${childId}/authorized-pickups`, data),
  updateAuthorizedPickup: (childId, pickupId, data) => api.put(`/portal/my-children/${childId}/authorized-pickups/${pickupId}`, data),
  deleteAuthorizedPickup: (childId, pickupId) => api.delete(`/portal/my-children/${childId}/authorized-pickups/${pickupId}`),
  // Emergency Contacts (per child, multi-entry)
  getEmergencyContacts: (childId) => api.get(`/portal/my-children/${childId}/emergency-contacts`),
  createEmergencyContact: (childId, data) => api.post(`/portal/my-children/${childId}/emergency-contacts`, data),
  updateEmergencyContactEntry: (childId, contactId, data) => api.put(`/portal/my-children/${childId}/emergency-contacts/${contactId}`, data),
  deleteEmergencyContact: (childId, contactId) => api.delete(`/portal/my-children/${childId}/emergency-contacts/${contactId}`),
  // Messages
  getMessages: (params) => api.get('/portal/messages', { params }),
  markMessageRead: (id) => api.put(`/portal/messages/${id}/read`),
  getUnreadMessageCount: () => api.get('/portal/messages/unread-count'),
  // Account deletion
  deleteAccount: (confirmation) => api.delete('/portal/account', { data: { confirmation } }),
};

export default api;
