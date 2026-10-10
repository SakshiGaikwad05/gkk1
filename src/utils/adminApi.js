import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gkk1.onrender.com';

console.log('[adminApi] import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[adminApi] API_BASE_URL resolved to:', API_BASE_URL);

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  withCredentials: true,
});

console.log('[adminApi] axios.defaults.baseURL:', adminApi.defaults.baseURL);

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[adminApi] REQUEST:', config.method?.toUpperCase(), config.baseURL + config.url);
    console.log('[adminApi] Full URL:', config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // a 401 from /login just means wrong credentials — let the form show the error
    // instead of reloading the page
    const isLoginRequest = error.config?.url?.endsWith('/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminApi;
