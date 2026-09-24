import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global errors (e.g. 401 unauth)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const unauthorized = error.response?.status === 401;
    const suspended = error.response?.status === 403 && /suspend/i.test(error.response?.data?.message || '');
    if (unauthorized || suspended) {
      localStorage.removeItem('careconnect_token');
      localStorage.removeItem('careconnect_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
