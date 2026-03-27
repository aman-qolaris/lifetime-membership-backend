import { DataTypes } from "sequelize";
import { sequelize } from "../../../config/database.js";

const Applicant = sequelize.define(
  "Applicant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // It will be null until the Admin assigns it
    },
    fullName: { type: DataTypes.STRING, allowNull: false },
    gender: {
      type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
      allowNull: false,
    },
    fatherOrHusbandName: { type: DataTypes.STRING, allowNull: false },
    permanentAddress: { type: DataTypes.TEXT, allowNull: false },
    currentAddress: { type: DataTypes.TEXT, allowNull: false },
    isFromRaipur: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobileNumber: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    education: { type: DataTypes.STRING, allowNull: false },
    occupation: { type: DataTypes.STRING, allowNull: false },
    officeAddress: { type: DataTypes.TEXT },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
    marriageDate: { type: DataTypes.DATEONLY },
    bloodGroup: { type: DataTypes.STRING(10) },
    membershipType: {
      type: DataTypes.ENUM("LIFETIME"),
      defaultValue: "LIFETIME",
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING_MEMBER_APPROVAL",
        "REJECTED_BY_MEMBER",
        "PENDING_ADMIN_REVIEW",
        "REJECTED_BY_ADMIN",
        "PENDING_PRESIDENT_APPROVAL",
        "REJECTED_BY_PRESIDENT",
        "PAYMENT_PENDING",
        "PAYMENT_COMPLETED",
        "MEMBER",
      ),
      defaultValue: "PENDING_MEMBER_APPROVAL",
    },
  },
  { tableName: "applicants", timestamps: true },
);

export default Applicant;
