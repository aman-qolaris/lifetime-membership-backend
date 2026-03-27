import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import emailService from "../../common/services/email.service.js";
import { sequelize } from "../../../database/index.js";
import "../../../config/env.js";
import adminRepository from "../repositories/admin.repository.js";

class AdminService {
  async login(phone_number, password) {
    const admin = await adminRepository.findAdminByPhone(phone_number);
    if (!admin) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    const token = jwt.sign(
      { id: admin.id, phone_number: admin.phone_number, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    return {
      token,
      admin: { id: admin.id, phone_number: admin.phone_number },
    };
  }

  // --- NEW: Admin edits applicant details before approval ---
  async updateApplicantDetails(applicantId, updateData) {
    const applicant = await adminRepository.findApplicantById(applicantId);
    if (!applicant) {
      throw { statusCode: 404, message: "Applicant not found." };
    }

    // Update the record
    await adminRepository.updateApplicant(applicant, updateData);

    // BEST PRACTICE: Re-fetch and return the fully populated object
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
          applicant.full_name,
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
            applicant_id: applicant.id,
            token: newRawToken,
            role_required: "PRESIDENT",
          },
          { transaction },
        );

        // Fetch President's email and send the link
        const president = await adminRepository.findPresident({ transaction });

        if (president) {
          await emailService.sendPresidentApprovalEmail(
            president.email,
            applicant.full_name,
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

  async getAllMembersForAdmin() {
    return adminRepository.findAllMembersForAdmin();
  }

  async toggleMemberStatus(memberId) {
    const member = await adminRepository.findMemberById(memberId);
    if (!member) throw { statusCode: 404, message: "Member not found." };
    if (member.role === "PRESIDENT")
      throw { statusCode: 400, message: "Cannot change President status." };

    member.is_active = !member.is_active;
    await adminRepository.saveMember(member);
    return {
      success: true,
      message: `${member.name} is now ${member.is_active ? "Active" : "Inactive"}.`,
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

      applicant.registration_number = registrationNumber;
      applicant.status = "MEMBER";
      await adminRepository.saveApplicant(applicant, { transaction });

      const existingMember = await adminRepository.findMemberByEmailOrMobile(
        { email: applicant.email, mobile_number: applicant.mobile_number },
        { transaction },
      );

      if (!existingMember) {
        await adminRepository.createMember(
          {
            name: applicant.full_name,
            email: applicant.email,
            mobile_number: applicant.mobile_number,
            role: "MEMBER",
          },
          { transaction },
        );
      }

      await emailService.sendWelcomeEmail(
        applicant.email,
        applicant.full_name,
        registrationNumber,
      );

      await transaction.commit();
      return {
        success: true,
        message: `Successfully promoted ${applicant.full_name} to official Member with Registration Number: ${registrationNumber}`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getSystemSettings() {
    return adminRepository.getAllSettings();
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
    return {
      success: true,
      message: `Membership fee updated to ₹${newValue} successfully.`,
    };
  }
}

export default new AdminService();
