import paymentService from "../services/payment.service.js";
class PaymentController {
  async createOrder(req, res) {
    const orderData = await paymentService.createPaymentOrder(
      req.body.applicant_id,
    );
    return res.status(200).json({ success: true, data: orderData });
  }

  async getFee(req, res) {
    const result = await paymentService.getMembershipFee();
    return res.status(200).json({ success: true, data: result });
  }

  async verifyPayment(req, res) {
    const result = await paymentService.verifyPaymentSignature(
      req.body.razorpay_order_id,
      req.body.razorpay_payment_id,
      req.body.razorpay_signature,
    );

    return res.status(200).json(result);
  }

  async checkStatus(req, res) {
    const { applicant_id } = req.params;
    const result =
      await paymentService.checkApplicantPaymentStatus(applicant_id);
    res.status(200).json(result);
  }
}

export default new PaymentController();
