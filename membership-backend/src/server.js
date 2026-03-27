import app from "./app.js";

// Import Database & infra initializers
import { testDbConnection } from "./config/database.js";
import { syncDatabase } from "./database/index.js";
import { initMinio } from "./config/minio.js";

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
