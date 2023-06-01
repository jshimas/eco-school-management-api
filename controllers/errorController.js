module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.success = err.success || false;

  if (err.name === "SequelizeValidationError") {
    err.message = "Validation errors";
    err.errors = err.errors.map((e) => e.message.split(".")[1]);
  }

  res.status(err.statusCode).json({
    success: err.success,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
  });
};
