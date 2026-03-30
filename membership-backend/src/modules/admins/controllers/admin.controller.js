import adminService from "../services/admin.service.js";

class AdminController {
  async login(req, res) {
    const result = await adminService.login(
      req.body.phoneNumber,
      req.body.password,
    );

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // Protects against CSRF
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds (match your JWT expiry)
    });

    const { token, ...adminData } = result;

    return res.status(200).json({ success: true, data: adminData });
  }

  async getMe(req, res) {
    const adminId = req.admin.id;

    const adminProfile = await adminService.getMe(adminId);

    return res.status(200).json({
      success: true,
      data: adminProfile,
    });
  }

  async getMemberById(req, res) {
    const { id } = req.params;

    const member = await adminService.getMemberDetails(id);

    return res.status(200).json({
      success: true,
      data: member,
    });
  }

  async logout(req, res) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
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

    const io = req.app.get("io");
    if (io) {
      const nextStatus =
        action === "REJECT"
          ? "REJECTED_BY_ADMIN"
          : "PENDING_PRESIDENT_APPROVAL";

      io.of("/admin").to("admins").emit("admin:applicant:status", {
        applicantId: id,
        status: nextStatus,
      });

      io.of("/applicant").to(`applicant:${id}`).emit("approval:status", {
        applicantId: id,
        status: nextStatus,
      });
    }
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
    const { applicantId, registrationNumber } = req.body;
    const result = await adminService.approveAndPromoteToMember(
      applicantId,
      registrationNumber,
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
