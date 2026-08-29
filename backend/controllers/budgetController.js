const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * Computes the start/end Date range for a budget's CURRENT active
 * period, based on its `period` type. Monthly/weekly windows are
 * computed live off today's date (never stored), so they're always
 * correct without needing a cron job to "roll over" anything.
 * Custom periods just use the budget's own stored startDate/endDate.
 */
const getCurrentPeriodRange = (budget) => {
  const now = new Date();

  if (budget.period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { start, end, periodKey: `${now.getFullYear()}-${now.getMonth() + 1}` };
  }

  if (budget.period === 'weekly') {
    // Week starts Sunday, matching the Calendar heatmap's SUN-first layout
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end, periodKey: `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}` };
  }

  // custom
  return {
    start: budget.startDate,
    end: budget.endDate,
    periodKey: `${budget.startDate?.toISOString()}_${budget.endDate?.toISOString()}`,
  };
};

/**
 * Computes how much has been spent against a single budget within its
 * current period, and returns a full status object: limit, spent,
 * remaining, percentUsed, and whether thresholds have been crossed.
 * Also handles creating a Notification the FIRST time a threshold is
 * crossed within a given period (via alertSentForCurrentPeriod +
 * lastAlertPeriodKey, so it never double-fires on repeated calls).
 */
const computeBudgetStatus = async (budget, userId) => {
  const { start, end, periodKey } = getCurrentPeriodRange(budget);

  // Reset the "already alerted" flag if we've rolled into a new period
  // since the last time this budget was checked (e.g. a new month
  // started). Stored as a string so it works for monthly/weekly/custom
  // alike without needing separate fields per period type.
  if (budget.lastAlertPeriodKey !== periodKey) {
    budget.alertSentForCurrentPeriod = false;
    budget.lastAlertPeriodKey = periodKey;
  }

  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
    type: 'expense',
    date: { $gte: start, $lt: end },
  };
  if (!budget.isOverall) {
    matchStage.category = budget.category;
  }

  const result = await Transaction.aggregate([
    { $match: matchStage },
    { $group: { _id: null, spent: { $sum: '$amount' } } },
  ]);

  const spent = result.length > 0 ? result[0].spent : 0;
  const percentUsed = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;
  const remaining = budget.limitAmount - spent;
  const thresholdCrossed = percentUsed >= budget.alertThreshold;
  const limitExceeded = spent > budget.limitAmount;

  // Fire an in-app notification the first time this period crosses the
  // threshold — not on every single request, only once per period.
  if (thresholdCrossed && !budget.alertSentForCurrentPeriod) {
    const label = budget.isOverall ? 'your overall budget' : `your "${budget.category}" budget`;
    await Notification.create({
      user: userId,
      type: limitExceeded ? 'budget_exceeded' : 'budget_alert',
      title: limitExceeded ? 'Budget exceeded' : 'Budget alert',
      message: limitExceeded
        ? `You've gone over ${label} — spent ${spent.toFixed(2)} of ${budget.limitAmount.toFixed(2)}.`
        : `You've used ${percentUsed.toFixed(0)}% of ${label} (${spent.toFixed(2)} of ${budget.limitAmount.toFixed(2)}).`,
      relatedBudget: budget._id,
    });

    budget.alertSentForCurrentPeriod = true;
    await budget.save();
  } else if (budget.isModified('lastAlertPeriodKey')) {
    // Period rolled over but threshold not yet crossed this time —
    // still persist the reset flag/periodKey so we don't recompute
    // this on every call.
    await budget.save();
  }

  return {
    budgetId: budget._id,
    category: budget.isOverall ? null : budget.category,
    isOverall: budget.isOverall,
    period: budget.period,
    periodStart: start,
    periodEnd: end,
    limitAmount: budget.limitAmount,
    spent,
    remaining,
    percentUsed: Math.round(percentUsed * 10) / 10,
    alertThreshold: budget.alertThreshold,
    thresholdCrossed,
    limitExceeded,
  };
};

/**
 * @desc    Create a new budget (category-specific or overall)
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = async (req, res, next) => {
  try {
    const { category, isOverall, limitAmount, period, startDate, endDate, alertThreshold } = req.body;

    const budget = await Budget.create({
      user: req.user._id,
      category: isOverall ? null : category,
      isOverall: !!isOverall,
      limitAmount,
      period,
      startDate: period === 'custom' ? startDate : null,
      endDate: period === 'custom' ? endDate : null,
      alertThreshold,
    });

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budget,
    });
  } catch (error) {
    // Duplicate key from the partial unique indexes (active budget
    // already exists for this category / already have an overall one)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An active budget already exists for this category (or an overall budget already exists).',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all budgets for the user, each with live status
 *          (spent/remaining/percentUsed) for its current period.
 * @route   GET /api/budgets
 * @access  Private
 * Query params:
 *   activeOnly - "true" to exclude deactivated budgets (default: true)
 */
const getBudgets = async (req, res, next) => {
  try {
    const { activeOnly = 'true' } = req.query;
    const filter = { user: req.user._id };
    if (activeOnly === 'true') {
      filter.isActive = true;
    }

    const budgets = await Budget.find(filter).sort({ createdAt: -1 });

    const statuses = await Promise.all(
      budgets.map((budget) => computeBudgetStatus(budget, req.user._id))
    );

    res.status(200).json({
      success: true,
      count: statuses.length,
      budgets: statuses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single budget's live status by ID
 * @route   GET /api/budgets/:id
 * @access  Private
 */
const getBudgetStatus = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    const status = await computeBudgetStatus(budget, req.user._id);

    res.status(200).json({ success: true, budget: status });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a budget's settings (limit, threshold, active state, etc.)
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = async (req, res, next) => {
  try {
    const { limitAmount, period, startDate, endDate, alertThreshold, isActive } = req.body;

    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    // category/isOverall intentionally NOT editable here — changing what
    // a budget tracks is conceptually a new budget. User should delete
    // and recreate instead, avoiding ambiguous history.
    if (limitAmount !== undefined) budget.limitAmount = limitAmount;
    if (period !== undefined) budget.period = period;
    if (startDate !== undefined) budget.startDate = period === 'custom' ? startDate : null;
    if (endDate !== undefined) budget.endDate = period === 'custom' ? endDate : null;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
    if (isActive !== undefined) budget.isActive = isActive;

    // Any settings change resets the alert flag — e.g. raising the
    // limit shouldn't leave a stale "already alerted" state hanging
    // around from before the change.
    budget.alertSentForCurrentPeriod = false;

    await budget.save();

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An active budget already exists for this category (or an overall budget already exists).',
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete a budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.status(200).json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Runs computeBudgetStatus for every ACTIVE budget belonging to a user.
 * This is what actually creates Notification documents when a threshold
 * is crossed (see computeBudgetStatus above) — exported so other
 * controllers (like transactionController) can trigger a budget check
 * right after a transaction changes, instead of only checking when the
 * user happens to visit the Budgets page.
 *
 * Deliberately fire-and-forget friendly: callers can await it or not.
 * Errors are caught internally and logged, never thrown — a failed
 * budget check should never break the transaction request that
 * triggered it.
 */
const checkBudgetsForUser = async (userId) => {
  try {
    const budgets = await Budget.find({ user: userId, isActive: true });
    await Promise.all(budgets.map((budget) => computeBudgetStatus(budget, userId)));
  } catch (error) {
    console.error(`Budget check failed for user ${userId}:`, error.message);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetStatus,
  updateBudget,
  deleteBudget,
  checkBudgetsForUser,
};