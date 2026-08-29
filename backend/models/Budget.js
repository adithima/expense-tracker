const mongoose = require('mongoose');

/**
 * Budget Schema
 * Represents a spending limit set by a user, either for a specific
 * category or as an overall limit across all categories.
 *
 * NOTE: `category` is a plain trimmed String, NOT an enum — this
 * matches Transaction's category field exactly (also a free-text
 * String), so budgets can reference any category the user has
 * actually used without needing a hardcoded list kept in sync.
 */
const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Free-text category name, matching Transaction.category exactly.
    // Required unless isOverall is true (validated below).
    category: {
      type: String,
      trim: true,
      default: null,
    },

    // True = this budget applies across ALL categories combined,
    // rather than one specific category. Using a boolean flag instead
    // of a magic string like category: "overall" keeps the category
    // field's meaning unambiguous — it's always either a real
    // category name or null, never a reserved keyword that could
    // collide with a real category someone names "Overall".
    isOverall: {
      type: Boolean,
      default: false,
    },

    limitAmount: {
      type: Number,
      required: [true, 'Budget limit amount is required'],
      min: [0.01, 'Limit amount must be greater than 0'],
    },

    period: {
      type: String,
      enum: ['monthly', 'weekly', 'custom'],
      required: true,
      default: 'monthly',
    },

    // Only used when period === 'custom'. For 'monthly'/'weekly',
    // the active window is computed on the fly (e.g. "this calendar
    // month" or "this calendar week") rather than stored, so it
    // never goes stale.
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },

    // Percentage (0-100) of limitAmount at which an alert/notification
    // should fire. e.g. 80 means "notify me when I've spent 80% of
    // this budget."
    alertThreshold: {
      type: Number,
      min: [1, 'Alert threshold must be at least 1%'],
      max: [100, 'Alert threshold cannot exceed 100%'],
      default: 80,
    },

    // Soft on/off switch — lets a user pause a budget without
    // deleting it (and losing its history/settings).
    isActive: {
      type: Boolean,
      default: true,
    },

    // Tracks whether the alertThreshold notification has already been
    // sent for the CURRENT period, so we don't spam a new notification
    // every time getBudgetStatus is recalculated within the same
    // month/week. Reset to false when a new period starts.
    alertSentForCurrentPeriod: {
      type: Boolean,
      default: false,
    },

    // Tracks which period (by a stable string key) the alert flag above
    // was last evaluated for, so computeBudgetStatus can detect "we've
    // rolled into a new month/week" and reset the flag automatically.
    lastAlertPeriodKey: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Validation: category is required UNLESS isOverall is true.
 * Prevents an ambiguous budget that's neither tied to a category
 * nor marked as overall.
 */
budgetSchema.pre('validate', function (next) {
  if (!this.isOverall && !this.category) {
    this.invalidate('category', 'Category is required unless this is an overall budget');
  }
  if (this.isOverall && this.category) {
    this.invalidate('category', 'Category must not be set when isOverall is true');
  }
  next();
});

/**
 * Validation: startDate/endDate required (and endDate after startDate)
 * only when period is 'custom'. Monthly/weekly periods compute their
 * window dynamically and shouldn't store fixed dates.
 */
budgetSchema.pre('validate', function (next) {
  if (this.period === 'custom') {
    if (!this.startDate || !this.endDate) {
      this.invalidate('startDate', 'startDate and endDate are required when period is custom');
    } else if (this.endDate <= this.startDate) {
      this.invalidate('endDate', 'endDate must be after startDate');
    }
  }
  next();
});

// One active budget per user+category (or per user if overall) avoids
// duplicate/conflicting budgets for the same thing. Partial index only
// applies to active budgets, so a user can re-create a budget for a
// category after deactivating an old one without a collision.
budgetSchema.index(
  { user: 1, category: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true, isOverall: false },
  }
);
budgetSchema.index(
  { user: 1, isOverall: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true, isOverall: true },
  }
);

module.exports = mongoose.model('Budget', budgetSchema);