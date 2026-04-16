// Error Handler Utility
// Centralized error handling and validation

/**
 * Custom Error Handler Class
 */
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorHandler;
