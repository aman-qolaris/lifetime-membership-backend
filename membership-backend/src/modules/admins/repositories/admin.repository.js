import {
  Admin,
  Applicant,
  ApprovalToken,
  FileUpload,
  Member,
  Setting,
  Payment,
} from "../../../database/index.js";
import { Op } from "sequelize";

class AdminRepository {
  async findAdminByPhone(phoneNumber) {
    return Admin.findOne({ where: { phoneNumber } });
  }

  async findAdminWithPassword(adminId, options = {}) {
    return Admin.findOne({
      where: { id: adminId },
      attributes: ["id", "password"],
      ...options,
    });
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

  async findAllMembersForAdmin(searchTerm = "", limit = 15, offset = 0) {
    const whereClause = {};

    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { mobileNumber: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    return Member.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "name",
        "email",
        "mobileNumber",
        "role",
        "isActive",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
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

  // --- NEW: Dashboard Statistics Query ---
  async getDashboardStats(startDate, endDate) {
    const memberWhereClause = { role: "MEMBER" };
    const paymentWhereClause = { status: "SUCCESS" };

    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      const dateFilter = {
        [Op.between]: [new Date(startDate), endOfDay],
      };

      memberWhereClause.createdAt = dateFilter;
      paymentWhereClause.createdAt = dateFilter;
    }

    const newMembersCount = await Member.count({
      where: memberWhereClause,
    });

    const totalRevenueResult = await Payment.sum("amount", {
      where: paymentWhereClause,
    });

    const totalRevenue = totalRevenueResult || 0;

    const pendingAdminReviewCount = await Applicant.count({
      where: { status: "PENDING_ADMIN_REVIEW" },
    });

    return {
      newMembersCount,
      totalRevenue,
      pendingAdminReviewCount,
      dateRange: startDate && endDate ? { startDate, endDate } : "All Time",
    };
  }

  async getMembersForExport(startDate, endDate) {
    const whereClause = { role: "MEMBER" };

    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), endOfDay],
      };
    }

    return Member.findAll({
      where: whereClause,
      attributes: [
        "id",
        "name",
        "email",
        "mobileNumber",
        "dateOfBirth",
        "bloodGroup",
        "permanentAddress",
        "isActive",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });
  }
}

export default new AdminRepository();
