import applicantService from "../services/applicant.service.js";
import jwt from "jsonwebtoken";

const buildApplicantSocketToken = (applicantId) => {
  // Token used only for Socket.io namespace authentication.
  // Clients should store it locally; we don't re-issue it from public endpoints.
  return jwt.sign({ role: "APPLICANT", applicantId }, process.env.JWT_SECRET, {
    expiresIn: process.env.APPLICANT_SOCKET_JWT_EXPIRES_IN || "30d",
  });
};

class ApplicantController {
  // Handles the POST /api/applicants endpoint
  async createApplicant(req, res) {
    const newApplicant = await applicantService.submitApplicationWithUploads(
      req.body,
      req.files,
    );

    const io = req.app.get("io");
    if (io) {
      io.of("/admin").to("admins").emit("admin:applicant:new", {
        applicantId: newApplicant.id,
        status: newApplicant.status,
        submittedAt: newApplicant.createdAt,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully. Pending member approval.",
      data: {
        id: newApplicant.id,
        status: newApplicant.status,
        socketToken: buildApplicantSocketToken(newApplicant.id),
      },
    });
  }

  // Handles the POST /api/v1/applicants/admin-submit endpoint
  async createApplicantByAdmin(req, res) {
    const newApplicant = await applicantService.submitApplicationWithUploads(
      req.body,
      req.files,
    );

    const io = req.app.get("io");
    if (io) {
      io.of("/admin").to("admins").emit("admin:applicant:new", {
        applicantId: newApplicant.id,
        status: newApplicant.status,
        submittedAt: newApplicant.createdAt,
      });
    }

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

    const io = req.app.get("io");
    if (io) {
      io.of("/admin").to("admins").emit("admin:applicant:status", {
        applicantId: updatedApplicant.id,
        status: updatedApplicant.status,
      });
    }

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
  async getAllApplicants(req, res) {
    const filters = req.query.status ? { status: req.query.status } : {};
    const searchTerm = req.query.search || "";

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;

    const result = await applicantService.getAllApplicants(
      filters,
      searchTerm,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      data: result,
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
