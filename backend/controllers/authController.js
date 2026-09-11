const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;

    // Check if a user with this email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // If a username was provided, check it's not already taken.
    // Username is entirely optional at signup.
    if (username) {
      const usernameExists = await User.findOne({ username: username.toLowerCase() });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'That username is already taken',
        });
      }
    }

    // Create the user. Password hashing happens automatically
    // via the pre('save') hook defined in the User model.
    const user = await User.create({
      name,
      email,
      username: username ? username.toLowerCase() : undefined,
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and return token. Accepts EITHER an email
 *          address OR a username in the same "identifier" field, and
 *          figures out which one was entered automatically.
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    // Accept either `identifier` (new field name) or `email` (old field
    // name) so this keeps working even if some part of the frontend
    // still sends `email` directly.
    const { identifier, email, password } = req.body;
    const rawInput = (identifier || email || '').trim().toLowerCase();

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        message: 'Enter your email or username',
      });
    }

    // A simple heuristic: if it contains "@", treat it as an email;
    // otherwise treat it as a username. Explicitly select password
    // since it's excluded by default in the schema.
    const isEmail = rawInput.includes('@');
    const query = isEmail ? { email: rawInput } : { username: rawInput };

    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware
    res.status(200).json({
      success: true,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getMe };