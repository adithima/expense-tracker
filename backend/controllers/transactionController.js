const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { checkBudgetsForUser } = require('./budgetController');

/**
 * @desc    Create a new transaction (income or expense)
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const { type, category, amount, description, date, paymentMethod } = req.body;

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      category,
      amount,
      description,
      date: date || Date.now(),
      paymentMethod,
    });

        // Fire-and-forget: check if this new transaction pushed any budget
    // past its alert threshold, and create a Notification if so.
    checkBudgetsForUser(req.user._id);

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions for the logged-in user,
 *          with optional search, category filter, date range filter,
 *          type filter, and pagination.
 * @route   GET /api/transactions
 * @access  Private
 * Query params supported:
 *   search      - text search on category/description
 *   category    - exact category match
 *   type        - "income" | "expense"
 *   startDate   - ISO date string
 *   endDate     - ISO date string
 *   page        - pagination page number (default 1)
 *   limit       - results per page (default 10)
 *   sortBy      - field to sort by (default "date")
 *   order       - "asc" | "desc" (default "desc")
 */
const getTransactions = async (req, res, next) => {
  try {
    const {
      search,
      category,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'date',
      order = 'desc',
    } = req.query;

    const filter = { user: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { type, category, amount, description, date, paymentMethod } = req.body;

    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (type !== undefined) transaction.type = type;
    if (category !== undefined) transaction.category = category;
    if (amount !== undefined) transaction.amount = amount;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;

    await transaction.save();

        // Amount/category/date may have changed — re-check budgets.
    checkBudgetsForUser(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard summary: total income, total expense,
 *          current balance, category-wise breakdown (for pie chart),
 *          and monthly income vs expense breakdown (for bar chart).
 *          ALL-TIME data — used by Calendar page's All-Time Overview.
 * @route   GET /api/transactions/summary
 * @access  Private
 */
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const totals = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    totals.forEach((t) => {
      if (t._id === 'income') totalIncome = t.total;
      if (t._id === 'expense') totalExpense = t.total;
    });

    const balance = totalIncome - totalExpense;

    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: 'expense',
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const monthlyMap = {};

    monthlyBreakdown.forEach((entry) => {
      const key = `${entry._id.year}-${entry._id.month}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: `${monthNames[entry._id.month - 1]} ${entry._id.year}`,
          income: 0,
          expense: 0,
        };
      }
      monthlyMap[key][entry._id.type] = entry.total;
    });

    const monthlySummary = Object.values(monthlyMap);

    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      totalIncome,
      totalExpense,
      balance,
      categoryBreakdown,
      monthlySummary,
      recentTransactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard STAT CARDS + category breakdown scoped to a
 *          single month only (Current Balance / Total Income / Total
 *          Expense / categoryBreakdown). Defaults to the current
 *          calendar month when no query params are given — used by
 *          the Dashboard page (pie chart + stat cards, both scoped to
 *          just this month). Calendar page can pass explicit
 *          year/month to browse other months' totals.
 * @route   GET /api/transactions/monthly-stats?year=2026&month=8
 * @access  Private
 * Query params (both optional):
 *   year   - defaults to current year
 *   month  - defaults to current month, 1-12
 */
const getMonthlyStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const yearNum = parseInt(req.query.year, 10) || now.getFullYear();
    const monthNum = parseInt(req.query.month, 10) || now.getMonth() + 1;

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'month must be between 1 and 12',
      });
    }

    // Exclusive upper bound (1st of next month) avoids off-by-one at
    // month-end, same approach as getCalendarData below.
    const startOfMonth = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const startOfNextMonth = new Date(yearNum, monthNum, 1, 0, 0, 0, 0);

    const [totals, categoryBreakdown] = await Promise.all([
      // Income vs expense totals for the month
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { $gte: startOfMonth, $lt: startOfNextMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Category-wise breakdown of EXPENSES only, for this month
      // (used for Dashboard's pie chart — same shape as getSummary's
      // all-time categoryBreakdown, just date-range-limited)
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            type: 'expense',
            date: { $gte: startOfMonth, $lt: startOfNextMonth },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;
    totals.forEach((t) => {
      if (t._id === 'income') totalIncome = t.total;
      if (t._id === 'expense') totalExpense = t.total;
      transactionCount += t.count;
    });

    res.status(200).json({
      success: true,
      year: yearNum,
      month: monthNum,
      currentBalance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      transactionCount,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get per-day totals for a given month, used to render the
 *          Calendar heatmap (color intensity per day based on spend).
 * @route   GET /api/transactions/calendar?year=2026&month=8
 * @access  Private
 * Query params:
 *   year   - required, e.g. 2026
 *   month  - required, 1-12 (calendar month, NOT zero-indexed)
 */
const getCalendarData = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (
      !yearNum ||
      !monthNum ||
      monthNum < 1 ||
      monthNum > 12
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid year and month (1-12) query params are required',
      });
    }

    const startOfMonth = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const startOfNextMonth = new Date(yearNum, monthNum, 1, 0, 0, 0, 0);

    const dailyBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startOfMonth, $lt: startOfNextMonth },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const dayMap = {};

    dailyBreakdown.forEach((entry) => {
      const day = entry._id.day;
      const dateKey = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { income: 0, expense: 0, total: 0, count: 0 };
      }

      dayMap[dateKey][entry._id.type] = entry.total;
      dayMap[dateKey].total += entry.total;
      dayMap[dateKey].count += entry.count;
    });

    res.status(200).json({
      success: true,
      year: yearNum,
      month: monthNum,
      days: dayMap,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getMonthlyStats,
  getCalendarData,
};