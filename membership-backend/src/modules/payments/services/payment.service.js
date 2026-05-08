import Razorpay from "razorpay";
import crypto from "node:crypto";
import { sequelize } from "../../../database/index.js";
import paymentRepository from "../repositories/payment.repository.js";
import AppError from "../../../utils/AppError.js";

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  // 1. Creates a Razorpay Order when the frontend requests it
  async createPaymentOrder(applicantId) {
    const transaction = await sequelize.transaction();

    try {
      const feeSetting = await paymentRepository.getFeeSetting(transaction);

      // FIXED: Prefer Number.parseInt over parseInt
      const currentFee = feeSetting
        ? Number.parseInt(feeSetting.value, 10) + 10
        : 1510;

      const applicant = await paymentRepository.findApplicantById(
        applicantId,
        transaction,
      );

      if (!applicant) {
        // FIXED: Expected an error object to be thrown
        throw new AppError("Applicant not found.", 404);
      }

      // STRICT BLOCK: If they already paid, completely block them.
      if (
        applicant.status === "PAYMENT_COMPLETED" ||
        applicant.status === "MEMBER"
      ) {
        throw new AppError(
          "Payment has already been successfully completed for this application.",
          400,
        );
      }

      // ALLOW RETRIES: They can only generate a payment link if they are in PAYMENT_PENDING
      if (applicant.status !== "PAYMENT_PENDING") {
        throw new AppError(
          `Applicant is not eligible for payment. Current status is ${applicant.status}.`,
          400,
        );
      }

      // Create order via Razorpay API (amount must be in paise, so multiply by 100)
      const options = {
        amount: currentFee * 100,
        currency: "INR",
        receipt: `receipt_app_${applicantId.substring(0, 8)}_${Date.now()}`,
      };

      const order = await this.razorpay.orders.create(options);

      // Save the new order details in our database
      await paymentRepository.createPayment(
        {
          applicantId,
          razorpayOrderId: order.id,
          amount: currentFee,
          status: "PENDING",
        },
        transaction,
      );

      await transaction.commit();

      return {
        orderId: order.id,
        amountInPaise: order.amount,
        amountInRupees: currentFee,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getMembershipFee() {
    // We don't need a transaction here since we are just reading one value
    const feeSetting = await paymentRepository.getFeeSetting();
    // FIXED: Prefer Number.parseInt over parseInt
    const currentFee = feeSetting
      ? Number.parseInt(feeSetting.value, 10)
      : 1510;

    return { fee: currentFee };
  }

  // 2. Cryptographically verifies the payment after frontend checkout is done
  async verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  ) {
    const transaction = await sequelize.transaction();

    try {
      // Create the expected signature using our secret key
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      console.log("EXPECTED SIGNATURE:", expectedSignature);

      const isAuthentic = expectedSignature === razorpaySignature;

      if (!isAuthentic) {
        // FIXED: Expected an error object to be thrown
        throw new AppError(
          "Invalid payment signature. Potential fraud detected.",
          400,
        );
      }

      // If authentic, update the database
      const paymentRecord = await paymentRepository.findPaymentByOrderId(
        razorpayOrderId,
        transaction,
      );
      if (!paymentRecord) {
        throw new AppError("Payment record not found.", 404);
      }

      paymentRecord.status = "COMPLETED";
      await paymentRepository.savePayment(paymentRecord, transaction);

      const applicant = await paymentRepository.findApplicantById(
        paymentRecord.applicantId,
        transaction,
      );
      applicant.status = "PAYMENT_COMPLETED";
      await paymentRepository.saveApplicant(applicant, transaction);

      await transaction.commit();
      return {
        success: true,
        message: "Payment verified and application is fully completed.",
        data: {
          applicantId: applicant.id,
          status: applicant.status,
          razorpayOrderId,
          razorpayPaymentId,
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async checkApplicantPaymentStatus(applicantId) {
    const applicant = await paymentRepository.findApplicantById(applicantId);
    if (!applicant) {
      // FIXED: Expected an error object to be thrown
      throw new AppError("Applicant not found.", 404);
    }

    const isPaid =
      applicant.status === "PAYMENT_COMPLETED" || applicant.status === "MEMBER";

    return { success: true, isPaid, status: applicant.status };
  }
}

export default new PaymentService();
