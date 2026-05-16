const logger = require("../../utils/logger");

// ─── Mongoose Error Handlers ──────────────────────────────────────────────────

const handleCastError = (err) => {
  return { message: `Invalid ${err.path}: ${err.value}`, statusCode: 400 };
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return { message: `${field} already exists. Please use a different value.`, statusCode: 409 };
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message).join(". ");
  return { message: messages, statusCode: 422 };
};

// ─── JWT Error Handlers ───────────────────────────────────────────────────────

const handleJWTError = () => ({
  message: "Invalid token. Please log in again.",
  statusCode: 401,
});

const handleJWTExpiredError = () => ({
  message: "Your session has expired. Please log in again.",
  statusCode: 401,
});

// ─── Main Error Middleware ────────────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Normalize known error types
  if (err.name === "CastError") ({ message, statusCode } = handleCastError(err));
  if (err.code === 11000) ({ message, statusCode } = handleDuplicateKeyError(err));
  if (err.name === "ValidationError") ({ message, statusCode } = handleValidationError(err));
  if (err.name === "JsonWebTokenError") ({ message, statusCode } = handleJWTError());
  if (err.name === "TokenExpiredError") ({ message, statusCode } = handleJWTExpiredError());

  // Log unexpected server errors with full stack trace
  if (statusCode >= 500) {
    logger.error(`${err.name}: ${err.message}`, { stack: err.stack, url: req.originalUrl });
  }

  const response = {
    status: `${statusCode}`.startsWith("4") ? "fail" : "error",
    message,
  };

  // Include stack trace in development for easier debugging
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
