import * as Minio from "minio";
import "./env.js";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  // Updated to use Number.parseInt
  port: Number.parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export const MINIO_BUCKET_NAME =
  process.env.MINIO_BUCKET_NAME || "maharashtra-mandal-uploads";

export const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET_NAME);

    // Fixed unexpected negated condition: Check for true first, then handle false in the else block
    if (exists) {
      console.log(`✅ MinIO Bucket '${MINIO_BUCKET_NAME}' is ready.`);
    } else {
      await minioClient.makeBucket(MINIO_BUCKET_NAME, "us-east-1");
      console.log(
        `✅ MinIO Bucket '${MINIO_BUCKET_NAME}' created successfully.`,
      );
    }
  } catch (error) {
    console.error("❌ Error initializing MinIO:", error);
  }
};
