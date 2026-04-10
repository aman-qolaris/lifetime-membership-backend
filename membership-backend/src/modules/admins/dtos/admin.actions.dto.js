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

// Replace your old editApplicantDto with this!
export const editApplicantDto = Joi.object({
  fullName: Joi.string(),
  fatherOrHusbandName: Joi.string(),
  gender: Joi.string(),
  dateOfBirth: Joi.date(),
  marriageDate: Joi.date().allow(null, ""),
  bloodGroup: Joi.string().allow(null, ""),
  education: Joi.string(),
  occupation: Joi.string(),
  mobileNumber: Joi.string(),
  email: Joi.string().email(),
  currentAddress: Joi.string(),
  permanentAddress: Joi.string(),
  officeAddress: Joi.string().allow(null, ""),
  isFromRaipur: Joi.boolean(),
  region: Joi.string().allow(null, ""),
  membershipType: Joi.string(),
})
  .rename("full_name", "fullName", { override: true, ignoreUndefined: true })
  .rename("father_or_husband_name", "fatherOrHusbandName", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("date_of_birth", "dateOfBirth", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("marriage_date", "marriageDate", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("blood_group", "bloodGroup", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("mobile_number", "mobileNumber", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("current_address", "currentAddress", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("permanent_address", "permanentAddress", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("office_address", "officeAddress", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("is_from_raipur", "isFromRaipur", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("membership_type", "membershipType", {
    override: true,
    ignoreUndefined: true,
  })
  .min(1)
  .unknown(true);

export const idParamsDto = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }).required(),
});

const passwordRule = Joi.string()
  .min(8)
  .max(16)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  .required()
  .messages({
    "string.empty": "New password is required",
    "string.min": "New password must be at least 8 characters long",
    "string.max": "New password cannot exceed 16 characters",
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@, $, !, %, *, ?, &)",
  });

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
  }),
  newPassword: passwordRule,
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
    }),
  newPassword: passwordRule,
});

export const dateRangeQueryDto = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    "date.format": "Start date must be a valid ISO date (YYYY-MM-DD).",
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().messages({
    "date.format": "End date must be a valid ISO date (YYYY-MM-DD).",
    "date.min": "End date cannot be earlier than the start date.",
  }),
});
