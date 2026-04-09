import approvalService from "../services/approval.service.js";

class ApprovalController {
  async handleMemberApproval(req, res) {
    const result = await approvalService.processApproval(
      req.body.token,
      req.body.action,
      "MEMBER",
    );

    const applicantId = result?.data?.applicantId;
    const status = result?.data?.status;
    const io = req.app.get("io");
    if (io && applicantId && status) {
      // Applicant gets immediate feedback
      io.of("/applicant")
        .to(`applicant:${applicantId}`)
        .emit("approval:status", {
          applicantId,
          status,
          decidedBy: result.data.decidedBy,
        });

      // If approved by member, it becomes visible/eligible for Admin review
      if (status === "PENDING_ADMIN_REVIEW") {
        io.of("/admin").to("admins").emit("admin:applicant:status", {
          applicantId,
          status,
        });
      }
    }
    return res.status(200).json(result);
  }

  async handlePresidentApproval(req, res) {
    const result = await approvalService.processApproval(
      req.body.token,
      req.body.action,
      "PRESIDENT",
    );

    const applicantId = result?.data?.applicantId;
    const status = result?.data?.status;
    const io = req.app.get("io");
    if (io && applicantId && status) {
      io.of("/applicant")
        .to(`applicant:${applicantId}`)
        .emit("approval:status", {
          applicantId,
          status,
          decidedBy: result.data.decidedBy,
        });

      io.of("/admin").to("admins").emit("admin:applicant:status", {
        applicantId: applicantId,
        status: status,
      });
    }
    return res.status(200).json(result);
  }

  // Handles the GET request from the frontend when the page loads
  async verifyTokenAndGetDetails(req, res) {
    const { token } = req.params;
    const { role } = req.query;

    const applicantData = await approvalService.getApplicantDetailsByToken(
      token,
      role,
    );

    return res.status(200).json({
      success: true,
      data: applicantData,
    });
  }
}

export default new ApprovalController();
