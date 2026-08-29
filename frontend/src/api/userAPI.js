import axiosInstance from './axiosInstance';

/**
 * User profile-related API calls.
 */

export const updateProfile = async (profileData) => {
  const response = await axiosInstance.put('/users/profile', profileData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await axiosInstance.put('/users/change-password', passwordData);
  return response.data;
};

/**
 * Fetch account stats: total transaction count (paired with
 * user.createdAt, already available from AuthContext, for the
 * "Member since X · Y transactions logged" line on Profile).
 */
export const getAccountStats = async () => {
  const response = await axiosInstance.get('/users/stats');
  return response.data;
};

export const deleteAccount = async () => {
  const response = await axiosInstance.delete('/users/profile');
  return response.data;
};