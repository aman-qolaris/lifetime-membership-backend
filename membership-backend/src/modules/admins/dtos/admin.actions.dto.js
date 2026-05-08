import Joi from "joi";

export const reviewApplicantDto = Joi.object({
  action: Joi.string().valid("APPROVE", "REJECT").required().messages({
    "any.only": "Action must be strictly 'APPROVE' or 'REJECT'.",
  }),
});

// 1. Refactored promoteApplicantDto
const basePromoteApplicantDto = Joi.object({
  applicantId: Joi.string().uuid({ version: "uuidv4" }).required(),
  registrationNumber: Joi.string().trim().min(1).max(50).required(),
});

export const promoteApplicantDto = [
  ["applicant_id", "applicantId"],
  ["registration_number", "registrationNumber"],
].reduce(
  (schema, [oldKey, newKey]) =>
    schema.rename(oldKey, newKey, { override: true, ignoreUndefined: true }),
  basePromoteApplicantDto,
);

export const updateFeeDto = Joi.object({
  amount: Joi.number().positive().required(),
});

// 2. Refactored editApplicantDto
const baseEditApplicantDto = Joi.object({
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
});

export const editApplicantDto = [
  ["full_name", "fullName"],
  ["father_or_husband_name", "fatherOrHusbandName"],
  ["date_of_birth", "dateOfBirth"],
  ["marriage_date", "marriageDate"],
  ["blood_group", "bloodGroup"],
  ["mobile_number", "mobileNumber"],
  ["current_address", "currentAddress"],
  ["permanent_address", "permanentAddress"],
  ["office_address", "officeAddress"],
  ["is_from_raipur", "isFromRaipur"],
  ["membership_type", "membershipType"],
]
  .reduce(
    (schema, [oldKey, newKey]) =>
      schema.rename(oldKey, newKey, { override: true, ignoreUndefined: true }),
    baseEditApplicantDto,
  )
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
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
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
