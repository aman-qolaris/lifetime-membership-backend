import AppError from "../utils/AppError.js";

const toAppError = (err) => {
  if (!err) return new AppError("Unknown error", 500);
  if (err instanceof AppError) return err;

  // If someone throws a plain object: throw { statusCode, message }
  if (typeof err === "object" && !(err instanceof Error)) {
    return new AppError(err.message || "Error", err.statusCode || 500, {
      original: err,
    });
  }

  // Already an Error
  return new AppError(err.message || "Error", err.statusCode || 500, {
    original: err,
  });
};

export const notFound = (req, res, next) => {
  next(new AppError(`API endpoint not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  let normalized = toAppError(err);

  // Joi support (in case any Joi errors escape validation middleware)
  if (err?.isJoi) {
    const errors = err.details?.map((d) => d.message) || [err.message];
    normalized = new AppError(errors[0] || "Validation failed", 400, {
      errors,
    });
  }

  // Sequelize common errors
  if (err?.name === "SequelizeUniqueConstraintError") {
    const duplicateField = err.errors?.[0]?.path;
    let message = "This record already exists.";

    if (duplicateField === "mobile_number") {
      message =
        "हा मोबाईल नंबर आधीच नोंदणीकृत आहे. (This mobile number is already registered.)";
    } else if (duplicateField === "email") {
      message =
        "हा ई-मेल आधीच नोंदणीकृत आहे. (This email is already registered.)";
    } else if (duplicateField === "name") {
      message = "This region already exists.";
    } else if (duplicateField) {
      message = `Duplicate value for ${duplicateField}.`;
    }

    normalized = new AppError(message, 400, { field: duplicateField });
  }

  if (err?.name === "SequelizeValidationError") {
    const errors = err.errors?.map((e) => e.message) || [err.message];
    normalized = new AppError(errors[0] || "Validation failed", 400, {
      errors,
    });
  }

  // JWT common errors
  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    normalized = new AppError("Unauthorized", 401);
  }

  const statusCode = normalized.statusCode || 500;

  const payload = {
    success: false,
    message:
      normalized.message ||
      (statusCode >= 500 ? "Internal server error" : "Error"),
  };

  if (normalized.details?.errors) payload.errors = normalized.details.errors;

  // Helpful for debugging in dev
  if (process.env.NODE_ENV !== "production") {
    payload.stack = err?.stack;
  }

  res.status(statusCode).json(payload);
};
