import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import emailService from "../../common/services/email.service.js";
import { sequelize } from "../../../database/index.js";
import adminRepository from "../repositories/admin.repository.js";
import {
  cacheDel,
  cacheGetOrSet,
  cacheKeys,
  setTemporaryData,
  getTemporaryData,
} from "../../../utils/cache.js";
import { parse } from "json2csv";
import AppError from "../../../utils/AppError.js";

class AdminService {
  async login(phoneNumber, password) {
    const admin = await adminRepository.findAdminByPhone(phoneNumber);
    if (!admin) {
      throw new AppError("Invalid phone number or password.", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid phone number or password.", 401);
    }

    const token = jwt.sign(
      { id: admin.id, phoneNumber: admin.phoneNumber, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    return {
      token,
      admin: { id: admin.id, phoneNumber: admin.phoneNumber },
    };
  }

  async getMe(adminId) {
    const admin = await adminRepository.findAdminById(adminId);

    if (!admin) {
      throw new AppError("Admin profile not found.", 404);
    }

    return admin;
  }

  async changePassword(adminId, currentPassword, newPassword) {
    const admin = await adminRepository.findAdminWithPassword(adminId);
    if (!admin) {
      throw new AppError("Admin not found.", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      throw new AppError("Incorrect current password.", 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    return { success: true, message: "Password updated successfully." };
  }

  async forgotPassword(email) {
    let admin;
    if (adminRepository.findAdminByEmail) {
      admin = await adminRepository.findAdminByEmail(email);
    } else {
      const AdminModel = (await import("../models/admin.model.js")).default;
      admin = await AdminModel.findOne({ where: { email } });
    }

    if (!admin) {
      return {
        success: true,
        message: "If that email exists, an OTP has been sent.",
      };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const cacheKey = `admin_pwd_reset_${email}`;

    await setTemporaryData(cacheKey, otp, 600);

    await emailService.sendAdminPasswordResetOTP(email, otp);

    return {
      success: true,
      message: "If that email exists, an OTP has been sent.",
    };
  }

  async resetPassword(email, otp, newPassword) {
    const cacheKey = `admin_pwd_reset_${email}`;
    const cachedOtp = await getTemporaryData(cacheKey);

    if (!cachedOtp || cachedOtp !== otp) {
      throw new AppError("Invalid or expired OTP.", 400);
    }

    let admin;
    if (adminRepository.findAdminByEmail) {
      admin = await adminRepository.findAdminByEmail(email);
    } else {
      const AdminModel = (await import("../models/admin.model.js")).default;
      admin = await AdminModel.findOne({ where: { email } });
    }

    if (!admin) {
      throw new AppError("Admin account not found.", 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    cacheDel(cacheKey);

    return {
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    };
  }

  async getMemberDetails(memberId) {
    const member = await adminRepository.findMemberById(memberId);

    if (!member) {
      throw new AppError("Member not found.", 404);
    }

    return member;
  }

  async updateApplicantDetails(applicantId, updateData) {
    if (!updateData || typeof updateData !== "object") {
      throw new AppError(
        "Invalid request body. Send JSON with Content-Type: application/json.",
        400,
      );
    }

    const applicant = await adminRepository.findApplicantById(applicantId);
    if (!applicant) {
      throw new AppError("Applicant not found.", 404);
    }

    const allowedFields = [
      "fullName",
      "gender",
      "fatherOrHusbandName",
      "permanentAddress",
      "currentAddress",
      "isFromRaipur",
      "region",
      "mobileNumber",
      "email",
      "education",
      "occupation",
      "officeAddress",
      "dateOfBirth",
      "marriageDate",
      "bloodGroup",
      "membershipType",
      "proposerMemberId",
    ];

    const sanitizedUpdateData = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedUpdateData[field] = updateData[field];
      }
    }

    if (updateData.full_name)
      sanitizedUpdateData.fullName = updateData.full_name;
    if (updateData.phone_number)
      sanitizedUpdateData.mobileNumber = updateData.phone_number;

    if (Object.keys(sanitizedUpdateData).length === 0) {
      throw new AppError("No valid editable fields provided.", 400);
    }

    await adminRepository.updateApplicant(applicant, sanitizedUpdateData);

    return adminRepository.findApplicantPopulated(applicantId);
  }

  async processAdminReview(applicantId, action) {
    const transaction = await sequelize.transaction();

    try {
      const applicant = await adminRepository.findApplicantById(applicantId, {
        transaction,
      });
      if (!applicant) {
        throw new AppError("Applicant not found.", 404);
      }

      if (applicant.status !== "PENDING_ADMIN_REVIEW") {
        throw new AppError(
          `Cannot review. Application is currently: ${applicant.status}`,
          400,
        );
      }

      if (action === "REJECT") {
        applicant.status = "REJECTED_BY_ADMIN";
        await adminRepository.saveApplicant(applicant, { transaction });

        const editUrl = `${process.env.FRONTEND_URL}/edit-application/${applicant.id}`;

        await emailService.sendAdminRejectionEmail(
          applicant.email,
          applicant.fullName,
          editUrl,
        );

        await transaction.commit();
        return {
          success: true,
          message:
            "Application rejected. Email sent to applicant for corrections.",
        };
      }

      if (action === "APPROVE") {
        applicant.status = "PENDING_PRESIDENT_APPROVAL";
        await adminRepository.saveApplicant(applicant, { transaction });

        const newRawToken = crypto.randomBytes(32).toString("hex");
        await adminRepository.createApprovalToken(
          {
            applicantId: applicant.id,
            token: newRawToken,
            roleRequired: "PRESIDENT",
          },
          { transaction },
        );

        const president = await adminRepository.findPresident({ transaction });

        if (president) {
          await emailService.sendPresidentApprovalEmail(
            president.email,
            applicant.fullName,
            newRawToken,
          );
        }

        await transaction.commit();
        return {
          success: true,
          message:
            "Application verified by Admin. Forwarded to President for approval.",
        };
      }

      throw new AppError("Invalid action. Use APPROVE or REJECT.", 400);
    } catch (error) {
      await transaction.rollback();
      throw error; // Will be caught by global errorHandler or asyncHandler
    }
  }

  async getAllProposers(searchTerm = "") {
    return adminRepository.findProposers(searchTerm);
  }

  async getAllMembersForAdmin(searchTerm = "", page = 1, limit = 15) {
    const offset = (page - 1) * limit;

    const { rows, count } = await adminRepository.findAllMembersForAdmin(
      searchTerm,
      limit,
      offset,
    );

    return {
      members: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      hasMore: page * limit < count,
    };
  }

  async toggleMemberStatus(memberId) {
    const member = await adminRepository.findMemberById(memberId);
    if (!member) throw new AppError("Member not found.", 404);
    if (member.role === "PRESIDENT")
      throw new AppError("Cannot change President status.", 400);

    member.isActive = !member.isActive;
    await adminRepository.saveMember(member);
    return {
      success: true,
      message: `${member.name} is now ${member.isActive ? "Active" : "Inactive"}.`,
    };
  }

  async approveAndPromoteToMember(applicantId, registrationNumber) {
    const transaction = await sequelize.transaction();
    try {
      const applicant = await adminRepository.findApplicantPopulated(
        applicantId,
        {
          transaction,
        },
      );
      if (!applicant) throw new AppError("Applicant not found.", 404);
      if (applicant.status !== "PAYMENT_COMPLETED")
        throw new AppError(
          `Applicant cannot be promoted. Current status is ${applicant.status}. Payment must be completed first.`,
          400,
        );

      const existingReg =
        await adminRepository.findApplicantByRegistrationNumber(
          registrationNumber,
          { transaction },
        );
      if (existingReg)
        throw new AppError(
          "This Registration Number is already assigned.",
          400,
        );

      applicant.registrationNumber = registrationNumber;
      applicant.status = "MEMBER";
      await adminRepository.saveApplicant(applicant, { transaction });

      const existingMember = await adminRepository.findMemberByEmailOrMobile(
        { email: applicant.email, mobileNumber: applicant.mobileNumber },
        { transaction },
      );

      if (existingMember) {
        throw new AppError(
          `Cannot promote: A member with this email (${applicant.email}) or mobile number already exists in the system.`,
          400,
        );
      }

      if (!existingMember) {
        await adminRepository.createMember(
          {
            name: applicant.fullName,
            email: applicant.email,
            mobileNumber: applicant.mobileNumber,
            dateOfBirth: applicant.dateOfBirth,
            permanentAddress: applicant.permanentAddress,
            currentAddress: applicant.currentAddress,
            bloodGroup: applicant.bloodGroup,
            role: "MEMBER",
          },
          { transaction },
        );
      }

      await emailService.sendWelcomeEmail(
        applicant.email,
        applicant.fullName,
        registrationNumber,
      );

      await transaction.commit();
      return {
        success: true,
        message: `Successfully promoted ${applicant.fullName} to official Member with Registration Number: ${registrationNumber}`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getSystemSettings() {
    return cacheGetOrSet(cacheKeys.settingsAll, async () => {
      const settings = await adminRepository.getAllSettings();
      return settings.map((s) => s.toJSON());
    });
  }

  async updateMembershipFee(newValue) {
    const parsedValue = Number(newValue);
    // Fixed: Prefer Number.isNaN over isNaN
    if (!parsedValue || Number.isNaN(parsedValue) || parsedValue <= 0) {
      throw new AppError("Invalid fee amount.", 400);
    }

    const setting = await adminRepository.findSettingByKey(
      "LIFETIME_MEMBERSHIP_FEE",
    );

    // Fixed: Removed unexpected negated condition by placing true condition first
    if (setting) {
      setting.value = newValue.toString();
      await adminRepository.saveSetting(setting);
    } else {
      await adminRepository.createSetting({
        key: "LIFETIME_MEMBERSHIP_FEE",
        value: newValue.toString(),
      });
    }

    cacheDel(cacheKeys.settingsAll);

    return {
      success: true,
      message: `Membership fee updated to ₹${newValue} successfully.`,
    };
  }

  async getDashboardStats(startDate, endDate) {
    const stats = await adminRepository.getDashboardStats(startDate, endDate);

    return {
      success: true,
      message: "Dashboard statistics fetched successfully.",
      data: stats,
    };
  }

  async generateMembersCSVReport(startDate, endDate) {
    const members = await adminRepository.getMembersForExport(
      startDate,
      endDate,
    );

    if (!members || members.length === 0) {
      throw new AppError("No members found in this date range to export.", 404);
    }

    const formattedData = members.map((m) => {
      const member = m.toJSON();
      return {
        "Registration Date": new Date(member.createdAt).toLocaleDateString(
          "en-IN",
        ),
        Name: member.name,
        Email: member.email,
        "Mobile Number": member.mobileNumber,
        "Blood Group": member.bloodGroup || "N/A",
        "Date of Birth": member.dateOfBirth,
        Address: member.permanentAddress,
        Status: member.isActive ? "Active" : "Inactive",
      };
    });

    const csvData = parse(formattedData);

    return csvData;
  }
}

export default new AdminService();
