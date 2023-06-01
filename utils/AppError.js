class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.success = `${statusCode}`.startsWith("2");

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
