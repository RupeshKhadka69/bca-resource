import { Role } from "../../../generated/prisma/index.js";
import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { uploadPdf } from "../../middleware/upload.middleware.js";
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentController,
  getDocumentsController,
  updateDocumentController,
} from "./document.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getDocumentsController);
router.get("/:id", getDocumentController);

router.post(
  "/",
  requireRole(Role.ADMIN),
  uploadPdf.single("pdf"),
  createDocumentController,
);
router.patch(
  "/:id",
  requireRole(Role.ADMIN),
  uploadPdf.single("pdf"),
  updateDocumentController,
);
router.delete("/:id", requireRole(Role.ADMIN), deleteDocumentController);

export default router;
