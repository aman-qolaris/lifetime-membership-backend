import request from "supertest";
import fs from "fs/promises";
import path from "path";

import app from "../app.js";

const tempUploadsDir = path.resolve(process.cwd(), "temp_uploads");

const listTempFiles = async () => {
  try {
    const entries = await fs.readdir(tempUploadsDir);
    return entries;
  } catch (err) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
};

const emptyTempUploadsDir = async () => {
  const entries = await listTempFiles();
  await Promise.all(
    entries.map(async (name) => {
      try {
        await fs.unlink(path.join(tempUploadsDir, name));
      } catch {
        // best-effort
      }
    }),
  );
};

describe("Upload cleanup on validation failure", () => {
  beforeEach(async () => {
    await emptyTempUploadsDir();
  });

  test("POST /api/v1/applicants deletes temp files when Joi validation fails", async () => {
    const before = await listTempFiles();
    expect(before.length).toBe(0);

    const res = await request(app)
      .post("/api/v1/applicants")
      .field("fullName", "Test Applicant")
      .field("gender", "MALE")
      .field("fatherOrHusbandName", "Test Father")
      .field("permanentAddress", "Some long permanent address in Raipur")
      .field("currentAddress", "Some long current address in Raipur")
      .field("isFromRaipur", "true")
      .field("region", "Tatibandh")
      // Intentionally omit mobileNumber to trigger Joi failure
      .field("email", "applicant@test.local")
      .field("education", "Graduate")
      .field("occupation", "Engineer")
      .field("dateOfBirth", "1995-01-01")
      .field("membershipType", "LIFETIME")
      .field("proposerMemberId", "11111111-1111-4111-8111-111111111111")
      .attach("applicant_photo", Buffer.from("fakejpeg"), {
        filename: "photo.jpg",
        contentType: "image/jpeg",
      })
      .attach("applicant_signature", Buffer.from("fakepng"), {
        filename: "sign.png",
        contentType: "image/png",
      })
      .attach("aadhar_front", Buffer.from("fakejpeg2"), {
        filename: "front.jpg",
        contentType: "image/jpeg",
      })
      .attach("aadhar_back", Buffer.from("fakejpeg3"), {
        filename: "back.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(400);
    expect(res.body?.success).toBe(false);

    const after = await listTempFiles();
    expect(after.length).toBe(0);
  });
});
