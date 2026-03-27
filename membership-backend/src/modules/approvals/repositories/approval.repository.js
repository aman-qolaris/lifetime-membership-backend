import {
  Applicant,
  ApprovalToken,
  FileUpload,
  Member,
} from "../../../database/index.js";

class ApprovalRepository {
  async findValidTokenWithApplicant({ token, expectedRole, transaction }) {
    return ApprovalToken.findOne({
      where: { token, roleRequired: expectedRole, isUsed: false },
      include: [{ model: Applicant, as: "applicant" }],
      transaction,
    });
  }

  async saveToken(tokenRecord, transaction) {
    return tokenRecord.save({ transaction });
  }

  async saveApplicant(applicant, transaction) {
    return applicant.save({ transaction });
  }

  async findTokenWithApplicantDetails({ token, expectedRole }) {
    return ApprovalToken.findOne({
      where: { token, roleRequired: expectedRole },
      include: [
        {
          model: Applicant,
          as: "applicant",
          include: [
            { model: Member, as: "proposer", attributes: ["name"] },
            {
              model: FileUpload,
              as: "files",
              attributes: ["fileType", "minioUrl"],
            },
          ],
        },
      ],
    });
  }
}

export default new ApprovalRepository();
