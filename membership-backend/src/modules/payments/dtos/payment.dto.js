import Joi from "joi";

export const createOrderDto = Joi.object({
  applicantId: Joi.string().uuid({ version: "uuidv4" }).required().messages({
    "any.required": "Applicant ID is required.",
    "string.empty": "Applicant ID is required.",
  }),
}).rename("applicant_id", "applicantId", {
  override: true,
  ignoreUndefined: true,
});

export const verifyPaymentDto = Joi.object({
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
})
  .rename("razorpay_order_id", "razorpayOrderId", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("razorpay_payment_id", "razorpayPaymentId", {
    override: true,
    ignoreUndefined: true,
  })
  .rename("razorpay_signature", "razorpaySignature", {
    override: true,
    ignoreUndefined: true,
  });

export const checkStatusParamsDto = Joi.object({
  applicantId: Joi.string().uuid({ version: "uuidv4" }).required(),
}).rename("applicant_id", "applicantId", {
  override: true,
  ignoreUndefined: true,
});
