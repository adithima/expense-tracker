import axiosInstance from './axiosInstance';

/**
 * Notification-related API calls. In-app only — no email/SMS/push.
 */

/**
 * Fetch notifications, newest first.
 * @param {Object} [options]
 * @param {boolean} [options.unreadOnly] - true to fetch only unread ones
 * @param {number}  [options.limit]      - max results (server caps at 50)
 */
export const getNotifications = async ({ unreadOnly, limit } = {}) => {
  const response = await axiosInstance.get('/notifications', {
    params: {
      unreadOnly: unreadOnly ? 'true' : undefined,
      limit,
    },
  });
  return response.data;
};

/**
 * Fetch just the unread count — cheap call for the bell icon's badge,
 * meant to be polled more frequently than the full list.
 */
export const getUnreadCount = async () => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return response.data;
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read (e.g. a "Mark all as read" button).
 */
export const markAllAsRead = async () => {
  const response = await axiosInstance.put('/notifications/read-all');
  return response.data;
};

/**
 * Delete a notification.
 */
export const deleteNotification = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`);
  return response.data;
};