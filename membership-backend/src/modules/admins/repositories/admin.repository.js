import {
  Admin,
  Applicant,
  ApprovalToken,
  FileUpload,
  Member,
  Setting,
} from "../../../database/index.js";
import { Op } from "sequelize";

class AdminRepository {
  async findAdminByPhone(phoneNumber) {
    return Admin.findOne({ where: { phoneNumber } });
  }

  async findAdminById(id) {
    return Admin.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
  }

  async findApplicantById(applicantId, { transaction } = {}) {
    return Applicant.findByPk(applicantId, { transaction });
  }

  async updateApplicant(applicant, updateData, { transaction } = {}) {
    return applicant.update(updateData, { transaction });
  }

  async findApplicantPopulated(applicantId, { transaction } = {}) {
    return Applicant.findByPk(applicantId, {
      include: [
        { model: FileUpload, as: "files" },
        { model: Member, as: "proposer", attributes: ["id", "name"] },
      ],
      transaction,
    });
  }

  async saveApplicant(applicant, { transaction } = {}) {
    return applicant.save({ transaction });
  }

  async createApprovalToken(payload, { transaction } = {}) {
    return ApprovalToken.create(payload, { transaction });
  }

  async findPresident({ transaction } = {}) {
    return Member.findOne({ where: { role: "PRESIDENT" }, transaction });
  }

  async findProposers(searchTerm = "") {
    const whereClause = { role: "MEMBER", isActive: true };
    if (searchTerm) {
      whereClause.name = { [Op.like]: `%${searchTerm}%` };
    }

    return Member.findAll({
      where: whereClause,
      attributes: ["id", "name", "mobileNumber"],
      order: [["name", "ASC"]],
      limit: 10,
    });
  }

  async findAllMembersForAdmin() {
    return Member.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "mobileNumber",
        "role",
        "isActive",
        "createdAt",
      ],
      order: [["name", "ASC"]],
    });
  }

  async findMemberById(memberId) {
    return Member.findByPk(memberId);
  }

  async saveMember(member) {
    return member.save();
  }

  async findApplicantByRegistrationNumber(
    registrationNumber,
    { transaction } = {},
  ) {
    return Applicant.findOne({
      where: { registrationNumber },
      transaction,
    });
  }

  async findMemberByEmailOrMobile(
    { email, mobileNumber },
    { transaction } = {},
  ) {
    return Member.findOne({
      where: {
        [Op.or]: [{ email }, { mobileNumber }],
      },
      transaction,
    });
  }

  async createMember(payload, { transaction } = {}) {
    return Member.create(payload, { transaction });
  }

  async getAllSettings() {
    return Setting.findAll();
  }

  async findSettingByKey(key, { transaction } = {}) {
    return Setting.findByPk(key, { transaction });
  }

  async createSetting(payload, { transaction } = {}) {
    return Setting.create(payload, { transaction });
  }

  async saveSetting(setting, { transaction } = {}) {
    return setting.save({ transaction });
  }

  async findAdminByEmail(email) {
    return await Admin.findOne({ where: { email } });
  }
}

export default new AdminRepository();
