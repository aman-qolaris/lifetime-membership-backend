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
  changePasswordSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from "../dtos/admin.actions.dto.js";
import asyncHandler from "../../../utils/asyncHandler.js";

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE (Static Routes)
// ==========================================
router.post(
  "/login",
  loginLimiter,
  validate(adminLoginDto),
  asyncHandler(adminController.login.bind(adminController)),
);

router.post(
  "/logout",
  verifyAdmin,
  asyncHandler(adminController.logout.bind(adminController)),
);

router.get(
  "/me",
  verifyAdmin,
  asyncHandler(adminController.getMe.bind(adminController)),
);

// ==========================================
// 1. AUTHENTICATION & PROFILE (Static Routes)
// ==========================================

// --- NEW PASSWORD ROUTES ---
router.post(
  "/change-password",
  verifyAdmin,
  validate(changePasswordSchema),
  asyncHandler(adminController.changePassword.bind(adminController)),
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(adminController.forgotPassword.bind(adminController)),
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(adminController.resetPassword.bind(adminController)),
);

// ==========================================
// 2. SETTINGS (Static Routes)
// ==========================================
router.get(
  "/settings",
  verifyAdmin,
  asyncHandler(adminController.getSettings.bind(adminController)),
);

router.patch(
  "/settings/update-fee",
  verifyAdmin,
  validate(updateFeeDto),
  asyncHandler(adminController.updateFee.bind(adminController)),
);

// ==========================================
// 3. MEMBERS (Static BEFORE Dynamic Routes)
// ==========================================
// Static Member Routes
router.get(
  "/members",
  asyncHandler(adminController.getProposers.bind(adminController)),
);

router.get(
  "/all-members",
  verifyAdmin,
  asyncHandler(adminController.getAllMembersAdmin.bind(adminController)),
);

// Dynamic Member Routes (Params)
router.get(
  "/members/:id",
  verifyAdmin,
  validate(idParamsDto, { property: "params" }),
  asyncHandler(adminController.getMemberById.bind(adminController)),
);

router.patch(
  "/members/:id/status",
  verifyAdmin,
  validate(idParamsDto, { property: "params" }),
  asyncHandler(adminController.toggleMemberStatus.bind(adminController)),
);

// ==========================================
// 4. APPLICANTS (Static BEFORE Dynamic Routes)
// ==========================================
// Static Applicant Routes
router.post(
  "/promote",
  verifyAdmin,
  validate(promoteApplicantDto),
  asyncHandler(adminController.promoteApplicant.bind(adminController)),
);

// Dynamic Applicant Routes (Params)
router.put(
  "/applicants/:id/edit",
  verifyAdmin,
  validate(idParamsDto, { property: "params" }),
  validate(editApplicantDto),
  asyncHandler(adminController.editApplicant.bind(adminController)),
);

router.post(
  "/applicants/:id/review",
  verifyAdmin,
  validate(idParamsDto, { property: "params" }),
  validate(reviewApplicantDto),
  asyncHandler(adminController.reviewApplicant.bind(adminController)),
);

export default router;
