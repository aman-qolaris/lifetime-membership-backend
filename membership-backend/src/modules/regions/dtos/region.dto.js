import Joi from "joi";

export const createRegionDto = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "any.required": "Region name is required.",
    "string.empty": "Region name is required.",
  }),
});

export const toggleRegionParamsDto = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }).required(),
});
