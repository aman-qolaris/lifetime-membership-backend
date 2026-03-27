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
    mobile_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
     date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
    blood_group: { type: DataTypes.STRING(10) },
    permanent_address: { type: DataTypes.TEXT, allowNull: false },
    current_address: { type: DataTypes.TEXT, allowNull: false },
    role: { type: DataTypes.ENUM("MEMBER", "PRESIDENT"), allowNull: false },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  { tableName: "members", timestamps: true },
);

export default Member;
