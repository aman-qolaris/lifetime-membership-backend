import { sequelize } from "../src/database/index.js";

export const resetDb = async () => {
  await sequelize.sync({ force: true });
};
