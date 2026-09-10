const express = require('express');
const router = express.Router();

const {
  createBudget,
  getBudgets,
  getBudgetStatus,
  getBudgetHistory,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');

const { protect } = require('../middleware/authMiddleware');

// All budget routes require a logged-in user
router.use(protect);

/**
 * @route   POST /api/budgets
 * @desc    Create a new budget (category-specific or overall)
 * @access  Private
 */
router.post('/', createBudget);

/**
 * @route   GET /api/budgets
 * @desc    Get all budgets with live status (spent/remaining/percentUsed)
 * @access  Private
 */
router.get('/', getBudgets);

/**
 * @route   GET /api/budgets/:id/history
 * @desc    Get a PAST period's spend for a budget (?offset=1 = last month/week)
 * @access  Private
 * NOTE: This must come BEFORE '/:id' below, otherwise Express would try
 * to match "history" as if it were a budget ID and fail.
 */
router.get('/:id/history', getBudgetHistory);

/**
 * @route   GET /api/budgets/:id
 * @desc    Get a single budget's live status
 * @access  Private
 */
router.get('/:id', getBudgetStatus);

/**
 * @route   PUT /api/budgets/:id
 * @desc    Update a budget's settings
 * @access  Private
 */
router.put('/:id', updateBudget);

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Delete a budget
 * @access  Private
 */
router.delete('/:id', deleteBudget);

module.exports = router;