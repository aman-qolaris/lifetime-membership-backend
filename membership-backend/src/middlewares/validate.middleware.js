import Joi from "joi";
import AppError from "../utils/AppError.js";
import { cleanupTempUploads } from "../utils/cleanupTempUploads.js";

export const validate = (
  schema,
  { property = "body", abortEarly = false, stripUnknown = true } = {},
) => {
  if (!schema || typeof schema.validateAsync !== "function") {
    throw new Error(
      "validate() middleware requires a Joi schema with validateAsync().",
    );
  }

  return async (req, res, next) => {
    try {
      const validated = await schema.validateAsync(req[property], {
        abortEarly,
        stripUnknown,
      });

      req[property] = validated;
      return next();
    } catch (error) {
      await cleanupTempUploads(req);

      if (error instanceof Joi.ValidationError || error?.isJoi) {
        const details = error.details || [];
        const errors = details.map((d) => d.message);
        return next(
          new AppError(errors[0] || "Validation failed", 400, { errors }),
        );
      }

      return next(error);
    }
  };
};
