import RegionService from "../services/region.service.js";

class RegionController {
  // 1. PUBLIC: Fetch all active regions for the frontend dropdown
  async getActiveRegions(req, res) {
    const regions = await RegionService.getActiveRegions();
    return res.status(200).json({ success: true, data: regions });
  }

  // 2. ADMIN: Fetch ALL regions (including inactive ones) for the dashboard
  async getAllRegionsForAdmin(req, res) {
    const regions = await RegionService.getAllRegionsForAdmin();
    return res.status(200).json({ success: true, data: regions });
  }

  // 3. ADMIN: Add a new region
  async createRegion(req, res) {
    const { name } = req.body;
    const newRegion = await RegionService.createRegion({ name });
    return res.status(201).json({
      success: true,
      message: "Region added successfully.",
      data: newRegion,
    });
  }

  // 4. ADMIN: Toggle a region's visibility (Hide/Show in frontend)
  async toggleRegionStatus(req, res) {
    const { id } = req.params;
    const region = await RegionService.toggleRegionStatus({ id });

    return res.status(200).json({
      success: true,
      message: `${region.name} is now ${region.is_active ? "Visible" : "Hidden"} in the form.`,
      data: region,
    });
  }
}

export default new RegionController();
