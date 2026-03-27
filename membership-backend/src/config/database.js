import { Sequelize } from "sequelize";
import "./env.js";

const dialect = process.env.DB_DIALECT || "mysql";

const commonOptions = {
  logging: false,
  define: {
    underscored: true,
  },
};

const sequelize =
  dialect === "sqlite"
    ? new Sequelize({
        ...commonOptions,
        dialect: "sqlite",
        storage: process.env.DB_STORAGE || ":memory:",
      })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
          ...commonOptions,
          host: process.env.DB_HOST,
          dialect: "mysql",
          port: process.env.DB_PORT || 3306,
          pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        },
      );

const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
};

export { sequelize, testDbConnection };
