import adminService from "../services/admin.service.js";

class AdminController {
  async login(req, res) {
    const result = await adminService.login(
      req.body.phone_number,
      req.body.password,
    );
    return res.status(200).json({ success: true, data: result });
  }

  // NEW: Handles admin editing applicant details
  async editApplicant(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    const updatedApplicant = await adminService.updateApplicantDetails(
      id,
      updateData,
    );

    return res.status(200).json({
      success: true,
      message: "Applicant details updated successfully.",
      data: updatedApplicant,
    });
  }

  // NEW: Handles admin approving or rejecting the form
  async reviewApplicant(req, res) {
    const { id } = req.params;
    const { action } = req.body;

    const result = await adminService.processAdminReview(id, action);
    return res.status(200).json(result);
  }

  async getProposers(req, res) {
    const searchTerm = req.query.search || "";
    const members = await adminService.getAllProposers(searchTerm);
    return res.status(200).json({ success: true, data: members });
  }

  // Handles GET request for the Admin to see all members (Active & Inactive)
  async getAllMembersAdmin(req, res) {
    const members = await adminService.getAllMembersForAdmin();
    return res.status(200).json({ success: true, data: members });
  }

  // Handles PATCH request to toggle member status
  async toggleMemberStatus(req, res) {
    const { id } = req.params;
    const result = await adminService.toggleMemberStatus(id);
    return res.status(200).json(result);
  }

  async promoteApplicant(req, res) {
    const { applicant_id, registration_number } = req.body;
    const result = await adminService.approveAndPromoteToMember(
      applicant_id,
      registration_number,
    );
    return res.status(200).json(result);
  }

  async getSettings(req, res) {
    const settings = await adminService.getSystemSettings();
    return res.status(200).json({ success: true, data: settings });
  }

  async updateFee(req, res) {
    const { amount } = req.body;
    const result = await adminService.updateMembershipFee(amount);
    return res.status(200).json(result);
  }
}

export default new AdminController();
