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
  membershipType: Joi.string()
})
  .rename("full_name", "fullName", { override: true, ignoreUndefined: true })
  .rename("father_or_husband_name", "fatherOrHusbandName", { override: true, ignoreUndefined: true })
  .rename("date_of_birth", "dateOfBirth", { override: true, ignoreUndefined: true })
  .rename("marriage_date", "marriageDate", { override: true, ignoreUndefined: true })
  .rename("blood_group", "bloodGroup", { override: true, ignoreUndefined: true })
  .rename("mobile_number", "mobileNumber", { override: true, ignoreUndefined: true })
  .rename("current_address", "currentAddress", { override: true, ignoreUndefined: true })
  .rename("permanent_address", "permanentAddress", { override: true, ignoreUndefined: true })
  .rename("office_address", "officeAddress", { override: true, ignoreUndefined: true })
  .rename("is_from_raipur", "isFromRaipur", { override: true, ignoreUndefined: true })
  .rename("membership_type", "membershipType", { override: true, ignoreUndefined: true })
  .min(1)
  .unknown(true);

export const idParamsDto = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }).required(),
});
