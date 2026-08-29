const express = require('express');
const router = express.Router();

const {
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  updateProfileValidationRules,
} = require('../middleware/validationMiddleware');

// All user routes require a logged-in user
router.use(protect);

/**
 * @route   PUT /api/users/profile
 * @desc    Update logged-in user's profile details
 * @access  Private
 */
router.put('/profile', updateProfileValidationRules, validate, updateProfile);

/**
 * @route   PUT /api/users/change-password
 * @desc    Change logged-in user's password
 * @access  Private
 */
router.put('/change-password', changePassword);

/**
 * @route   DELETE /api/users/profile
 * @desc    Permanently delete logged-in user's account and data
 * @access  Private
 */
router.delete('/profile', deleteAccount);

module.exports = router;