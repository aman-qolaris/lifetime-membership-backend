import { Region } from "../../../database/index.js";

class RegionRepository {
  async findActive() {
    return Region.findAll({
      where: { is_active: true },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
  }

  async findAll() {
    return Region.findAll({
      order: [["name", "ASC"]],
    });
  }

  async create({ name }) {
    return Region.create({ name });
  }

  async findById(id) {
    return Region.findByPk(id);
  }

  async save(region) {
    return region.save();
  }
}

export default new RegionRepository();
