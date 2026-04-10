import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
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

class AdminService {
  async login(phoneNumber, password) {
    const admin = await adminRepository.findAdminByPhone(phoneNumber);
    if (!admin) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
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
      throw { statusCode: 404, message: "Admin profile not found." };
    }

    return admin;
  }

  async changePassword(adminId, currentPassword, newPassword) {
    const admin = await adminRepository.findAdminById(adminId);
    if (!admin) {
      throw { statusCode: 404, message: "Admin not found." };
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      throw { statusCode: 401, message: "Incorrect current password." };
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
      throw { statusCode: 400, message: "Invalid or expired OTP." };
    }

    let admin;
    if (adminRepository.findAdminByEmail) {
      admin = await adminRepository.findAdminByEmail(email);
    } else {
      const AdminModel = (await import("../models/admin.model.js")).default;
      admin = await AdminModel.findOne({ where: { email } });
    }

    if (!admin) {
      throw { statusCode: 404, message: "Admin account not found." };
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
      throw { statusCode: 404, message: "Member not found." };
    }

    return member;
  }

  // --- UPDATED: Admin edits applicant details before approval ---
  async updateApplicantDetails(applicantId, updateData) {
    if (!updateData || typeof updateData !== "object") {
      throw {
        statusCode: 400,
        message:
          "Invalid request body. Send JSON with Content-Type: application/json.",
      };
    }

    const applicant = await adminRepository.findApplicantById(applicantId);
    if (!applicant) {
      throw { statusCode: 404, message: "Applicant not found." };
    }

    // 1. Define the exact fields an admin is allowed to modify (Security Best Practice)
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

    // 2. Safely extract only the permitted camelCase fields provided in the request
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedUpdateData[field] = updateData[field];
      }
    }

    // 3. Optional Fallback: If your frontend still sends some snake_case keys, map them manually here
    if (updateData.full_name)
      sanitizedUpdateData.fullName = updateData.full_name;
    if (updateData.phone_number)
      sanitizedUpdateData.mobileNumber = updateData.phone_number;

    // 4. Ensure we actually have data to update before hitting the database
    if (Object.keys(sanitizedUpdateData).length === 0) {
      throw { statusCode: 400, message: "No valid editable fields provided." };
    }

    // 5. Update the record using the safely mapped data
    await adminRepository.updateApplicant(applicant, sanitizedUpdateData);

    // 6. Re-fetch and return the fully populated object
    return adminRepository.findApplicantPopulated(applicantId);
  }

  // --- NEW: Admin Approves or Rejects the application ---
  async processAdminReview(applicantId, action) {
    const transaction = await sequelize.transaction();

    try {
      const applicant = await adminRepository.findApplicantById(applicantId, {
        transaction,
      });
      if (!applicant) {
        throw { statusCode: 404, message: "Applicant not found." };
      }

      if (applicant.status !== "PENDING_ADMIN_REVIEW") {
        throw {
          statusCode: 400,
          message: `Cannot review. Application is currently: ${applicant.status}`,
        };
      }

      if (action === "REJECT") {
        applicant.status = "REJECTED_BY_ADMIN";
        await adminRepository.saveApplicant(applicant, { transaction });

        const editUrl = `${process.env.FRONTEND_URL}/edit-application/${applicant.id}`;

        // We will create this email method in the next step!
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

        // Generate the token for the President
        const newRawToken = crypto.randomBytes(32).toString("hex");
        await adminRepository.createApprovalToken(
          {
            applicantId: applicant.id,
            token: newRawToken,
            roleRequired: "PRESIDENT",
          },
          { transaction },
        );

        // Fetch President's email and send the link
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

      throw {
        statusCode: 400,
        message: "Invalid action. Use APPROVE or REJECT.",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ... (All other existing methods remain unchanged)
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
    if (!member) throw { statusCode: 404, message: "Member not found." };
    if (member.role === "PRESIDENT")
      throw { statusCode: 400, message: "Cannot change President status." };

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
      if (!applicant)
        throw { statusCode: 404, message: "Applicant not found." };
      if (applicant.status !== "PAYMENT_COMPLETED")
        throw {
          statusCode: 400,
          message: `Applicant cannot be promoted. Current status is ${applicant.status}. Payment must be completed first.`,
        };

      const existingReg =
        await adminRepository.findApplicantByRegistrationNumber(
          registrationNumber,
          { transaction },
        );
      if (existingReg)
        throw {
          statusCode: 400,
          message: "This Registration Number is already assigned.",
        };

      applicant.registrationNumber = registrationNumber;
      applicant.status = "MEMBER";
      await adminRepository.saveApplicant(applicant, { transaction });

      const existingMember = await adminRepository.findMemberByEmailOrMobile(
        { email: applicant.email, mobileNumber: applicant.mobileNumber },
        { transaction },
      );

      if (existingMember) {
        throw {
          statusCode: 400,
          message: `Cannot promote: A member with this email (${applicant.email}) or mobile number already exists in the system.`,
        };
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
    if (!newValue || isNaN(newValue) || newValue <= 0)
      throw { statusCode: 400, message: "Invalid fee amount." };

    const setting = await adminRepository.findSettingByKey(
      "LIFETIME_MEMBERSHIP_FEE",
    );
    if (!setting) {
      await adminRepository.createSetting({
        key: "LIFETIME_MEMBERSHIP_FEE",
        value: newValue.toString(),
      });
    } else {
      setting.value = newValue.toString();
      await adminRepository.saveSetting(setting);
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
      throw {
        statusCode: 404,
        message: "No members found in this date range to export.",
      };
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
