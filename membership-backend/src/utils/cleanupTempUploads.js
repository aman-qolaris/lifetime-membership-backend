import fs from "fs/promises";
import path from "path";

const isTempUploadPath = (filePath) => {
  if (!filePath || typeof filePath !== "string") return false;

  const normalized = path.normalize(filePath);
  const needle = `${path.sep}temp_uploads${path.sep}`;

  return normalized.includes(needle);
};

const collectMulterFiles = (req) => {
  const files = [];

  if (req?.file) files.push(req.file);

  const reqFiles = req?.files;
  if (!reqFiles) return files;

  if (Array.isArray(reqFiles)) {
    files.push(...reqFiles);
    return files;
  }

  // Multer fields() => { fieldName: [file, ...] }
  for (const value of Object.values(reqFiles)) {
    if (Array.isArray(value)) files.push(...value);
  }

  return files;
};

export const cleanupTempUploads = async (req) => {
  const files = collectMulterFiles(req);
  if (files.length === 0) return;

  await Promise.all(
    files
      .map((file) => file?.path)
      .filter((filePath) => isTempUploadPath(filePath))
      .map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch {
          // Best-effort cleanup only
        }
      }),
  );
};
