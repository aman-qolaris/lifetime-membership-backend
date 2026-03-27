import regionRepository from "../repositories/region.repository.js";

class RegionService {
  static async getActiveRegions() {
    return regionRepository.findActive();
  }

  static async getAllRegionsForAdmin() {
    return regionRepository.findAll();
  }

  static async createRegion({ name }) {
    return regionRepository.create({ name: name.trim() });
  }

  static async toggleRegionStatus({ id }) {
    const region = await regionRepository.findById(id);
    if (!region) {
      throw { statusCode: 404, message: "Region not found." };
    }

    region.is_active = !region.is_active;
    await regionRepository.save(region);

    return region;
  }
}

export default RegionService;
