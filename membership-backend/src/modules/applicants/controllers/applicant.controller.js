import applicantService from "../services/applicant.service.js";
import storageService from "../../common/services/storage.service.js";
import AppError from "../../../utils/AppError.js";

class ApplicantController {
  // Handles the POST /api/applicants endpoint
  async createApplicant(req, res) {
    const validatedData = { ...req.body };

    if (
      !req.files ||
      !req.files["applicant_photo"] ||
      !req.files["applicant_signature"] ||
      !req.files["aadhar_front"] ||
      !req.files["aadhar_back"]
    ) {
      throw new AppError(
        "Photo, signature, and both sides of Aadhar card are required.",
        400,
      );
    }

    const photoUrl = await storageService.uploadToMinio(
      req.files["applicant_photo"][0],
    );
    const signatureUrl = await storageService.uploadToMinio(
      req.files["applicant_signature"][0],
    );
    const aadharFrontUrl = await storageService.uploadToMinio(
      req.files["aadhar_front"][0],
    );
    const aadharBackUrl = await storageService.uploadToMinio(
      req.files["aadhar_back"][0],
    );

    validatedData.files = [
      { file_type: "PHOTO", minio_url: photoUrl },
      { file_type: "SIGNATURE", minio_url: signatureUrl },
      { file_type: "AADHAR_FRONT", minio_url: aadharFrontUrl },
      { file_type: "AADHAR_BACK", minio_url: aadharBackUrl },
    ];

    const newApplicant =
      await applicantService.submitApplication(validatedData);

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
    const validatedData = { ...req.body };

    if (
      !req.files ||
      !req.files["applicant_photo"] ||
      !req.files["applicant_signature"] ||
      !req.files["aadhar_front"] ||
      !req.files["aadhar_back"]
    ) {
      throw new AppError(
        "Photo, signature, and both sides of Aadhar card are required.",
        400,
      );
    }

    const photoUrl = await storageService.uploadToMinio(
      req.files["applicant_photo"][0],
    );
    const signatureUrl = await storageService.uploadToMinio(
      req.files["applicant_signature"][0],
    );
    const aadharFrontUrl = await storageService.uploadToMinio(
      req.files["aadhar_front"][0],
    );
    const aadharBackUrl = await storageService.uploadToMinio(
      req.files["aadhar_back"][0],
    );

    validatedData.files = [
      { file_type: "PHOTO", minio_url: photoUrl },
      { file_type: "SIGNATURE", minio_url: signatureUrl },
      { file_type: "AADHAR_FRONT", minio_url: aadharFrontUrl },
      { file_type: "AADHAR_BACK", minio_url: aadharBackUrl },
    ];

    const newApplicant =
      await applicantService.submitApplication(validatedData);

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
    const validatedData = { ...req.body };

    if (req.files) {
      const newFiles = [];
      if (req.files["applicant_photo"]) {
        const photoUrl = await storageService.uploadToMinio(
          req.files["applicant_photo"][0],
        );
        newFiles.push({ file_type: "PHOTO", minio_url: photoUrl });
      }
      if (req.files["applicant_signature"]) {
        const signatureUrl = await storageService.uploadToMinio(
          req.files["applicant_signature"][0],
        );
        newFiles.push({ file_type: "SIGNATURE", minio_url: signatureUrl });
      }

      if (req.files["aadhar_front"]) {
        const aadharFrontUrl = await storageService.uploadToMinio(
          req.files["aadhar_front"][0],
        );
        newFiles.push({ file_type: "AADHAR_FRONT", minio_url: aadharFrontUrl });
      }
      if (req.files["aadhar_back"]) {
        const aadharBackUrl = await storageService.uploadToMinio(
          req.files["aadhar_back"][0],
        );
        newFiles.push({ file_type: "AADHAR_BACK", minio_url: aadharBackUrl });
      }

      if (newFiles.length > 0) {
        validatedData.files = newFiles;
      }
    }

    const updatedApplicant = await applicantService.resubmitApplication(
      id,
      validatedData,
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
