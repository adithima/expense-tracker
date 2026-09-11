const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Stores user account information for authentication and profile display.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/,
        'Please enter a valid email address',
      ],
    },
    // Optional alternative identifier for login. Not required, so
    // existing accounts created before this field existed keep working
    // exactly as before, logging in with email only. sparse:true means
    // the unique constraint only applies to documents that actually
    // HAVE a username set — multiple users with no username (null)
    // won't collide with each other.
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
      unique: true,
      sparse: true,
      default: undefined,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Never return password field by default in queries
    },
    avatar: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR', // Default currency symbol/code used in dashboard
    },

    // Notification preference: whether budget threshold/exceeded alerts
    // should be created at all. Checked by budgetController's
    // computeBudgetStatus before creating a Notification document —
    // toggling this off means no new alerts get created, without
    // deleting any budgets or existing (already-created) notifications.
    budgetAlertsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

/**
 * Mongoose pre-save hook.
 * Hashes the password before saving to the database,
 * but only if the password field has been modified (created or changed).
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare a plaintext password (from login form)
 * with the hashed password stored in the database.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method to return a safe user object (no password)
 * for sending in API responses.
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    username: this.username || null,
    avatar: this.avatar,
    currency: this.currency,
    budgetAlertsEnabled: this.budgetAlertsEnabled,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);