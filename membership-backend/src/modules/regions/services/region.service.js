import regionRepository from "../repositories/region.repository.js";
import { cacheDel, cacheGetOrSet, cacheKeys } from "../../../utils/cache.js";

class RegionService {
  static async getActiveRegions() {
    return cacheGetOrSet(cacheKeys.regionsActive, async () => {
      const regions = await regionRepository.findActive();
      return regions.map((r) => r.toJSON());
    });
  }

  static async getAllRegionsForAdmin() {
    return cacheGetOrSet(cacheKeys.regionsAll, async () => {
      const regions = await regionRepository.findAll();
      return regions.map((r) => r.toJSON());
    });
  }

  static async createRegion({ name }) {
    const region = await regionRepository.create({ name: name.trim() });
    cacheDel([cacheKeys.regionsActive, cacheKeys.regionsAll]);
    return region;
  }

  static async toggleRegionStatus({ id }) {
    const region = await regionRepository.findById(id);
    if (!region) {
      throw { statusCode: 404, message: "Region not found." };
    }

    region.isActive = !region.isActive;
    await regionRepository.save(region);

    cacheDel([cacheKeys.regionsActive, cacheKeys.regionsAll]);

    return region;
  }
}

export default RegionService;
