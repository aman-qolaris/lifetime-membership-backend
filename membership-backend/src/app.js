import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import "./config/env.js";

import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";

export const createApp = () => {
  const app = express();

  // === GLOBAL MIDDLEWARES ===
  app.use(helmet());

  const allowedOrigins = new Set([
    process.env.FRONTEND_URL,
    "http://localhost:5173",
  ]);

  app.use(
    cors({
      origin: function (origin, callback) {
        if (origin === undefined) return callback(null, true);

        // FIXED: Using .has() instead of .includes()
        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Blocked by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(
    express.json({
      type: ["application/json", "application/*+json", "text/plain"],
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  // Basic abuse protection (applies to all routes)
  app.use(globalLimiter);

  // === API ROUTES ===
  app.use("/api/v1", apiRoutes);

  // === 404 + GLOBAL ERROR HANDLER ===
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const app = createApp();
export default app;
