import { Applicant, Payment, Setting } from "../../../database/index.js";

class PaymentRepository {
  async getFeeSetting(transaction) {
    return Setting.findByPk("LIFETIME_MEMBERSHIP_FEE", { transaction });
  }

  async findApplicantById(applicantId, transaction) {
    return Applicant.findByPk(applicantId, { transaction });
  }

  async createPayment(payload, transaction) {
    return Payment.create(payload, { transaction });
  }

  async findPaymentByOrderId(razorpay_order_id, transaction) {
    return Payment.findOne({ where: { razorpay_order_id }, transaction });
  }

  async savePayment(payment, transaction) {
    return payment.save({ transaction });
  }

  async saveApplicant(applicant, transaction) {
    return applicant.save({ transaction });
  }
}

export default new PaymentRepository();
