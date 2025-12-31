import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetail = error.response?.data?.detail;
    
    // Check if session expired due to login from another device
    if (errorDetail === 'SESSION_EXPIRED_OTHER_DEVICE') {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show warning message
      toast.error('Başka bir cihazda oturum açıldı. Bu oturum sonlandırıldı.', {
        duration: 5000,
      });
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      return Promise.reject(error);
    }
    
    // Handle other 401 errors (token expired, invalid token)
    if (error.response?.status === 401) {
      const detail = errorDetail || '';
      
      if (detail === 'Token süresi dolmuş' || detail === 'Geçersiz token') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        toast.error('Oturum süresi doldu. Lütfen tekrar giriş yapın.', {
          duration: 3000,
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
