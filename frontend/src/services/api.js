import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  verifyEmail: () => api.post('/auth/verify'),
};

// Listings endpoints
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getOne: (id) => api.get(`/listings/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'location') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'image' && data[key]) {
        formData.append('image', data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'location') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'image' && data[key] instanceof File) {
        formData.append('image', data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/listings/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/listings/${id}`),
  getMyListings: () => api.get('/listings/my/listings'),
  incrementView: (id) => api.post(`/listings/${id}/view`),
};

// Orders endpoints
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getBuyerOrders: () => api.get('/orders/buyer'),
  getFarmerOrders: () => api.get('/orders/farmer'),
  getOne: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.delete(`/orders/${id}`),
};

// Messages endpoints
export const messagesAPI = {
  send: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId) => api.get(`/messages/conversation/${conversationId}`),
  getUnreadCount: () => api.get('/messages/unread/count'),
  delete: (id) => api.delete(`/messages/${id}`),
};

// Admin endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (uid, active) => api.put(`/admin/users/${uid}/status`, { active }),
  updateUserRole: (uid, role) => api.put(`/admin/users/${uid}/role`, { role }),
  deleteUser: (uid) => api.delete(`/admin/users/${uid}`),
  getListings: () => api.get('/admin/listings'),
  moderateListing: (id, status, reason) => api.put(`/admin/listings/${id}/moderate`, { status, reason }),
  getOrders: (params) => api.get('/admin/orders', { params }),
};

export default api;
