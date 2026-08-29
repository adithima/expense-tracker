import axiosInstance from './axiosInstance';

/**
 * Auth-related API calls.
 * Each function returns the Axios response's `data` payload directly,
 * so calling components don't need to unwrap `.data` every time.
 */

export const registerUser = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};