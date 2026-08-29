const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for a given user ID.
 * The token is used to authenticate subsequent API requests
 * via the Authorization header (Bearer token).
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {string} signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = generateToken;
