import Joi from "joi";

export const reviewApplicantDto = Joi.object({
  action: Joi.string().valid("APPROVE", "REJECT").required().messages({
    "any.only": "Action must be strictly 'APPROVE' or 'REJECT'.",
  }),
});

export const promoteApplicantDto = Joi.object({
  applicant_id: Joi.string().uuid({ version: "uuidv4" }).required(),
  registration_number: Joi.string().trim().min(1).max(50).required(),
});

export const updateFeeDto = Joi.object({
  amount: Joi.number().positive().required(),
});

export const editApplicantDto = Joi.object().min(1).unknown(true);

export const idParamsDto = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }).required(),
});
