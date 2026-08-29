const mongoose = require('mongoose');

/**
 * Note Schema
 * Represents a small notepad entry belonging to a user.
 * Used by the sidebar "Notes" widget so students can jot down
 * quick reminders (e.g. "pay hostel fee", "check scholarship deadline").
 */
const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Speeds up queries filtered by user
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true,
      maxlength: [2000, 'Note cannot exceed 2000 characters'],
    },
    // Hybrid model: a note can optionally be pinned to a specific calendar
    // day. Stored as 'YYYY-MM-DD' (not a full Date) so lookups/comparisons
    // are simple string matches and avoid timezone drift. null/undefined
    // means the note is freeform and not tied to any day.
    date: {
      type: String,
      default: null,
      validate: {
        validator: (v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v),
        message: 'date must be in YYYY-MM-DD format',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Fetch a user's notes sorted by most recently updated first.
noteSchema.index({ user: 1, updatedAt: -1 });

// Enforce at most one date-linked note per user per day. Freeform notes
// (date: null) are excluded via the partialFilterExpression so they never
// collide with this constraint.
noteSchema.index(
  { user: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { date: { $type: 'string' } },
  }
);

module.exports = mongoose.model('Note', noteSchema);