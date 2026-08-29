import axiosInstance from './axiosInstance';

/**
 * Budget-related API calls.
 */

/**
 * Fetch all budgets with live status (spent/remaining/percentUsed)
 * for each one's current period.
 * @param {boolean} [activeOnly=true] - false to include deactivated budgets
 */
export const getBudgets = async (activeOnly = true) => {
  const response = await axiosInstance.get('/budgets', {
    params: { activeOnly: activeOnly ? 'true' : 'false' },
  });
  return response.data;
};

/**
 * Fetch a single budget's live status by ID.
 */
export const getBudgetStatus = async (id) => {
  const response = await axiosInstance.get(`/budgets/${id}`);
  return response.data;
};

/**
 * Create a new budget.
 * @param {Object} budgetData - { category, isOverall, limitAmount, period, startDate, endDate, alertThreshold }
 */
export const createBudget = async (budgetData) => {
  const response = await axiosInstance.post('/budgets', budgetData);
  return response.data;
};

/**
 * Update a budget's settings. Note: category/isOverall are not
 * editable — the backend blocks changing what a budget tracks.
 * @param {string} id
 * @param {Object} budgetData - { limitAmount, period, startDate, endDate, alertThreshold, isActive }
 */
export const updateBudget = async (id, budgetData) => {
  const response = await axiosInstance.put(`/budgets/${id}`, budgetData);
  return response.data;
};

/**
 * Delete a budget.
 */
export const deleteBudget = async (id) => {
  const response = await axiosInstance.delete(`/budgets/${id}`);
  return response.data;
};