import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
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

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      if (error.response.status === 401) {
        // Unauthorized - clear storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        toast.error('Bu işlem için yetkiniz yok');
      } else if (error.response.status >= 500) {
        toast.error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
