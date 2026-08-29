const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * @desc    Update logged-in user's profile (name, email, currency, avatar,
 *          notification preferences)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, currency, avatar, budgetAlertsEnabled } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If email is being changed, make sure it's not already taken
    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: 'This email is already in use by another account',
        });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (currency !== undefined) user.currency = currency;
    if (avatar !== undefined) user.avatar = avatar;
    if (budgetAlertsEnabled !== undefined) user.budgetAlertsEnabled = budgetAlertsEnabled;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change logged-in user's password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Need password field explicitly since it's excluded by default
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword; // pre-save hook will hash this automatically
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get account stats for the logged-in user — total transaction
 *          count, so Profile can show "X transactions logged" alongside
 *          the "Member since" date already returned by toSafeObject().
 * @route   GET /api/users/stats
 * @access  Private
 */
const getAccountStats = async (req, res, next) => {
  try {
    const transactionCount = await Transaction.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      transactionCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete logged-in user's account permanently
 * @route   DELETE /api/users/profile
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    // Clean up all transactions belonging to this user first
    await Transaction.deleteMany({ user: req.user._id });

    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Account and all associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateProfile, changePassword, deleteAccount, getAccountStats };