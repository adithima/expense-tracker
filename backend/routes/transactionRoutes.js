const express = require('express');
const router = express.Router();

const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getMonthlyStats,
  getCalendarData,
} = require('../controllers/transactionController');

const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  transactionValidationRules,
} = require('../middleware/validationMiddleware');

// All transaction routes require a logged-in user
router.use(protect);

/**
 * @route   GET /api/transactions/summary
 * @desc    Get dashboard summary data (totals, charts, recent transactions)
 * @access  Private
 * NOTE: This must be declared BEFORE the "/:id" route below,
 * otherwise Express would treat "summary" as an :id param.
 */
router.get('/summary', getSummary);

/**
 * @route   GET /api/transactions/monthly-stats
 * @desc    Get Current Balance / Total Income / Total Expense scoped to
 *          a single month (defaults to current month if no query params).
 *          Powers the Dashboard stat cards.
 * @access  Private
 * NOTE: Also declared BEFORE "/:id" for the same reason as "/summary".
 */
router.get('/monthly-stats', getMonthlyStats);

/**
 * @route   GET /api/transactions/calendar
 * @desc    Get per-day totals for a given month (heatmap data)
 * @access  Private
 * NOTE: Also declared BEFORE "/:id" for the same reason as "/summary".
 */
router.get('/calendar', getCalendarData);

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/', transactionValidationRules, validate, createTransaction);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions (supports search/filter/sort/pagination via query params)
 * @access  Private
 */
router.get('/', getTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a single transaction by ID
 * @access  Private
 */
router.get('/:id', getTransactionById);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update a transaction
 * @access  Private
 */
router.put('/:id', transactionValidationRules, validate, updateTransaction);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction
 * @access  Private
 */
router.delete('/:id', deleteTransaction);

module.exports = router;