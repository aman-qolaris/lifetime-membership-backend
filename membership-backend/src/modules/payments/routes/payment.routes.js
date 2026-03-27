import express from "express";
import paymentController from "../controllers/payment.controller.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import {
  checkStatusParamsDto,
  createOrderDto,
  verifyPaymentDto,
} from "../dtos/payment.dto.js";
import asyncHandler from "../../../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/fee",
  asyncHandler(paymentController.getFee.bind(paymentController)),
);

// Route to create an order (Frontend calls this before opening Razorpay checkout)
router.post(
  "/create-order",
  validate(createOrderDto),
  asyncHandler(paymentController.createOrder.bind(paymentController)),
);

// Route to verify an order (Frontend calls this after Razorpay checkout succeeds)
router.post(
  "/verify",
  validate(verifyPaymentDto),
  asyncHandler(paymentController.verifyPayment.bind(paymentController)),
);

router.get(
  "/status/:applicant_id",
  validate(checkStatusParamsDto, { property: "params" }),
  asyncHandler(paymentController.checkStatus.bind(paymentController)),
);
export default router;
