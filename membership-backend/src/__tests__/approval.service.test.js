import { resetDb } from "../../tests/testDb.js";
import approvalService from "../modules/approvals/services/approval.service.js";
import { Applicant, ApprovalToken, Member } from "../database/index.js";

describe("Approval state machine", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("processApproval rejects invalid token", async () => {
    await expect(
      approvalService.processApproval("not-a-real-token", "APPROVE", "MEMBER"),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("processApproval rejects already-used token", async () => {
    const proposer = await Member.create({
      name: "Proposer",
      email: "proposer@test.local",
      mobileNumber: "9000000009",
      dateOfBirth: "1990-01-01",
      permanentAddress: "Raipur",
      currentAddress: "Raipur",
      role: "MEMBER",
    });

    const applicant = await Applicant.create({
      fullName: "Applicant",
      gender: "MALE",
      fatherOrHusbandName: "Father",
      permanentAddress: "Raipur",
      currentAddress: "Raipur",
      isFromRaipur: true,
      region: "Tatibandh",
      mobileNumber: "9111111111",
      email: "applicant@test.local",
      education: "Graduate",
      occupation: "Engineer",
      dateOfBirth: "1995-01-01",
      proposerMemberId: proposer.id,
      status: "PENDING_MEMBER_APPROVAL",
    });

    await ApprovalToken.create({
      applicantId: applicant.id,
      token: "used-token",
      roleRequired: "MEMBER",
      isUsed: true,
    });

    await expect(
      approvalService.processApproval("used-token", "APPROVE", "MEMBER"),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("processApproval MEMBER APPROVE advances to PENDING_ADMIN_REVIEW and consumes token", async () => {
    const proposer = await Member.create({
      name: "Proposer",
      email: "proposer2@test.local",
      mobileNumber: "9000000010",
      dateOfBirth: "1990-01-01",
      permanentAddress: "Raipur",
      currentAddress: "Raipur",
      role: "MEMBER",
    });

    const applicant = await Applicant.create({
      fullName: "Applicant",
      gender: "MALE",
      fatherOrHusbandName: "Father",
      permanentAddress: "Raipur",
      currentAddress: "Raipur",
      isFromRaipur: true,
      region: "Tatibandh",
      mobileNumber: "9222222222",
      email: "applicant2@test.local",
      education: "Graduate",
      occupation: "Engineer",
      dateOfBirth: "1995-01-01",
      proposerMemberId: proposer.id,
      status: "PENDING_MEMBER_APPROVAL",
    });

    await ApprovalToken.create({
      applicantId: applicant.id,
      token: "valid-token",
      roleRequired: "MEMBER",
      isUsed: false,
    });

    const result = await approvalService.processApproval(
      "valid-token",
      "APPROVE",
      "MEMBER",
    );

    expect(result?.success).toBe(true);

    const refreshedApplicant = await Applicant.findByPk(applicant.id);
    expect(refreshedApplicant.status).toBe("PENDING_ADMIN_REVIEW");

    const refreshedToken = await ApprovalToken.findOne({
      where: { token: "valid-token" },
    });
    expect(refreshedToken.isUsed).toBe(true);
  });
});
