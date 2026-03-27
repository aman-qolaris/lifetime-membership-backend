import Joi from "joi";

export const createOrderDto = Joi.object({
  applicant_id: Joi.string().uuid({ version: "uuidv4" }).required().messages({
    "any.required": "Applicant ID is required.",
    "string.empty": "Applicant ID is required.",
  }),
});

export const verifyPaymentDto = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

export const checkStatusParamsDto = Joi.object({
  applicant_id: Joi.string().uuid({ version: "uuidv4" }).required(),
});
