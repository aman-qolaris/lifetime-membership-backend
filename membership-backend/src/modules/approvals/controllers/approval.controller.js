import approvalService from "../services/approval.service.js";

class ApprovalController {
  async handleMemberApproval(req, res) {
    const result = await approvalService.processApproval(
      req.body.token,
      req.body.action,
      "MEMBER",
    );
    return res.status(200).json(result);
  }

  async handlePresidentApproval(req, res) {
    const result = await approvalService.processApproval(
      req.body.token,
      req.body.action,
      "PRESIDENT",
    );
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
