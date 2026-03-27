import express from "express";
import approvalController from "../controllers/approval.controller.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import {
  processApprovalDto,
  verifyTokenParamsDto,
  verifyTokenQueryDto,
} from "../dtos/approval.dto.js";
import asyncHandler from "../../../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/verify/:token",
  validate(verifyTokenParamsDto, { property: "params" }),
  validate(verifyTokenQueryDto, { property: "query" }),
  asyncHandler(
    approvalController.verifyTokenAndGetDetails.bind(approvalController),
  ),
);

// The frontend will call these via POST requests when the user clicks the email link and presses "Approve" or "Reject"
router.post(
  "/member",
  validate(processApprovalDto),
  asyncHandler(
    approvalController.handleMemberApproval.bind(approvalController),
  ),
);
router.post(
  "/president",
  validate(processApprovalDto),
  asyncHandler(
    approvalController.handlePresidentApproval.bind(approvalController),
  ),
);

export default router;
