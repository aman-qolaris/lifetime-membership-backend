import {
  Applicant,
  Member,
  FileUpload,
  Payment,
  ApprovalToken,
} from "../../../database/index.js";
import { Op } from "sequelize";

class ApplicantRepository {
  // Creates a new applicant, optionally within a database transaction
  async create(applicantData, transaction = null) {
    return await Applicant.create(applicantData, {
      include: [{ model: FileUpload, as: "files" }],
      transaction,
    });
  }

  // Fetches an applicant by ID, including their proposer, uploaded files, and payment status
  async findById(id) {
    return await Applicant.findByPk(id, {
      include: [
        { model: Member, as: "proposer", attributes: ["id", "name", "email"] },
        {
          model: FileUpload,
          as: "files",
          attributes: ["fileType", "minioUrl"],
        },
        {
          model: Payment,
          as: "payment",
          attributes: ["amount", "status", "razorpayOrderId"],
        },
      ],
    });
  }

  // Updates the workflow status of an applicant
  async updateStatus(id, newStatus, transaction = null) {
    return await Applicant.update(
      { status: newStatus },
      { where: { id }, transaction },
    );
  }

  // Fetches all applicants for the Admin dashboard
  async findAll(filters = {}) {
    return await Applicant.findAll({
      where: filters,
      order: [["createdAt", "DESC"]],
      include: [{ model: Member, as: "proposer", attributes: ["name"] }],
    });
  }

  async findApplicantByIdForUpdate(id, transaction = null) {
    return Applicant.findByPk(id, { transaction });
  }

  async destroyFileUploadByType(applicantId, fileType, transaction = null) {
    return FileUpload.destroy({
      where: { applicantId, fileType },
      transaction,
    });
  }

  async destroyFileUploadsByTypes(applicantId, fileTypes, transaction = null) {
    if (!Array.isArray(fileTypes) || fileTypes.length === 0) return 0;

    return FileUpload.destroy({
      where: {
        applicantId,
        fileType: { [Op.in]: fileTypes },
      },
      transaction,
    });
  }

  async createFileUpload(payload, transaction = null) {
    return FileUpload.create(payload, { transaction });
  }

  async bulkCreateFileUploads(payloads, transaction = null) {
    if (!Array.isArray(payloads) || payloads.length === 0) return [];
    return FileUpload.bulkCreate(payloads, { transaction });
  }

  async createApprovalToken(payload, transaction = null) {
    return ApprovalToken.create(payload, { transaction });
  }

  async findMemberById(id, transaction = null) {
    return Member.findByPk(id, { transaction });
  }
}

export default new ApplicantRepository();
