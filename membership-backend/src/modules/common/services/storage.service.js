import { minioClient, MINIO_BUCKET_NAME } from "../../../config/minio.js";
import fs from "fs";
import sharp from "sharp";

const normalizeBaseName = (name) => {
  const base = String(name || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  return base || "upload";
};

const randomSuffix = () => `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

const isImageMime = (mime) =>
  mime === "image/jpeg" || mime === "image/jpg" || mime === "image/png";

class StorageService {
  // Takes a Multer file object, uploads it to MinIO, and deletes the local copy
  async uploadToMinio(file) {
    if (!file) return null;

    const safeBaseName = normalizeBaseName(file.fieldname);

    try {
      // Images: compress + convert to WebP before upload
      if (isImageMime(file.mimetype)) {
        const webpQuality = Number.parseInt(
          process.env.IMAGE_WEBP_QUALITY || "80",
          10,
        );

        const inputBuffer = await fs.promises.readFile(file.path);
        const outputBuffer = await sharp(inputBuffer)
          .rotate()
          .webp({
            quality: Number.isFinite(webpQuality) ? webpQuality : 80,
          })
          .toBuffer();

        const objectName = `${safeBaseName}-${randomSuffix()}.webp`;
        await minioClient.putObject(
          MINIO_BUCKET_NAME,
          objectName,
          outputBuffer,
          outputBuffer.length,
          { "Content-Type": "image/webp" },
        );

        return `/${MINIO_BUCKET_NAME}/${objectName}`;
      }

      // Non-images (e.g., PDFs): upload as-is
      const objectName = `${safeBaseName}-${randomSuffix()}.pdf`;
      await minioClient.fPutObject(MINIO_BUCKET_NAME, objectName, file.path, {
        "Content-Type": file.mimetype,
      });

      return `/${MINIO_BUCKET_NAME}/${objectName}`;
    } catch (error) {
      console.error("MinIO Upload Error:", error);

      throw new Error("Failed to upload file to permanent storage.");
    } finally {
      // Always delete the temporary file from local disk to free up space
      try {
        if (file?.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {
        // best-effort cleanup
      }
    }
  }
}

export default new StorageService();
