class AppError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode || 500;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
