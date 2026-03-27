import { DataTypes } from "sequelize";
import { sequelize } from "../../../config/database.js";

const FileUpload = sequelize.define(
  "FileUpload",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fileType: {
      type: DataTypes.ENUM(
        "PHOTO",
        "SIGNATURE",
        "PAYMENT_SLIP",
        "AADHAR_FRONT",
        "AADHAR_BACK",
      ),
      allowNull: false,
    },
    minioUrl: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "file_uploads", timestamps: true },
);

export default FileUpload;
