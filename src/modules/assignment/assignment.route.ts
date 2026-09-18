import { Role } from "@prisma/client";
import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { uploadPdfWithLimit } from "../../middleware/upload.middleware.js";
import {
  createAssignmentController,
  deleteAssignmentController,
  getAssignmentController,
  getAssignmentsController,
  updateAssignmentController,
} from "./assignment.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getAssignmentsController);
router.get("/:id", getAssignmentController);

router.post(
  "/",
  requireRole(Role.ADMIN),
  uploadPdfWithLimit.single("pdf"),
  createAssignmentController,
);
router.patch(
  "/:id",
  requireRole(Role.ADMIN),
  uploadPdfWithLimit.single("pdf"),
  updateAssignmentController,
);
router.delete("/:id", requireRole(Role.ADMIN), deleteAssignmentController);

export default router;
