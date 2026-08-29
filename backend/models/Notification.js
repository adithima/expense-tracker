const mongoose = require('mongoose');

/**
 * Notification Schema
 * In-app only — no email/SMS/push. Persisted so a user (including a
 * younger family member without an email address) sees alerts purely
 * inside the web app via the bell icon in the Navbar, with a badge
 * for unread count and a dropdown/list to read them.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Keeps notification types open for future use (e.g. later a
    // "recurring transaction due" type) without a schema migration —
    // just add a new string value used by whichever controller creates it.
    type: {
      type: String,
      enum: ['budget_alert', 'budget_exceeded'],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional link back to the budget that triggered this, so the
    // frontend can deep-link "View Budget" from the notification item
    // straight to that budget's card on the Budgets page.
    relatedBudget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Fast lookup for "all unread notifications for this user, newest first"
// — the exact query the bell icon's dropdown will run every time it's
// opened, plus for computing the unread badge count.
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);