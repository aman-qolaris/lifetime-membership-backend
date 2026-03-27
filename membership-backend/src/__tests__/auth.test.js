import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import app from "../app.js";
import { resetDb } from "../../tests/testDb.js";
import { Admin } from "../database/index.js";

describe("Auth & Admin access", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("POST /api/v1/admins/login rejects wrong password", async () => {
    const passwordHash = await bcrypt.hash("Correct@123", 10);
    await Admin.create({ phoneNumber: "9999999999", password: passwordHash });

    const res = await request(app)
      .post("/api/v1/admins/login")
      .send({ phoneNumber: "9999999999", password: "Wrong@123" });

    expect(res.status).toBe(401);
    expect(res.body?.success).toBe(false);
  });

  test("GET /api/v1/admins/settings denies missing Authorization header", async () => {
    const res = await request(app).get("/api/v1/admins/settings");

    expect(res.status).toBe(401);
    expect(res.body?.success).toBe(false);
  });

  test("GET /api/v1/admins/settings rejects non-admin JWT", async () => {
    const token = jwt.sign(
      { id: "member-id", phoneNumber: "9000000002", role: "MEMBER" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const res = await request(app)
      .get("/api/v1/admins/settings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body?.success).toBe(false);
  });
});
