import adminService from "../services/admin.service.js";
import { adminLoginDto } from "../dtos/admin.dto.js";

class AdminController {
  async login(req, res) {
    try {
      const validatedData = await adminLoginDto.validateAsync(req.body);

      const result = await adminService.login(
        validatedData.phone_number,
        validatedData.password,
      );

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.isJoi)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, message: error.message });
    }
  }

  async getProposers(req, res) {
    try {
      // Extract search from the URL query parameters
      const searchTerm = req.query.search || "";

      const members = await adminService.getAllProposers(searchTerm);

      return res.status(200).json({ success: true, data: members });
    } catch (error) {
      console.error("Error fetching proposers:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch proposers list." });
    }
  }

  async promoteApplicant(req, res) {
    try {
      const { applicant_id, registration_number } = req.body;

      // Basic validation
      if (!applicant_id || !registration_number) {
        return res.status(400).json({
          success: false,
          message:
            "Applicant ID and Registration Number are completely required.",
        });
      }

      const result = await adminService.approveAndPromoteToMember(
        applicant_id,
        registration_number,
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error promoting applicant:", error);
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();
