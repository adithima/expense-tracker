/**
 * 404 Not Found handler.
 * Catches any request that doesn't match a defined route
 * and forwards it to the central error handler below.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Central error handling middleware.
 * Catches all errors passed via next(error) throughout the app
 * and formats a consistent JSON error response.
 * Must be registered LAST in the middleware chain in server.js.
 */
const errorHandler = (err, req, res, next) => {
  // If a route sent a 200 status but threw an error, default to 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId (CastError) -> treat as 404
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key error (e.g. duplicate email on register)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with this ${field} already exists`;
  }

  // Mongoose validation error (schema-level validation failures)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only include stack trace in development for debugging;
    // never leak internals in production responses.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };