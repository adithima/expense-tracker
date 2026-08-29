import axios from 'axios';

/**
 * Centralized Axios instance for all API calls.
 * - Automatically prefixes requests with the configured API base URL.
 * - Attaches the JWT token (if present) to every outgoing request.
 * - Handles 401 responses globally by logging the user out and
 *   redirecting to the login page, so we don't need to repeat
 *   this logic in every component that makes an API call.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------- Request Interceptor ----------
// Attach the JWT token from localStorage to every request, if it exists.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Response Interceptor ----------
// Globally handle expired/invalid tokens (401 Unauthorized).
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired - clear stored auth data
      // and force the user back to the login page.
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;