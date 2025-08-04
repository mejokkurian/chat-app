import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-d5c5.up.railway.app/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  // Discovery and friend requests
  discoverUsers: (params = {}) => api.get('/users/discover', { params }),
  getUserProfile: (userId) => api.get(`/users/profile/${userId}`),
  sendFriendRequest: (userId) => api.post(`/users/friend-request/${userId}`),
  acceptFriendRequest: (userId) => api.post(`/users/friend-request/${userId}/accept`),
  rejectFriendRequest: (userId) => api.post(`/users/friend-request/${userId}/reject`),
  getFriendRequests: () => api.get('/users/friend-requests'),
  getFriends: () => api.get('/users/friends'),
  
  // Profile management
  updateProfile: (userData) => api.put('/users/profile', userData),
  
  // Legacy endpoints (for compatibility)
  getAllUsers: () => api.get('/users'),
  getUserById: (userId) => api.get(`/users/${userId}`),
  searchUsers: (query) => api.get(`/users/search?q=${query}`),
};

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
  sendMessage: (messageData) => api.post('/messages', messageData),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationIds = null) => api.put('/notifications/mark-read', { notificationIds }),
  markSingleAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  deleteAllNotifications: (type = null) => api.delete('/notifications', { params: { type } }),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api; 