import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";

const getCorsOrigins = () => {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return "*";
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : "*";
};

const authenticateJwt = (token) => {
  if (!token || typeof token !== "string") {
    const err = new Error("Missing token");
    err.data = { code: "MISSING_TOKEN" };
    throw err;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    const err = new Error("Invalid token");
    err.data = { code: "INVALID_TOKEN" };
    throw err;
  }
};

export const createSocketServer = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: getCorsOrigins(),
      credentials: true,
    },
  });

  // Multi-instance scaling: use Redis adapter when REDIS_URL is configured.
  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));

    io.on("close", async () => {
      try {
        await Promise.all([pubClient.quit(), subClient.quit()]);
      } catch {
        // ignore
      }
    });
  }

  // --- Admin namespace ---
  const adminNsp = io.of("/admin");
  adminNsp.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = authenticateJwt(token);

      if (decoded?.role !== "ADMIN") {
        const err = new Error("Forbidden");
        err.data = { code: "FORBIDDEN" };
        return next(err);
      }

      socket.data.admin = { id: decoded.id, phoneNumber: decoded.phoneNumber };
      next();
    } catch (err) {
      next(err);
    }
  });

  adminNsp.on("connection", (socket) => {
    socket.join("admins");
  });

  // --- Applicant namespace ---
  // NOTE: This expects a JWT with role=APPLICANT and applicantId.
  // We only *emit* to rooms from the server; clients must present this token to join.
  const applicantNsp = io.of("/applicant");
  applicantNsp.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = authenticateJwt(token);

      if (decoded?.role !== "APPLICANT" || !decoded?.applicantId) {
        const err = new Error("Forbidden");
        err.data = { code: "FORBIDDEN" };
        return next(err);
      }

      socket.data.applicant = { applicantId: decoded.applicantId };
      next();
    } catch (err) {
      next(err);
    }
  });

  applicantNsp.on("connection", (socket) => {
    const applicantId = socket.data.applicant.applicantId;
    socket.join(`applicant:${applicantId}`);
  });

  return io;
};
