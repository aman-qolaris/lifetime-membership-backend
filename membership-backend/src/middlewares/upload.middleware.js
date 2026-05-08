import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define where Multer should temporarily place files
const tempDir = path.join(__dirname, "../../temp_uploads");

// Auto-create the temp directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Never trust user-supplied extensions (originalname). Only use a safe extension derived from a validated mimetype.
const MIME_TYPE_TO_EXTENSION = Object.freeze({
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const extension = MIME_TYPE_TO_EXTENSION[file.mimetype];
    if (!extension) {
      return cb(
        new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."),
      );
    }

    // FIXED: Replaced Math.random() with a cryptographically secure random string
    const uniqueSuffix =
      Date.now() + "-" + crypto.randomBytes(8).toString("hex");
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// Security: Only allow specific file types
const fileFilter = (req, file, cb) => {
  if (MIME_TYPE_TO_EXTENSION[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."),
      false,
    );
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB strict limit
  fileFilter: fileFilter,
});
