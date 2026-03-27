import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./config/env.js";

// Import Database & Master Router
import { testDbConnection } from "./config/database.js";
import { syncDatabase } from "./database/index.js";
import { initMinio } from "./config/minio.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

// === GLOBAL MIDDLEWARES ===
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Basic abuse protection (applies to all routes)
app.use(globalLimiter);

// === API ROUTES ===
// All routes are now cleanly prefixed with /api/v1 through the central router
app.use("/api/v1", apiRoutes);

// === 404 + GLOBAL ERROR HANDLER ===
app.use(notFound);
app.use(errorHandler);

// === SERVER INITIALIZATION ===
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await testDbConnection();
    await syncDatabase();
    await initMinio();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
