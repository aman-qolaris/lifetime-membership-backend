import { sequelize } from "../src/database/index.js";

export default async () => {
  try {
    await sequelize.close();
  } catch {
    // ignore
  }
};
