import {
  Applicant,
  ApprovalToken,
  FileUpload,
  Member,
} from "../../../database/index.js";

class ApprovalRepository {
  async findValidTokenWithApplicant({ token, expectedRole, transaction }) {
    return ApprovalToken.findOne({
      where: { token, role_required: expectedRole, is_used: false },
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
      where: { token, role_required: expectedRole },
      include: [
        {
          model: Applicant,
          as: "applicant",
          include: [
            { model: Member, as: "proposer", attributes: ["name"] },
            {
              model: FileUpload,
              as: "files",
              attributes: ["file_type", "minio_url"],
            },
          ],
        },
      ],
    });
  }
}

export default new ApprovalRepository();
