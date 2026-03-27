import express from "express";
import adminController from "../controllers/admin.controller.js";
import { verifyAdmin } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import { adminLoginDto } from "../dtos/admin.dto.js";
import { loginLimiter } from "../../../middlewares/rateLimit.middleware.js";
import {
  editApplicantDto,
  idParamsDto,
  promoteApplicantDto,
  reviewApplicantDto,
  updateFeeDto,
} from "../dtos/admin.actions.dto.js";
import asyncHandler from "../../../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/login",
  loginLimiter,
  validate(adminLoginDto),
  asyncHandler(adminController.login.bind(adminController)),
);

// Admin Settings: Get and Update Fee
router.get(
  "/settings",
  verifyAdmin,
  asyncHandler(adminController.getSettings.bind(adminController)),
);

// Admin: Edit applicant text details
router.put(
  "/applicants/:id/edit",
  verifyAdmin,
  validate(idParamsDto, { property: "params" }),
  validate(editApplicantDto),
  asyncHandler(adminController.editApplicant.bind(adminController)),
);

// Admin: Approve or Reject the application
router.post(
  "/applicants/:id/review",
  verifyAdmin,
  validate(idParamsDto, { property: "params" }),
  validate(reviewApplicantDto),
  asyncHandler(adminController.reviewApplicant.bind(adminController)),
);

router.get(
  "/members",
  asyncHandler(adminController.getProposers.bind(adminController)),
);
// Admin: Get full list of members for management grid
router.get(
  "/all-members",
  verifyAdmin,
  asyncHandler(adminController.getAllMembersAdmin.bind(adminController)),
);

router.post(
  "/promote",
  verifyAdmin,
  validate(promoteApplicantDto),
  asyncHandler(adminController.promoteApplicant.bind(adminController)),
);
router.patch(
  "/settings/update-fee",
  verifyAdmin,
  validate(updateFeeDto),
  asyncHandler(adminController.updateFee.bind(adminController)),
);

// Admin: Toggle a member's active/inactive status
router.patch(
  "/members/:id/status",
  verifyAdmin,
  validate(idParamsDto, { property: "params" }),
  asyncHandler(adminController.toggleMemberStatus.bind(adminController)),
);

export default router;
