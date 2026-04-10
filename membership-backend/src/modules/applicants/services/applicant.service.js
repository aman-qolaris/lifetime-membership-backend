import crypto from "crypto";
import { sequelize } from "../../../database/index.js";
import applicantRepository from "../repositories/applicant.repository.js";
import emailService from "../../common/services/email.service.js";
import storageService from "../../common/services/storage.service.js";
import AppError from "../../../utils/AppError.js";

const UPLOAD_FIELD_TO_TYPE = {
  applicant_photo: "PHOTO",
  applicant_signature: "SIGNATURE",
  aadhar_front: "AADHAR_FRONT",
  aadhar_back: "AADHAR_BACK",
};

class ApplicantService {
  async _buildUploadedFiles(files, { required } = { required: false }) {
    if (!files) {
      if (required) {
        throw new AppError(
          "Photo, signature, and both sides of Aadhar card are required.",
          400,
        );
      }
      return [];
    }

    if (required) {
      const missing = Object.keys(UPLOAD_FIELD_TO_TYPE).filter(
        (field) => !files[field] || !files[field][0],
      );
      if (missing.length > 0) {
        throw new AppError(
          "Photo, signature, and both sides of Aadhar card are required.",
          400,
        );
      }
    }

    const uploaded = [];
    for (const [field, fileType] of Object.entries(UPLOAD_FIELD_TO_TYPE)) {
      const file = files[field]?.[0];
      if (!file) continue;

      const minioUrl = await storageService.uploadToMinio(file);
      uploaded.push({ fileType, minioUrl });
    }

    return uploaded;
  }

  async submitApplicationWithUploads(applicantBody, files) {
    const applicantData = { ...applicantBody };
    applicantData.files = await this._buildUploadedFiles(files, {
      required: true,
    });
    return this.submitApplication(applicantData);
  }

  // Handles the entire workflow of submitting a new application
  async submitApplication(applicantData) {
    const { existingMember, existingApplicant } =
      await applicantRepository.findExistingByEmailOrMobile(
        applicantData.email,
        applicantData.mobileNumber,
      );

    if (existingMember) {
      throw new AppError(
        "A registered member with this email or mobile number already exists.",
        400,
      );
    }

    if (existingApplicant) {
      throw new AppError(
        "An application with this email or mobile number is already in progress.",
        400,
      );
    }

    const transaction = await sequelize.transaction();

    try {
      const applicant = await applicantRepository.create(
        applicantData,
        transaction,
      );

      const token = crypto.randomBytes(32).toString("hex");

      await applicantRepository.createApprovalToken(
        {
          applicantId: applicant.id,
          token: token,
          roleRequired: "MEMBER",
        },
        transaction,
      );

      const proposer = await applicantRepository.findMemberById(
        applicantData.proposerMemberId,
        transaction,
      );
      if (proposer) {
        await emailService.sendMemberApprovalEmail(
          proposer.email,
          applicant.fullName,
          token,
        );
      }

      await transaction.commit();
      return applicant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async resubmitApplicationWithUploads(applicantId, applicantBody, files) {
    const updatedData = { ...applicantBody };
    const uploadedFiles = await this._buildUploadedFiles(files, {
      required: false,
    });

    if (uploadedFiles.length > 0) {
      updatedData.files = uploadedFiles;
    }

    return this.resubmitApplication(applicantId, updatedData);
  }

  // --- UPDATED: Handles resubmission for BOTH Member and Admin rejections ---
  async resubmitApplication(applicantId, updatedData) {
    const transaction = await sequelize.transaction();

    try {
      const applicant = await applicantRepository.findApplicantByIdForUpdate(
        applicantId,
        transaction,
      );
      if (!applicant) {
        throw { statusCode: 404, message: "Applicant not found." };
      }

      // --- NEW FIX: Handle new file uploads during resubmission ---
      if (updatedData.files && updatedData.files.length > 0) {
        const fileTypes = [
          ...new Set(updatedData.files.map((file) => file.fileType)),
        ];

        await applicantRepository.destroyFileUploadsByTypes(
          applicantId,
          fileTypes,
          transaction,
        );

        await applicantRepository.bulkCreateFileUploads(
          updatedData.files.map((file) => ({
            applicantId,
            fileType: file.fileType,
            minioUrl: file.minioUrl,
          })),
          transaction,
        );
      }

      // SCENARIO 1: Rejected by Member
      if (applicant.status === "REJECTED_BY_MEMBER") {
        await applicant.update(
          {
            ...updatedData,
            status: "PENDING_MEMBER_APPROVAL", // Goes back to Proposer
          },
          { transaction },
        );

        const newToken = crypto.randomBytes(32).toString("hex");
        await applicantRepository.createApprovalToken(
          {
            applicantId: applicant.id,
            token: newToken,
            roleRequired: "MEMBER",
          },
          transaction,
        );

        const proposer = await applicantRepository.findMemberById(
          updatedData.proposerMemberId || applicant.proposerMemberId,
          transaction,
        );

        if (proposer) {
          await emailService.sendMemberApprovalEmail(
            proposer.email,
            applicant.fullName,
            newToken,
          );
        }
      }
      // SCENARIO 2: Rejected by Admin
      else if (applicant.status === "REJECTED_BY_ADMIN") {
        await applicant.update(
          {
            ...updatedData,
            status: "PENDING_ADMIN_REVIEW", // Goes straight back to Admin dashboard
          },
          { transaction },
        );
      }
      // SCENARIO 3: Illegal state
      else {
        throw {
          statusCode: 400,
          message: `Application cannot be edited in its current state: ${applicant.status}`,
        };
      }

      await transaction.commit();
      return applicant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getApplicantDetails(id) {
    const applicant = await applicantRepository.findById(id);
    if (!applicant) {
      const error = new Error("Applicant not found");
      error.statusCode = 404;
      throw error;
    }
    return applicant;
  }

  async getAllApplicants(filters = {}, searchTerm = "", page = 1, limit = 15) {
    const offset = (page - 1) * limit;

    const { rows, count } = await applicantRepository.findAll(
      filters,
      searchTerm,
      limit,
      offset,
    );

    return {
      applicants: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      hasMore: page * limit < count,
    };
  }
}

export default new ApplicantService();
