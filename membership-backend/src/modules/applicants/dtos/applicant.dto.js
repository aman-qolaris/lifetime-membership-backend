import Joi from "joi";

// Calculate the maximum allowed date of birth (Exactly 18 years ago from today)
const maxDob = new Date();
maxDob.setFullYear(maxDob.getFullYear() - 18);

// 1. Define the base schema without the renames
const baseSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),

  // NEW: Gender field
  gender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),

  fatherOrHusbandName: Joi.string().trim().min(2).max(100).required(),

  permanentAddress: Joi.string().trim().min(10).max(500).required(),

  currentAddress: Joi.string().trim().min(10).max(500).required(),

  isFromRaipur: Joi.boolean().required(),

  // Smart Validation: Region is required ONLY if isFromRaipur is true
  region: Joi.string().when("isFromRaipur", {
    is: true,
    then: Joi.string().required().messages({
      "any.required":
        "Region is required since you selected you are from Raipur.",
      "string.empty":
        "Region cannot be empty since you selected you are from Raipur.",
    }),
    otherwise: Joi.string().optional().allow(null, ""),
  }),

  mobileNumber: Joi.string()
    // Fixed: Use \d instead of [0-9]
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Mobile number must be a valid 10-digit Indian number.",
    }),

  email: Joi.string().email().trim().required(),

  education: Joi.string().trim().max(100).required(),

  occupation: Joi.string().trim().max(100).required(),

  officeAddress: Joi.string().trim().max(500).optional().allow(null, ""),

  dateOfBirth: Joi.date().iso().max(maxDob).required().messages({
    "date.max": "Applicant must be at least 18 years old to apply.",
  }),

  marriageDate: Joi.date().iso().optional().allow(null),

  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional()
    .allow(null),

  membershipType: Joi.string().valid("LIFETIME").required(),

  proposerMemberId: Joi.string().uuid({ version: "uuidv4" }).required(),
});

// 2. Define your snake_case to camelCase mappings in a clean array
const renameMappings = [
  ["full_name", "fullName"],
  ["father_or_husband_name", "fatherOrHusbandName"],
  ["permanent_address", "permanentAddress"],
  ["current_address", "currentAddress"],
  ["is_from_raipur", "isFromRaipur"],
  ["mobile_number", "mobileNumber"],
  ["office_address", "officeAddress"],
  ["date_of_birth", "dateOfBirth"],
  ["marriage_date", "marriageDate"],
  ["blood_group", "bloodGroup"],
  ["membership_type", "membershipType"],
  ["proposer_member_id", "proposerMemberId"],
];

// 3. Programmatically apply the renames to avoid code duplication
const createApplicantDto = renameMappings.reduce(
  (schema, [oldKey, newKey]) =>
    schema.rename(oldKey, newKey, { override: true, ignoreUndefined: true }),
  baseSchema,
);

export default createApplicantDto;
