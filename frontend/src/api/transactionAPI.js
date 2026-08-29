import axiosInstance from './axiosInstance';

/**
 * Transaction-related API calls.
 */

/**
 * Fetch transactions with optional filters/search/pagination.
 * @param {Object} params - e.g. { search, category, type, startDate, endDate, page, limit }
 */
export const getTransactions = async (params = {}) => {
  const response = await axiosInstance.get('/transactions', { params });
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await axiosInstance.get(`/transactions/${id}`);
  return response.data;
};

export const createTransaction = async (transactionData) => {
  const response = await axiosInstance.post('/transactions', transactionData);
  return response.data;
};

export const updateTransaction = async (id, transactionData) => {
  const response = await axiosInstance.put(`/transactions/${id}`, transactionData);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await axiosInstance.delete(`/transactions/${id}`);
  return response.data;
};

export const getSummary = async () => {
  const response = await axiosInstance.get('/transactions/summary');
  return response.data;
};

/**
 * Fetch stat-card totals (Current Balance / Total Income / Total Expense)
 * scoped to a single month. Called with no args from the Dashboard page
 * (defaults to the current month on the backend). The Calendar page can
 * pass explicit year/month to browse other months' totals using this
 * same endpoint.
 * @param {number} [year]  - e.g. 2026, omit for current year
 * @param {number} [month] - 1-12, omit for current month
 */
export const getMonthlyStats = async (year, month) => {
  const response = await axiosInstance.get('/transactions/monthly-stats', {
    params: { year, month },
  });
  return response.data;
};

/**
 * Fetch per-day totals for a given month, used to render the Calendar heatmap.
 * @param {number} year  - e.g. 2026
 * @param {number} month - 1-12 (calendar month, not zero-indexed)
 */
export const getCalendarData = async (year, month) => {
  const response = await axiosInstance.get('/transactions/calendar', {
    params: { year, month },
  });
  return response.data;
};