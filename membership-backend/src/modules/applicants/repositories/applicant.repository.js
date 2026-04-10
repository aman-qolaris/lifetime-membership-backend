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

  async findAll(filters = {}, searchTerm = "", limit = 15, offset = 0) {
    const whereClause = { ...filters };

    if (searchTerm) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { mobileNumber: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    return await Applicant.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [{ model: Member, as: "proposer", attributes: ["name"] }],
      limit,
      offset,
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

  async findExistingByEmailOrMobile(email, mobileNumber) {
    const existingMember = await Member.findOne({
      where: {
        [Op.or]: [{ email }, { mobileNumber }],
      },
    });

    const existingApplicant = await Applicant.findOne({
      where: {
        [Op.or]: [{ email }, { mobileNumber }],
      },
    });

    return { existingMember, existingApplicant };
  }
}

export default new ApplicantRepository();
