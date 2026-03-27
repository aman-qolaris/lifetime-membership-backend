import applicantService from "../services/applicant.service.js";

class ApplicantController {
  // Handles the POST /api/applicants endpoint
  async createApplicant(req, res) {
    const newApplicant = await applicantService.submitApplicationWithUploads(
      req.body,
      req.files,
    );

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully. Pending member approval.",
      data: {
        id: newApplicant.id,
        status: newApplicant.status,
      },
    });
  }

  // Handles the POST /api/v1/applicants/admin-submit endpoint
  async createApplicantByAdmin(req, res) {
    const newApplicant = await applicantService.submitApplicationWithUploads(
      req.body,
      req.files,
    );

    return res.status(201).json({
      success: true,
      message:
        "Application submitted successfully by Admin. Pending member approval.",
      data: { id: newApplicant.id, status: newApplicant.status },
    });
  }

  // Handles the PUT /api/v1/applicants/:id endpoint for resubmissions
  async resubmitApplicant(req, res) {
    const { id } = req.params;
    const updatedApplicant =
      await applicantService.resubmitApplicationWithUploads(
        id,
        req.body,
        req.files,
      );

    return res.status(200).json({
      success: true,
      message:
        "Application resubmitted successfully. A new approval link has been sent to the Proposer.",
      data: {
        id: updatedApplicant.id,
        status: updatedApplicant.status,
      },
    });
  }

  // Handles the GET /api/applicants endpoint (For Admin Dashboard)
  async getApplicants(req, res) {
    const applicants = await applicantService.getAllApplicants();

    return res.status(200).json({
      success: true,
      data: applicants,
    });
  }

  // Handles the GET /api/applicants/:id endpoint
  async getApplicantById(req, res) {
    const { id } = req.params;
    const applicant = await applicantService.getApplicantDetails(id);

    return res.status(200).json({
      success: true,
      data: applicant,
    });
  }
}

export default new ApplicantController();
