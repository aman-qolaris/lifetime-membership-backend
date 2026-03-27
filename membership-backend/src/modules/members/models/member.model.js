import { DataTypes } from "sequelize";
import { sequelize } from "../../../config/database.js";

const Member = sequelize.define(
  "Member",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    mobileNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
    bloodGroup: { type: DataTypes.STRING(10) },
    permanentAddress: { type: DataTypes.TEXT, allowNull: false },
    currentAddress: { type: DataTypes.TEXT, allowNull: false },
    role: { type: DataTypes.ENUM("MEMBER", "PRESIDENT"), allowNull: false },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  { tableName: "members", timestamps: true },
);

export default Member;
