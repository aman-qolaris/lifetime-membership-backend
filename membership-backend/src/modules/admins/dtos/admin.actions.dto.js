import Joi from "joi";

export const reviewApplicantDto = Joi.object({
  action: Joi.string().valid("APPROVE", "REJECT").required().messages({
    "any.only": "Action must be strictly 'APPROVE' or 'REJECT'.",
  }),
});

export const promoteApplicantDto = Joi.object({
  applicantId: Joi.string().uuid({ version: "uuidv4" }).required(),
  registrationNumber: Joi.string().trim().min(1).max(50).required(),
})
  .rename("applicant_id", "applicantId", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("registration_number", "registrationNumber", {
    override: true,
    ignoreUndefined: true,
  });

export const updateFeeDto = Joi.object({
  amount: Joi.number().positive().required(),
});

export const editApplicantDto = Joi.object().min(1).unknown(true);

export const idParamsDto = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }).required(),
});
