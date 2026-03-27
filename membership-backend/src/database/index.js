import { sequelize } from "../config/database.js";

// Import Models
import Admin from "../modules/admins/models/admin.model.js";
import Applicant from "../modules/applicants/models/applicant.model.js";
import ApprovalToken from "../modules/approvals/models/approvalToken.model.js";
import FileUpload from "../modules/common/models/fileUpload.model.js";
import Setting from "../modules/common/models/setting.model.js";
import Member from "../modules/members/models/member.model.js";
import Payment from "../modules/payments/models/payment.model.js";
import Region from "../modules/regions/models/region.model.js";

// Define Associations
Member.hasMany(Applicant, {
  foreignKey: "proposer_member_id",
  as: "proposed_applicants",
});
Applicant.belongsTo(Member, {
  foreignKey: "proposer_member_id",
  as: "proposer",
});

Applicant.hasMany(ApprovalToken, {
  foreignKey: "applicant_id",
  as: "approval_tokens",
});
ApprovalToken.belongsTo(Applicant, {
  foreignKey: "applicant_id",
  as: "applicant",
});

Applicant.hasOne(Payment, { foreignKey: "applicant_id", as: "payment" });
Payment.belongsTo(Applicant, { foreignKey: "applicant_id", as: "applicant" });

Applicant.hasMany(FileUpload, { foreignKey: "applicant_id", as: "files" });
FileUpload.belongsTo(Applicant, {
  foreignKey: "applicant_id",
  as: "applicant",
});

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ All database models synchronized successfully.");
  } catch (error) {
    console.error("❌ Error synchronizing database models:", error);
  }
};

export {
  sequelize,
  syncDatabase,
  Admin,
  Member,
  Applicant,
  ApprovalToken,
  Payment,
  FileUpload,
  Setting,
  Region,
};
