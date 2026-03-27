import Joi from "joi";

// Calculate the maximum allowed date of birth (Exactly 18 years ago from today)
const maxDob = new Date();
maxDob.setFullYear(maxDob.getFullYear() - 18);

const createApplicantDto = Joi.object({
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
    .pattern(/^[6-9][0-9]{9}$/)
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
})
  .rename("full_name", "fullName", { override: true, ignoreUndefined: true })
  .rename("father_or_husband_name", "fatherOrHusbandName", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("permanent_address", "permanentAddress", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("current_address", "currentAddress", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("is_from_raipur", "isFromRaipur", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("mobile_number", "mobileNumber", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("office_address", "officeAddress", {
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
  .rename("membership_type", "membershipType", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("proposer_member_id", "proposerMemberId", {
    override: true,
    ignoreUndefined: true,
  });

export default createApplicantDto;
