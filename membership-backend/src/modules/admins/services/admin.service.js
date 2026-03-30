import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import emailService from "../../common/services/email.service.js";
import { sequelize } from "../../../database/index.js";
import adminRepository from "../repositories/admin.repository.js";
import { cacheDel, cacheGetOrSet, cacheKeys } from "../../../utils/cache.js";

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

  async getAllMembersForAdmin() {
    return adminRepository.findAllMembersForAdmin();
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
}

export default new AdminService();
