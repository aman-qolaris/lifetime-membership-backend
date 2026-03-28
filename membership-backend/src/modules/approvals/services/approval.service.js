import { sequelize } from "../../../database/index.js";
import emailService from "../../common/services/email.service.js";
import approvalRepository from "../repositories/approval.repository.js";

class ApprovalService {
  // Handles the state transitions based on who is approving and what action they take
  async processApproval(tokenStr, action, expectedRole) {
    const transaction = await sequelize.transaction();

    try {
      const { tokenRecord, applicant } =
        await this._validateTokenAndLoadApplicant({
          tokenStr,
          expectedRole,
          transaction,
        });

      await this._consumeApprovalToken({ tokenRecord, transaction });

      let result;
      if (action === "REJECT") {
        result = await this._handleRejection({
          expectedRole,
          applicant,
          transaction,
        });
      } else if (action === "APPROVE") {
        result = await this._handleApproval({
          expectedRole,
          applicant,
          transaction,
        });
      } else {
        const error = new Error("Unsupported approval action.");
        error.statusCode = 400;
        throw error;
      }

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async _validateTokenAndLoadApplicant({
    tokenStr,
    expectedRole,
    transaction,
  }) {
    const tokenRecord = await approvalRepository.findValidTokenWithApplicant({
      token: tokenStr,
      expectedRole,
      transaction,
    });

    if (!tokenRecord) {
      const error = new Error(
        "Invalid, expired, or already used approval token.",
      );
      error.statusCode = 400;
      throw error;
    }

    return { tokenRecord, applicant: tokenRecord.applicant };
  }

  async _consumeApprovalToken({ tokenRecord, transaction }) {
    tokenRecord.isUsed = true;
    await approvalRepository.saveToken(tokenRecord, transaction);
  }

  async _handleRejection({ expectedRole, applicant, transaction }) {
    if (expectedRole === "MEMBER") {
      await this._rejectByMember({ applicant, transaction });
    } else if (expectedRole === "PRESIDENT") {
      await this._rejectByPresident({ applicant, transaction });
    } else {
      const error = new Error("Unsupported approver role.");
      error.statusCode = 400;
      throw error;
    }

    return {
      success: true,
      message: `Application has been rejected by ${expectedRole.toLowerCase()}. Notification sent to applicant.`,
      data: {
        applicantId: applicant.id,
        status: applicant.status,
        decidedBy: expectedRole,
      },
    };
  }

  async _handleApproval({ expectedRole, applicant, transaction }) {
    if (expectedRole === "MEMBER") {
      await this._approveByMember({ applicant, transaction });
      return {
        success: true,
        message:
          "Application approved by Member. Forwarded to Admin for review.",
        data: {
          applicantId: applicant.id,
          status: applicant.status,
          decidedBy: expectedRole,
        },
      };
    }

    if (expectedRole === "PRESIDENT") {
      await this._approveByPresident({ applicant, transaction });
      return {
        success: true,
        message:
          "Application approved by President. Form recheck & payment link sent to applicant.",
        data: {
          applicantId: applicant.id,
          status: applicant.status,
          decidedBy: expectedRole,
        },
      };
    }

    const error = new Error("Unsupported approver role.");
    error.statusCode = 400;
    throw error;
  }

  async _rejectByMember({ applicant, transaction }) {
    applicant.status = "REJECTED_BY_MEMBER";
    await approvalRepository.saveApplicant(applicant, transaction);

    const editUrl = this._buildEditApplicationUrl(applicant.id);
    await emailService.sendMemberRejectionEmail(
      applicant.email,
      applicant.fullName,
      editUrl,
    );
  }

  async _rejectByPresident({ applicant, transaction }) {
    applicant.status = "REJECTED_BY_PRESIDENT";
    await approvalRepository.saveApplicant(applicant, transaction);

    await emailService.sendPresidentRejectionEmail(
      applicant.email,
      applicant.fullName,
    );
  }

  async _approveByMember({ applicant, transaction }) {
    applicant.status = "PENDING_ADMIN_REVIEW";
    await approvalRepository.saveApplicant(applicant, transaction);
  }

  async _approveByPresident({ applicant, transaction }) {
    applicant.status = "PAYMENT_PENDING";
    await approvalRepository.saveApplicant(applicant, transaction);

    const recheckUrl = this._buildRecheckApplicationUrl(applicant.id);
    await emailService.sendPaymentEmail(
      applicant.email,
      applicant.fullName,
      recheckUrl,
    );
  }

  _buildEditApplicationUrl(applicantId) {
    return `${process.env.FRONTEND_URL}/edit-application/${applicantId}`;
  }

  _buildRecheckApplicationUrl(applicantId) {
    return `${process.env.FRONTEND_URL}/recheck-application/${applicantId}`;
  }

  // Fetches full applicant details securely using only the email token
  async getApplicantDetailsByToken(tokenStr, expectedRole) {
    const tokenRecord = await approvalRepository.findTokenWithApplicantDetails({
      token: tokenStr,
      expectedRole,
    });

    if (!tokenRecord) {
      const error = new Error(
        "This approval link is invalid, expired, or has already been processed.",
      );
      error.statusCode = 404;
      throw error;
    }

    return {
      applicant: tokenRecord.applicant,
      isUsed: tokenRecord.isUsed,
    };
  }
}

export default new ApprovalService();
