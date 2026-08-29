const express = require('express');
const router = express.Router();

const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  validate,
  registerValidationRules,
  loginValidationRules,
} = require('../middleware/validationMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', registerValidationRules, validate, registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Log in an existing user
 * @access  Public
 */
router.post('/login', loginValidationRules, validate, loginUser);

/**
 * @route   GET /api/auth/me
 * @desc    Get the currently authenticated user's data
 * @access  Private (requires valid JWT)
 */
router.get('/me', protect, getMe);

module.exports = router;