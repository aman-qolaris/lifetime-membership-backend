import paymentService from "../services/payment.service.js";
class PaymentController {
  async createOrder(req, res) {
    const orderData = await paymentService.createPaymentOrder(
      req.body.applicantId,
    );
    return res.status(200).json({ success: true, data: orderData });
  }

  async getFee(req, res) {
    const result = await paymentService.getMembershipFee();
    return res.status(200).json({ success: true, data: result });
  }

  async verifyPayment(req, res) {
    const result = await paymentService.verifyPaymentSignature(
      req.body.razorpayOrderId,
      req.body.razorpayPaymentId,
      req.body.razorpaySignature,
    );

    return res.status(200).json(result);
  }

  async checkStatus(req, res) {
    const { applicantId } = req.params;
    const result =
      await paymentService.checkApplicantPaymentStatus(applicantId);
    res.status(200).json(result);
  }
}

export default new PaymentController();
