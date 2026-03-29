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

      if (property === "query" || property === "params") {
        // Express defines query/params as getters. Modify the object in place.
        // 1. Clear existing keys (respects stripUnknown)
        Object.keys(req[property]).forEach((key) => delete req[property][key]);
        // 2. Assign the validated values back into the object
        Object.assign(req[property], validated);
      } else {
        // req.body can be reassigned safely
        req[property] = validated;
      }
      // --- FIX ENDS HERE ---
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
