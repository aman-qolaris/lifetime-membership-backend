import express from "express";
import applicantController from "../controllers/applicant.controller.js";
import { upload } from "../../../middlewares/upload.middleware.js";
import { verifyAdmin } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import createApplicantDto from "../dtos/applicant.dto.js";
import asyncHandler from "../../../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "applicant_photo", maxCount: 1 },
    { name: "applicant_signature", maxCount: 1 },
    { name: "aadhar_front", maxCount: 1 },
    { name: "aadhar_back", maxCount: 1 },
  ]),
  validate(createApplicantDto),
  asyncHandler(applicantController.createApplicant.bind(applicantController)),
);

router.post(
  "/admin-submit",
  verifyAdmin,
  upload.fields([
    { name: "applicant_photo", maxCount: 1 },
    { name: "applicant_signature", maxCount: 1 },
    { name: "aadhar_front", maxCount: 1 },
    { name: "aadhar_back", maxCount: 1 },
  ]),
  validate(createApplicantDto),
  asyncHandler(
    applicantController.createApplicantByAdmin.bind(applicantController),
  ),
);

router.put(
  "/:id",
  upload.fields([
    { name: "applicant_photo", maxCount: 1 },
    { name: "applicant_signature", maxCount: 1 },
    { name: "aadhar_front", maxCount: 1 },
    { name: "aadhar_back", maxCount: 1 },
  ]),
  validate(createApplicantDto),
  asyncHandler(applicantController.resubmitApplicant.bind(applicantController)),
);

router.get(
  "/",
  verifyAdmin,
  asyncHandler(applicantController.getApplicants.bind(applicantController)),
);
router.get(
  "/:id",
  asyncHandler(applicantController.getApplicantById.bind(applicantController)),
);

export default router;
